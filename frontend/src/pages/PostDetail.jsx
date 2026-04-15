import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { postAPI, commentAPI } from '../api';
import PostCard from '../components/PostCard';
import CommentThread from '../components/CommentThread';
import Spinner from '../components/ui/Spinner';
import Button from '../components/ui/Button';

const PostDetail = () => {
  const { postId } = useParams();

  const { data: post, isLoading: postLoading } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => postAPI.getPost(postId),
  });

  const { data: commentsData, isLoading: commentsLoading } = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => commentAPI.getComments(postId, 1, 50),
    enabled: !!postId,
  });

  if (postLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {}
      <Link to="/">
        <Button variant="ghost">
          <ArrowLeft size={20} className="mr-2" />
          Back to Feed
        </Button>
      </Link>

      {}
      {post && <PostCard post={post} showFullContent />}

      {}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          Comments ({commentsData?.comments?.length || 0})
        </h2>
        <CommentThread
          postId={postId}
          comments={commentsData?.comments || []}
          isLoading={commentsLoading}
        />
      </div>
    </div>
  );
};

export default PostDetail;
