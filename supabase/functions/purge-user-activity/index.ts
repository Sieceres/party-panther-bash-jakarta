import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { target_user_id } = await req.json()

    if (!target_user_id) {
      return new Response(JSON.stringify({ error: 'target_user_id is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Authenticate caller
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    // Admin client for elevated operations
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Check caller is admin
    const { data: callerRole } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'superadmin'])
      .single()

    if (!callerRole) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      })
    }

    // Purge all activity for target user
    const counts: Record<string, number> = {}

    const tables = [
      { table: 'event_comments', column: 'user_id' },
      { table: 'promo_comments', column: 'user_id' },
      { table: 'promo_reviews', column: 'user_id' },
      { table: 'reports', column: 'reporter_id' },
      { table: 'event_attendees', column: 'user_id' },
      { table: 'event_photos', column: 'uploaded_by' },
      { table: 'event_photo_reports', column: 'reported_by' },
      { table: 'user_favorite_promos', column: 'user_id' },
    ]

    for (const { table, column } of tables) {
      const { data, error } = await adminClient
        .from(table)
        .delete()
        .eq(column, target_user_id)
        .select('id')

      if (error) {
        console.error(`Error purging ${table}:`, error)
        counts[table] = 0
      } else {
        counts[table] = data?.length || 0
      }
    }

    const totalDeleted = Object.values(counts).reduce((a, b) => a + b, 0)

    console.log(`Activity purged for user ${target_user_id} by admin ${user.id}:`, counts)

    return new Response(JSON.stringify({
      success: true,
      message: `Purged ${totalDeleted} records`,
      counts,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Purge operation failed:', error)
    return new Response(JSON.stringify({ error: 'Operation failed. Please try again.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
