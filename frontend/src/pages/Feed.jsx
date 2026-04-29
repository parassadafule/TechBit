import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, TrendingUp, Clock, Sparkles } from 'lucide-react';
import { postAPI } from '../api';
import PostCard from '../components/PostCard';
import CreatePostModal from '../components/CreatePostModal';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import { useAuth } from '../contexts/AuthContext';

const Feed = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filter, setFilter] = useState('all'); 
  // const [sort, setSort] = useState('latest');
  const { user, isAuthenticated } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['posts', 'feed', filter ],
    queryFn: async () => {
      console.log('Fetching feed with filter:', filter );
      const result = await postAPI.getFeed({ 
        page: 1, 
        limit: 20,
        type: filter !== 'all' ? filter : undefined,
      });
      console.log('Feed result:', result);
      return result;
    },
  });

  console.log('Feed state - isLoading:', isLoading, 'error:', error, 'data:', data);

  const posts = data?.posts || [];

  const filterOptions = [
    { value: 'all', label: 'All', icon: Sparkles },
    { value: 'blog', label: 'Blogs', icon: '📝' },
    { value: 'repo', label: 'Repos', icon: '💻' },
    { value: 'video', label: 'Videos', icon: '🎥' },
    { value: 'podcast', label: 'Podcasts', icon: '🎙️' },
  ];

  // const sortOptions = [
  //   { value: 'latest', label: 'Latest', icon: Clock },
  // ];

  return (
    <div className="space-y-6">
      {}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Feed</h1>
        {isAuthenticated && (
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={20} className="mr-2" />
            Create Post
          </Button>
        )}
      </div>

      {}
      <div className="flex flex-col sm:flex-row gap-4">
        {}
        <div className="flex-1">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {filterOptions.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  filter === value
                    ? 'bg-primary-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {typeof Icon === 'string' ? (
                  <span>{Icon}</span>
                ) : (
                  <Icon size={18} />
                )}
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        
        {/* <div className="flex items-center gap-2">
          {sortOptions.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setSort(value)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                sort === value
                  ? 'bg-primary-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon size={18} />
              <span className="font-medium">{label}</span>
            </button>
          ))}
        </div> */}
      </div>

      {}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-600">Failed to load posts. Please try again.</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts yet</h3>
          <p className="text-gray-600 mb-6">
            {isAuthenticated ? 'Be the first to share something!' : 'Log in to start sharing content!'}
          </p>
          {isAuthenticated ? (
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus size={20} className="mr-2" />
              Create First Post
            </Button>
          ) : (
            <Button onClick={() => window.location.href = '/login'}>
              Log In to Get Started
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard key={post._id} post={post} userInterests={user?.interests || []} />
          ))}
        </div>
      )}

      {}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
};

export default Feed;
