import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { event_id, promo_id, user_id, type } = await req.json();
    
    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // Create user client to verify authentication
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get current user
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // Create admin client for elevated operations
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Check user's admin status using user_roles table
    const { data: userRole } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'superadmin'])
      .single();

    const isAdmin = userRole?.role === 'admin' || userRole?.role === 'superadmin';

    if (event_id || type === 'event') {
      const id = event_id;
      
      // Check if user can delete this event (is admin OR owns the event)
      const { data: event } = await adminClient
        .from('events')
        .select('created_by')
        .eq('id', id)
        .single();

      if (!event) {
        return new Response(JSON.stringify({ error: 'Event not found' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        });
      }

      const canDelete = isAdmin || event.created_by === user.id;
      if (!canDelete) {
        return new Response(JSON.stringify({ error: 'Not authorized to delete this event' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        });
      }

      // Perform secure delete with admin client
      await adminClient.from('event_attendees').delete().eq('event_id', id);
      await adminClient.from('event_comments').delete().eq('event_id', id);
      await adminClient.from('event_tag_assignments').delete().eq('event_id', id);
      
      const { data, error } = await adminClient.from('events').delete().eq('id', id).select();

      return new Response(JSON.stringify({ 
        message: 'Event securely deleted',
        success: !error && data && data.length > 0,
        deletedRows: data?.length || 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });

    } else if (promo_id || type === 'promo') {
      const id = promo_id;
      
      // Check if user can delete this promo (is admin OR owns the promo)
      const { data: promo } = await adminClient
        .from('promos')
        .select('created_by')
        .eq('id', id)
        .single();

      if (!promo) {
        return new Response(JSON.stringify({ error: 'Promo not found' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        });
      }

      const canDelete = isAdmin || promo.created_by === user.id;
      if (!canDelete) {
        return new Response(JSON.stringify({ error: 'Not authorized to delete this promo' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        });
      }

      // Perform secure delete with admin client
      await adminClient.from('promo_reviews').delete().eq('promo_id', id);
      await adminClient.from('promo_comments').delete().eq('promo_id', id);
      
      const { data, error } = await adminClient.from('promos').delete().eq('id', id).select();

      return new Response(JSON.stringify({ 
        message: 'Promo securely deleted',
        success: !error && data && data.length > 0,
        deletedRows: data?.length || 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });

    } else if (user_id || type === 'user') {
      const id = user_id;
      
      // Only super admins can delete users
      if (userRole?.role !== 'superadmin') {
        return new Response(JSON.stringify({ error: 'Only super admins can delete users' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        });
      }

      // Check if user profile exists
      const { data: userProfile } = await adminClient
        .from('profiles')
        .select('id, display_name')
        .eq('id', id)
        .single();

      if (!userProfile) {
        return new Response(JSON.stringify({ error: 'User profile not found' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        });
      }

      // Clean up related user data first
      await adminClient.from('event_attendees').delete().eq('user_id', userProfile.id);
      await adminClient.from('event_comments').delete().eq('user_id', userProfile.id);
      await adminClient.from('promo_comments').delete().eq('user_id', userProfile.id);
      await adminClient.from('promo_reviews').delete().eq('user_id', userProfile.id);
      
      // Delete the user profile
      const { data, error } = await adminClient.from('profiles').delete().eq('id', id).select();

      return new Response(JSON.stringify({ 
        message: 'User profile securely deleted',
        success: !error && data && data.length > 0,
        deletedRows: data?.length || 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });

    } else {
      return new Response(JSON.stringify({ error: 'Must specify event_id, promo_id, or user_id' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

  } catch (error) {
    // Never expose error details to client - log server-side only
    console.error('Delete operation failed:', error);
    return new Response(JSON.stringify({ error: 'Operation failed. Please try again.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})