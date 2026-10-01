import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { KeyRound, Mail } from "lucide-react";

export function AccountSecuritySection() {
  const [currentEmail, setCurrentEmail] = useState("");
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [hasPassword, setHasPassword] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      setCurrentEmail(u?.email ?? "");
      setPendingEmail((u as any)?.new_email ?? null);
      const providers: string[] = (u?.app_metadata as any)?.providers ?? [];
      setHasPassword(providers.includes("email"));
    });
  }, []);

  const changeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = newEmail.trim();
    if (!email || email.toLowerCase() === currentEmail.toLowerCase()) {
      toast.error("Enter a new email address");
      return;
    }
    setSavingEmail(true);
    const { error } = await supabase.auth.updateUser(
      { email },
      { emailRedirectTo: `${window.location.origin}/profile` }
    );
    setSavingEmail(false);
    if (error) return toast.error(error.message);
    setPendingEmail(email);
    setNewEmail("");
    toast.success("Check your inbox to confirm the new email address.");
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) return toast.error("Password must be at least 6 characters");
    if (newPassword !== confirmPassword) return toast.error("Passwords don't match");
    setSavingPw(true);
    const attrs: any = { password: newPassword };
    if (hasPassword) attrs.current_password = currentPassword;
    const { error } = await supabase.auth.updateUser(attrs);
    setSavingPw(false);
    if (error) return toast.error(error.message);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setHasPassword(true);
    toast.success("Password updated");
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-lg">Account settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        <form onSubmit={changeEmail} className="space-y-3">
          <div className="flex items-center gap-2 font-medium"><Mail className="h-4 w-4" /> Change email</div>
          <p className="text-sm text-muted-foreground">
            Current: <strong>{currentEmail}</strong>
            {pendingEmail && <> · Waiting for confirmation of <strong>{pendingEmail}</strong></>}
          </p>
          <Label htmlFor="new-email">New email</Label>
          <Input id="new-email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
          <p className="text-xs text-muted-foreground">The change takes effect after you click the confirmation link we email you.</p>
          <Button type="submit" disabled={savingEmail}>{savingEmail ? "Sending..." : "Update email"}</Button>
        </form>

        <form onSubmit={changePassword} className="space-y-3">
          <div className="flex items-center gap-2 font-medium"><KeyRound className="h-4 w-4" /> {hasPassword ? "Change password" : "Set a password"}</div>
          {hasPassword && (
            <>
              <Label htmlFor="cur-pw">Current password</Label>
              <Input id="cur-pw" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required autoComplete="current-password" />
            </>
          )}
          <Label htmlFor="new-pw">New password</Label>
          <Input id="new-pw" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required autoComplete="new-password" />
          <Label htmlFor="confirm-pw">Confirm new password</Label>
          <Input id="confirm-pw" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password" />
          <Button type="submit" disabled={savingPw}>{savingPw ? "Saving..." : "Update password"}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
