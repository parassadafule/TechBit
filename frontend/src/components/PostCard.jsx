import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Heart, MessageCircle, Share2, MoreHorizontal, ExternalLink, Sparkles } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Card from './ui/Card';
import Avatar from './ui/Avatar';
import Badge from './ui/Badge';
import { postAPI } from '../api';
import { formatTimeAgo } from '../utils/date';
import { extractDomain, getPostTypeColor, getPostTypeIcon } from '../utils/helpers';
import { useAuth } from '../contexts/AuthContext';



const PostCard = ({ post, showFullContent = false, userInterests = [] }) => {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [isLiked, setIsLiked] = useState(post?.likedByUser || false);
  const [likesCount, setLikesCount] = useState(post?.likes || 0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const queryClient = useQueryClient();

  if (!post || !post._id || !post.userId) {
    return null;
  }

  const isRecommended = userInterests.length > 0 && post.tags && 
    post.tags.some(tag => userInterests.includes(tag));

  const authorId = post?.userId?._id;
  const isProfilePage = pathname.startsWith('/app/profile');
  const isOwnPost = user?._id && authorId && user._id === authorId;
  const canManagePost = isProfilePage && isOwnPost;

  const likeMutation = useMutation({
    mutationFn: () => postAPI.likePost(post._id),
    onMutate: () => {
      setIsLiked(!isLiked);
      setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
    },
    onError: () => {
      setIsLiked(isLiked);
      setLikesCount(likesCount);
    },
    onSuccess: (data) => {
      setIsLiked(Boolean(data?.likedByUser));
      setLikesCount(Number(data?.likes ?? likesCount));
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', post._id] });
    },
  });

  const shareMutation = useMutation({
    mutationFn: () => postAPI.sharePost(post._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', post._id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => postAPI.deletePost(post._id),
    onSuccess: () => {
      setIsMenuOpen(false);
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['posts', 'user', authorId] });
      queryClient.invalidateQueries({ queryKey: ['profile', authorId] });
    },
  });

  useEffect(() => {
    setIsLiked(post?.likedByUser || false);
    setLikesCount(post?.likes || 0);
  }, [post?.likedByUser, post?.likes]);

  const handleDeletePost = () => {
    const shouldDelete = window.confirm('Delete this post? This action cannot be undone.');
    if (!shouldDelete) return;
    deleteMutation.mutate();
  };

  const formattedContent = post.content;;
  const formattedTldr = post.tldr.replace(/(^|\n)\s*•\s+/g, '$1- ').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();;

  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      {}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Link to={`/app/profile/${post.userId._id}`}>
            <Avatar src={null} alt={post.userId.username} />
          </Link>
          <div>
            <Link to={`/app/profile/${post.userId._id}`} className="font-semibold text-gray-900 hover:underline">
              {post.userId.username}
            </Link>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>{formatTimeAgo(post.createdAt)}</span>
              {post.blogUrl && (
                <>
                  <span>•</span>
                  <a
                    href={post.blogUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary-600 flex items-center space-x-1"
                  >
                    <span>{extractDomain(post.blogUrl)}</span>
                    <ExternalLink size={12} />
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
        {canManagePost && (
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="p-2 hover:bg-gray-100 rounded-lg"
              aria-label="Post options"
              disabled={deleteMutation.isLoading}
            >
              <MoreHorizontal size={20} className="text-gray-500" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-11 z-10 w-40 rounded-lg border border-gray-200 bg-white shadow-lg p-1">
                <button
                  onClick={handleDeletePost}
                  className="w-full text-left px-3 py-2 text-sm rounded-md text-red-600 hover:bg-red-50"
                  disabled={deleteMutation.isLoading}
                >
                  {deleteMutation.isLoading ? 'Deleting...' : 'Delete post'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {}
      <div className="mb-3 flex items-center gap-2">
        <Badge variant="info" className={getPostTypeColor(post.type)}>
          {getPostTypeIcon(post.type)} {post.type.toUpperCase()}
        </Badge>
        {isRecommended && (
          <Badge variant="success" className="bg-green-100 text-green-800">
            <Sparkles size={12} className="mr-1" />
            Recommended for you
          </Badge>
        )}
      </div>

      {}
      <Link to={`/app/post/${post._id}`}>
        <h2 className="text-xl font-bold text-gray-900 mb-3 hover:text-primary-600 cursor-pointer">
          {post.title}
        </h2>
      </Link>

      {}
      <div className="prose prose-sm max-w-none mb-4">
        {showFullContent ? (
          <ReactMarkdown
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={vscDarkPlus}
                    language={match[1]}
                    PreTag="div"
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {formattedContent}
          </ReactMarkdown>
        ) : (
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="text-gray-700 mb-2">{children}</p>,
              ul: ({ children }) => <ul className="list-disc pl-5 text-gray-700 space-y-1">{children}</ul>,
              li: ({ children }) => <li>{children}</li>,
            }}
          >
            {formattedTldr}
          </ReactMarkdown>
        )}
      </div>

      {}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.slice(0, 5).map((tag) => (
            <Link
              key={tag}
              to={`/app/search?tags=${tag}`}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              #{tag}
            </Link>
          ))}
        </div>
      )}

      {}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-6">
          <button
            onClick={() => likeMutation.mutate()}
            className={`flex items-center space-x-2 ${
              isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
            }`}
          >
            <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
            <span className="text-sm font-medium">{likesCount}</span>
          </button>

          <Link
            to={`/app/post/${post._id}`}
            className="flex items-center space-x-2 text-gray-500 hover:text-primary-600"
          >
            <MessageCircle size={20} />
            <span className="text-sm font-medium">{post.commentsCount || 0}</span>
          </Link>

          <button
            onClick={() => shareMutation.mutate()}
            className="flex items-center space-x-2 text-gray-500 hover:text-green-600"
          >
            <Share2 size={20} />
            <span className="text-sm font-medium">{post.shares || 0}</span>
          </button>
        </div>
      </div>
    </Card>
  );
};

export default PostCard;
