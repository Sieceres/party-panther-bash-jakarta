import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Calendar, Star, Users, Trash2, Edit, Eye, ArrowLeft, Database, RefreshCw, Instagram } from "lucide-react";
import { Header } from "./Header";
import { AdminReceiptManagement } from "./AdminReceiptManagement";
import { AdminAnalytics } from "./AdminAnalytics";
import { AdminImageMigration } from "./AdminImageMigration";
import { AdminVenueManagement } from "./AdminVenueManagement";
import { AdminTagManagement } from "./AdminTagManagement";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getEventUrl, getEditEventUrl, getPromoUrl, getEditPromoUrl } from "@/lib/slug-utils";
import { SpinningPaws } from "@/components/ui/spinning-paws";
import { usePageTitle } from "@/hooks/usePageTitle";

interface Event {
  id: string;
  title: string;
  date: string;
  venue_name: string;
  organizer_name: string;
  created_at: string;
  slug?: string;
}

interface Promo {
  id: string;
  title: string;
  venue_name: string;
  discount_text: string;
  valid_until: string;
  created_at: string;
  slug?: string;
}

interface User {
  id: string;
  user_id: string;
  display_name: string;
  profile_type: string;
  created_at: string;
  is_verified: boolean;
  roles?: { role: string }[];
}

