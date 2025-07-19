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
import { User, Star, Calendar, Edit, Save, X, ArrowLeft, Trash2, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { Tables } from "../integrations/supabase/types";
import { ImageUpload } from "./form-components/ImageUpload";

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
}

export const UserProfile = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userEvents, setUserEvents] = useState<Tables<'events'>[]>([]);
  const [userPromos, setUserPromos] = useState<Tables<'promos'>[]>([]);
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
  const isAdminView = !!userId;

  const fetchUserProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Not authenticated",
          description: "Please sign in to view your profile.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      setUser(user);

      // If this is admin view, fetch the specific user's profile by userId
      const profileQuery = isAdminView 
        ? supabase.from('profiles').select('*, is_admin, is_super_admin').eq('id', userId).single()
        : supabase.from('profiles').select('*, is_admin, is_super_admin').eq('user_id', user.id).single();

      const { data: profile, error } = await profileQuery;

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

      // Fetch events created by the user (or viewed user in admin mode)
      const targetUserId = isAdminView ? profile?.user_id : user.id;
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('created_by', targetUserId)
        .order('created_at', { ascending: false });

      if (eventsError) {
        console.error('Error fetching user events:', eventsError);
        toast({
          title: "Error",
          description: isAdminView ? "Failed to load user's created events." : "Failed to load your created events.",
          variant: "destructive",
        });
      } else {
        setUserEvents(eventsData || []);
      }

      // Fetch promos created by the user (or viewed user in admin mode)
      const { data: promosData, error: promosError } = await supabase
        .from('promos')
        .select('*')
        .eq('created_by', targetUserId)
        .order('created_at', { ascending: false });

      if (promosError) {
        console.error('Error fetching user promos:', promosError);
        toast({
          title: "Error",
          description: "Failed to load your created promos.",
          variant: "destructive",
        });
      } else {
        setUserPromos(promosData || []);
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
  }, [toast, isAdminView, userId]);

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
        avatar_url: profile.avatar_url || ''
      });
    }
    setIsEditing(false);
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

  // ... (loading and !user checks remain the same)
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="animate-pulse space-y-4">
              <div className="w-24 h-24 bg-muted rounded-full mx-auto"></div>
              <div className="h-4 bg-muted rounded w-1/3 mx-auto"></div>
              <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-card border-border">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Please sign in to view your profile.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayName = profile?.display_name || user.email?.split('@')[0] || 'User';
  const avatarUrl = profile?.avatar_url || `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face`;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ... (Back to Home button and Profile Header remain the same) */}
      
      <Button
        variant="ghost"
        onClick={() => navigate(isAdminView ? '/admin' : '/')}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        {isAdminView ? 'Back to Admin Dashboard' : 'Back to Home'}
      </Button>

      {/* Profile Header */}
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-6">
            {/* Profile Image */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary neon-glow">
                <img
                  src={isEditing ? editForm.avatar_url || avatarUrl : avatarUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face`;
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
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="gender">Gender (optional)</Label>
                      <Select value={editForm.gender} onValueChange={(value) => setEditForm({ ...editForm, gender: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="non-binary">Non-binary</SelectItem>
                          <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="age">Age (optional)</Label>
                      <Input
                        id="age"
                        type="number"
                        min="18"
                        max="100"
                        value={editForm.age}
                        onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
                        placeholder="Enter your age"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="party_style">Party Style (optional)</Label>
                    <Select value={editForm.party_style} onValueChange={(value) => setEditForm({ ...editForm, party_style: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="What's your party vibe?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="clubbing">Clubbing</SelectItem>
                        <SelectItem value="rooftop-parties">Rooftop Parties</SelectItem>
                        <SelectItem value="underground-raves">Underground Raves</SelectItem>
                        <SelectItem value="beach-parties">Beach Parties</SelectItem>
                        <SelectItem value="live-music">Live Music</SelectItem>
                        <SelectItem value="cocktail-lounges">Cocktail Lounges</SelectItem>
                        <SelectItem value="casual-hangouts">Casual Hangouts</SelectItem>
                        <SelectItem value="vip-experiences">VIP Experiences</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="instagram">Instagram Handle (optional)</Label>
                      <Input
                        id="instagram"
                        value={editForm.instagram}
                        onChange={(e) => setEditForm({ ...editForm, instagram: e.target.value })}
                        placeholder="@yourusername"
                      />
                    </div>
                    <div>
                      <Label htmlFor="whatsapp">WhatsApp Number (optional)</Label>
                      <Input
                        id="whatsapp"
                        value={editForm.whatsapp}
                        onChange={(e) => setEditForm({ ...editForm, whatsapp: e.target.value })}
                        placeholder="+62 XXX XXX XXXX"
                      />
                    </div>
                    {(editForm.instagram || editForm.whatsapp) && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <p className="text-sm text-amber-800">
                          <strong>Privacy Notice:</strong> By making your Instagram or WhatsApp visible on your profile, you understand that it is visible to anyone online and that they can contact you on these platforms.
                        </p>
                      </div>
                    )}
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
                  <h2 className="text-3xl font-bold gradient-text">{displayName}</h2>
                  <p className="text-lg text-muted-foreground">@{displayName.toLowerCase().replace(/\s+/g, '')}</p>
                  <p className="text-sm text-muted-foreground mt-2 max-w-md">
                    {profile?.bio || "Jakarta party enthusiast | Always looking for the next great party! 🎉"}
                  </p>
                  
                  {/* Additional Profile Info */}
                  <div className="mt-4 space-y-2">
                    {(profile?.gender || profile?.age) && (
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        {profile?.gender && (
                          <span className="capitalize">{profile.gender.replace('-', ' ')}</span>
                        )}
                        {profile?.age && (
                          <span>{profile.age} years old</span>
                        )}
                      </div>
                    )}
                    
                    {profile?.party_style && (
                      <div className="text-sm">
                        <Badge variant="secondary" className="bg-primary/10 text-primary">
                          {profile.party_style.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                      </div>
                    )}
                    
                    {(profile?.instagram || profile?.whatsapp) && (
                      <div className="flex gap-3 text-sm">
                        {profile?.instagram && (
                          <a 
                            href={`https://instagram.com/${profile.instagram.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary/80 transition-colors"
                          >
                            📸 {profile.instagram}
                          </a>
                        )}
                        {profile?.whatsapp && (
                          <a 
                            href={`https://wa.me/${profile.whatsapp.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary/80 transition-colors"
                          >
                            💬 WhatsApp
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="flex justify-center md:justify-start space-x-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-neon-blue">12</div>
                  <div className="text-xs text-muted-foreground">Events Attended</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-neon-cyan">3</div>
                  <div className="text-xs text-muted-foreground">Events Created</div>
                </div>
              </div>

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
                    {!isAdminView && (
                      <>
                        <Button 
                          onClick={() => setIsEditing(true)}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Profile
                        </Button>
                        <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                          Share Profile
                        </Button>
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
                    {!isAdminView && (profile?.is_admin || profile?.is_super_admin) && (
                      <Button
                        variant="outline"
                        className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                        onClick={() => navigate('/admin')}
                      >
                        Admin Dashboard
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
                      onClick={() => navigate(`/edit-event/${event.id}`)}
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
                      onClick={() => navigate(`/edit-promo/${promo.id}`)}
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

      {/* ... (Badges, User Info, Recent Activity cards remain the same) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Badges */}
        <Card className="bg-card border-border">
          <CardHeader>
            <h3 className="font-semibold flex items-center space-x-2">
              <Star className="w-5 h-5 text-primary" />
              <span>Badges</span>
            </h3>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {["Party Animal", "Event Creator", "Social Butterfly", "Night Owl"].map((badge) => (
                <Badge key={badge} className="bg-primary/20 text-primary border-primary/30">
                  {badge}
                </Badge>
              ))}
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
    </div>
  );
};
