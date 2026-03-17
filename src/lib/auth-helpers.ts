import { supabase } from "@/integrations/supabase/client";

/**
 * Check if the current user has admin or super admin role
 * @param userId The user's UUID
 * @returns Object with is_admin and is_super_admin booleans
 */
export const checkUserAdminStatus = async (userId: string | undefined): Promise<{
  is_admin: boolean;
  is_super_admin: boolean;
}> => {
  if (!userId) {
    return { is_admin: false, is_super_admin: false };
  }

  try {
    const { data: roles, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .in('role', ['admin', 'superadmin']);

    if (error) {
      console.error('Error checking user roles:', error);
      return { is_admin: false, is_super_admin: false };
    }

    const hasAdminRole = roles && roles.some(r => r.role === 'admin');
    const hasSuperAdminRole = roles && roles.some(r => r.role === 'superadmin');

    return {
      is_admin: hasAdminRole || hasSuperAdminRole, // Super admins are also admins
      is_super_admin: hasSuperAdminRole
    };
  } catch (error) {
    console.error('Error in checkUserAdminStatus:', error);
    return { is_admin: false, is_super_admin: false };
  }
};

/**
 * Check if the current user is banned
 * @param userId The user's UUID
 * @returns true if the user is currently banned
 */
export const checkUserBanStatus = async (userId: string | undefined): Promise<boolean> => {
  if (!userId) return false;

  try {
    const { data, error } = await supabase
      .from('banned_users')
      .select('id, expires_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error checking ban status:', error);
      return false;
    }

    if (!data) return false;

    // Check if ban has expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in checkUserBanStatus:', error);
    return false;
  }
};
