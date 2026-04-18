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

  // Use data from database
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

  // return (
  //   <aside className="hidden lg:block w-80 space-y-6">
  //     {/* Quick Actions */}
  //     <Card className="p-4">
  //       <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
  //       <div className="space-y-2">
  //         {quickActions.map(({ icon: Icon, label, color }) => (
  //           <button
  //             key={label}
  //             className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
  //           >
  //             <Icon size={20} className={color} />
  //             <span className="text-sm font-medium text-gray-700">{label}</span>
  //           </button>
  //         ))}
  //       </div>
  //     </Card>

  //     {/* Trending Topics */}
  //     <Card className="p-4">
  //       <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
  //         <TrendingUp size={18} className="mr-2" />
  //         Trending Topics
  //       </h3>
  //       <div className="space-y-3">
  //         {trendingTopics.map((topic, index) => (
  //           <div key={topic.name} className="flex items-center justify-between">
  //             <div className="flex items-center space-x-2">
  //               <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
  //               <span className="text-sm font-medium text-gray-900">{topic.name}</span>
  //             </div>
  //             <span className="text-xs text-gray-500">{topic.count}</span>
  //           </div>
  //         ))}
  //       </div>
  //       <button className="mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium">
  //         Show more
  //       </button>
  //     </Card>

  //     {/* Suggested Users */}
  //     <Card className="p-4">
  //       <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
  //         <Users size={18} className="mr-2" />
  //         Suggested to Follow
  //       </h3>
  //       <div className="space-y-3">
  //         {suggestedUsers.map((user) => (
  //           <div key={user._id} className="flex items-center justify-between">
  //             <div className="flex items-center space-x-3">
  //               <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
  //                 <span className="text-primary-700 font-semibold text-sm">
  //                   {user.username.split(' ').map(n => n[0]).join('').toUpperCase()}
  //                 </span>
  //               </div>
  //               <div>
  //                 <p className="text-sm font-medium text-gray-900">{user.username}</p>
  //                 <p className="text-xs text-gray-500">
  //                   {user.goals?.skillLevel || 'Developer'} • {user.contributionsCount || 0} posts
  //                 </p>
  //               </div>
  //             </div>
  //             <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
  //               Follow
  //             </button>
  //           </div>
  //         ))}
  //       </div>
  //     </Card>

  //     {/* Footer */}
  //     <div className="px-4 py-3 text-xs text-gray-500 space-x-3">
  //       <a href="#" className="hover:underline">About</a>
  //       <a href="#" className="hover:underline">Help</a>
  //       <a href="#" className="hover:underline">Privacy</a>
  //       <a href="#" className="hover:underline">Terms</a>
  //     </div>
  //   </aside>
  // );
};

export default Sidebar;