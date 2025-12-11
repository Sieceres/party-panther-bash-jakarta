import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const startdate = url.searchParams.get('startdate');
    const enddate = url.searchParams.get('enddate');
    const granularity = url.searchParams.get('granularity') || 'daily';

    console.log('Analytics request:', { startdate, enddate, granularity });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const start = startdate ? new Date(startdate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = enddate ? new Date(enddate) : new Date();
    end.setHours(23, 59, 59, 999);

    // Fetch all data within date range
    const [eventsRes, attendeesRes, promosRes, profilesRes, reviewsRes] = await Promise.all([
      supabase.from('events').select('created_at').gte('created_at', start.toISOString()).lte('created_at', end.toISOString()),
      supabase.from('event_attendees').select('joined_at').gte('joined_at', start.toISOString()).lte('joined_at', end.toISOString()),
      supabase.from('promos').select('created_at').gte('created_at', start.toISOString()).lte('created_at', end.toISOString()),
      supabase.from('profiles').select('created_at').gte('created_at', start.toISOString()).lte('created_at', end.toISOString()),
      supabase.from('promo_reviews').select('created_at').gte('created_at', start.toISOString()).lte('created_at', end.toISOString()),
    ]);

    // Group data by day
    const dailyData: Record<string, { events: number; attendees: number; promos: number; users: number; reviews: number }> = {};
    
    const currentDate = new Date(start);
    while (currentDate <= end) {
      const dateKey = currentDate.toISOString().split('T')[0];
      dailyData[dateKey] = { events: 0, attendees: 0, promos: 0, users: 0, reviews: 0 };
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Count events per day
    eventsRes.data?.forEach(item => {
      const dateKey = new Date(item.created_at).toISOString().split('T')[0];
      if (dailyData[dateKey]) dailyData[dateKey].events++;
    });

    // Count attendees per day
    attendeesRes.data?.forEach(item => {
      if (item.joined_at) {
        const dateKey = new Date(item.joined_at).toISOString().split('T')[0];
        if (dailyData[dateKey]) dailyData[dateKey].attendees++;
      }
    });

    // Count promos per day
    promosRes.data?.forEach(item => {
      const dateKey = new Date(item.created_at).toISOString().split('T')[0];
      if (dailyData[dateKey]) dailyData[dateKey].promos++;
    });

    // Count users per day
    profilesRes.data?.forEach(item => {
      const dateKey = new Date(item.created_at).toISOString().split('T')[0];
      if (dailyData[dateKey]) dailyData[dateKey].users++;
    });

    // Count reviews per day
    reviewsRes.data?.forEach(item => {
      const dateKey = new Date(item.created_at).toISOString().split('T')[0];
      if (dailyData[dateKey]) dailyData[dateKey].reviews++;
    });

    // Convert to array format
    const data = Object.entries(dailyData).map(([date, counts]) => ({
      periodStart: new Date(date).toISOString(),
      periodEnd: new Date(date + 'T23:59:59.999Z').toISOString(),
      events: counts.events,
      attendees: counts.attendees,
      promos: counts.promos,
      users: counts.users,
      reviews: counts.reviews,
    })).sort((a, b) => new Date(a.periodStart).getTime() - new Date(b.periodStart).getTime());

    // Calculate totals
    const totals = {
      totalEvents: eventsRes.data?.length || 0,
      totalAttendees: attendeesRes.data?.length || 0,
      totalPromos: promosRes.data?.length || 0,
      totalUsers: profilesRes.data?.length || 0,
      totalReviews: reviewsRes.data?.length || 0,
    };

    return new Response(
      JSON.stringify({ data, totals }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Analytics error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
