import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Users, Zap } from 'lucide-react';
import Card from './ui/Card';
import Badge from './ui/Badge';
import { trendAPI, userAPI } from '../api';

const Sidebar = () => {
  const { data: trendsData } = useQuery({
    queryKey: ['trends'],
    queryFn: () => trendAPI.getTrends(),
  });

  const { data: suggestedData } = useQuery({
    queryKey: ['suggested-users'],
    queryFn: () => userAPI.getSuggestedUsers(5),
  });

  const trendingTopics = trendsData?.trends?.slice(0, 5).map((trend, index) => ({
    name: trend.title,
    count: `${trend.score || 0} ${trend.source === 'github' ? 'stars' : trend.source === 'stackoverflow' ? 'votes' : 'tweets'}`,
  })) || [];

  const suggestedUsers = suggestedData?.suggestedUsers || [];

  const quickActions = [
    { icon: Zap, label: 'AI Summarize', color: 'text-purple-600' },
    { icon: TrendingUp, label: 'Top Posts', color: 'text-blue-600' },
    { icon: Users, label: 'Communities', color: 'text-green-600' },
  ];




};

export default Sidebar;
