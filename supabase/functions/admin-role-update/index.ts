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

    // Check if the current user is an admin or superadmin using user_roles table
    const { data: currentUserRole, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (roleError || !currentUserRole) {
      console.error('Error fetching user role:', roleError)
      return new Response(
        JSON.stringify({ error: 'Unable to verify user permissions' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 403 
        }
      )
    }

    const isAdmin = currentUserRole.role === 'admin'
    const isSuperAdmin = currentUserRole.role === 'superadmin'

    if (!isAdmin && !isSuperAdmin) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions. Admin or Super Admin access required.' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 403 
        }
      )
    }

    // Parse the request body
    const { target_user_id, new_role } = await req.json()

    if (!target_user_id) {
      return new Response(
        JSON.stringify({ error: 'target_user_id is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
      )
    }

    // Validate the new role
    const validRoles = ['user', 'admin', 'superadmin']
    if (!new_role || !validRoles.includes(new_role)) {
      return new Response(
        JSON.stringify({ error: 'Invalid role. Must be one of: user, admin, superadmin' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
      )
    }

    // Only superadmins can assign/remove superadmin role
    if (new_role === 'superadmin' && !isSuperAdmin) {
      return new Response(
        JSON.stringify({ error: 'Only Super Admins can assign Super Admin role' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 403 
        }
      )
    }

    // Check if target user currently has superadmin role (only superadmins can demote superadmins)
    const { data: targetUserRole } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', target_user_id)
      .single()

    if (targetUserRole?.role === 'superadmin' && !isSuperAdmin) {
      return new Response(
        JSON.stringify({ error: 'Only Super Admins can modify Super Admin users' }),
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

    // Check if user already has a role entry
    const { data: existingRole } = await supabaseServiceClient
      .from('user_roles')
      .select('id')
      .eq('user_id', target_user_id)
      .single()

    let result
    if (existingRole) {
      // Update existing role
      result = await supabaseServiceClient
        .from('user_roles')
        .update({ role: new_role, updated_at: new Date().toISOString() })
        .eq('user_id', target_user_id)
        .select()
    } else {
      // Insert new role
      result = await supabaseServiceClient
        .from('user_roles')
        .insert({ user_id: target_user_id, role: new_role })
        .select()
    }

    if (result.error) {
      console.error('Error updating user role:', result.error)
      return new Response(
        JSON.stringify({ error: 'Failed to update user role', details: result.error.message }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 500 
        }
      )
    }

    if (!result.data || result.data.length === 0) {
      return new Response(
        JSON.stringify({ error: 'User not found or no changes made' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 404 
        }
      )
    }

    console.log(`User role updated: ${target_user_id} -> ${new_role} by ${user.id}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User role updated successfully',
        updatedRole: result.data[0]
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    )
  }
})
