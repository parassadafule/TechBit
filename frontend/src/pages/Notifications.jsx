import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  Check,
  CheckCheck,
  FileText,
  Heart,
  MessageCircle,
  Repeat2,
  Sparkles,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { notificationAPI } from '../api';
import { useSocket } from '../contexts/SocketContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import { formatTimeAgo } from '../utils/date';

const notificationIcons = {
  new_post: FileText,
  like: Heart,
  comment: MessageCircle,
  share: Repeat2,
  recommendation: Sparkles,
  follow: UserPlus,
};

const notificationLinkMap = {
  new_post: {
    buildHref: (relatedId) => `/app/post/${relatedId}`,
    label: 'View post',
  },
  like: {
    buildHref: (relatedId) => `/app/post/${relatedId}`,
    label: 'View post',
  },
  comment: {
    buildHref: (relatedId) => `/app/post/${relatedId}`,
    label: 'View post',
  },
  share: {
    buildHref: (relatedId) => `/app/post/${relatedId}`,
    label: 'View post',
  },
  follow: {
    buildHref: (relatedId) => `/app/profile/${relatedId}`,
    label: 'View profile',
  },
};

const Notifications = () => {
  const socket = useSocket();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationAPI.getNotifications(1, 50),
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notifId) => notificationAPI.markAsRead(notifId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationAPI.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (notifId) => notificationAPI.deleteNotification(notifId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  useEffect(() => {
    if (!socket) {
      return undefined;
    }

    const handleNewNotification = (notification) => {
      queryClient.setQueryData(['notifications'], (previous) => {
        if (!notification) {
          return previous;
        }

        if (!previous) {
          return {
            notifications: [notification],
            unreadCount: 1,
          };
        }

        const existingNotifications = previous.notifications || [];
        if (existingNotifications.some((item) => item._id === notification._id)) {
          return previous;
        }

        return {
          ...previous,
          notifications: [notification, ...existingNotifications],
          unreadCount: (previous.unreadCount || 0) + 1,
        };
      });
    };

    socket.on('notification', handleNewNotification);

    return () => {
      socket.off('notification', handleNewNotification);
    };
  }, [socket, queryClient]);

  const unreadCount = data?.unreadCount
    ?? data?.notifications?.filter((notification) => !notification.read).length
    ?? 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center text-2xl font-bold text-gray-900">
            <Bell size={28} className="mr-3 text-primary-600" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="danger" className="ml-3">
                {unreadCount} new
              </Badge>
            )}
          </h1>
          <p className="mt-1 text-gray-600">Stay updated with activity from people and posts you follow.</p>
        </div>

        {unreadCount > 0 && (
          <Button
            onClick={() => markAllAsReadMutation.mutate()}
            loading={markAllAsReadMutation.isPending}
            variant="outline"
            size="sm"
          >
            <CheckCheck size={18} className="mr-2" />
            Mark all as read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : !data?.notifications || data.notifications.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="mb-4 flex justify-center">
            <Bell size={48} className="text-gray-300" />
          </div>
          <h3 className="mb-2 text-xl font-semibold text-gray-900">No notifications</h3>
          <p className="text-gray-600">You are all caught up.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.notifications.map((notification) => {
            const NotificationIcon = notificationIcons[notification.type] || Bell;
            const linkConfig = notificationLinkMap[notification.type];
            const href = notification.relatedId && linkConfig
              ? linkConfig.buildHref(notification.relatedId)
              : null;

            return (
              <Card
                key={notification._id}
                className={`p-4 ${notification.read ? 'bg-white' : 'border-blue-200 bg-blue-50'}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex flex-1 items-start space-x-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                      <NotificationIcon size={20} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-gray-900">{notification.message}</p>
                      <p className="mt-1 text-sm text-gray-500">{formatTimeAgo(notification.createdAt)}</p>

                      {href && (
                        <Link
                          to={href}
                          className="mt-2 inline-block text-sm text-primary-600 hover:underline"
                        >
                          {linkConfig.label}
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="ml-4 flex items-center space-x-2">
                    {!notification.read && (
                      <button
                        type="button"
                        onClick={() => markAsReadMutation.mutate(notification._id)}
                        className="rounded-lg p-2 text-blue-600 hover:bg-blue-100"
                        title="Mark as read"
                      >
                        <Check size={18} />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => deleteMutation.mutate(notification._id)}
                      className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notifications;
