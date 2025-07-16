import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Initialize a separate Supabase client with the service role key
const getAdminClient = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables.');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { promo_id } = await req.json()

    if (!promo_id) {
      return new Response(JSON.stringify({ error: 'promo_id is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Create a client with the user's authentication context
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // 1. Get the current user
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // 2. Verify the user is the owner of the promo
    const { data: promo, error: promoError } = await userClient
      .from('promos')
      .select('id, created_by')
      .eq('id', promo_id)
      .single();

    if (promoError || !promo) {
      return new Response(JSON.stringify({ error: 'Promo not found or access denied.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    if (promo.created_by !== user.id) {
      return new Response(JSON.stringify({ error: 'You are not the owner of this promo.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403, // Forbidden
      });
    }

    // 3. If ownership is verified, use the admin client to delete all related data
    const adminClient = getAdminClient();

    // Delete promo reviews
    await adminClient.from('promo_reviews').delete().eq('promo_id', promo_id);
    // Delete promo comments
    await adminClient.from('promo_comments').delete().eq('promo_id', promo_id);
    // Delete the promo itself
    const { error: deleteError } = await adminClient.from('promos').delete().eq('id', promo_id);

    if (deleteError) {
      throw deleteError;
    }

    return new Response(JSON.stringify({ message: 'Promo deleted successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500, // Internal Server Error for caught exceptions
    })
  }
})