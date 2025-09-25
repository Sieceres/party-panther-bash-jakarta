import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the logged in user.
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Get the session or user object
    const { data: { user } } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Not authenticated' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 401 
        }
      )
    }

    // Check if the current user is an admin or super admin
    const { data: currentUserProfile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('is_admin, is_super_admin')
      .eq('user_id', user.id)
      .single()

    if (profileError || !currentUserProfile) {
      return new Response(
        JSON.stringify({ error: 'Unable to verify user permissions' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 403 
        }
      )
    }

    if (!currentUserProfile.is_admin && !currentUserProfile.is_super_admin) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions. Admin or Super Admin access required.' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 403 
        }
      )
    }

    // Parse the request body
    const { target_user_id, is_admin, is_super_admin } = await req.json()

    if (!target_user_id) {
      return new Response(
        JSON.stringify({ error: 'target_user_id is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
      )
    }

    // Only super admins can modify super admin status
    if (is_super_admin !== undefined && !currentUserProfile.is_super_admin) {
      return new Response(
        JSON.stringify({ error: 'Only Super Admins can modify Super Admin status' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 403 
        }
      )
    }

    // Create a service role client for the actual update
    const supabaseServiceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Prepare the update object
    const updateData: { is_admin?: boolean; is_super_admin?: boolean } = {}
    if (is_admin !== undefined) updateData.is_admin = is_admin
    if (is_super_admin !== undefined) updateData.is_super_admin = is_super_admin

    // Update the target user's admin status using service role
    const { data, error } = await supabaseServiceClient
      .from('profiles')
      .update(updateData)
      .eq('id', target_user_id)
      .select()

    if (error) {
      console.error('Error updating admin status:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to update admin status', details: error.message }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 500 
        }
      )
    }

    if (!data || data.length === 0) {
      return new Response(
        JSON.stringify({ error: 'User not found or no changes made' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 404 
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Admin status updated successfully',
        updatedUser: data[0]
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    )
  }
})