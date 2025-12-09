import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ContinuousStarfield } from "@/components/ContinuousStarfield";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { User, Star, Calendar, Edit, Save, X, ArrowLeft, Trash2, Gift, Share2, Heart, Eye, Settings, Building2, Pencil } from "lucide-react";
import { ReportDialog } from "./ReportDialog";
import { Header } from "./Header";
import { supabase } from "@/integrations/supabase/client";
import defaultAvatar from "@/assets/default-avatar.png";
import { useToast } from "@/hooks/use-toast";
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { Tables } from "../integrations/supabase/types";
import { ImageUpload } from "./form-components/ImageUpload";
import { EventWithSlug, PromoWithSlug } from "@/types/extended-types";
import { getEventUrl, getPromoUrl, getEditEventUrl, getEditPromoUrl } from "@/lib/slug-utils";
import { SpinningPaws } from "@/components/ui/spinning-paws";
import { usePageTitle } from "@/hooks/usePageTitle";

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  gender: string | null;
  age: number | null;
  instagram: string | null;
  whatsapp: string | null;
  party_style: string | null;
  created_at: string;
  updated_at: string;
  is_admin: boolean;
  is_super_admin: boolean;
  is_verified: boolean;
  profile_type: string | null;
  business_name: string | null;
  venue_whatsapp: string | null;
  venue_address: string | null;
  venue_opening_hours: string | null;
  venue_status: string;
  venue_applied_at: string | null;
  venue_verified_at: string | null;
}

