"use client";

import { markNotificationRead } from "@/app/student/actions";

type Notification = { id: string; title: string; body: string | null; is_read: boolean; created_at: string };

export function NotificationList({ notifications }: { notifications: Notification[] }) {
  if (notifications.length === 0) return <p className="text-sm text-muted">You are all caught up.</p>;
  return <ul className="divide-y divide-border">{notifications.map((notification) => <li key={notification.id} className="flex items-start justify-between gap-4 py-3"><div><p className={notification.is_read ? "text-sm text-muted" : "text-sm font-semibold text-foreground"}>{notification.title}</p>{notification.body && <p className="mt-1 text-sm text-muted">{notification.body}</p>}<p className="mt-1 text-xs text-muted">{new Date(notification.created_at).toLocaleString()}</p></div>{!notification.is_read && <form action={markNotificationRead}><input type="hidden" name="notificationId" value={notification.id} /><button type="submit" className="text-xs font-medium text-primary-600 hover:underline">Mark read</button></form>}</li>)}</ul>;
}
