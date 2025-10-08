import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
import { User, Star, Calendar, Edit, Save, X, ArrowLeft, Trash2, Gift, Share2, Heart, Eye, Settings } from "lucide-react";
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

// ... (interface Profile remains the same)

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
}

export const UserProfile = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [activeSection, setActiveSection] = useState('profile');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userEvents, setUserEvents] = useState<EventWithSlug[]>([]);
  const [userPromos, setUserPromos] = useState<PromoWithSlug[]>([]);
  const [joinedEvents, setJoinedEvents] = useState<EventWithSlug[]>([]);
  const [favoritePromos, setFavoritePromos] = useState<PromoWithSlug[]>([]);
  const [editForm, setEditForm] = useState({
    display_name: '',
    bio: '',
    avatar_url: '',
    gender: '',
    age: '',
    instagram: '',
    whatsapp: '',
    party_style: ''
  });
  const { toast } = useToast();
  const navigate = useNavigate();
  const { userId } = useParams();
  const isAdminView = window.location.pathname.includes('/admin/user/');
  const isSharedProfile = window.location.pathname.includes('/profile/') && !!userId;

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
        setEditForm({
          display_name: profile.display_name || '',
          bio: profile.bio || '',
          avatar_url: profile.avatar_url || '',
          gender: profile.gender || '',
          age: profile.age?.toString() || '',
          instagram: profile.instagram || '',
          whatsapp: profile.whatsapp || '',
          party_style: profile.party_style || ''
        });
      }

      // Fetch events created by the user using the secure function
      const targetUserId = (isAdminView || isSharedProfile) ? profile?.user_id : user?.id;
      
      if (targetUserId) {
        const { data: eventsData, error: eventsError } = await supabase
          .rpc('get_events_safe')
          .eq('created_by', targetUserId)
          .order('created_at', { ascending: false });

        if (eventsError) {
          console.error('Error fetching user events:', eventsError);
          toast({
            title: "Error",
            description: (isAdminView || isSharedProfile) ? "Failed to load user's created events." : "Failed to load your created events.",
            variant: "destructive",
          });
        } else {
          setUserEvents((eventsData?.map((event: any) => ({ ...event, slug: event.slug || null })) as EventWithSlug[]) || []);
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

  const handleSaveProfile = async () => {
    // ... (handleSaveProfile remains the same)
    if (!user) return;

    setSaving(true);
    try {
      const profileData = {
        user_id: user.id,
        display_name: editForm.display_name || null,
        bio: editForm.bio || null,
        avatar_url: editForm.avatar_url || null,
        gender: editForm.gender || null,
        age: editForm.age ? parseInt(editForm.age) : null,
        instagram: editForm.instagram || null,
        whatsapp: editForm.whatsapp || null,
        party_style: editForm.party_style || null,
        updated_at: new Date().toISOString()
      };

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

      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });

      await fetchUserProfile();
      setIsEditing(false);
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
      setEditForm({
        display_name: profile.display_name || '',
        bio: profile.bio || '',
        avatar_url: profile.avatar_url || '',
        gender: profile.gender || '',
        age: profile.age?.toString() || '',
        instagram: profile.instagram || '',
        whatsapp: profile.whatsapp || '',
        party_style: profile.party_style || ''
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
        <Header activeSection={activeSection} onSectionChange={setActiveSection} />
        <div className="max-w-4xl mx-auto space-y-6 pt-20 px-4">
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
      <Header activeSection={activeSection} onSectionChange={setActiveSection} />
      <div className="max-w-4xl mx-auto space-y-6 pt-20 px-4">
      {/* Profile Header */}
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-6">
            {/* Profile Image */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary neon-glow">
                  <img
                    src={isEditing ? editForm.avatar_url || avatarUrl || defaultAvatar : avatarUrl || defaultAvatar}
                    alt={displayName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = defaultAvatar;
                    }}
                  />
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
                      </SelectContent>
                    </Select>
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
                          variant="outline" 
                          onClick={handleShareProfile}
                          className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                        >
                          <Share2 className="w-4 h-4 mr-2" />
                          Share Profile
                        </Button>
                        {(profile?.is_admin || profile?.is_super_admin) && (
                          <Button
                            variant="outline"
                            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                            onClick={() => navigate('/admin')}
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
                {profile?.is_verified && (
                  <Badge variant="outline" className="border-primary text-primary">
                    ✓ Verified
                  </Badge>
                )}
                {userEvents.length >= 5 && (
                  <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                    🎉 Event Creator
                  </Badge>
                )}
                {userPromos.length >= 3 && (
                  <Badge variant="outline" className="border-green-500 text-green-600">
                    💰 Deal Master
                  </Badge>
                )}
                {profile?.party_style && (
                  <Badge variant="outline" className="border-purple-500 text-purple-600">
                    🕺 {profile.party_style.charAt(0).toUpperCase() + profile.party_style.slice(1).replace('-', ' ')}
                  </Badge>
                )}
                {(!profile?.is_admin && !profile?.is_super_admin && !profile?.is_verified && userEvents.length < 5 && userPromos.length < 3 && !profile?.party_style) && (
                  <p className="text-sm text-muted-foreground">No badges yet. Keep creating events and promos to earn achievements!</p>
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