export const AdminDashboard = () => {
  usePageTitle("Admin Dashboard");
  const { toast } = useToast();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: 'deleteEvent' | 'deletePromo' | 'deleteUser' | 'makeAdmin' | 'makeSuperAdmin';
    id: string;
    title?: string;
    userName?: string;
    isCurrentlyAdmin?: boolean;
    isCurrentlySuperAdmin?: boolean;
  } | null>(null);
  const [refreshingPromoStats, setRefreshingPromoStats] = useState(false);
  const [refreshingEventStats, setRefreshingEventStats] = useState(false);

  const checkAuthAndPermissions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Access Denied",
          description: "Please log in to access the admin dashboard",
          variant: "destructive"
        });
        navigate('/auth');
        return;
      }

      // Check user_roles table for admin/superadmin status
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['admin', 'superadmin']);

      if (error) {
        console.error('Error checking roles:', error);
        toast({
          title: "Access Denied",
          description: "Unable to verify your permissions",
          variant: "destructive"
        });
        navigate('/');
        return;
      }

      // Check if user has admin or superadmin role
      const isAdmin = roles && roles.length > 0;
      const isSuperAdminUser = roles && roles.some(r => r.role === 'superadmin');

      if (!isAdmin) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access the admin dashboard",
          variant: "destructive"
        });
        navigate('/');
        return;
      }

      setIsAuthorized(true);
      setIsSuperAdmin(isSuperAdminUser);
    } catch (error) {
      console.error('Error checking authentication:', error);
      toast({
        title: "Error",
        description: "Failed to verify authentication",
        variant: "destructive"
      });
      navigate('/');
    } finally {
      setAuthLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      const [eventsData, promosData, usersData] = await Promise.all([
        supabase.rpc('get_events_safe').then(result => ({ 
          data: result.data?.map((event: any) => ({
            id: event.id,
            title: event.title,
            date: event.date,
            venue_name: event.venue_name,
            organizer_name: event.organizer_name,
            created_at: event.created_at,
            slug: event.slug
          })) || [], 
          error: result.error 
        })),
        supabase.from('promos').select('id, title, venue_name, discount_text, valid_until, created_at, slug').order('created_at', { ascending: false }),
        supabase.from('profiles').select(`
          id,
          user_id,
          display_name,
          profile_type,
          created_at,
          is_verified
        `).order('created_at', { ascending: false })
      ]);

      if (eventsData.error) throw eventsData.error;
      if (promosData.error) throw promosData.error;
      if (usersData.error) throw usersData.error;

      setEvents(eventsData.data || []);
      setPromos(promosData.data || []);
      setUsers(usersData.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuthAndPermissions();
  }, [navigate, toast]);

  useEffect(() => {
    if (isAuthorized) {
      fetchData();
    }
  }, [isAuthorized, toast]);

  const handleDeleteEvent = async (id: string) => {
    try {
      // Use secure-delete function with proper authorization checks
      const authData = JSON.parse(localStorage.getItem('sb-qgttbaibhmzbmknjlghj-auth-token') || '{}');
      const response = await fetch('https://qgttbaibhmzbmknjlghj.supabase.co/functions/v1/secure-delete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authData.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ event_id: id })
      });
      
      const result = await response.json();
      
      if (result.success && result.deletedRows > 0) {
        await fetchData();
        toast({ title: "Success", description: "Event deleted successfully" });
      } else {
        throw new Error(result.message || 'Delete failed');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: "Error",
        description: `Failed to delete event: ${error.message}`,
        variant: "destructive"
      });
    }
    setPendingAction(null);
  };

  const handleDeletePromo = async (id: string) => {
    try {
      // Use secure-delete function with proper authorization checks
      const authData = JSON.parse(localStorage.getItem('sb-qgttbaibhmzbmknjlghj-auth-token') || '{}');
      const response = await fetch('https://qgttbaibhmzbmknjlghj.supabase.co/functions/v1/secure-delete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authData.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ promo_id: id })
      });
      
      const result = await response.json();
      
      if (result.success && result.deletedRows > 0) {
        await fetchData();
        toast({ title: "Success", description: "Promo deleted successfully" });
      } else {
        throw new Error(result.message || 'Delete failed');
      }
    } catch (error) {
      console.error('Error deleting promo:', error);
      toast({
        title: "Error",
        description: `Failed to delete promo: ${error.message}`,
        variant: "destructive"
      });
    }
    setPendingAction(null);
  };

  const handleDeleteUser = async (id: string) => {
    try {
      // Use secure-delete function with proper authorization checks
      const authData = JSON.parse(localStorage.getItem('sb-qgttbaibhmzbmknjlghj-auth-token') || '{}');
      const response = await fetch('https://qgttbaibhmzbmknjlghj.supabase.co/functions/v1/secure-delete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authData.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user_id: id })
      });
      
      const result = await response.json();
      
      if (result.success && result.deletedRows > 0) {
        await fetchData();
        toast({ title: "Success", description: "User deleted successfully" });
      } else {
        throw new Error(result.message || result.error || 'Delete failed');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: `Failed to delete user: ${error.message}`,
        variant: "destructive"
      });
    }
    setPendingAction(null);
  };

  const handleVerifyUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified: true })
        .eq('id', userId);
      
      if (error) throw error;
      
      setUsers(users.map(user => 
        user.id === userId ? { ...user, is_verified: true } : user
      ));
      
      toast({
        title: "Success",
        description: "User verified successfully"
      });
    } catch (error) {
      console.error('Error verifying user:', error);
      toast({
        title: "Error",
        description: "Failed to verify user",
        variant: "destructive"
      });
    }
  };

  const handleSetAdmin = async (userId: string, isAdmin: boolean) => {
    try {
      console.log('Attempting to set admin status:', { userId, isAdmin });
      
      // Use admin-role-update function with proper authorization checks
      const authData = JSON.parse(localStorage.getItem('sb-qgttbaibhmzbmknjlghj-auth-token') || '{}');
      const response = await fetch('https://qgttbaibhmzbmknjlghj.supabase.co/functions/v1/admin-role-update', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authData.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          target_user_id: userId,
          new_role: isAdmin ? 'admin' : 'user'
        })
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || 'Admin role update failed');
      }
      
      console.log('Admin role update successful:', result);
      
      // Refresh data to get updated roles
      await fetchData();
      
      toast({
        title: "Success",
        description: `User ${isAdmin ? 'granted' : 'revoked'} admin privileges.`
      });
    } catch (error) {
      console.error('Error setting admin:', error);
      toast({
        title: "Error",
        description: `Failed to update user role: ${error.message || error}`,
        variant: "destructive"
      });
    }
    setPendingAction(null);
  };

  const handleSetSuperAdmin = async (userId: string, isSuperAdmin: boolean) => {
    try {
      console.log('Attempting to set super admin status:', { userId, isSuperAdmin });
      
      // Use admin-role-update function with proper authorization checks
      const authData = JSON.parse(localStorage.getItem('sb-qgttbaibhmzbmknjlghj-auth-token') || '{}');
      const response = await fetch('https://qgttbaibhmzbmknjlghj.supabase.co/functions/v1/admin-role-update', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authData.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          target_user_id: userId,
          new_role: isSuperAdmin ? 'superadmin' : 'user'
        })
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || 'Super admin role update failed');
      }
      
      console.log('Super admin role update successful:', result);
      
      // Refresh data to get updated roles
      await fetchData();
      
      toast({
        title: "Success",
        description: `User ${isSuperAdmin ? 'granted' : 'revoked'} super admin privileges.`
      });
    } catch (error) {
      console.error('Error setting super admin:', error);
      toast({
        title: "Error",
        description: `Failed to update user role: ${error.message || error}`,
        variant: "destructive"
      });
    }
    setPendingAction(null);
  };

  const confirmAction = () => {
    if (!pendingAction) return;
    
    switch (pendingAction.type) {
      case 'deleteEvent':
        handleDeleteEvent(pendingAction.id);
        break;
      case 'deletePromo':
        handleDeletePromo(pendingAction.id);
        break;
      case 'deleteUser':
        handleDeleteUser(pendingAction.id);
        break;
      case 'makeAdmin':
        handleSetAdmin(pendingAction.id, !pendingAction.isCurrentlyAdmin);
        break;
      case 'makeSuperAdmin':
        handleSetSuperAdmin(pendingAction.id, !pendingAction.isCurrentlySuperAdmin);
        break;
    }
  };

  const refreshPromoStats = async () => {
    setRefreshingPromoStats(true);
    try {
      const { error } = await supabase.rpc('refresh_promo_review_stats');
      if (error) throw error;
      toast({ title: "Success", description: "Promo review stats refreshed successfully" });
    } catch (error) {
      console.error('Error refreshing promo stats:', error);
      toast({
        title: "Error",
        description: `Failed to refresh promo stats: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setRefreshingPromoStats(false);
    }
  };

  const refreshEventStats = async () => {
    setRefreshingEventStats(true);
    try {
      const { error } = await supabase.rpc('refresh_event_attendee_stats');
      if (error) throw error;
      toast({ title: "Success", description: "Event attendee stats refreshed successfully" });
    } catch (error) {
      console.error('Error refreshing event stats:', error);
      toast({
        title: "Error",
        description: `Failed to refresh event stats: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setRefreshingEventStats(false);
    }
  };

  const getConfirmationMessage = () => {
    if (!pendingAction) return '';
    
    switch (pendingAction.type) {
      case 'deleteEvent':
        return `Are you sure you want to delete the event "${pendingAction.title}"?`;
      case 'deletePromo':
        return `Are you sure you want to delete the promo "${pendingAction.title}"?`;
      case 'deleteUser':
        return `Are you sure you want to delete user "${pendingAction.userName}"?`;
      case 'makeAdmin':
        return pendingAction.isCurrentlyAdmin 
          ? `Are you sure you want to revoke admin privileges from "${pendingAction.userName}"?`
          : `Are you sure you want to make "${pendingAction.userName}" an Admin?`;
      case 'makeSuperAdmin':
        return pendingAction.isCurrentlySuperAdmin
          ? `Are you sure you want to revoke super admin privileges from "${pendingAction.userName}"?`
          : `Are you sure you want to make "${pendingAction.userName}" a Super Admin?`;
      default:
        return 'Are you sure you want to perform this action?';
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background pt-20 px-4">
        <div className="container mx-auto">
          <div className="text-center">Verifying permissions...</div>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-20 px-4">
        <div className="container mx-auto">
          <div className="text-center space-y-4">
            <SpinningPaws size="lg" />
            <div className="text-center">Loading admin dashboard...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header activeSection="admin" onSectionChange={(section) => {
        if (section === 'home') {
          navigate('/');
        } else if (section === 'profile') {
          navigate('/profile');
        } else if (section === 'admin') {
          navigate('/admin');
        } else {
          navigate(`/?section=${section}`);
        }
      }} />
      <div className="min-h-screen bg-background pt-20 px-4">
        <div className="container mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold gradient-text mb-2">Admin Dashboard</h1>
              <p className="text-muted-foreground">Manage events, promos, and users</p>
            </div>
            <div className="flex gap-2">
              {isSuperAdmin && (
                <Button
                  variant="default"
                  onClick={() => navigate('/admin/instagram-generator')}
                >
                  <Instagram className="w-4 h-4 mr-2" />
                  Instagram Generator
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => navigate('/profile')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Profile
              </Button>
            </div>
          </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{events.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Promos</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{promos.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Management Tabs */}
        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-9">
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="promos">Promos</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="tags">Tags</TabsTrigger>
            <TabsTrigger value="venues">Venues</TabsTrigger>
            <TabsTrigger value="receipts">Receipts</TabsTrigger>
            <TabsTrigger value="database">Database</TabsTrigger>
            <TabsTrigger value="migration">Migration</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            <AdminAnalytics />
          </TabsContent>

          <TabsContent value="events" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Manage Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {events.map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <h4 className="font-semibold">{event.title}</h4>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>{event.date}</span>
                          <span>{event.venue_name}</span>
                          <span>by {event.organizer_name}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(getEventUrl(event))}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(getEditEventUrl(event))}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => setPendingAction({ type: 'deleteEvent', id: event.id, title: event.title })}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="promos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Manage Promos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {promos.map((promo) => (
                    <div key={promo.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <h4 className="font-semibold">{promo.title}</h4>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>{promo.venue_name}</span>
                          <span>Valid until: {promo.valid_until}</span>
                        </div>
                        <Badge className="bg-neon-pink text-black">{promo.discount_text}</Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(getPromoUrl(promo))}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(getEditPromoUrl(promo))}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => setPendingAction({ type: 'deletePromo', id: promo.id, title: promo.title })}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Manage Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <h4 className="font-semibold">{user.display_name || 'Unnamed User'}</h4>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>Type: {user.profile_type}</span>
                          <span>Joined: {new Date(user.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={user.roles?.some(r => r.role === 'user') ? 'secondary' : 'default'}>
                            {user.roles?.find(r => r.role === 'superadmin') ? 'Super Admin' : 
                             user.roles?.find(r => r.role === 'admin') ? 'Admin' : 
                             user.profile_type}
                          </Badge>
                          {user.is_verified && (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              Verified
                            </Badge>
                          )}
                          {user.roles?.some(r => r.role === 'admin' || r.role === 'superadmin') && (
                            <Badge variant="destructive">
                              {user.roles.find(r => r.role === 'superadmin') ? 'Super Admin' : 'Admin'}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {!user.is_verified && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleVerifyUser(user.id)}
                          >
                            Verify
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setPendingAction({ 
                            type: 'makeAdmin', 
                            id: user.id, 
                            userName: user.display_name || 'Unnamed User',
                            isCurrentlyAdmin: user.roles?.some(r => r.role === 'admin' || r.role === 'superadmin') || false
                          })}
                        >
                          {user.roles?.some(r => r.role === 'admin' || r.role === 'superadmin') ? 'Revoke Admin' : 'Make Admin'}
                        </Button>
                        {isSuperAdmin && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setPendingAction({ 
                              type: 'makeSuperAdmin', 
                              id: user.id, 
                              userName: user.display_name || 'Unnamed User',
                              isCurrentlySuperAdmin: user.roles?.some(r => r.role === 'superadmin') || false
                            })}
                          >
                            {user.roles?.some(r => r.role === 'superadmin') ? 'Revoke Super Admin' : 'Make Super Admin'}
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/admin/user/${user.id}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => setPendingAction({ 
                            type: 'deleteUser', 
                            id: user.id, 
                            userName: user.display_name || 'Unnamed User' 
                          })}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="receipts" className="space-y-4">
            <AdminReceiptManagement />
          </TabsContent>

          <TabsContent value="venues" className="space-y-4">
            <AdminVenueManagement />
          </TabsContent>

          <TabsContent value="database" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database Maintenance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Materialized Views</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    These views cache aggregated data for better performance. They refresh automatically every 10 minutes, but you can manually refresh them here if needed.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-semibold">Promo Review Stats</h4>
                        <p className="text-sm text-muted-foreground">Caches review counts and average ratings for all promos</p>
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={refreshPromoStats}
                        disabled={refreshingPromoStats}
                      >
                        <RefreshCw className={`w-4 h-4 mr-2 ${refreshingPromoStats ? 'animate-spin' : ''}`} />
                        {refreshingPromoStats ? 'Refreshing...' : 'Refresh Stats'}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-semibold">Event Attendee Stats</h4>
                        <p className="text-sm text-muted-foreground">Caches attendee counts for all events</p>
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={refreshEventStats}
                        disabled={refreshingEventStats}
                      >
                        <RefreshCw className={`w-4 h-4 mr-2 ${refreshingEventStats ? 'animate-spin' : ''}`} />
                        {refreshingEventStats ? 'Refreshing...' : 'Refresh Stats'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="migration" className="space-y-4">
            <AdminImageMigration />
          </TabsContent>

          <TabsContent value="tags" className="space-y-4">
            <AdminTagManagement />
          </TabsContent>
        </Tabs>

        {/* Confirmation Dialog */}
        <AlertDialog open={!!pendingAction} onOpenChange={(open) => !open && setPendingAction(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Action</AlertDialogTitle>
              <AlertDialogDescription>
                {getConfirmationMessage()}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setPendingAction(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmAction}>Confirm</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        </div>
      </div>
    </>
  );
};