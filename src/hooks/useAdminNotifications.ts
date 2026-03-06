import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';

export interface AdminNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown>;
  priority: string;
  is_read: boolean;
  created_at: string;
}

/**
 * Admin notifications hook.
 * The admin_notifications table has not been created yet,
 * so this returns empty data to prevent 404 polling errors.
 */
export function useAdminNotifications() {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const admin = isAdmin();

  return {
    notifications: [] as AdminNotification[],
    unreadCount: 0,
    isLoading: false,
    markAsRead: (_id: string) => {},
    markAllAsRead: () => {},
    isAdmin: admin,
  };
}
