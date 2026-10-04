"use client";

import { Check } from "lucide-react";
import { markNotificationRead } from "@/lib/actions/notifications";
import { buttonClasses } from "@/components/ui/button";
import { DIVIDE, ICON, SUBTEXT } from "@/lib/ui/styles";
import { cn } from "@/lib/utils/cn";

type Notification = { id: string; title: string; body: string | null; is_read: boolean; created_at: string };

export function NotificationList({ notifications }: { notifications: Notification[] }) {
  if (notifications.length === 0) return <p className={SUBTEXT}>You are all caught up.</p>;
  return (
    <ul className={DIVIDE}>
      {notifications.map((notification) => (
        <li key={notification.id} className="flex items-start justify-between gap-4 py-3">
          <div>
            <p className={notification.is_read ? SUBTEXT : "text-sm font-medium"}>{notification.title}</p>
            {notification.body && <p className={cn(SUBTEXT, "mt-1")}>{notification.body}</p>}
            <p className={cn(SUBTEXT, "mt-1")}>{new Date(notification.created_at).toLocaleString()}</p>
          </div>
          {!notification.is_read && (
            <form action={markNotificationRead}>
              <input type="hidden" name="notificationId" value={notification.id} />
              <button type="submit" className={buttonClasses({ variant: "ghost", size: "sm" })}>
                <Check className={ICON} />
                Mark read
              </button>
            </form>
          )}
        </li>
      ))}
    </ul>
  );
}
