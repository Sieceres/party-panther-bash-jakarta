import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const startdate = url.searchParams.get('startdate');
    const enddate = url.searchParams.get('enddate');
    const granularity = url.searchParams.get('granularity') || 'daily';

    console.log('Analytics request:', { startdate, enddate, granularity });

    // For now, return mock data since we don't have real analytics integration
    // In production, you would integrate with Lovable's analytics API or your own analytics service
    const mockData = generateMockAnalytics(startdate, enddate, granularity);

    return new Response(
      JSON.stringify({ data: mockData }),
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

function generateMockAnalytics(startDate: string | null, endDate: string | null, granularity: string) {
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();
  
  const data = [];
  const currentDate = new Date(start);
  
  while (currentDate <= end) {
    const periodStart = new Date(currentDate);
    const periodEnd = new Date(currentDate);
    periodEnd.setHours(23, 59, 59, 999);
    
    data.push({
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      visits: Math.floor(Math.random() * 100) + 50,
      pageviews: Math.floor(Math.random() * 300) + 150,
    });
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return data;
}
