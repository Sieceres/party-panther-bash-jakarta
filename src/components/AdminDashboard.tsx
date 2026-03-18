import { useState, useEffect } from "react";

import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Star, Users, Trash2, Edit, Eye, ArrowLeft, Database, RefreshCw, Instagram, MapPin, Image, Phone, FileUp, AlertTriangle, Ban, Eraser, Flag, ShieldAlert, Bell } from "lucide-react";
import { Header } from "./Header";
import { AdminReceiptManagement } from "./AdminReceiptManagement";
import { AdminAnalytics } from "./AdminAnalytics";
import { AdminImageMigration } from "./AdminImageMigration";
import { AdminVenueManagement } from "./AdminVenueManagement";
import { AdminVenueEdits } from "./AdminVenueEdits";
import { AdminVenueAudit } from "./AdminVenueAudit";
import { AdminTagManagement } from "./AdminTagManagement";
import { AdminReportManagement } from "./AdminReportManagement";
import { AdminUserFlags } from "./AdminUserFlags";
import { AdminVenueClaims } from "./AdminVenueClaims";
import { AdminNotificationSettings } from "./AdminNotificationSettings";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getEventUrl, getEditEventUrl, getPromoUrl, getEditPromoUrl } from "@/lib/slug-utils";
import { SpinningPaws } from "@/components/ui/spinning-paws";
import { usePageTitle } from "@/hooks/usePageTitle";
import { detectDrinkCategory, getPlaceholderImage, enrichDrinkTypes } from "@/lib/drink-categories";
import { reclassifyPromoType } from "@/lib/promo-types";

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
  description?: string;
  promo_type?: string;
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
    type: 'deleteEvent' | 'deletePromo' | 'deleteUser' | 'makeAdmin' | 'makeSuperAdmin' | 'purgeActivity' | 'banUser' | 'unbanUser';
    id: string;
    title?: string;
    userName?: string;
    isCurrentlyAdmin?: boolean;
    isCurrentlySuperAdmin?: boolean;
  } | null>(null);
  const [refreshingPromoStats, setRefreshingPromoStats] = useState(false);
  const [refreshingEventStats, setRefreshingEventStats] = useState(false);
  const [backfillingPromos, setBackfillingPromos] = useState(false);
  const [reclassifying, setReclassifying] = useState(false);
  const [pendingReportCount, setPendingReportCount] = useState(0);
  const [pendingFlagCount, setPendingFlagCount] = useState(0);
  const [bannedUserIds, setBannedUserIds] = useState<Set<string>>(new Set());
  const [banReason, setBanReason] = useState('');
  const [banExpiry, setBanExpiry] = useState('');
  const [purgingUserId, setPurgingUserId] = useState<string | null>(null);
  const defaultTab = new URLSearchParams(window.location.search).get('tab') || 'analytics';

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

      // Fetch user roles for all users
      const userIds = usersData.data?.map(u => u.user_id).filter(Boolean) || [];
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
      }

      // Merge roles with user profiles
      const usersWithRoles = (usersData.data || []).map(user => ({
        ...user,
        roles: rolesData?.filter(r => r.user_id === user.user_id).map(r => ({ role: r.role })) || []
      }));

      setEvents(eventsData.data || []);
      setPromos(promosData.data || []);
      setUsers(usersWithRoles);
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
      fetchPendingReportCount();
      fetchBannedUsers();
    }
  }, [isAuthorized, toast]);

  const fetchPendingReportCount = async () => {
    try {
      const { count, error } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      if (!error && count !== null) setPendingReportCount(count);
    } catch (e) {
      console.error('Error fetching report count:', e);
    }
  };


  const fetchBannedUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('banned_users')
        .select('user_id');
      if (!error && data) {
        setBannedUserIds(new Set(data.map(b => b.user_id)));
      }
    } catch (e) {
      console.error('Error fetching banned users:', e);
    }
  };

  const handlePurgeActivity = async (userId: string) => {
    setPurgingUserId(userId);
    try {
      const authData = JSON.parse(localStorage.getItem('sb-qgttbaibhmzbmknjlghj-auth-token') || '{}');
      const response = await fetch('https://qgttbaibhmzbmknjlghj.supabase.co/functions/v1/purge-user-activity', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authData.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ target_user_id: userId })
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({ 
          title: "Activity Purged", 
          description: result.message 
        });
      } else {
        throw new Error(result.error || 'Purge failed');
      }
    } catch (error: any) {
      console.error('Error purging user activity:', error);
      toast({
        title: "Error",
        description: `Failed to purge activity: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setPurgingUserId(null);
    }
    setPendingAction(null);
  };

  const handleBanUser = async (userId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const insertData: any = {
        user_id: userId,
        banned_by: user?.id,
        reason: banReason || 'Banned by admin',
      };
      if (banExpiry) {
        insertData.expires_at = new Date(banExpiry).toISOString();
      }

      const { error } = await supabase
        .from('banned_users')
        .insert(insertData);

      if (error) throw error;

      setBannedUserIds(prev => new Set([...prev, userId]));
      toast({ title: "User Banned", description: "User has been banned successfully" });
    } catch (error: any) {
      console.error('Error banning user:', error);
      toast({
        title: "Error",
        description: `Failed to ban user: ${error.message}`,
        variant: "destructive"
      });
    }
    setBanReason('');
    setBanExpiry('');
    setPendingAction(null);
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('banned_users')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      setBannedUserIds(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
      toast({ title: "User Unbanned", description: "User ban has been removed" });
    } catch (error: any) {
      console.error('Error unbanning user:', error);
      toast({
        title: "Error",
        description: `Failed to unban user: ${error.message}`,
        variant: "destructive"
      });
    }
    setPendingAction(null);
  };

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
      case 'purgeActivity':
        handlePurgeActivity(pendingAction.id);
        break;
      case 'banUser':
        handleBanUser(pendingAction.id);
        break;
      case 'unbanUser':
        handleUnbanUser(pendingAction.id);
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

  const backfillPromoImages = async () => {
    setBackfillingPromos(true);
    try {
      const { data: allPromos, error } = await supabase
        .from('promos')
        .select('id, title, description, discount_text, drink_type, image_url');

      if (error) throw error;
      if (!allPromos || allPromos.length === 0) {
        toast({ title: "No promos found", description: "There are no promos to backfill." });
        return;
      }

      let updatedCount = 0;
      for (const p of allPromos) {
        const drinkTypes = Array.isArray(p.drink_type) ? p.drink_type : [];
        const category = detectDrinkCategory(
          p.title || '', p.description || '', p.discount_text || '', drinkTypes
        );
        const placeholder = getPlaceholderImage(category);
        const enrichedTypes = enrichDrinkTypes(drinkTypes, category);

        const needsImageUpdate = !p.image_url || p.image_url.includes('unsplash.com') || p.image_url.trim() === '';
        const needsTypeUpdate = drinkTypes.length === 0 && enrichedTypes.length > 0;

        if (needsImageUpdate || needsTypeUpdate) {
          const updates: Record<string, any> = {};
          if (needsImageUpdate) updates.image_url = placeholder;
          if (needsTypeUpdate) updates.drink_type = enrichedTypes;

          const { error: updateError } = await supabase
            .from('promos')
            .update(updates)
            .eq('id', p.id);

          if (!updateError) updatedCount++;
        }
      }

      toast({
        title: "Backfill Complete",
        description: `Updated ${updatedCount} of ${allPromos.length} promos with category images and drink types.`
      });
    } catch (error: any) {
      console.error('Error backfilling promos:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to backfill promo images",
        variant: "destructive"
      });
    } finally {
      setBackfillingPromos(false);
    }
  };

  const reclassifyPromos = async () => {
    setReclassifying(true);
    try {
      const { data: allPromos, error } = await supabase
        .from('promos')
        .select('id, title, discount_text, description, promo_type');

      if (error) throw error;

      let changed = 0;
      let skipped = 0;

      for (const promo of allPromos || []) {
        const newType = reclassifyPromoType(promo.title, promo.discount_text, promo.description);
        if (!newType || newType === promo.promo_type) {
          skipped++;
          continue;
        }

        const { error: updateError } = await supabase
          .from('promos')
          .update({ promo_type: newType })
          .eq('id', promo.id);

        if (!updateError) changed++;
      }

      toast({
        title: "Re-categorization complete",
        description: `${changed} promos updated, ${skipped} unchanged`,
      });
      fetchData();
    } catch (error: any) {
      console.error('Error reclassifying promos:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to reclassify promos",
        variant: "destructive"
      });
    } finally {
      setReclassifying(false);
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
      case 'purgeActivity':
        return `This will permanently delete ALL activity by "${pendingAction.userName}" — comments, reviews, reports, photos, and event attendance. This cannot be undone.`;
      case 'banUser':
        return `Ban "${pendingAction.userName}"? They will be unable to create events, promos, comments, or reviews.`;
      case 'unbanUser':
        return `Remove the ban on "${pendingAction.userName}"? They will regain full access.`;
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
      <Header activeSection="admin" />
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
        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList className="flex w-full flex-wrap h-auto gap-1">
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="reports" className="relative">
              Reports
              {pendingReportCount > 0 && (
                <Badge variant="destructive" className="ml-1.5 px-1.5 py-0 text-[10px] min-w-[18px] h-[18px] flex items-center justify-center">
                  {pendingReportCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="flags" className="relative">
              <Flag className="w-3 h-3 mr-1" />
              Flags
              {pendingFlagCount > 0 && (
                <Badge variant="destructive" className="ml-1.5 px-1.5 py-0 text-[10px] min-w-[18px] h-[18px] flex items-center justify-center">
                  {pendingFlagCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="promos">Promos</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="tags">Tags</TabsTrigger>
            <TabsTrigger value="venues">Venues</TabsTrigger>
            <TabsTrigger value="venue-claims">Claims</TabsTrigger>
            <TabsTrigger value="venue-edits">Edits</TabsTrigger>
            <TabsTrigger value="venue-audit">Audit</TabsTrigger>
            <TabsTrigger value="receipts">Receipts</TabsTrigger>
            <TabsTrigger value="database">Database</TabsTrigger>
            <TabsTrigger value="migration">Migration</TabsTrigger>
            <TabsTrigger value="ig-creator">IG Creator</TabsTrigger>
            <TabsTrigger value="import">Import</TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="w-3 h-3 mr-1" />
              Notifications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            <AdminAnalytics />
          </TabsContent>

          <TabsContent value="reports">
            <AdminReportManagement />
          </TabsContent>

          <TabsContent value="flags">
            <AdminUserFlags onFlagCountChange={setPendingFlagCount} />
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
                        <div className="flex items-center gap-2 flex-wrap">
                          {user.roles?.some(r => r.role === 'admin' || r.role === 'superadmin') ? (
                            <Badge variant="destructive">
                              {user.roles.find(r => r.role === 'superadmin') ? 'Super Admin' : 'Admin'}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              {user.profile_type}
                            </Badge>
                          )}
                          {user.is_verified && (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              Verified
                            </Badge>
                          )}
                          {bannedUserIds.has(user.user_id) && (
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <Ban className="w-3 h-3" /> Banned
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
                            id: user.user_id, 
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
                              id: user.user_id, 
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
                          variant="outline"
                          size="sm"
                          disabled={purgingUserId === user.user_id}
                          onClick={() => setPendingAction({
                            type: 'purgeActivity',
                            id: user.user_id,
                            userName: user.display_name || 'Unnamed User'
                          })}
                          title="Purge all activity"
                        >
                          <Eraser className="w-4 h-4" />
                        </Button>
                        {bannedUserIds.has(user.user_id) ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPendingAction({
                              type: 'unbanUser',
                              id: user.user_id,
                              userName: user.display_name || 'Unnamed User'
                            })}
                          >
                            Unban
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setBanReason('');
                              setBanExpiry('');
                              setPendingAction({
                                type: 'banUser',
                                id: user.user_id,
                                userName: user.display_name || 'Unnamed User'
                              });
                            }}
                          >
                            <Ban className="w-4 h-4" />
                          </Button>
                        )}
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

          <TabsContent value="venue-claims" className="space-y-4">
            <AdminVenueClaims />
          </TabsContent>

          <TabsContent value="venue-edits" className="space-y-4">
            <AdminVenueEdits />
          </TabsContent>

          <TabsContent value="venue-audit" className="space-y-4">
            <AdminVenueAudit />
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

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-semibold">Backfill Promo Images & Drink Types</h4>
                        <p className="text-sm text-muted-foreground">Auto-categorize promos and assign placeholder images based on drink keywords</p>
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={backfillPromoImages}
                        disabled={backfillingPromos}
                      >
                        <Database className={`w-4 h-4 mr-2 ${backfillingPromos ? 'animate-spin' : ''}`} />
                        {backfillingPromos ? 'Backfilling...' : 'Backfill Promos'}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-semibold">Re-categorize Promo Types</h4>
                        <p className="text-sm text-muted-foreground">Re-classify all promos using keyword rules (fixes misclassified Free Flow, Other, etc.)</p>
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={reclassifyPromos}
                        disabled={reclassifying}
                      >
                        <RefreshCw className={`w-4 h-4 mr-2 ${reclassifying ? 'animate-spin' : ''}`} />
                        {reclassifying ? 'Re-categorizing...' : 'Re-categorize'}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-semibold">Seed Venues from Promos & Events</h4>
                        <p className="text-sm text-muted-foreground">Create venue records from existing venue names in promos and events</p>
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={async () => {
                          try {
                            toast({ title: "Seeding venues...", description: "Processing existing data" });
                            // Get unique venue names from promos
                            const { data: promos } = await supabase.from('promos').select('venue_name, venue_address, venue_latitude, venue_longitude');
                            const { data: events } = await supabase.from('events').select('venue_name, venue_address, venue_latitude, venue_longitude');
                            
                            const venueMap = new Map<string, any>();
                            [...(promos || []), ...(events || [])].forEach(item => {
                              if (item.venue_name && !venueMap.has(item.venue_name.toLowerCase())) {
                                venueMap.set(item.venue_name.toLowerCase(), {
                                  name: item.venue_name,
                                  address: item.venue_address,
                                  latitude: item.venue_latitude,
                                  longitude: item.venue_longitude,
                                });
                              }
                            });

                            // Check which venues already exist
                            const { data: existingVenues } = await supabase.from('venues').select('name');
                            const existingNames = new Set((existingVenues || []).map(v => v.name.toLowerCase()));
                            
                            const newVenues = Array.from(venueMap.values()).filter(v => !existingNames.has(v.name.toLowerCase()));
                            
                            if (newVenues.length === 0) {
                              toast({ title: "No new venues", description: "All venue names already exist in the database" });
                              return;
                            }

                            const { data: { user } } = await supabase.auth.getUser();
                            const toInsert = newVenues.map(v => ({ ...v, created_by: user?.id }));
                            
                            const { error } = await supabase.from('venues').insert(toInsert);
                            if (error) throw error;

                            // Now link promos and events to venue records
                            const { data: allVenues } = await supabase.from('venues').select('id, name');
                            if (allVenues) {
                              const venueByName = new Map(allVenues.map(v => [v.name.toLowerCase(), v.id]));
                              for (const [name, venueId] of venueByName) {
                                await supabase.from('promos').update({ venue_id: venueId }).ilike('venue_name', name).is('venue_id', null);
                                await supabase.from('events').update({ venue_id: venueId }).ilike('venue_name', name).is('venue_id', null);
                              }
                            }

                            toast({ title: "Success!", description: `Created ${newVenues.length} venue records and linked existing promos/events` });
                          } catch (error: any) {
                            console.error('Error seeding venues:', error);
                            toast({ title: "Error", description: error.message || "Failed to seed venues", variant: "destructive" });
                          }
                        }}
                      >
                        <Database className="w-4 h-4 mr-2" />
                        Seed Venues
                      </Button>
                    </div>

                    {/* Geocode Venues */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-semibold">Geocode Venues</h4>
                        <p className="text-sm text-muted-foreground">Auto-populate missing addresses and coordinates using Photon geocoding (OpenStreetMap)</p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={async () => {
                          const { searchPlaces, formatAddress } = await import("@/lib/photon");
                          
                          try {
                            const { data: venues, error } = await supabase
                              .from('venues')
                              .select('id, name, address, latitude, longitude')
                              .or('address.is.null,latitude.is.null,longitude.is.null');
                            
                            if (error) throw error;
                            if (!venues || venues.length === 0) {
                              toast({ title: "All done", description: "All venues already have address data" });
                              return;
                            }

                            toast({ title: "Geocoding...", description: `Processing ${venues.length} venues...` });

                            let updated = 0;
                            let skipped = 0;

                            for (const venue of venues) {
                              try {
                                const results = await searchPlaces(venue.name + " Jakarta");
                                if (results.length > 0) {
                                  const top = results[0];
                                  const [lng, lat] = top.geometry.coordinates;
                                  const address = formatAddress(top);

                                  await supabase
                                    .from('venues')
                                    .update({ address, latitude: lat, longitude: lng })
                                    .eq('id', venue.id);

                                  updated++;
                                } else {
                                  skipped++;
                                }
                                // Rate limit: 300ms between requests
                                await new Promise(r => setTimeout(r, 300));
                              } catch {
                                skipped++;
                              }
                            }

                            toast({ title: "Geocoding complete", description: `Updated ${updated} venues, skipped ${skipped}` });
                          } catch (error: any) {
                            console.error('Error geocoding venues:', error);
                            toast({ title: "Error", description: error.message || "Failed to geocode venues", variant: "destructive" });
                          }
                        }}
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        Geocode Venues
                      </Button>
                    </div>

                    {/* Scrape Venue Images */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-semibold">Scrape Venue Images</h4>
                        <p className="text-sm text-muted-foreground">Auto-fetch images from venue websites and Instagram</p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={async () => {
                          try {
                            toast({ title: "Scraping images...", description: "Processing batch of 10 venues. Please wait..." });
                            const { data, error } = await supabase.functions.invoke('scrape-venue-images', {
                              body: { batch_size: 10, mode: 'images' },
                            });
                            if (error) {
                              const errorBody = error?.context ? await error.context.json?.().catch(() => null) : null;
                              throw new Error(errorBody?.error || error.message || 'Edge function error');
                            }
                            if (data?.success) {
                              toast({ 
                                title: "✅ Image scraping complete", 
                                description: `Found images for ${data.summary.images}/${data.summary.total} venues.${data.summary.total > data.summary.images ? ' Click again for more.' : ''}` 
                              });
                            } else {
                              toast({ title: "Error", description: data?.error || "Failed to scrape images", variant: "destructive" });
                            }
                          } catch (error: any) {
                            console.error('Error scraping venue images:', error);
                            toast({ title: "Scraping failed", description: error.message || "Failed to scrape venue images. Try again.", variant: "destructive" });
                          }
                        }}
                      >
                        <Image className="w-4 h-4 mr-2" />
                        Scrape Images
                      </Button>
                    </div>

                    {/* Scrape Venue Contacts */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-semibold">Scrape Venue Contacts</h4>
                        <p className="text-sm text-muted-foreground">Auto-find Instagram handles and WhatsApp numbers</p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={async () => {
                          try {
                            toast({ title: "Scraping contacts...", description: "Looking for Instagram & WhatsApp..." });
                            const { data, error } = await supabase.functions.invoke('scrape-venue-images', {
                              body: { batch_size: 10, mode: 'contacts' },
                            });
                            if (error) {
                              const errorBody = error?.context ? await error.context.json?.().catch(() => null) : null;
                              throw new Error(errorBody?.error || error.message || 'Edge function error');
                            }
                            if (data?.success) {
                              toast({ 
                                title: "✅ Contact scraping complete", 
                                description: `Found ${data.summary.instagram} Instagram, ${data.summary.whatsapp} WhatsApp across ${data.summary.total} venues.${data.summary.total > data.summary.found ? ' Click again for more.' : ''}` 
                              });
                            } else {
                              toast({ title: "Error", description: data?.error || "Failed to scrape contacts", variant: "destructive" });
                            }
                          } catch (error: any) {
                            console.error('Error scraping venue contacts:', error);
                            toast({ title: "Scraping failed", description: error.message || "Failed to scrape venue contacts.", variant: "destructive" });
                          }
                        }}
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        Scrape Contacts
                      </Button>
                    </div>

                    {/* Scrape Venue Details (GMaps + Hours) */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-semibold">Scrape Venue Details</h4>
                        <p className="text-sm text-muted-foreground">Auto-find Google Maps links and opening hours</p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={async () => {
                          try {
                            toast({ title: "Scraping details...", description: "Looking for Google Maps links & opening hours..." });
                            const { data, error } = await supabase.functions.invoke('scrape-venue-images', {
                              body: { batch_size: 10, mode: 'details' },
                            });
                            if (error) {
                              const errorBody = error?.context ? await error.context.json?.().catch(() => null) : null;
                              throw new Error(errorBody?.error || error.message || 'Edge function error');
                            }
                            if (data?.success) {
                              toast({ 
                                title: "✅ Details scraping complete", 
                                description: `Found ${data.summary.gmaps} Google Maps, ${data.summary.hours} opening hours across ${data.summary.total} venues.${data.summary.total > data.summary.found ? ' Click again for more.' : ''}` 
                              });
                            } else {
                              toast({ title: "Error", description: data?.error || "Failed to scrape details", variant: "destructive" });
                            }
                          } catch (error: any) {
                            console.error('Error scraping venue details:', error);
                            toast({ title: "Scraping failed", description: error.message || "Failed to scrape venue details.", variant: "destructive" });
                          }
                        }}
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        Scrape Details
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

          <TabsContent value="ig-creator" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Instagram className="w-5 h-5" />
                  Instagram Post Generator
                </CardTitle>
                <CardDescription>Create and manage Instagram posts for events and promos</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => navigate('/instagram-generator')} className="flex items-center gap-2">
                  <Instagram className="w-4 h-4" />
                  Open IG Creator
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="import" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileUp className="w-5 h-5" />
                  Batch Import
                </CardTitle>
                <CardDescription>Import promos, events, or contacts from images and spreadsheets</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => navigate('/import')} className="flex items-center gap-2">
                  <FileUp className="w-4 h-4" />
                  Open Import Tool
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tags" className="space-y-4">
            <AdminTagManagement />
          </TabsContent>

          <TabsContent value="notifications">
            <AdminNotificationSettings />
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
            {pendingAction?.type === 'banUser' && (
              <div className="space-y-3 py-2">
                <div>
                  <Label htmlFor="ban-reason">Reason</Label>
                  <Input
                    id="ban-reason"
                    placeholder="Reason for ban..."
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="ban-expiry">Expires (optional)</Label>
                  <Input
                    id="ban-expiry"
                    type="datetime-local"
                    value={banExpiry}
                    onChange={(e) => setBanExpiry(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Leave empty for permanent ban</p>
                </div>
              </div>
            )}
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