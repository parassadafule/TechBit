import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin, Link as LinkIcon, Calendar, Edit } from 'lucide-react';
import { userAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';
import PostCard from '../components/PostCard';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import Input from '../components/ui/Input';
import TextArea from '../components/ui/TextArea';
import Modal from '../components/ui/Modal';
import { formatDate } from '../utils/date';

const Profile = () => {
  const { userId } = useParams();
  const { user: currentUser, setUser: setCurrentUser } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('posts');
  const [isEditing, setIsEditing] = useState(false);
  const [followModal, setFollowModal] = useState({ isOpen: false, type: 'followers' });
  const [formState, setFormState] = useState({
    name: '',
    username: '',
    bio: '',
    location: '',
    website: '',
    interestsInput: '',
  });

  const id = userId || currentUser?._id;

  const isOwnProfile = !userId || userId === currentUser?._id;

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => userAPI.getProfile(userId),
  });

  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['posts', 'user', id],
    queryFn: () => userAPI.getUserPosts(id, 1, 20),
    enabled: tab === 'posts' && !!id,
  });

  const { data: activityData, isLoading: activityLoading } = useQuery({
    queryKey: ['activity', userId],
    queryFn: () => userAPI.getActivity(1, 20),
    enabled: tab === 'activity' && isOwnProfile,
  });

  const updateProfileMutation = useMutation({
    mutationFn: (payload) => userAPI.updateProfile(payload),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
      if (isOwnProfile) {
        setCurrentUser(updatedUser);
      }
      setIsEditing(false);
    },
  });

  const followMutation = useMutation({
    mutationFn: () => userAPI.followUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['suggested-users'] });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: () => userAPI.unfollowUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['suggested-users'] });
    },
  });

  const user = profile || currentUser;
  const posts = postsData?.posts || [];
  const followersCount = user?.followersCount || 0;
  const followingCount = user?.followingCount || 0;
  const isFollowing = Boolean(user?.isFollowing);
  const isFollowLoading = followMutation.isPending || unfollowMutation.isPending;

  const followModalTitle = useMemo(() => {
    if (followModal.type === 'following') return 'Following';
    return 'Followers';
  }, [followModal.type]);

  const {
    data: followListData,
    isLoading: followListLoading,
  } = useQuery({
    queryKey: ['follow-list', followModal.type, id],
    queryFn: () =>
      followModal.type === 'following'
        ? userAPI.getFollowing(id, { page: 1, limit: 100 })
        : userAPI.getFollowers(id, { page: 1, limit: 100 }),
    enabled: followModal.isOpen && !!id,
  });

  const followUsers = followListData?.users || [];

  if (profileLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  const startEdit = () => {
    setFormState({
      name: user?.name || '',
      username: user?.username || '',
      bio: user?.bio || '',
      location: user?.location || '',
      website: user?.website || '',
      interestsInput: Array.isArray(user?.interests) ? user.interests.join(', ') : '',
    });
    setIsEditing(true);
  };

  const submitProfileUpdate = (event) => {
    event.preventDefault();

    const interests = formState.interestsInput
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    updateProfileMutation.mutate({
      name: formState.name,
      username: formState.username,
      bio: formState.bio,
      location: formState.location,
      website: formState.website,
      interests,
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row gap-6">
          <Avatar src={user?.avatarUrl} alt={user?.username} size="xl" />
          
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{user?.name}</h1>
                <p className="text-gray-600">@{user?.username}</p>
              </div>
              
              {isOwnProfile ? (
                <Button variant="outline" size="sm" onClick={startEdit}>
                  <Edit size={16} className="mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <Button
                  variant={isFollowing ? 'outline' : 'primary'}
                  size="sm"
                  onClick={() => {
                    if (isFollowing) {
                      unfollowMutation.mutate();
                    } else {
                      followMutation.mutate();
                    }
                  }}
                  loading={isFollowLoading}
                >
                  {isFollowing ? 'Unfollow' : 'Follow'}
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
                  <span>{user.website.includes('github.com') ? 'Git Profile' : 'Website'}</span>
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
                <span className="font-bold text-gray-900">{user?.contributionsCount || posts.length}</span>
                <span className="text-gray-600 ml-1">Posts</span>
              </div>
              <button
                type="button"
                onClick={() => setFollowModal({ isOpen: true, type: 'followers' })}
                className="text-left hover:opacity-80 transition-opacity"
              >
                <span className="font-bold text-gray-900">{followersCount}</span>
                <span className="text-gray-600 ml-1">Followers</span>
              </button>
              <button
                type="button"
                onClick={() => setFollowModal({ isOpen: true, type: 'following' })}
                className="text-left hover:opacity-80 transition-opacity"
              >
                <span className="font-bold text-gray-900">{followingCount}</span>
                <span className="text-gray-600 ml-1">Following</span>
              </button>
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

            {isEditing && (
              <form onSubmit={submitProfileUpdate} className="mt-6 border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50">
                <Input
                  label="Enter Your Name"
                  value={formState.name}
                  onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Your full name"
                />
                <Input
                  label="Username"
                  value={formState.username}
                  onChange={(event) => setFormState((prev) => ({ ...prev, username: event.target.value }))}
                  placeholder="Your username"
                />
                <TextArea
                  label="Bio"
                  value={formState.bio}
                  onChange={(event) => setFormState((prev) => ({ ...prev, bio: event.target.value }))}
                  rows={3}
                />
                <Input
                  label="Location"
                  value={formState.location}
                  onChange={(event) => setFormState((prev) => ({ ...prev, location: event.target.value }))}
                  placeholder="City, Country"
                />
                <Input
                  label="Git Profile URL"
                  value={formState.website}
                  onChange={(event) => setFormState((prev) => ({ ...prev, website: event.target.value }))}
                  placeholder="https://github.com/your-username"
                />
                <Input
                  label="Interests"
                  value={formState.interestsInput}
                  onChange={(event) => setFormState((prev) => ({ ...prev, interestsInput: event.target.value }))}
                  placeholder="react, node.js, system design"
                />

                <div className="flex gap-2">
                  <Button type="submit" size="sm" loading={updateProfileMutation.isLoading}>
                    Save Changes
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
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
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No posts yet</p>
            </div>
          ) : (
            posts.map((post) => (
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

      <Modal
        isOpen={followModal.isOpen}
        onClose={() => setFollowModal((prev) => ({ ...prev, isOpen: false }))}
        title={followModalTitle}
        size="sm"
      >
        {followListLoading ? (
          <div className="flex justify-center py-10">
            <Spinner size="lg" />
          </div>
        ) : followUsers.length === 0 ? (
          <div className="py-10 text-center text-gray-600">
            No {followModal.type === 'following' ? 'following' : 'followers'} yet
          </div>
        ) : (
          <div className="max-h-[60vh] overflow-auto">
            <div className="space-y-2">
              {followUsers.map((u) => (
                <Link
                  key={u._id}
                  to={`/app/profile/${u._id}`}
                  onClick={() => setFollowModal((prev) => ({ ...prev, isOpen: false }))}
                  className="flex items-center gap-3 rounded-md p-2 hover:bg-gray-50 transition-colors"
                >
                  <Avatar src={u.avatarUrl} alt={u.username} size="md" />
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 truncate">{u.name || u.username}</div>
                    <div className="text-sm text-gray-600 truncate">@{u.username}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Profile;
