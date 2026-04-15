import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Link as LinkIcon, Calendar, Edit } from 'lucide-react';
import { userAPI, postAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';
import PostCard from '../components/PostCard';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import { formatDate } from '../utils/date';

const Profile = () => {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const [tab, setTab] = useState('posts');
  const id = userId || currentUser?._id;

  const isOwnProfile = !userId || userId === currentUser?._id;

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => userAPI.getProfile(userId),
  });

  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['posts', 'user', id],
    queryFn: () => postAPI.getFeed({ page: 1, limit: 20 }),
    enabled: tab === 'posts' && !!id,
  });

  const { data: activityData, isLoading: activityLoading } = useQuery({
    queryKey: ['activity', userId],
    queryFn: () => userAPI.getActivity(1, 20),
    enabled: tab === 'activity' && isOwnProfile,
  });

  if (profileLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  const user = profile || currentUser;
  const userPosts = (postsData?.posts || []).filter((post) => post?.userId?._id === id);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row gap-6">
          <Avatar src={null} alt={user?.username} size="xl" />
          
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{user?.username}</h1>
                <p className="text-gray-600">@{user?.username}</p>
              </div>
              
              {isOwnProfile && (
                <Button variant="outline" size="sm">
                  <Edit size={16} className="mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>

            <p className="text-gray-700 mb-4">{user?.bio || 'No bio yet'}</p>

            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              {user?.location && (
                <div className="flex items-center space-x-1">
                  <MapPin size={16} />
                  <span>{user.location}</span>
                </div>
              )}
              {user?.website && (
                <a
                  href={user.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-primary-600 hover:underline"
                >
                  <LinkIcon size={16} />
                  <span>Website</span>
                </a>
              )}
              <div className="flex items-center space-x-1">
                <Calendar size={16} />
                <span>Joined {formatDate(user?.createdAt)}</span>
              </div>
            </div>

            {}
            <div className="flex gap-6 mt-4 pt-4 border-t border-gray-100">
              <div>
                <span className="font-bold text-gray-900">{userPosts.length}</span>
                <span className="text-gray-600 ml-1">Posts</span>
              </div>
              <div>
                <span className="font-bold text-gray-900">0</span>
                <span className="text-gray-600 ml-1">Followers</span>
              </div>
              <div>
                <span className="font-bold text-gray-900">0</span>
                <span className="text-gray-600 ml-1">Following</span>
              </div>
            </div>

            {}
            {user?.interests && user.interests.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {user.interests.map((interest) => (
                    <Badge key={interest} variant="primary">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {isOwnProfile && (
              <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-100">
                <h3 className="text-sm font-semibold text-blue-900 mb-1">Personalization Profile</h3>
                <p className="text-sm text-blue-800">
                  Skill level: {user?.goals?.skillLevel || 'intermediate'} • Career goal: {user?.goals?.career || 'full-stack-developer'}
                </p>
                <a href="/learning" className="text-sm text-primary-700 hover:underline mt-1 inline-block">
                  Update your adaptive learning path
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {}
      <div className="border-b border-gray-200">
        <div className="flex space-x-8">
          <button
            onClick={() => setTab('posts')}
            className={`pb-4 px-1 font-medium transition-colors ${
              tab === 'posts'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Posts
          </button>
          {isOwnProfile && (
            <button
              onClick={() => setTab('activity')}
              className={`pb-4 px-1 font-medium transition-colors ${
                tab === 'activity'
                  ? 'border-b-2 border-primary-600 text-primary-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Activity
            </button>
          )}
        </div>
      </div>

      {}
      {tab === 'posts' && (
        <div className="space-y-6">
          {postsLoading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : userPosts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No posts yet</p>
            </div>
          ) : (
            userPosts.map((post) => (
              <PostCard key={post._id} post={post} />
            ))
          )}
        </div>
      )}

      {tab === 'activity' && (
        <div className="space-y-4">
          {activityLoading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : activityData?.activities?.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No activity yet</p>
            </div>
          ) : (
            activityData?.activities?.map((activity, index) => (
              <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="text-gray-900">
                  <span className="font-medium">{activity.action}</span> • {formatDate(activity.timestamp)}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Profile;