export const UserProfile = () => {
  usePageTitle("Profile");
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [activeSection, setActiveSection] = useState('profile');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showVenueDialog, setShowVenueDialog] = useState(false);
  const [venueCtaDismissed, setVenueCtaDismissed] = useState(false);
  const [userEvents, setUserEvents] = useState<EventWithSlug[]>([]);
  const [userPromos, setUserPromos] = useState<PromoWithSlug[]>([]);
  const [joinedEvents, setJoinedEvents] = useState<EventWithSlug[]>([]);
  const [favoritePromos, setFavoritePromos] = useState<PromoWithSlug[]>([]);
  const [badgeStats, setBadgeStats] = useState({
    totalAttendees: 0,
    commentsCount: 0,
    reviewsCount: 0,
    accountAge: 0,
  });
  const [editForm, setEditForm] = useState({
    display_name: '',
    bio: '',
    avatar_url: '',
    gender: '',
    age: '',
    instagram: '',
    whatsapp: '',
    party_style: '',
    custom_party_style: '',
    business_name: '',
    venue_whatsapp: '',
    venue_address: '',
    venue_opening_hours: '',
  });
  const { toast } = useToast();
  const navigate = useNavigate();
  const { userId } = useParams();
  const isAdminView = window.location.pathname.includes('/admin/user/');
  const isSharedProfile = window.location.pathname.includes('/profile/') && !!userId;

  const checkAdminStatus = async (userId?: string) => {
    if (!userId) {
      setIsAdmin(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .in('role', ['admin', 'superadmin'])
        .single();

      setIsAdmin(!!data && !error);
    } catch (error) {
      setIsAdmin(false);
    }
  };

  const fetchUserProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // For shared profiles, allow unauthenticated access
      if (!user && !isSharedProfile) {
        toast({
          title: "Not authenticated",
          description: "Please sign in to view your profile.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      setUser(user);

      // Determine which profile to fetch based on the route
      let profileData;
      let error = null;
      
      try {
        if (isAdminView) {
          // Admin viewing a user: use full profile function with profile ID
          const profileResult = await supabase.from('profiles').select('user_id').eq('id', userId).single();
          if (profileResult.data) {
            const { data } = await supabase.rpc('get_full_profile_info', { profile_user_id: profileResult.data.user_id });
            profileData = data && data.length > 0 ? data[0] : null;
          }
        } else if (isSharedProfile) {
          // Shared profile: use public profile function
          const { data } = await supabase.rpc('get_public_profile_info', { profile_user_id: userId });
          profileData = data && data.length > 0 ? data[0] : null;
        } else if (user) {
          // Current user's own profile: use full profile function
          const { data } = await supabase.rpc('get_full_profile_info', { profile_user_id: user.id });
          profileData = data && data.length > 0 ? data[0] : null;
        } else {
          // No user and not a shared profile - should not happen due to earlier check
          setLoading(false);
          return;
        }
      } catch (err) {
        error = err;
        profileData = null;
      }

      const profile = profileData;

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        toast({
          title: "Error",
          description: "Failed to load profile data.",
          variant: "destructive",
        });
        return;
      }

      if (profile) {
        console.log('Profile loaded:', profile);
        console.log('Gender from profile:', profile.gender);
        setProfile(profile);
        const isCustomPartyStyle = profile.party_style && !['clubbing', 'rooftop-parties', 'underground-raves', 'beach-parties', 'live-music', 'cocktail-lounges', 'casual-hangouts', 'vip-experiences'].includes(profile.party_style);
        setEditForm({
          display_name: profile.display_name || '',
          bio: profile.bio || '',
          avatar_url: profile.avatar_url || '',
          gender: profile.gender || '',
          age: profile.age?.toString() || '',
          instagram: profile.instagram || '',
          whatsapp: profile.whatsapp || '',
          party_style: isCustomPartyStyle ? 'custom' : (profile.party_style || ''),
          custom_party_style: isCustomPartyStyle ? profile.party_style : '',
          business_name: profile.business_name || '',
          venue_whatsapp: profile.venue_whatsapp || '',
          venue_address: profile.venue_address || '',
          venue_opening_hours: profile.venue_opening_hours || '',
        });
      }

      // Fetch events created by the user using the secure function
      const targetUserId = (isAdminView || isSharedProfile) ? profile?.user_id : user?.id;
      
      if (targetUserId) {
        const { data: eventsData, error: eventsError } = await supabase
          .rpc('get_events_safe');

        if (eventsError) {
          console.error('Error fetching user events:', eventsError);
          toast({
            title: "Error",
            description: (isAdminView || isSharedProfile) ? "Failed to load user's created events." : "Failed to load your created events.",
            variant: "destructive",
          });
        } else {
          // Filter events by the target user ID
          const filteredEvents = eventsData?.filter((event: any) => event.created_by === targetUserId) || [];
          setUserEvents(filteredEvents.map((event: any) => ({ ...event, slug: event.slug || null })) as EventWithSlug[]);
        }

        // Fetch promos created by the user
        const { data: promosData, error: promosError } = await supabase
          .from('promos')
          .select('*')
          .eq('created_by', targetUserId)
          .order('created_at', { ascending: false });

        if (promosError) {
          console.error('Error fetching user promos:', promosError);
          toast({
            title: "Error",
            description: (isAdminView || isSharedProfile) ? "Failed to load user's created promos." : "Failed to load your created promos.",
            variant: "destructive",
          });
        } else {
          setUserPromos((promosData?.map((promo: any) => ({ ...promo, slug: promo.slug || null })) as PromoWithSlug[]) || []);
        }

        // Fetch events the user has joined (only for own profile, not admin/shared views)
        if (!isAdminView && !isSharedProfile && user?.id === targetUserId) {
          const { data: joinedEventsData, error: joinedEventsError } = await supabase
            .from('event_attendees')
            .select(`
              events:events(*)
            `)
            .eq('user_id', targetUserId);

          if (joinedEventsError) {
            console.error('Error fetching joined events:', joinedEventsError);
            toast({
              title: "Error",
              description: "Failed to load events you joined.",
              variant: "destructive",
            });
          } else {
            const joinedEventsWithSlug = joinedEventsData
              ?.map((item: any) => item.events)
              .filter(Boolean)
              .map((event: any) => ({ ...event, slug: event.slug || null })) as EventWithSlug[];
            setJoinedEvents(joinedEventsWithSlug || []);
          }

          // Fetch user's favorite promos
          const { data: favoritePromosData, error: favoritePromosError } = await supabase
            .from('user_favorite_promos')
            .select(`
              promo_id,
              promos!inner(*)
            `)
            .eq('user_id', targetUserId);

          if (favoritePromosError) {
            console.error('Error fetching favorite promos:', favoritePromosError);
            toast({
              title: "Error",
              description: "Failed to load favorite promos.",
              variant: "destructive",
            });
          } else {
            const favoritePromosWithSlug = favoritePromosData
              ?.map((item: any) => item.promos)
              .filter(Boolean)
              .map((promo: any) => ({ ...promo, slug: promo.slug || null })) as PromoWithSlug[];
            setFavoritePromos(favoritePromosWithSlug || []);
          }

          // Fetch badge statistics
          // Get total attendees across all user's events
          const { data: attendeesData } = await supabase
            .from('event_attendees')
            .select('event_id, events!inner(created_by)', { count: 'exact' })
            .eq('events.created_by', targetUserId);

          // Get comments count
          const { count: eventCommentsCount } = await supabase
            .from('event_comments')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', targetUserId);

          const { count: promoCommentsCount } = await supabase
            .from('promo_comments')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', targetUserId);

          // Get reviews count
          const { count: reviewsCount } = await supabase
            .from('promo_reviews')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', targetUserId);

          // Calculate account age in days
          const accountAge = profile?.created_at 
            ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24))
            : 0;

          setBadgeStats({
            totalAttendees: attendeesData?.length || 0,
            commentsCount: (eventCommentsCount || 0) + (promoCommentsCount || 0),
            reviewsCount: reviewsCount || 0,
            accountAge,
          });
        }
      }

    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, isAdminView, isSharedProfile, userId]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  // Load user-specific venue CTA dismissal state
  useEffect(() => {
    if (user?.id) {
      const dismissed = localStorage.getItem(`venueCtaDismissed_v2_${user.id}`) === 'true';
      setVenueCtaDismissed(dismissed);
    } else {
      setVenueCtaDismissed(false);
    }
  }, [user?.id]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        checkAdminStatus(session?.user?.id);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      checkAdminStatus(session?.user?.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSaveProfile = async () => {
    // ... (handleSaveProfile remains the same)
    if (!user) return;

    setSaving(true);
    try {
      const profileData: any = {
        user_id: user.id,
        display_name: editForm.display_name || null,
        bio: editForm.bio || null,
        avatar_url: editForm.avatar_url || null,
        gender: editForm.gender || null,
        age: editForm.age ? parseInt(editForm.age) : null,
        instagram: editForm.instagram || null,
        whatsapp: editForm.whatsapp || null,
        party_style: editForm.party_style === 'custom' ? editForm.custom_party_style : editForm.party_style || null,
        business_name: editForm.business_name || null,
        venue_whatsapp: editForm.venue_whatsapp || null,
        venue_address: editForm.venue_address || null,
        venue_opening_hours: editForm.venue_opening_hours || null,
        updated_at: new Date().toISOString()
      };

      // If user is filling venue info for the first time or reapplying after rejection, set status to pending
      const currentStatus = profile?.venue_status || 'none';
      const isFirstVenueApplication = currentStatus === 'none' || !profile?.venue_status;
      const isReapplication = currentStatus === 'rejected';
      const hasRequiredVenueInfo = editForm.business_name && editForm.venue_whatsapp;
      
      if ((isFirstVenueApplication || isReapplication) && hasRequiredVenueInfo) {
        profileData.venue_status = 'pending';
        profileData.venue_applied_at = new Date().toISOString();
        console.log('Setting venue status to pending:', { 
          business_name: editForm.business_name, 
          venue_whatsapp: editForm.venue_whatsapp,
          currentStatus,
          isReapplication
        });
      }

      console.log('Saving profile data:', profileData);
      console.log('Gender value being saved:', editForm.gender);

      const { error } = await supabase
        .from('profiles')
        .upsert(profileData, { 
          onConflict: 'user_id',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('Error updating profile:', error);
        toast({
          title: "Error",
          description: "Failed to update profile.",
          variant: "destructive",
        });
        return;
      }

      // Show different message for venue applications
      const isVenueApplication = (isFirstVenueApplication || isReapplication) && hasRequiredVenueInfo;
      toast({
        title: "Success",
        description: isVenueApplication ? "Success! Application submitted!" : "Profile updated successfully!",
      });

      // Immediately update local state for instant UI feedback
      if (isVenueApplication && profile) {
        setProfile({
          ...profile,
          venue_status: 'pending',
          venue_applied_at: new Date().toISOString(),
          business_name: editForm.business_name,
          venue_whatsapp: editForm.venue_whatsapp,
          venue_address: editForm.venue_address || profile.venue_address,
          venue_opening_hours: editForm.venue_opening_hours || profile.venue_opening_hours,
        });
      }

      await fetchUserProfile();
      setIsEditing(false);
      setShowVenueDialog(false);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    // ... (handleCancelEdit remains the same)
     if (profile) {
      const isCustomPartyStyle = profile.party_style && !['clubbing', 'rooftop-parties', 'underground-raves', 'beach-parties', 'live-music', 'cocktail-lounges', 'casual-hangouts', 'vip-experiences'].includes(profile.party_style);
      setEditForm({
        display_name: profile.display_name || '',
        bio: profile.bio || '',
        avatar_url: profile.avatar_url || '',
        gender: profile.gender || '',
        age: profile.age?.toString() || '',
        instagram: profile.instagram || '',
        whatsapp: profile.whatsapp || '',
        party_style: isCustomPartyStyle ? 'custom' : (profile.party_style || ''),
        custom_party_style: isCustomPartyStyle ? profile.party_style : '',
        business_name: profile.business_name || '',
        venue_whatsapp: profile.venue_whatsapp || '',
        venue_address: profile.venue_address || '',
        venue_opening_hours: profile.venue_opening_hours || '',
      });
    }
    setIsEditing(false);
  };

  const handleShareProfile = async () => {
    try {
      const profileUrl = isAdminView 
        ? `${window.location.origin}/profile/${profile?.user_id || userId}`
        : `${window.location.origin}/profile/${user?.id}`;
      
      await navigator.clipboard.writeText(profileUrl);
      
      toast({
        title: "Profile URL Copied! 🔗",
        description: "The profile link has been copied to your clipboard and is ready to paste.",
      });
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      const fallbackUrl = isAdminView 
        ? `${window.location.origin}/profile/${profile?.user_id || userId}`
        : `${window.location.origin}/profile/${user?.id}`;
      toast({
        title: "Share Profile",
        description: `Profile URL: ${fallbackUrl}`,
      });
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-delete', {
        body: { type: 'event', id: eventId },
      });
      
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "Success",
        description: "Event deleted successfully!",
      });

      // Refresh the event list
      setUserEvents(userEvents.filter(event => event.id !== eventId));

    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: "Error",
        description: `Failed to delete event: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleDeletePromo = async (promoId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-delete', {
        body: { type: 'promo', id: promoId },
      });
      
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "Success",
        description: "Promo deleted successfully!",
      });

      // Refresh the promo list
      setUserPromos(userPromos.filter(promo => promo.id !== promoId));

    } catch (error) {
      console.error('Error deleting promo:', error);
      toast({
        title: "Error",
        description: `Failed to delete promo: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const toggleFavoritePromo = async (promoId: string) => {
    if (!user) return;

    try {
      const isFavorite = favoritePromos.some(promo => promo.id === promoId);
      
      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from('user_favorite_promos')
          .delete()
          .eq('user_id', user.id)
          .eq('promo_id', promoId);

        if (error) throw error;

        setFavoritePromos(favoritePromos.filter(promo => promo.id !== promoId));
        toast({
          title: "Removed from favorites",
          description: "Promo removed from your favorites!",
        });
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('user_favorite_promos')
          .insert({ user_id: user.id, promo_id: promoId });

        if (error) throw error;

        // Fetch the promo details to add to favorites list
        const { data: promoData, error: promoError } = await supabase
          .from('promos')
          .select('*')
          .eq('id', promoId)
          .single();

        if (!promoError && promoData) {
          setFavoritePromos([...favoritePromos, { ...promoData, slug: promoData.slug || null }]);
        }

        toast({
          title: "Added to favorites",
          description: "Promo added to your favorites!",
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: "Error",
        description: "Failed to update favorite status.",
        variant: "destructive",
      });
    }
  };

  // ... (loading and !user checks remain the same)
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <SpinningPaws size="lg" />
              <p className="text-muted-foreground">Loading profile...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Only require authentication for non-shared profiles
  if (!user && !isSharedProfile) {
    return (
      <>
        <ContinuousStarfield />
        <Header activeSection={activeSection} onSectionChange={setActiveSection} />
        <div className="max-w-4xl mx-auto space-y-6 pt-20 px-4 relative z-10">
          <Card className="bg-card border-border">
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">Please sign in to view your profile.</p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'User';
  const avatarUrl = profile?.avatar_url || defaultAvatar;

  return (
    <>
      <ContinuousStarfield />
      <Header activeSection={activeSection} onSectionChange={setActiveSection} />
      <div className="max-w-4xl mx-auto space-y-6 pt-20 px-4 relative z-10">
      {/* Profile Header */}
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-6">
            {/* Profile Image */}
            <div className="relative">
              <div 
                className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary neon-glow cursor-pointer group"
                onClick={() => {
                  if (isEditing || (!isSharedProfile && user?.id === profile?.user_id)) {
                    document.getElementById('avatar-upload-trigger')?.click();
                  }
                }}
              >
                <img
                  src={isEditing ? editForm.avatar_url || avatarUrl || defaultAvatar : avatarUrl || defaultAvatar}
                  alt={displayName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = defaultAvatar;
                  }}
                />
                {(isEditing || (!isSharedProfile && user?.id === profile?.user_id)) && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Pencil className="w-6 h-6 text-white" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <Star className="w-4 h-4 text-primary-foreground fill-current" />
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left space-y-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="display_name">Display Name</Label>
                    <Input
                      id="display_name"
                      value={editForm.display_name}
                      onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                      placeholder="Enter your display name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={editForm.bio}
                      onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                      placeholder="Tell us about yourself..."
                      className="min-h-[60px]"
                    />
                  </div>
                  
                  <div className="bg-muted/30 rounded-lg p-4 border">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <h4 className="font-medium text-sm">Basic Info</h4>
                      <span className="text-xs text-muted-foreground">(optional)</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="gender" className="text-sm font-medium">Gender</Label>
                        <Select value={editForm.gender} onValueChange={(value) => setEditForm({ ...editForm, gender: value })}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">👨 Male</SelectItem>
                            <SelectItem value="female">👩 Female</SelectItem>
                            <SelectItem value="non-binary">🌈 Non-binary</SelectItem>
                            <SelectItem value="prefer-not-to-say">🤐 Prefer not to say</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="age" className="text-sm font-medium">Age</Label>
                        <Input
                          id="age"
                          type="number"
                          min="18"
                          max="100"
                          value={editForm.age}
                          onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
                          placeholder="18-100"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-primary/5 to-purple-600/5 rounded-lg p-4 border border-primary/20">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="text-lg">🎉</div>
                      <Label htmlFor="party_style" className="text-base font-semibold text-primary">Party Style</Label>
                      <span className="text-xs text-muted-foreground">(Let others know your vibe!)</span>
                    </div>
                    <Select value={editForm.party_style} onValueChange={(value) => setEditForm({ ...editForm, party_style: value })}>
                      <SelectTrigger className="border-primary/30 focus:border-primary">
                        <SelectValue placeholder="🕺 What's your party vibe?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="clubbing">🍸 Clubbing</SelectItem>
                        <SelectItem value="rooftop-parties">🏙️ Rooftop Parties</SelectItem>
                        <SelectItem value="underground-raves">🎵 Underground Raves</SelectItem>
                        <SelectItem value="beach-parties">🏖️ Beach Parties</SelectItem>
                        <SelectItem value="live-music">🎤 Live Music</SelectItem>
                        <SelectItem value="cocktail-lounges">🍹 Cocktail Lounges</SelectItem>
                        <SelectItem value="casual-hangouts">😎 Casual Hangouts</SelectItem>
                        <SelectItem value="vip-experiences">✨ VIP Experiences</SelectItem>
                        <SelectItem value="custom">✍️ Custom Style</SelectItem>
                      </SelectContent>
                    </Select>
                    {editForm.party_style === 'custom' && (
                      <div className="mt-3">
                        <Input
                          value={editForm.custom_party_style}
                          onChange={(e) => setEditForm({ ...editForm, custom_party_style: e.target.value })}
                          placeholder="Enter your custom party style..."
                          className="border-primary/30 focus:border-primary"
                        />
                      </div>
                    )}
                  </div>

                  <div className="bg-muted/20 rounded-lg p-4 border border-green-200/50">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <h4 className="font-medium text-sm">Social Connect</h4>
                      <span className="text-xs text-muted-foreground">(Let people find you!)</span>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="instagram" className="text-sm font-medium flex items-center gap-2">
                          📸 Instagram Handle
                        </Label>
                        <Input
                          id="instagram"
                          value={editForm.instagram}
                          onChange={(e) => setEditForm({ ...editForm, instagram: e.target.value })}
                          placeholder="@yourusername"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="whatsapp" className="text-sm font-medium flex items-center gap-2">
                          💬 WhatsApp Number
                        </Label>
                        <Input
                          id="whatsapp"
                          value={editForm.whatsapp}
                          onChange={(e) => setEditForm({ ...editForm, whatsapp: e.target.value })}
                          placeholder="+62 XXX XXX XXXX"
                          className="mt-1"
                        />
                      </div>
                      {(editForm.instagram || editForm.whatsapp) && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                          <p className="text-sm text-amber-800">
                            <strong>🔒 Privacy Notice:</strong> By adding social links, they'll be visible to anyone viewing your profile.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Hidden file input for avatar upload */}
                  <Input
                    id="avatar-upload-trigger"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      
                      try {
                        const { data: { user } } = await supabase.auth.getUser();
                        if (!user) {
                          toast({
                            title: "Error",
                            description: "You must be logged in to upload images",
                            variant: "destructive",
                          });
                          return;
                        }

                        // Preview immediately
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          const result = e.target?.result as string;
                          setEditForm({ ...editForm, avatar_url: result });
                        };
                        reader.readAsDataURL(file);

                        // Upload to Supabase Storage
                        const { uploadImage } = await import('@/lib/supabase-storage');
                        const publicUrl = await uploadImage(file, 'events', user.id);
                        
                        setEditForm({ ...editForm, avatar_url: publicUrl });
                        toast({
                          title: "Success",
                          description: "Avatar uploaded successfully!",
                        });
                      } catch (error) {
                        console.error("Upload error:", error);
                        toast({
                          title: "Error",
                          description: "Failed to upload avatar",
                          variant: "destructive",
                        });
                      }
                    }}
                  />

                  {profile?.venue_status === 'pending' && (
                    <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-lg p-4 border border-amber-200/50">
                      <div className="flex items-center gap-3">
                        <Building2 className="w-6 h-6 text-amber-600" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-base">Venue Registration Pending</h4>
                            <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-300">Pending Review</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            Your venue application is under review. We'll notify you once it's approved!
                          </p>
                          {profile?.venue_applied_at && (
                            <p className="text-xs text-muted-foreground">
                              Submitted on {new Date(profile.venue_applied_at).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })} • Typical review time: 2-3 business days
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {profile?.venue_status === 'verified' && (
                    <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg p-4 border border-green-200/50">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="text-2xl">✅</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-base">Verified Venue</h4>
                            <Badge className="bg-green-600 hover:bg-green-700">Verified</Badge>
                          </div>
                          {profile?.venue_verified_at && (
                            <p className="text-xs text-muted-foreground">
                              Verified on {new Date(profile.venue_verified_at).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="business_name" className="text-sm font-medium">Business Name</Label>
                          <Input
                            id="business_name"
                            value={editForm.business_name}
                            onChange={(e) => setEditForm({ ...editForm, business_name: e.target.value })}
                            placeholder="Your venue or business name"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="venue_whatsapp" className="text-sm font-medium">Venue WhatsApp</Label>
                          <Input
                            id="venue_whatsapp"
                            value={editForm.venue_whatsapp}
                            onChange={(e) => setEditForm({ ...editForm, venue_whatsapp: e.target.value })}
                            placeholder="+62 XXX XXX XXXX"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="venue_address" className="text-sm font-medium">Venue Address</Label>
                          <Input
                            id="venue_address"
                            value={editForm.venue_address}
                            onChange={(e) => setEditForm({ ...editForm, venue_address: e.target.value })}
                            placeholder="Full address of your venue"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="venue_opening_hours" className="text-sm font-medium">Opening Hours</Label>
                          <Input
                            id="venue_opening_hours"
                            value={editForm.venue_opening_hours}
                            onChange={(e) => setEditForm({ ...editForm, venue_opening_hours: e.target.value })}
                            placeholder="e.g., Mon-Sat 6PM-2AM"
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {profile?.venue_status === 'rejected' && (
                    <div className="bg-gradient-to-r from-red-500/10 to-rose-500/10 rounded-lg p-4 border border-red-200/50">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">❌</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-base">Application Not Approved</h4>
                            <Badge variant="destructive" className="bg-red-600">Rejected</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            Your venue application was not approved. Please review your information and submit a new application with updated details.
                          </p>
                          <div className="space-y-3 mt-4">
                            <div>
                              <Label htmlFor="business_name_rejected" className="text-sm font-medium">Business Name *</Label>
                              <Input
                                id="business_name_rejected"
                                value={editForm.business_name}
                                onChange={(e) => setEditForm({ ...editForm, business_name: e.target.value })}
                                placeholder="Your venue or business name"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label htmlFor="venue_whatsapp_rejected" className="text-sm font-medium">Venue WhatsApp *</Label>
                              <Input
                                id="venue_whatsapp_rejected"
                                value={editForm.venue_whatsapp}
                                onChange={(e) => setEditForm({ ...editForm, venue_whatsapp: e.target.value })}
                                placeholder="+62 XXX XXX XXXX"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label htmlFor="venue_address_rejected" className="text-sm font-medium">Venue Address</Label>
                              <Input
                                id="venue_address_rejected"
                                value={editForm.venue_address}
                                onChange={(e) => setEditForm({ ...editForm, venue_address: e.target.value })}
                                placeholder="Full address of your venue"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label htmlFor="venue_opening_hours_rejected" className="text-sm font-medium">Opening Hours</Label>
                              <Input
                                id="venue_opening_hours_rejected"
                                value={editForm.venue_opening_hours}
                                onChange={(e) => setEditForm({ ...editForm, venue_opening_hours: e.target.value })}
                                placeholder="e.g., Mon-Sat 6PM-2AM"
                                className="mt-1"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}


                  <ImageUpload
                    label="Avatar"
                    imageUrl={editForm.avatar_url}
                    onImageChange={(url) => setEditForm({ ...editForm, avatar_url: url })}
                    inputId="avatar-upload"
                  />
                </div>
              ) : (
                <div>
                  <h2 className="text-3xl font-bold gradient-text break-words leading-tight mb-2">{displayName}</h2>
                  <p className="text-sm text-muted-foreground mt-3 max-w-md">
                    {profile?.bio || "Jakarta party enthusiast 🎉"}
                  </p>
                  
                  {/* Additional Profile Info */}
                  <div className="mt-6 space-y-4">
                    {/* Basic Info */}
                    {(profile?.gender || profile?.age) && (
                      <div className="flex items-center gap-4 text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
                        <div className="w-2 h-2 rounded-full bg-primary"></div>
                        <div className="flex gap-4">
                          {profile?.gender && (
                            <span className="capitalize font-medium">{profile.gender.replace('-', ' ')}</span>
                          )}
                          {profile?.age && (
                            <span className="font-medium">{profile.age} years old</span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Party Style - Make it prominent */}
                    {profile?.party_style && (
                      <div className="bg-gradient-to-r from-primary/10 to-purple-600/10 rounded-lg p-4 border border-primary/20">
                        <div className="flex items-center gap-3">
                          <div className="text-lg">🎉</div>
                          <div>
                            <p className="text-xs text-muted-foreground font-medium mb-1">PARTY STYLE</p>
                            <Badge variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm px-3 py-1">
                              {profile.party_style.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Social Links */}
                    {(profile?.instagram || profile?.whatsapp) && (
                      <div className="bg-muted/30 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <p className="text-xs text-muted-foreground font-medium">CONNECT</p>
                        </div>
                        <div className="flex gap-3">
                          {profile?.instagram && (
                            <a 
                              href={`https://instagram.com/${profile.instagram.replace('@', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-3 py-2 rounded-full text-sm font-medium hover:shadow-lg transition-all duration-200 hover:scale-105"
                            >
                              📸 Instagram
                            </a>
                          )}
                          {profile?.whatsapp && (
                            <a 
                              href={`https://wa.me/${profile.whatsapp.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 bg-green-500 text-white px-3 py-2 rounded-full text-sm font-medium hover:shadow-lg transition-all duration-200 hover:scale-105"
                            >
                              💬 WhatsApp
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Venue Registration CTA & Status Cards (Non-Edit Mode) */}
              {!isEditing && !isSharedProfile && (
                <>
                  {/* CTA Card - only show for users with no venue status or 'none' status */}
                  {(!profile?.venue_status || profile?.venue_status === 'none') && !venueCtaDismissed && (
                    <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-200/50 mt-6">
                      <CardContent className="pt-6">
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute -top-2 -right-2 h-8 w-8"
                      onClick={() => {
                        setVenueCtaDismissed(true);
                        if (user?.id) {
                          localStorage.setItem(`venueCtaDismissed_v2_${user.id}`, 'true');
                        }
                      }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <div className="flex items-start gap-4">
                            <div className="text-4xl">🏢</div>
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold mb-1">
                                Are you a venue owner?
                              </h3>
                              <p className="text-sm text-muted-foreground mb-4">
                                Register as venue to create promos, manage events, and connect with Jakarta's party community!
                              </p>
                            <Dialog open={showVenueDialog} onOpenChange={setShowVenueDialog}>
                              <DialogTrigger asChild>
                                <Button className="bg-purple-600 hover:bg-purple-700">
                                  <Building2 className="w-4 h-4 mr-2" />
                                  Register as Venue
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                  <DialogTitle>Register as Venue</DialogTitle>
                                  <DialogDescription>
                                    Fill in your venue details to get started. Our team will review your application.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div>
                                    <Label htmlFor="business_name_dialog" className="text-sm font-medium">Business Name *</Label>
                                    <Input
                                      id="business_name_dialog"
                                      value={editForm.business_name}
                                      onChange={(e) => setEditForm({ ...editForm, business_name: e.target.value })}
                                      placeholder="Your venue or business name"
                                      className="mt-1"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="venue_whatsapp_dialog" className="text-sm font-medium">Venue WhatsApp *</Label>
                                    <Input
                                      id="venue_whatsapp_dialog"
                                      value={editForm.venue_whatsapp}
                                      onChange={(e) => setEditForm({ ...editForm, venue_whatsapp: e.target.value })}
                                      placeholder="+62 XXX XXX XXXX"
                                      className="mt-1"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="venue_address_dialog" className="text-sm font-medium">Venue Address</Label>
                                    <Input
                                      id="venue_address_dialog"
                                      value={editForm.venue_address}
                                      onChange={(e) => setEditForm({ ...editForm, venue_address: e.target.value })}
                                      placeholder="Full address of your venue"
                                      className="mt-1"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="venue_opening_hours_dialog" className="text-sm font-medium">Opening Hours</Label>
                                    <Input
                                      id="venue_opening_hours_dialog"
                                      value={editForm.venue_opening_hours}
                                      onChange={(e) => setEditForm({ ...editForm, venue_opening_hours: e.target.value })}
                                      placeholder="e.g., Mon-Sat 6PM-2AM"
                                      className="mt-1"
                                    />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setShowVenueDialog(false)}>
                                    Cancel
                                  </Button>
                                  <Button onClick={async () => {
                                    setShowVenueDialog(false);
                                    await handleSaveProfile();
                                  }}>
                                    Submit Application
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                            </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Pending Status Card */}
                  {profile?.venue_status === 'pending' && (
                    <Card className="bg-amber-50 border-amber-200 mt-6">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">⏳</span>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">Venue Application Pending</h3>
                            <Badge variant="secondary">Under Review</Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Your venue application is being reviewed by our team. 
                          You'll receive a notification once it's approved!
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Verified Venue Card */}
                  {profile?.venue_status === 'verified' && (
                    <Card className="bg-green-50 border-green-200 mt-6">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-2xl">✅</span>
                          <h3 className="font-semibold">Verified Venue</h3>
                          <Badge className="bg-green-500">Verified</Badge>
                        </div>
                        <dl className="space-y-2 text-sm">
                          {profile.business_name && (
                            <div className="flex gap-2">
                              <dt className="font-medium w-32">Business:</dt>
                              <dd className="text-muted-foreground">{profile.business_name}</dd>
                            </div>
                          )}
                          {profile.venue_whatsapp && (
                            <div className="flex gap-2">
                              <dt className="font-medium w-32">WhatsApp:</dt>
                              <dd className="text-muted-foreground">{profile.venue_whatsapp}</dd>
                            </div>
                          )}
                          {profile.venue_address && (
                            <div className="flex gap-2">
                              <dt className="font-medium w-32">Address:</dt>
                              <dd className="text-muted-foreground">{profile.venue_address}</dd>
                            </div>
                          )}
                          {profile.venue_opening_hours && (
                            <div className="flex gap-2">
                              <dt className="font-medium w-32">Hours:</dt>
                              <dd className="text-muted-foreground">{profile.venue_opening_hours}</dd>
                            </div>
                          )}
                        </dl>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                {isEditing ? (
                  <>
                    <Button 
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleCancelEdit}
                      disabled={saving}
                      className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    {!isAdminView && !isSharedProfile && user && (
                      <>
                        <Button 
                          onClick={() => setIsEditing(true)}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Profile
                        </Button>
                        <Button 
                          onClick={handleShareProfile}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                          <Share2 className="w-4 h-4 mr-2" />
                          Share Profile
                        </Button>
                        {isAdmin && (
                          <Button
                            onClick={() => navigate('/admin')}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground"
                          >
                            <Settings className="w-4 h-4 mr-2" />
                            Admin Dashboard
                          </Button>
                        )}
                      </>
                    )}
                    {isAdminView && (
                      <Button
                        variant="outline"
                        className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                        onClick={() => navigate('/admin')}
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Admin
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User's Created Events */}
      <Card className="bg-card border-border">
        <CardHeader>
          <h3 className="font-semibold flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-primary" />
            <span>Created Events</span>
          </h3>
        </CardHeader>
        <CardContent>
          {userEvents.length === 0 ? (
            <p className="text-muted-foreground">Haven't created any events yet.</p>
          ) : (
            <div className="space-y-4">
              {userEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between border-b pb-2 last:pb-0 last:border-b-0">
                  <div>
                    <p className="font-medium">{event.title}</p>
                    <p className="text-sm text-muted-foreground">{event.date} at {event.time}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(getEventUrl(event))}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(getEditEventUrl(event))}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the event
                            and all associated data (attendees, comments, etc.).
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteEvent(event.id)}>
                            Continue
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* User's Created Promos */}
      <Card className="bg-card border-border">
        <CardHeader>
          <h3 className="font-semibold flex items-center space-x-2">
            <Gift className="w-5 h-5 text-primary" />
            <span>Created Promos</span>
          </h3>
        </CardHeader>
        <CardContent>
          {userPromos.length === 0 ? (
            <p className="text-muted-foreground">Haven't created any promos yet.</p>
          ) : (
            <div className="space-y-4">
              {userPromos.map((promo) => (
                <div key={promo.id} className="flex items-center justify-between border-b pb-2 last:pb-0 last:border-b-0">
                  <div>
                    <p className="font-medium">{promo.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {promo.venue_name} • {promo.discount_text}
                      {promo.valid_until && (
                        <> • Valid until {new Date(promo.valid_until).toLocaleDateString()}</>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(getEditPromoUrl(promo))}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the promo
                            and all associated data (reviews, comments, etc.).
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeletePromo(promo.id)}>
                            Continue
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Events I Joined - Only show for own profile */}
      {!isAdminView && !isSharedProfile && user && (
        <Card className="bg-card border-border">
          <CardHeader>
            <h3 className="font-semibold flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-green-500" />
              <span>Events I Joined</span>
            </h3>
          </CardHeader>
          <CardContent>
            {joinedEvents.length === 0 ? (
              <p className="text-muted-foreground">You haven't joined any events yet.</p>
            ) : (
              <div className="space-y-4">
                {joinedEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between border-b pb-2 last:pb-0 last:border-b-0">
                    <div>
                      <p className="font-medium">{event.title}</p>
                      <p className="text-sm text-muted-foreground">{event.date} at {event.time}</p>
                      {event.venue_name && (
                        <p className="text-sm text-muted-foreground">📍 {event.venue_name}</p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(getEventUrl(event))}
                    >
                      View Event
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Favorite Promos - Only show for own profile */}
      {!isAdminView && !isSharedProfile && user && (
        <Card className="bg-card border-border">
          <CardHeader>
            <h3 className="font-semibold flex items-center space-x-2">
              <Heart className="w-5 h-5 text-pink-500" />
              <span>Favorite Promos</span>
            </h3>
          </CardHeader>
          <CardContent>
            {favoritePromos.length === 0 ? (
              <p className="text-muted-foreground">No favorite promos saved yet.</p>
            ) : (
              <div className="space-y-4">
                {favoritePromos.map((promo) => (
                  <div key={promo.id} className="flex items-center justify-between border-b pb-2 last:pb-0 last:border-b-0">
                    <div>
                      <p className="font-medium">{promo.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {promo.venue_name} • {promo.discount_text}
                        {promo.valid_until && (
                          <> • Valid until {new Date(promo.valid_until).toLocaleDateString()}</>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(getPromoUrl(promo))}
                      >
                        View Promo
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleFavoritePromo(promo.id)}
                        className="text-pink-500 hover:text-pink-600"
                      >
                        <Heart className="w-4 h-4 fill-current" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Badges */}
        <Card className="bg-card border-border">
          <CardHeader>
            <h3 className="font-semibold flex items-center space-x-2">
              <Star className="w-5 h-5 text-primary" />
              <span>Badges & Achievements</span>
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {/* Admin Badges */}
                {profile?.is_super_admin && (
                  <Badge variant="destructive" className="bg-gradient-to-r from-red-500 to-purple-600 text-white border-none">
                    🔥 Super Admin
                  </Badge>
                )}
                {profile?.is_admin && !profile?.is_super_admin && (
                  <Badge variant="secondary" className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-none">
                    ⚡ Admin
                  </Badge>
                )}
                
                {/* Verified Status Badges */}
                {profile?.is_verified && (
                  <Badge variant="outline" className="border-primary text-primary">
                    ✓ Verified
                  </Badge>
                )}
                {profile?.venue_status === 'verified' && (
                  <Badge variant="outline" className="border-green-500 text-green-600 bg-green-50">
                    🏢 Verified Venue
                  </Badge>
                )}

                {/* Event Creator - Tiered */}
                {userEvents.length >= 30 && (
                  <Badge variant="outline" className="border-yellow-600 text-yellow-700 bg-gradient-to-r from-yellow-50 to-amber-50 font-semibold">
                    🏆 Event Creator (Gold)
                  </Badge>
                )}
                {userEvents.length >= 15 && userEvents.length < 30 && (
                  <Badge variant="outline" className="border-slate-400 text-slate-600 bg-gradient-to-r from-slate-50 to-gray-50">
                    🥈 Event Creator (Silver)
                  </Badge>
                )}
                {userEvents.length >= 5 && userEvents.length < 15 && (
                  <Badge variant="outline" className="border-orange-500 text-orange-600 bg-orange-50">
                    🥉 Event Creator (Bronze)
                  </Badge>
                )}

                {/* Deal Master - Tiered */}
                {userPromos.length >= 20 && (
                  <Badge variant="outline" className="border-emerald-600 text-emerald-700 bg-gradient-to-r from-emerald-50 to-green-50 font-semibold">
                    🏆 Deal Master (Gold)
                  </Badge>
                )}
                {userPromos.length >= 10 && userPromos.length < 20 && (
                  <Badge variant="outline" className="border-slate-400 text-slate-600 bg-gradient-to-r from-slate-50 to-gray-50">
                    🥈 Deal Master (Silver)
                  </Badge>
                )}
                {userPromos.length >= 3 && userPromos.length < 10 && (
                  <Badge variant="outline" className="border-green-500 text-green-600 bg-green-50">
                    🥉 Deal Master (Bronze)
                  </Badge>
                )}

                {/* Social Butterfly - Tiered (based on joined events) */}
                {joinedEvents.length >= 50 && (
                  <Badge variant="outline" className="border-pink-600 text-pink-700 bg-gradient-to-r from-pink-50 to-rose-50 font-semibold">
                    🏆 Social Butterfly (Gold)
                  </Badge>
                )}
                {joinedEvents.length >= 25 && joinedEvents.length < 50 && (
                  <Badge variant="outline" className="border-slate-400 text-slate-600 bg-gradient-to-r from-slate-50 to-gray-50">
                    🥈 Social Butterfly (Silver)
                  </Badge>
                )}
                {joinedEvents.length >= 10 && joinedEvents.length < 25 && (
                  <Badge variant="outline" className="border-pink-500 text-pink-600 bg-pink-50">
                    🥉 Social Butterfly (Bronze)
                  </Badge>
                )}

                {/* Popular Creator - Tiered (based on total attendees) */}
                {badgeStats.totalAttendees >= 500 && (
                  <Badge variant="outline" className="border-purple-600 text-purple-700 bg-gradient-to-r from-purple-50 to-violet-50 font-semibold">
                    🏆 Popular Creator (Gold)
                  </Badge>
                )}
                {badgeStats.totalAttendees >= 200 && badgeStats.totalAttendees < 500 && (
                  <Badge variant="outline" className="border-slate-400 text-slate-600 bg-gradient-to-r from-slate-50 to-gray-50">
                    🥈 Popular Creator (Silver)
                  </Badge>
                )}
                {badgeStats.totalAttendees >= 50 && badgeStats.totalAttendees < 200 && (
                  <Badge variant="outline" className="border-purple-500 text-purple-600 bg-purple-50">
                    🥉 Popular Creator (Bronze)
                  </Badge>
                )}

                {/* Active Commenter - Tiered */}
                {badgeStats.commentsCount >= 100 && (
                  <Badge variant="outline" className="border-blue-600 text-blue-700 bg-gradient-to-r from-blue-50 to-indigo-50 font-semibold">
                    🏆 Active Commenter (Gold)
                  </Badge>
                )}
                {badgeStats.commentsCount >= 50 && badgeStats.commentsCount < 100 && (
                  <Badge variant="outline" className="border-slate-400 text-slate-600 bg-gradient-to-r from-slate-50 to-gray-50">
                    🥈 Active Commenter (Silver)
                  </Badge>
                )}
                {badgeStats.commentsCount >= 10 && badgeStats.commentsCount < 50 && (
                  <Badge variant="outline" className="border-blue-500 text-blue-600 bg-blue-50">
                    🥉 Active Commenter (Bronze)
                  </Badge>
                )}

                {/* Reviewer - Tiered */}
                {badgeStats.reviewsCount >= 50 && (
                  <Badge variant="outline" className="border-amber-600 text-amber-700 bg-gradient-to-r from-amber-50 to-yellow-50 font-semibold">
                    🏆 Reviewer (Gold)
                  </Badge>
                )}
                {badgeStats.reviewsCount >= 20 && badgeStats.reviewsCount < 50 && (
                  <Badge variant="outline" className="border-slate-400 text-slate-600 bg-gradient-to-r from-slate-50 to-gray-50">
                    🥈 Reviewer (Silver)
                  </Badge>
                )}
                {badgeStats.reviewsCount >= 5 && badgeStats.reviewsCount < 20 && (
                  <Badge variant="outline" className="border-amber-500 text-amber-600 bg-amber-50">
                    🥉 Reviewer (Bronze)
                  </Badge>
                )}

                {/* Promo Hunter - Tiered (based on favorites) */}
                {favoritePromos.length >= 30 && (
                  <Badge variant="outline" className="border-red-600 text-red-700 bg-gradient-to-r from-red-50 to-pink-50 font-semibold">
                    🏆 Promo Hunter (Gold)
                  </Badge>
                )}
                {favoritePromos.length >= 15 && favoritePromos.length < 30 && (
                  <Badge variant="outline" className="border-slate-400 text-slate-600 bg-gradient-to-r from-slate-50 to-gray-50">
                    🥈 Promo Hunter (Silver)
                  </Badge>
                )}
                {favoritePromos.length >= 5 && favoritePromos.length < 15 && (
                  <Badge variant="outline" className="border-red-500 text-red-600 bg-red-50">
                    🥉 Promo Hunter (Bronze)
                  </Badge>
                )}

                {/* Early Adopter (account less than 90 days old) */}
                {badgeStats.accountAge <= 90 && badgeStats.accountAge > 0 && (
                  <Badge variant="outline" className="border-cyan-500 text-cyan-600 bg-cyan-50">
                    🌟 Early Adopter
                  </Badge>
                )}

                {/* Party Style */}
                {profile?.party_style && (
                  <Badge variant="outline" className="border-violet-500 text-violet-600 bg-violet-50">
                    🕺 {profile.party_style.charAt(0).toUpperCase() + profile.party_style.slice(1).replace('-', ' ')}
                  </Badge>
                )}

                {/* No badges message */}
                {(!profile?.is_admin && 
                  !profile?.is_super_admin && 
                  !profile?.is_verified && 
                  profile?.venue_status !== 'verified' &&
                  userEvents.length < 5 && 
                  userPromos.length < 3 && 
                  joinedEvents.length < 10 &&
                  badgeStats.totalAttendees < 50 &&
                  badgeStats.commentsCount < 10 &&
                  badgeStats.reviewsCount < 5 &&
                  favoritePromos.length < 5 &&
                  badgeStats.accountAge > 90 &&
                  !profile?.party_style) && (
                  <p className="text-sm text-muted-foreground">No badges yet. Keep creating events and promos, joining parties, and engaging with the community to earn achievements!</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Info */}
        <Card className="bg-card border-border">
          <CardHeader>
            <h3 className="font-semibold flex items-center space-x-2">
              <User className="w-5 h-5 text-primary" />
              <span>Account Info</span>
            </h3>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="text-sm font-medium text-primary">{user.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Member Since</span>
              <span className="text-sm font-medium text-primary">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Recently'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Last Updated</span>
              <span className="text-sm font-medium text-primary">
                {profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString() : 'Never'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-card border-border">
          <CardHeader>
            <h3 className="font-semibold flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-primary" />
              <span>Recent Activity</span>
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {["Signed up for Party Panther", "Updated profile information", "Joined the community"].map((activity, index) => (
                <div key={index} className="text-sm text-muted-foreground border-l-2 border-primary/30 pl-3">
                  {activity}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Report Option for Shared Profiles */}
      {isSharedProfile && profile && (
        <div className="fixed bottom-4 right-4">
          <ReportDialog
            type="profile"
            targetId={profile.id}
            targetTitle={profile.display_name || 'User Profile'}
          />
        </div>
      )}
      </div>
    </>
  );
};
