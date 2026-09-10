import { Task } from '../types';
import { logSecurityEvent } from './security';

export interface NotificationSettings {
  enabled: boolean;
  dueDateReminders: boolean;
  focusSprintAlerts: boolean;
  advanceDays: number;
}

const SETTINGS_KEY = 'daymark.notificationSettings';
const NOTIFIED_TASKS_KEY = 'daymark.notifiedTaskMap';

export function getNotificationSettings(): NotificationSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    enabled: true,
    dueDateReminders: true,
    focusSprintAlerts: true,
    advanceDays: 1
  };
}

export function saveNotificationSettings(settings: NotificationSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

/**
 * Request OS system notification permission (Windows & Android)
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    // 1. Mobile Android (Capacitor) Native Permission
    if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.()) {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const status = await LocalNotifications.requestPermissions();
      logSecurityEvent('Capacitor Notification Permission', `Status: ${status.display}`, 'info');
      return status.display === 'granted';
    }

    // 2. Web & Desktop Browser Permission
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') return true;
      if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        logSecurityEvent('Notification Permission', `Status: ${permission}`, 'info');
        return permission === 'granted';
      }
    }
  } catch (err) {
    console.warn('Native notification permission error:', err);
  }
  return false;
}

/**
 * Trigger a native System OS Notification (Windows Desktop / Web / Mobile)
 */
export async function sendNativeNotification(title: string, body: string, tag?: string) {
  const settings = getNotificationSettings();
  if (!settings.enabled) return;

  try {
    // 1. Try Capacitor LocalNotifications for Android Mobile
    if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.()) {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Math.floor(Math.random() * 100000),
            title,
            body,
            schedule: { at: new Date(Date.now() + 100) }
          }
        ]
      });
      return;
    }

    // 2. Try Tauri Desktop Native Notification Plugin if in Tauri container
    if (typeof window !== 'undefined' && (window as any).__TAURI__) {
      try {
        const tauriPlugin = '@tauri-apps/plugin-notification';
        const tauriNotif = await import(/* @vite-ignore */ tauriPlugin);
        let permission = await tauriNotif.isPermissionGranted();
        if (!permission) {
          const permissionGrant = await tauriNotif.requestPermission();
          permission = permissionGrant === 'granted';
        }
        if (permission) {
          tauriNotif.sendNotification({ title, body });
          return;
        }
      } catch (e) {
        console.warn('Tauri notification plugin not installed, falling back to Web API');
      }
    }


    // 3. Fallback to standard Windows Web Notification API
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, {
          body,
          tag,
          icon: '/favicon.ico'
        });
      } else if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          new Notification(title, { body, tag });
        }
      }
    }
  } catch (err) {
    console.warn('Notification delivery fallback:', err);
  }
}

/**
 * Proactively check tasks due in 1 day (e.g. due on 11th when today is 10th)
 */
export function checkAndNotifyDueTasks(tasks: Task[]) {
  const settings = getNotificationSettings();
  if (!settings.enabled || !settings.dueDateReminders) return;

  try {
    const rawNotified = localStorage.getItem(NOTIFIED_TASKS_KEY);
    const notifiedMap: Record<string, string> = rawNotified ? JSON.parse(rawNotified) : {};

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + settings.advanceDays); // Advance by 1 day
    const targetDateStr = targetDate.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];

    tasks.forEach((task) => {
      if (task.status === 'complete') return;

      const isDueTomorrow = task.dueDate === targetDateStr;
      const isDueToday = task.dueDate === todayStr;
      const isHighPri = (task.priority || '').toLowerCase() === 'high';

      const dueKey = `due_${task.id}_${task.dueDate}`;
      const highPriKey = `highpri_${task.id}_${todayStr}`;

      if ((isDueTomorrow || isDueToday) && !notifiedMap[dueKey]) {
        const title = isDueTomorrow
          ? `Task Due Tomorrow — Daymark`
          : `Task Due Today — Daymark`;
        const body = `"${task.title}" is scheduled for ${task.dueDate}. Priority: ${task.priority.toUpperCase()}`;

        sendNativeNotification(title, body, `task_${task.id}`);
        notifiedMap[dueKey] = new Date().toISOString();
        logSecurityEvent('Due Date Notification Fired', `Task: ${task.title} (Due: ${task.dueDate})`, 'info');
      }

      if (isHighPri && !notifiedMap[highPriKey]) {
        const title = `High Priority Task Pending — Daymark`;
        const body = `"${task.title}" is flagged HIGH priority and pending execution.`;

        sendNativeNotification(title, body, `highpri_${task.id}`);
        notifiedMap[highPriKey] = new Date().toISOString();
        logSecurityEvent('High Priority Notification Fired', `Task: ${task.title}`, 'info');
      }
    });

    localStorage.setItem(NOTIFIED_TASKS_KEY, JSON.stringify(notifiedMap));
  } catch (err) {
    console.warn('Error evaluating task due notifications:', err);
  }
}

/**
 * Notify when focus timer hits 1 minute (60 seconds remaining)
 */
export function notifyFocusSprintWarning(mainFocus: string) {
  const settings = getNotificationSettings();
  if (!settings.enabled || !settings.focusSprintAlerts) return;

  const title = `1 Minute Remaining — Focus Sprint`;
  const body = `Your focus session for "${mainFocus || 'Primary Deliverable'}" completes in 60 seconds!`;

  sendNativeNotification(title, body, 'focus_warning');
  logSecurityEvent('Focus Sprint Alert', '1 minute remaining alert sent', 'info');
}
