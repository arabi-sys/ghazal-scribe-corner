import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string | null;
  is_read: boolean;
  reference_id: string | null;
  created_at: string;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    }
    setLoading(false);
  }, []);

  const getUnreadByType = useCallback((type: string) => {
    return notifications.filter(n => !n.is_read && n.type === type).length;
  }, [notifications]);

  const getUnreadByTypes = useCallback((types: string[]) => {
    return notifications.filter(n => !n.is_read && types.includes(n.type)).length;
  }, [notifications]);

  const markAsRead = useCallback(async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
    
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markTypeAsRead = useCallback(async (type: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const unreadOfType = notifications.filter(n => !n.is_read && n.type === type);
    if (unreadOfType.length === 0) return;

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('type', type)
      .eq('is_read', false);
    
    setNotifications(prev => 
      prev.map(n => n.type === type ? { ...n, is_read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - unreadOfType.length));
  }, [notifications]);

  const markTypesAsRead = useCallback(async (types: string[]) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const unreadOfTypes = notifications.filter(n => !n.is_read && types.includes(n.type));
    if (unreadOfTypes.length === 0) return;

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)
      .in('type', types);
    
    setNotifications(prev => 
      prev.map(n => types.includes(n.type) ? { ...n, is_read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - unreadOfTypes.length));
  }, [notifications]);

  useEffect(() => {
    fetchNotifications();

    // Subscribe to realtime notifications
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    getUnreadByType,
    getUnreadByTypes,
    markAsRead,
    markTypeAsRead,
    markTypesAsRead,
    refresh: fetchNotifications
  };
};

// Helper to create notifications from frontend (for actions user performs)
export const createNotification = async (
  userId: string,
  type: string,
  title: string,
  message?: string,
  referenceId?: string
) => {
  const { data, error } = await supabase.rpc('create_notification', {
    p_user_id: userId,
    p_type: type,
    p_title: title,
    p_message: message || null,
    p_reference_id: referenceId || null
  });
  return { data, error };
};

// Helper to notify all admins
export const notifyAdmins = async (
  type: string,
  title: string,
  message?: string,
  referenceId?: string
) => {
  const { error } = await supabase.rpc('notify_admins', {
    p_type: type,
    p_title: title,
    p_message: message || null,
    p_reference_id: referenceId || null
  });
  return { error };
};
