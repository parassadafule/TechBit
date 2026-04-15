import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, Trash2, CheckCheck } from 'lucide-react';
import { notificationAPI } from '../api';
import { useSocket } from '../contexts/SocketContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import { formatTimeAgo } from '../utils/date';
import { useEffect } from 'react';

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
      queryClient.invalidateQueries(['notifications']);
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationAPI.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (notifId) => notificationAPI.deleteNotification(notifId),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    },
  });

  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = () => {
      queryClient.invalidateQueries(['notifications']);
    };

    socket.on('notification', handleNewNotification);

    return () => {
      socket.off('notification', handleNewNotification);
    };
  }, [socket, queryClient]);

  const getNotificationIcon = (type) => {
    const icons = {
      like: '❤️',
      comment: '💬',
      share: '🔄',
      follow: '👤',
      mention: '@',
    };
    return icons[type] || '🔔';
  };

  const unreadCount = data?.notifications?.filter(n => !n.read).length || 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Bell size={28} className="mr-3 text-primary-600" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="danger" className="ml-3">
                {unreadCount} new
              </Badge>
            )}
          </h1>
          <p className="text-gray-600 mt-1">Stay updated with your activity</p>
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
          <div className="text-6xl mb-4">🔔</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Notifications</h3>
          <p className="text-gray-600">You're all caught up!</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.notifications.map((notification) => (
            <Card
              key={notification._id}
              className={`p-4 ${notification.read ? 'bg-white' : 'bg-blue-50 border-blue-200'}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  {}
                  <div className="text-2xl flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {}
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900">
                      <span className="text-gray-700">{notification.message}</span>
                    </p>
                    <p className="text-sm text-gray-500 mt-1">{formatTimeAgo(notification.createdAt)}</p>

                    {}
                    {notification.relatedId && (
                      <a
                        href={`/post/${notification.relatedId}`}
                        className="text-sm text-primary-600 hover:underline mt-2 inline-block"
                      >
                        View post →
                      </a>
                    )}
                  </div>
                </div>

                {}
                <div className="flex items-center space-x-2 ml-4">
                  {!notification.read && (
                    <button
                      onClick={() => markAsReadMutation.mutate(notification._id)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                      title="Mark as read"
                    >
                      <Check size={18} />
                    </button>
                  )}
                  <button
                    onClick={() => deleteMutation.mutate(notification._id)}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
