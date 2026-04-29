import { Link, useLocation } from 'react-router-dom';
import { Home, Search, TrendingUp, BookOpen, MessageSquare, Bell, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Avatar from './ui/Avatar';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

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
          <div className="flex items-center space-x-4">
            <Link
              to="/app/notifications"
              className="relative p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
            >
              <Bell size={20} />
              {}
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </Link>

            <Link
              to="/app/profile"
              className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-lg"
            >
              <Avatar src={null} alt={user?.username} size="sm" />
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
    </nav>
  );
};

export default Navbar;
