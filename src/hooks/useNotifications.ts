import { useEffect, useState } from 'react';
import type { Phone, Expense } from '../types';

export interface Notification {
  id: string;
  message: string;
  type: 'warning' | 'info' | 'success';
  dismissible?: boolean;
}

export const useNotifications = (phones: Phone[], expenses: Expense[]) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    checkNotifications();
  }, [phones, expenses]);

  const checkNotifications = () => {
    const newNotifications: Notification[] = [];
    const today = new Date();

    // Check for aging stock (> 30 days)
    phones
      .filter(p => p.status === 'In Stock')
      .forEach(phone => {
        const buyDate = new Date(phone.buyDate);
        const daysOld = Math.floor((today.getTime() - buyDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysOld > 30) {
          newNotifications.push({
            id: `aging-${phone.id}`,
            message: `${phone.model} has been in stock for over 30 days!`,
            type: 'warning',
            dismissible: true,
          });
        }
      });

    // Check for sold phones without sell price
    phones
      .filter(p => p.status === 'Sold' && (!p.sellPrice || p.sellPrice === 0))
      .forEach(phone => {
        newNotifications.push({
          id: `sellprice-${phone.id}`,
          message: `Don't forget to add sellPrice for ${phone.model}!`,
          type: 'warning',
          dismissible: true,
        });
      });

    setNotifications(newNotifications);
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return;
    }

    if (Notification.permission === 'granted') {
      setPermissionGranted(true);
      return;
    }

    if (Notification.permission !== 'denied') {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          setPermissionGranted(true);
        }
      } catch (error) {
        console.error('Error requesting notification permission:', error);
      }
    }
  };

  const sendBrowserNotification = (title: string, options?: NotificationOptions) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, options);
    }
  };

  const dismissNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  return {
    notifications,
    permissionGranted,
    requestNotificationPermission,
    sendBrowserNotification,
    dismissNotification,
  };
};
