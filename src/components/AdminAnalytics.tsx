import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Calendar, Users, Star, Megaphone, UserPlus } from "lucide-react";
import { SpinningPaws } from "@/components/ui/spinning-paws";
import { format, subDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

interface DailyData {
  periodStart: string;
  periodEnd: string;
  events: number;
  attendees: number;
  promos: number;
  users: number;
  reviews: number;
}

interface AnalyticsResponse {
  data: DailyData[];
  totals: {
    totalEvents: number;
    totalAttendees: number;
    totalPromos: number;
    totalUsers: number;
    totalReviews: number;
  };
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export const AdminAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30");
  const [analyticsData, setAnalyticsData] = useState<AnalyticsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async (days: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const endDate = new Date();
      const startDate = subDays(endDate, days);
      
      const { data, error: fnError } = await supabase.functions.invoke('analytics', {
        body: {},
        headers: {},
      }).then(async () => {
        // Use fetch directly for query params
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL || 'https://qgttbaibhmzbmknjlghj.supabase.co'}/functions/v1/analytics?startdate=${format(startDate, 'yyyy-MM-dd')}&enddate=${format(endDate, 'yyyy-MM-dd')}&granularity=daily`,
          {
            headers: {
              'Content-Type': 'application/json',
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFndHRiYWliaG16Ym1rbmpsZ2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MzAyODAsImV4cCI6MjA2NTUwNjI4MH0.jChcXNsowGgb4dz1WTnoTWrBPTK8HeZsUjQA1Mhe5gc'
            },
          }
        );
        if (!response.ok) throw new Error('Failed to fetch analytics');
        return { data: await response.json(), error: null };
      });

      if (fnError) throw fnError;
      setAnalyticsData(data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(parseInt(dateRange));
  }, [dateRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <SpinningPaws size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  const totals = analyticsData?.totals || { totalEvents: 0, totalAttendees: 0, totalPromos: 0, totalUsers: 0, totalReviews: 0 };

  const chartData = analyticsData?.data?.map(item => ({
    date: format(new Date(item.periodStart), 'MMM dd'),
    events: item.events,
    attendees: item.attendees,
    promos: item.promos,
    users: item.users,
    reviews: item.reviews,
  })) || [];

  const activityDistribution = [
    { name: 'Events', value: totals.totalEvents },
    { name: 'Attendees', value: totals.totalAttendees },
    { name: 'Promos', value: totals.totalPromos },
    { name: 'Users', value: totals.totalUsers },
    { name: 'Reviews', value: totals.totalReviews },
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      {/* Header with Date Range Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Analytics Overview</h2>
          <p className="text-muted-foreground">Track your app's activity and engagement</p>
        </div>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.totalEvents}</div>
            <p className="text-xs text-muted-foreground mt-1">Created</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.totalAttendees}</div>
            <p className="text-xs text-muted-foreground mt-1">Joined events</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promos</CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.totalPromos}</div>
            <p className="text-xs text-muted-foreground mt-1">Created</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Users</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">Registered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reviews</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.totalReviews}</div>
            <p className="text-xs text-muted-foreground mt-1">Submitted</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart - Activity Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                events: { label: "Events", color: "hsl(var(--chart-1))" },
                attendees: { label: "Attendees", color: "hsl(var(--chart-2))" },
                users: { label: "Users", color: "hsl(var(--chart-3))" },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="events" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={{ fill: "hsl(var(--chart-1))" }} />
                  <Line type="monotone" dataKey="attendees" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ fill: "hsl(var(--chart-2))" }} />
                  <Line type="monotone" dataKey="users" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={{ fill: "hsl(var(--chart-3))" }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Bar Chart - Promos & Reviews */}
        <Card>
          <CardHeader>
            <CardTitle>Promos & Reviews Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                promos: { label: "Promos", color: "hsl(var(--chart-4))" },
                reviews: { label: "Reviews", color: "hsl(var(--chart-5))" },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="promos" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="reviews" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Activity Distribution */}
      {activityDistribution.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Activity Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ value: { label: "Count" } }} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={activityDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {activityDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};