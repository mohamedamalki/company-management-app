import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

function timeAgo(dateString) {
  const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);

  const intervals = [
    { label: "y", seconds: 31536000 },
    { label: "mo", seconds: 2592000 },
    { label: "d", seconds: 86400 },
    { label: "h", seconds: 3600 },
    { label: "min", seconds: 60 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) return `${count}${interval.label} ago`;
  }
  return "just now";
}

function NotificationBell() {
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = async () => {
    try {
      const response = await api.get("/notifications");
      setNotifications(response.data.data ?? []);
      setUnreadCount(response.data.unread_count ?? 0);
    } catch (error) {
      // Silent fail on polling — avoid spamming the user with error toasts
      console.error("Failed to load notifications", error);
    } finally {
      setLoading(false);
    }
  };

    useEffect(() => {
    queueMicrotask(fetchNotifications);

    const interval = setInterval(fetchNotifications, 30000);

    return () => {
        clearInterval(interval);
    };
    }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification) => {
    if (!notification.read_at) {
      try {
        await api.post(`/notifications/${notification.id}/read`);
        setNotifications((current) =>
          current.map((item) =>
            item.id === notification.id
              ? { ...item, read_at: new Date().toISOString() }
              : item,
          ),
        );
        setUnreadCount((current) => Math.max(current - 1, 0));
      } catch (error) {
        console.error("Failed to mark notification as read", error);
      }
    }

    setOpen(false);
    if (notification.data?.url) {
      navigate(notification.data.url);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setMarkingAll(true);
      await api.post("/notifications/read-all");
      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          read_at: item.read_at ?? new Date().toISOString(),
        })),
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all notifications as read", error);
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg sm:w-96">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
            <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={markingAll}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50"
              >
                {markingAll ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <CheckCheck size={13} />
                )}
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10 text-slate-400">
                <Loader2 size={20} className="animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-slate-400">
                No notifications yet.
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => handleNotificationClick(notification)}
                  className={`flex w-full flex-col items-start gap-1 border-b border-slate-100 px-4 py-3 text-left last:border-b-0 hover:bg-slate-50 ${
                    !notification.read_at ? "bg-blue-50/60" : ""
                  }`}
                >
                  <div className="flex w-full items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">
                      {notification.data?.title ?? "Notification"}
                    </p>
                    {!notification.read_at && (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600">
                    {notification.data?.message}
                  </p>
                  <span className="text-[11px] text-slate-400">
                    {timeAgo(notification.created_at)}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
