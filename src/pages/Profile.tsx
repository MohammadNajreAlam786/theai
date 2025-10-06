import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Upload, Loader2, User, Lock, Trash2, BarChart3, Image, FileText, Music, Video } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";

const Profile = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [stats, setStats] = useState({ total: 0, text: 0, image: 0, music: 0, video: 0 });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadProfile();
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from('creations')
        .select('type')
        .eq('user_id', user?.id);

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        text: data?.filter(c => c.type === 'text').length || 0,
        image: data?.filter(c => c.type === 'image').length || 0,
        music: data?.filter(c => c.type === 'music').length || 0,
        video: data?.filter(c => c.type === 'video').length || 0,
      };

      setStats(stats);
    } catch (error: any) {
      console.error('Error loading stats:', error);
    }
  };

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      if (data) {
        setFullName(data.full_name || '');
        setAvatarUrl(data.avatar_url);
      }
    } catch (error: any) {
      console.error('Error loading profile:', error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${user?.id}/avatar.${fileExt}`;

      setUploading(true);

      // Delete old avatar if exists
      if (avatarUrl) {
        const oldPath = avatarUrl.split('/').pop();
        if (oldPath) {
          await supabase.storage.from('avatars').remove([`${user?.id}/${oldPath}`]);
        }
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
      toast.success("Avatar uploaded successfully!");
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error("Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  };

  const saveProfile = async () => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          avatar_url: avatarUrl
        })
        .eq('id', user?.id);

      if (error) throw error;

      toast.success("Profile updated successfully!");
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      setChangingPassword(true);
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success("Password changed successfully!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error("Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  const deleteAccount = async () => {
    try {
      // Delete user's creations first
      const { error: deleteError } = await supabase
        .from('creations')
        .delete()
        .eq('user_id', user?.id);

      if (deleteError) throw deleteError;

      // Delete user account
      const { error: authError } = await supabase.auth.admin.deleteUser(user?.id || '');
      
      if (authError) throw authError;

      toast.success("Account deleted successfully");
      navigate('/');
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast.error("Failed to delete account");
    }
  };

  if (authLoading || loading) {
    return <LoadingSpinner />;
  }

  const getInitials = () => {
    if (fullName) {
      return fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
      
      <div className="relative">
        <header className="border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Profile Settings
              </h1>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-6 py-12">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Stats Overview */}
            <Card className="p-6 bg-card/50 backdrop-blur border-border/50">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Your Statistics</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-4 rounded-lg bg-background/50">
                  <div className="text-2xl font-bold text-primary">{stats.total}</div>
                  <div className="text-xs text-muted-foreground mt-1">Total</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-background/50">
                  <FileText className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
                  <div className="text-xl font-bold">{stats.text}</div>
                  <div className="text-xs text-muted-foreground mt-1">Text</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-background/50">
                  <Image className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
                  <div className="text-xl font-bold">{stats.image}</div>
                  <div className="text-xs text-muted-foreground mt-1">Image</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-background/50">
                  <Music className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
                  <div className="text-xl font-bold">{stats.music}</div>
                  <div className="text-xs text-muted-foreground mt-1">Music</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-background/50">
                  <Video className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
                  <div className="text-xl font-bold">{stats.video}</div>
                  <div className="text-xs text-muted-foreground mt-1">Video</div>
                </div>
              </div>
            </Card>

            {/* Profile Information */}
            <Card className="p-8 bg-card/50 backdrop-blur border-border/50 shadow-xl">
              <div className="flex items-center gap-2 mb-6">
                <User className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Profile Information</h2>
              </div>
              <div className="space-y-8">
                {/* Avatar Section */}
                <div className="flex flex-col items-center gap-4">
                  <Avatar className="h-32 w-32 border-4 border-primary/20">
                    {avatarUrl ? (
                      <AvatarImage src={avatarUrl} alt="Profile avatar" />
                    ) : (
                      <AvatarFallback className="text-4xl bg-primary/10">
                        {getInitials()}
                      </AvatarFallback>
                    )}
                  </Avatar>

                  <div className="flex flex-col items-center gap-2">
                    <label htmlFor="avatar-upload">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={uploading}
                        className="gap-2 cursor-pointer"
                        asChild
                      >
                        <span>
                          {uploading ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4" />
                              Upload Avatar
                            </>
                          )}
                        </span>
                      </Button>
                    </label>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={uploadAvatar}
                      disabled={uploading}
                      className="hidden"
                    />
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG or WEBP (max. 5MB)
                    </p>
                  </div>
                </div>

                {/* Profile Info */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block text-muted-foreground">
                      Email
                    </label>
                    <Input
                      value={user?.email || ''}
                      disabled
                      className="bg-background/50 border-border/50"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Email cannot be changed
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block text-muted-foreground">
                      Full Name
                    </label>
                    <Input
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="bg-background/50 border-border/50"
                    />
                  </div>
                </div>

                {/* Save Button */}
                <Button 
                  onClick={saveProfile}
                  disabled={saving}
                  className="w-full h-12 text-base font-semibold"
                  size="lg"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </Card>

            {/* Security Settings */}
            <Card className="p-8 bg-card/50 backdrop-blur border-border/50 shadow-xl">
              <div className="flex items-center gap-2 mb-6">
                <Lock className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Security Settings</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-2"
                  />
                </div>
                <Button
                  onClick={changePassword}
                  disabled={changingPassword || !newPassword || !confirmPassword}
                  variant="outline"
                  className="w-full"
                >
                  {changingPassword ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Changing Password...
                    </>
                  ) : (
                    'Change Password'
                  )}
                </Button>
              </div>
            </Card>

            {/* Danger Zone */}
            <Card className="p-8 bg-destructive/5 border-destructive/20 backdrop-blur">
              <div className="flex items-center gap-2 mb-4">
                <Trash2 className="w-5 h-5 text-destructive" />
                <h2 className="text-lg font-semibold text-destructive">Danger Zone</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Deleting your account is permanent and cannot be undone. All your creations will be deleted.
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your account
                      and remove all your data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={deleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Delete Account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;