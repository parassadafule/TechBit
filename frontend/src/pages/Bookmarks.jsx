import { useQuery } from '@tanstack/react-query';
import { userAPI } from '../api';
import PostCard from '../components/PostCard';
import Spinner from '../components/ui/Spinner';

const Bookmarks = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: () => userAPI.getBookmarks(),
  });

  const bookmarks = data?.bookmarks || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bookmarks</h1>
        <p className="text-gray-600">Saved content you want to revisit later.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-600">Failed to load bookmarks.</div>
      ) : bookmarks.length === 0 ? (
        <div className="text-center py-12 text-gray-600">You have not bookmarked anything yet.</div>
      ) : (
        <div className="space-y-6">
          {bookmarks.map((post) => (
            <PostCard key={post._id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Bookmarks;
