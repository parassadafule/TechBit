import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MoreHorizontal, Trash2, Edit2 } from 'lucide-react';
import Avatar from './ui/Avatar';
import Button from './ui/Button';
import TextArea from './ui/TextArea';
import { commentAPI } from '../api';
import { formatTimeAgo } from '../utils/date';
import { useAuth } from '../contexts/AuthContext';

const CommentThread = ({ postId, comments, isLoading }) => {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (text) => commentAPI.createComment(postId, text),
    onSuccess: () => {
      queryClient.invalidateQueries(['comments', postId]);
      setNewComment('');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ commentId, text }) => commentAPI.updateComment(commentId, text),
    onSuccess: () => {
      queryClient.invalidateQueries(['comments', postId]);
      setEditingId(null);
      setEditText('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId) => commentAPI.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries(['comments', postId]);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newComment.trim()) {
      createMutation.mutate(newComment);
    }
  };

  const handleEdit = (comment) => {
    setEditingId(comment._id);
    setEditText(comment.text);
  };

  const handleUpdate = (commentId) => {
    if (editText.trim()) {
      updateMutation.mutate({ commentId, text: editText });
    }
  };

  return (
    <div className="space-y-6">
      {}
      <form onSubmit={handleSubmit} className="space-y-3">
        <TextArea
          placeholder="Write a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={3}
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={!newComment.trim()}
            loading={createMutation.isPending}
          >
            Post Comment
          </Button>
        </div>
      </form>

      {}
      <div className="space-y-4">
        {isLoading ? (
          <p className="text-center text-gray-500">Loading comments...</p>
        ) : comments?.length === 0 ? (
          <p className="text-center text-gray-500">No comments yet. Be the first to comment!</p>
        ) : (
          comments?.map((comment) => (
            <div key={comment._id} className="flex space-x-3">
              <Avatar src={comment.userId?.avatarUrl} alt={comment.userId?.username} size="sm" />
              
              <div className="flex-1 bg-gray-50 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="font-semibold text-gray-900">{comment.userId?.username || 'Unknown user'}</span>
                    <span className="text-sm text-gray-500 ml-2">{formatTimeAgo(comment.createdAt)}</span>
                  </div>
                  
                  {user?._id === comment.userId?._id && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(comment)}
                        className="p-1 text-gray-500 hover:text-primary-600"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(comment._id)}
                        className="p-1 text-gray-500 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {editingId === comment._id ? (
                  <div className="space-y-2">
                    <TextArea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={2}
                    />
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleUpdate(comment._id)}
                        loading={updateMutation.isPending}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-700">{comment.text}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommentThread;
