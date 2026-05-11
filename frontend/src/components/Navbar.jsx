import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Search,
  TrendingUp,
  BookOpen,
  MessageSquare,
  Bell,
  LogOut,
  Sparkles,
  Unplug,
  Loader2,
} from 'lucide-react';
import { notificationAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useBackendHealth } from '../hooks/useBackendHealth';
import { shouldPollLocalBackendHealth } from '../lib/apiEnv';
import Avatar from './ui/Avatar';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const socket = useSocket();
  const queryClient = useQueryClient();

  const { data: notificationData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationAPI.getNotifications(1, 20),
  });

  const healthEnabled = shouldPollLocalBackendHealth();
  const health = useBackendHealth(healthEnabled);
  const isBackendOnline = health.isSuccess;
  const isBackendOffline = health.isError;
  const isBackendChecking = !health.isSuccess && !health.isError;

  const [showLocalReadyToast, setShowLocalReadyToast] = useState(false);
  const lastHealthDefinitiveRef = useRef(null);

  useEffect(() => {
    if (!healthEnabled) {
      lastHealthDefinitiveRef.current = null;
      return undefined;
    }
    if (health.isSuccess) {
      if (lastHealthDefinitiveRef.current === 'down') {
        setShowLocalReadyToast(true);
      }
      lastHealthDefinitiveRef.current = 'up';
    } else if (health.isError) {
      lastHealthDefinitiveRef.current = 'down';
    }
    return undefined;
  }, [healthEnabled, health.isSuccess, health.isError]);

  useEffect(() => {
    if (!showLocalReadyToast) {
      return undefined;
    }
    const t = window.setTimeout(() => setShowLocalReadyToast(false), 6500);
    return () => window.clearTimeout(t);
  }, [showLocalReadyToast]);

  useEffect(() => {
    if (!socket) {
      return undefined;
    }

    const refreshNotifications = () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };

    socket.on('notification', refreshNotifications);

    return () => {
      socket.off('notification', refreshNotifications);
    };
  }, [socket, queryClient]);

  const isActive = (path) => location.pathname === path;
  const unreadCount = notificationData?.unreadCount
    ?? notificationData?.notifications?.filter((notification) => !notification.read).length
    ?? 0;

  const navLinks = [
    { path: '/app', icon: Home, label: 'Feed' },
    { path: '/app/search', icon: Search, label: 'Search' },
    { path: '/app/trends', icon: TrendingUp, label: 'Trends' },
    { path: '/app/learning', icon: BookOpen, label: 'Learning' },
    { path: '/app/ai-chat', icon: MessageSquare, label: 'AI Chat' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {}
          <Link to="/app" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <span className="text-xl font-bold text-gray-900">TechBit</span>
          </Link>

          {}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map(({ path, icon: Icon, label }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  isActive(path)
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{label}</span>
              </Link>
            ))}
          </div>

          {}
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 shrink-0">
            {healthEnabled && (
              <>
                <div
                  role="status"
                  aria-live="polite"
                  className={`hidden sm:flex max-w-44 sm:max-w-xs md:max-w-md items-center gap-2 rounded-lg border px-2 py-1.5 text-left ${
                    isBackendOnline
                      ? 'border-emerald-200 bg-emerald-50/90'
                      : isBackendChecking
                        ? 'border-gray-200 bg-gray-50'
                        : 'border-amber-200 bg-amber-50/90'
                  }`}
                  title={
                    isBackendOnline
                      ? 'Local backend is running. Ollama-backed posting, AI chat, summaries, and search embeddings are available.'
                      : isBackendChecking
                        ? 'Checking whether the local backend is reachable.'
                        : 'Local backend is not reachable. Start the API server (and Ollama) to use AI-generated posts, AI chat, and other server-backed features.'
                  }
                >
                  {isBackendOnline ? (
                    <Sparkles className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                  ) : isBackendChecking ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-gray-500" aria-hidden />
                  ) : (
                    <Unplug className="h-4 w-4 shrink-0 text-amber-700" aria-hidden />
                  )}
                  <p className="hidden md:block text-xs font-medium leading-snug text-gray-800">
                    {isBackendOnline
                      ? 'Local API online — AI posts, chat, and smart features are available.'
                      : isBackendChecking
                        ? 'Checking local API…'
                        : 'Local API offline — start the backend for AI posts and related features.'}
                  </p>
                  <p className="hidden sm:block md:hidden text-[11px] font-medium leading-tight text-gray-800">
                    {isBackendOnline ? 'API online · AI on' : isBackendChecking ? 'Checking…' : 'API offline'}
                  </p>
                </div>

                <div
                  role="status"
                  aria-live="polite"
                  className="flex sm:hidden items-center justify-center rounded-lg border p-1.5"
                  title={
                    isBackendOnline
                      ? 'Local API online — AI features available.'
                      : isBackendChecking
                        ? 'Checking local API…'
                        : 'Local API offline — start the backend for AI features.'
                  }
                >
                  {isBackendOnline ? (
                    <Sparkles className="h-4 w-4 text-emerald-600" aria-hidden />
                  ) : isBackendChecking ? (
                    <Loader2 className="h-4 w-4 animate-spin text-gray-500" aria-hidden />
                  ) : (
                    <Unplug className="h-4 w-4 text-amber-700" aria-hidden />
                  )}
                </div>
              </>
            )}

            <Link
              to="/app/notifications"
              className="relative p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            <Link
              to="/app/profile"
              className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-lg"
            >
              <Avatar src={user?.avatarUrl} alt={user?.username} size="sm" />
              <span className="hidden md:block font-medium text-gray-700">{user?.username}</span>
            </Link>

            <button
              onClick={logout}
              className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>

      {}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex items-center justify-around">
          {navLinks.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center space-y-1 p-2 rounded-lg ${
                isActive(path)
                  ? 'text-primary-700'
                  : 'text-gray-600'
              }`}
            >
              <Icon size={20} />
              <span className="text-xs">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {healthEnabled && showLocalReadyToast && (
        <div
          role="alert"
          className="fixed bottom-24 left-1/2 z-50 w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center shadow-lg md:bottom-8"
        >
          <p className="text-sm font-semibold text-emerald-900">Local backend is ready</p>
          <p className="mt-1 text-xs text-emerald-800">
            AI-generated posts, AI chat, and other server features are available now.
          </p>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
