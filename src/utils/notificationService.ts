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
 * Helper to determine current daily time slot for multi-frequency notifications
 */
function getCurrentTimeSlot(): string {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

/**
 * Schedule Native Capacitor Local Notifications for Android Native OS Alarm Manager
 * (Sends 2-3 reminders a day at 9:00 AM, 1:30 PM, and 6:30 PM for tasks due today/tomorrow)
 */
export async function scheduleCapacitorNativeReminders(tasks: Task[]) {
  try {
    if (typeof window === 'undefined' || !(window as any).Capacitor?.isNativePlatform?.()) return;

    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const pendingTasks = tasks.filter((t) => t.status !== 'complete' && t.dueDate);
    if (pendingTasks.length === 0) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const notificationsToSchedule: any[] = [];
    let notifId = 1000;

    pendingTasks.forEach((task) => {
      const isDueToday = task.dueDate === todayStr;
      const isDueTomorrow = task.dueDate === tomorrowStr;
      const isOverdue = task.dueDate < todayStr;

      if (!isDueToday && !isDueTomorrow && !isOverdue) return;

      let title = `Task Reminder — Daymark`;
      let timeLabel = `scheduled for ${task.dueDate}`;
      if (isDueToday) {
        title = `Due Today: "${task.title}"`;
        timeLabel = `due today`;
      } else if (isDueTomorrow) {
        title = `Due Tomorrow: "${task.title}"`;
        timeLabel = `due tomorrow (${task.dueDate})`;
      } else if (isOverdue) {
        title = `Overdue Action Required: "${task.title}"`;
        timeLabel = `was due on ${task.dueDate}`;
      }

      // Times for 3 daily reminder slots: 9:00 AM, 1:30 PM (13:30), 6:30 PM (18:30)
      const slotTimes = [
        { h: 9, m: 0 },
        { h: 13, m: 30 },
        { h: 18, m: 30 }
      ];

      slotTimes.forEach(({ h, m }) => {
        const schedTime = new Date();
        schedTime.setHours(h, m, 0, 0);

        // If today's slot time has already passed, set for tomorrow if task is still due
        if (schedTime.getTime() > Date.now()) {
          notifId++;
          notificationsToSchedule.push({
            id: notifId,
            title,
            body: `"${task.title}" is ${timeLabel}. Priority: ${task.priority.toUpperCase()}. Please review and mark complete.`,
            schedule: { at: schedTime },
            smallIcon: 'ic_stat_icon_config_sample',
            iconColor: '#DC8064'
          });
        }
      });
    });

    if (notificationsToSchedule.length > 0) {
      await LocalNotifications.schedule({ notifications: notificationsToSchedule });
      logSecurityEvent('Capacitor LocalNotifications Scheduled', `Scheduled ${notificationsToSchedule.length} native reminders`, 'info');
    }
  } catch (err) {
    console.warn('Capacitor native scheduling warning:', err);
  }
}

/**
 * Proactively check tasks and send accurate due notifications (2-3 times a day until marked complete)
 */
export function checkAndNotifyDueTasks(tasks: Task[]) {
  const settings = getNotificationSettings();
  if (!settings.enabled || !settings.dueDateReminders) return;

  try {
    const rawNotified = localStorage.getItem(NOTIFIED_TASKS_KEY);
    const notifiedMap: Record<string, string> = rawNotified ? JSON.parse(rawNotified) : {};

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const currentSlot = getCurrentTimeSlot();

    tasks.forEach((task) => {
      // 1. If task is already complete, stop notifying
      if (task.status === 'complete') return;

      const isDueToday = task.dueDate === todayStr;
      const isDueTomorrow = task.dueDate === tomorrowStr;
      const isOverdue = task.dueDate && task.dueDate < todayStr;
      const isHighPri = (task.priority || '').toLowerCase() === 'high';

      // Slot key ensures up to 3 notifications per day (morning, afternoon, evening)
      const slotKey = `notif_${task.id}_${todayStr}_${currentSlot}`;
      const highPriSlotKey = `highpri_${task.id}_${todayStr}_${currentSlot}`;

      if ((isDueToday || isDueTomorrow || isOverdue) && !notifiedMap[slotKey]) {
        let title = '';
        let body = '';

        if (isDueToday) {
          title = `Due Today: "${task.title}"`;
          body = `Reminder: "${task.title}" is due today (${task.dueDate})! Priority: ${task.priority.toUpperCase()}. Status: ${task.status.toUpperCase()}.`;
        } else if (isDueTomorrow) {
          title = `Due Tomorrow: "${task.title}"`;
          body = `Upcoming Task: "${task.title}" is scheduled for tomorrow (${task.dueDate}). Priority: ${task.priority.toUpperCase()}.`;
        } else if (isOverdue) {
          title = `Overdue Task Action Required: "${task.title}"`;
          body = `Pending Action: "${task.title}" was due on ${task.dueDate} and is still incomplete. Priority: ${task.priority.toUpperCase()}.`;
        }

        sendNativeNotification(title, body, `task_${task.id}`);
        notifiedMap[slotKey] = new Date().toISOString();
        logSecurityEvent('Due Date Notification Fired', `Task: ${task.title} (Slot: ${currentSlot}, Due: ${task.dueDate})`, 'info');
      }

      // Additional high-priority reminder if flagged high priority and not yet complete
      if (isHighPri && (isDueToday || isOverdue) && !notifiedMap[highPriSlotKey]) {
        const title = `[High Priority] Action Pending: "${task.title}"`;
        const body = `Urgent: "${task.title}" is marked HIGH priority and requires immediate attention.`;

        sendNativeNotification(title, body, `highpri_${task.id}`);
        notifiedMap[highPriSlotKey] = new Date().toISOString();
        logSecurityEvent('High Priority Notification Fired', `Task: ${task.title}`, 'info');
      }
    });

    localStorage.setItem(NOTIFIED_TASKS_KEY, JSON.stringify(notifiedMap));

    // Also sync native Capacitor background reminders if on mobile
    scheduleCapacitorNativeReminders(tasks);
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
