import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { notificationService } from '../services/api';
import socketService from '../services/socket';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data);
      setUnreadCount(data.filter(notification => !notification.read).length);
    } catch (err) {
      setError(err.message || 'Failed to fetch notifications');
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch unread notifications
  const fetchUnreadNotifications = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await notificationService.getUnreadNotifications();
      // Update unread count
      setUnreadCount(data.length);
      // Merge with existing notifications
      setNotifications(prev => {
        const existingIds = new Set(prev.map(n => n._id));
        const newNotifications = data.filter(n => !existingIds.has(n._id));
        return [...newNotifications, ...prev];
      });
    } catch (err) {
      setError(err.message || 'Failed to fetch unread notifications');
      console.error('Error fetching unread notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Mark a notification as read
  const markAsRead = useCallback(async (notificationId) => {
    if (!user || !notificationId) return;
    
    try {
      await notificationService.markAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification._id === notificationId 
            ? { ...notification, read: true } 
            : notification
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, [user]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    
    try {
      await notificationService.markAllAsRead();
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      
      // Reset unread count
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  }, [user]);

  // Delete a notification
  const deleteNotification = useCallback(async (notificationId) => {
    if (!user || !notificationId) return;
    
    try {
      await notificationService.deleteNotification(notificationId);
      
      // Update local state
      const removedNotification = notifications.find(n => n._id === notificationId);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      
      // Update unread count if needed
      if (removedNotification && !removedNotification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  }, [user, notifications]);

  // Setup socket listeners for real-time notifications
  useEffect(() => {
    if (!user) return;

    // Connect to socket
    socketService.connect();
    socketService.joinUserRoom(user._id);

    // Handle new notification
    const handleNewNotification = (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // You can add browser notifications here if needed
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/logo192.png' // Assuming you have this icon
        });
      }
    };

    // Register socket event listeners
    socketService.on('notification', handleNewNotification);
    
    // Listen specifically for emergency alerts
    socketService.on('system_alert', (data) => {
      console.log('Emergency alert received:', data);
      // If we have alert data with alerts array, add them directly
      if (data && data.alerts && Array.isArray(data.alerts)) {
        setNotifications(prev => {
          const newAlerts = data.alerts.filter(alert => 
            !prev.some(n => n._id === alert._id)
          );
          return [...newAlerts, ...prev];
        });
        setUnreadCount(prev => prev + data.alerts.length);
      } else {
        // Fallback to fetching all notifications
        fetchNotifications();
      }
    });
    
    // Listen for emergency dispatches
    socketService.on('emergency_dispatch', (data) => {
      console.log('Emergency dispatch received:', data);
      fetchNotifications(); // Fetch all notifications to ensure we get the emergency dispatch
    });

    // Fetch initial notifications
    fetchNotifications();

    // Request browser notification permission
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }

    // Cleanup function
    return () => {
      socketService.off('notification', handleNewNotification);
      socketService.off('system_alert');
      socketService.off('emergency_dispatch');
    };
  }, [user, fetchNotifications]);

  // Clear error
  const clearError = () => {
    setError(null);
  };

  const value = {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    fetchUnreadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearError
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};