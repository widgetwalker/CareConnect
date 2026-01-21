import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseclient";
import { Button } from "@/components/ui/button";
import { Bell, Check, X, Calendar, ClipboardList, AlertCircle } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    related_id: string;
    is_read: boolean;
    created_at: string;
}

interface NotificationsProps {
    userId: string;
}

export const Notifications = ({ userId }: NotificationsProps) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        loadNotifications();

        // Subscribe to notifications
        const channel = supabase
            .channel("notifications")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "notifications",
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    setNotifications((prev) => [payload.new as Notification, ...prev]);
                    setUnreadCount((prev) => prev + 1);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId]);

    const loadNotifications = async () => {
        const { data, error } = await supabase
            .from("notifications")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(20);

        if (error) {
            console.error("Error loading notifications:", error);
        } else {
            setNotifications(data || []);
            setUnreadCount(data?.filter((n) => !n.is_read).length || 0);
        }
    };

    const markAsRead = async (notificationId: string) => {
        const { error } = await supabase
            .from("notifications")
            .update({ is_read: true })
            .eq("id", notificationId);

        if (!error) {
            setNotifications((prev) =>
                prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        }
    };

    const markAllAsRead = async () => {
        const { error } = await supabase
            .from("notifications")
            .update({ is_read: true })
            .eq("user_id", userId)
            .eq("is_read", false);

        if (!error) {
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
            setUnreadCount(0);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case "appointment_booked":
                return <Calendar className="w-4 h-4 text-green-500" />;
            case "appointment_cancelled":
                return <X className="w-4 h-4 text-red-500" />;
            case "appointment_rescheduled":
                return <Calendar className="w-4 h-4 text-blue-500" />;
            case "prescription_received":
                return <ClipboardList className="w-4 h-4 text-purple-500" />;
            default:
                return <AlertCircle className="w-4 h-4 text-gray-500" />;
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                        >
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <div className="flex items-center justify-between px-4 py-2 border-b">
                    <h3 className="font-semibold">Notifications</h3>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={markAllAsRead}
                            className="h-auto p-1 text-xs"
                        >
                            Mark all read
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-[400px]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-4">
                            <Bell className="w-12 h-12 text-muted-foreground opacity-50 mb-2" />
                            <p className="text-sm text-muted-foreground text-center">
                                No notifications yet
                            </p>
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <DropdownMenuItem
                                key={notification.id}
                                className={`flex gap-3 p-4 cursor-pointer ${!notification.is_read ? "bg-muted/50" : ""
                                    }`}
                                onClick={() => !notification.is_read && markAsRead(notification.id)}
                            >
                                <div className="mt-1">{getIcon(notification.type)}</div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="font-semibold text-sm">{notification.title}</p>
                                        {!notification.is_read && (
                                            <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {format(new Date(notification.created_at), "MMM dd, yyyy 'at' hh:mm a")}
                                    </p>
                                </div>
                            </DropdownMenuItem>
                        ))
                    )}
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
