import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, ExternalLink, Sparkles } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Card from './ui/Card';
import Avatar from './ui/Avatar';
import Badge from './ui/Badge';
import { postAPI, userAPI } from '../api';
import { formatTimeAgo } from '../utils/date';
import { extractDomain, getPostTypeColor, getPostTypeIcon } from '../utils/helpers';
import { useAuth } from '../contexts/AuthContext';

const normalizeGeneratedMarkdown = (text = '', { isTldr = false } = {}) => {
  const value = String(text || '').trim();
  if (!value) return '';

  let normalized = value
    .replace(/\r/g, '')
    .replace(/📋\s*Overview/gi, '### Overview')
    .replace(/🔑\s*Key\s*Takeaways/gi, '### Key Takeaways')
    .replace(/🛠\s*Practical\s*Application/gi, '### Practical Application')
    .replace(/💡\s*Why\s*It\s*Matters/gi, '### Why It Matters')
    .replace(/📚\s*Next\s*Steps/gi, '### Next Steps')
    .replace(/^Overview\s*$/gim, '### Overview')
    .replace(/^Key\s*Takeaways\s*$/gim, '### Key Takeaways')
    .replace(/^Practical\s*Application\s*$/gim, '### Practical Application')
    .replace(/^Why\s*It\s*Matters\s*$/gim, '### Why It Matters')
    .replace(/^Next\s*Steps\s*$/gim, '### Next Steps')
    .replace(/(^|\n)•\s+/g, '$1- ')
    .replace(/\n{3,}/g, '\n\n');

  if (isTldr) {
    normalized = normalized
      .replace(/\s+-\s+/g, '\n- ')
      .replace(/\n{2,}/g, '\n');
  }

  return normalized.trim();
};

const PostCard = ({ post, showFullContent = false, userInterests = [] }) => {
  const { user, setUser, checkAuth } = useAuth();
  const [isLiked, setIsLiked] = useState(post?.likedByUser || false);
  const [likesCount, setLikesCount] = useState(post?.likes || 0);
  const [isBookmarked, setIsBookmarked] = useState(
    Array.isArray(user?.bookmarks)
      && user.bookmarks.some((bookmarkId) => String(bookmarkId) === String(post?._id))
  );
  const queryClient = useQueryClient();

  useEffect(() => {
    setIsBookmarked(
      Array.isArray(user?.bookmarks)
      && user.bookmarks.some((bookmarkId) => String(bookmarkId) === String(post?._id))
    );
  }, [user?.bookmarks, post?._id]);

  if (!post || !post._id || !post.userId) {
    return null;
  }

  const isRecommended = userInterests.length > 0 && post.tags && 
    post.tags.some(tag => userInterests.includes(tag));

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
    onSuccess: () => {
      queryClient.invalidateQueries(['posts']);
    },
  });

  const shareMutation = useMutation({
    mutationFn: () => postAPI.sharePost(post._id),
    onSuccess: () => {
      queryClient.invalidateQueries(['posts']);
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: () => userAPI.toggleBookmark(post._id),
    onMutate: () => {
      setIsBookmarked((prev) => !prev);
    },
    onError: () => {
      setIsBookmarked((prev) => !prev);
    },
    onSuccess: async (result) => {
      if (user) {
        setUser({
          ...user,
          bookmarks: result.bookmarks || [],
        });
      } else {
        await checkAuth();
      }
      queryClient.invalidateQueries(['bookmarks']);
    },
  });

  const formattedContent = normalizeGeneratedMarkdown(post.content);
  const formattedTldr = normalizeGeneratedMarkdown(post.tldr, { isTldr: true });

  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      {}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Link to={`/profile/${post.userId._id}`}>
            <Avatar src={null} alt={post.userId.username} />
          </Link>
          <div>
            <Link to={`/profile/${post.userId._id}`} className="font-semibold text-gray-900 hover:underline">
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
        <button className="p-2 hover:bg-gray-100 rounded-lg">
          <MoreHorizontal size={20} className="text-gray-500" />
        </button>
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
      <Link to={`/post/${post._id}`}>
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
              to={`/search?tags=${tag}`}
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
            to={`/post/${post._id}`}
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

        <button
          onClick={() => bookmarkMutation.mutate()}
          className={`p-2 hover:bg-gray-50 rounded-lg ${
            isBookmarked ? 'text-primary-600' : 'text-gray-500 hover:text-primary-600'
          }`}
        >
          <Bookmark size={20} />
        </button>
      </div>
    </Card>
  );
};

export default PostCard;
