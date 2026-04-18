import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import Modal from './ui/Modal';
import Input from './ui/Input';
import TextArea from './ui/TextArea';
import Button from './ui/Button';
import { postAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';

const CreatePostModal = ({ isOpen, onClose, initialType = 'blog' }) => {
  const { isAuthenticated } = useAuth();
  const [step, setStep] = useState(1); // 1: Choose method, 2: Manual/URL form
  const [method, setMethod] = useState(null); // 'manual' or 'url'
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: '',
    type: initialType,
    sourceUrl: '',
  });
  const [url, setUrl] = useState('');
  const [urlType, setUrlType] = useState('blog');

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => postAPI.createPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['posts']);
      handleClose();
    },
  });

  const uploadMutation = useMutation({
    mutationFn: ({ url, type }) => postAPI.uploadPost(url, type),
    onSuccess: () => {
      queryClient.invalidateQueries(['posts']);
      handleClose();
    },
  });

  const isSubmitting = createMutation.isPending || uploadMutation.isPending;

  const handleClose = () => {
    if (isSubmitting) return;

    setStep(1);
    setMethod(null);
    setFormData({
      title: '',
      content: '',
      tags: '',
      type: initialType,
      sourceUrl: '',
    });
    setUrl('');
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      setFormData((prev) => ({
        ...prev,
        type: initialType,
      }));
    }
  }, [initialType, isOpen]);

  const handleMethodSelect = (selectedMethod) => {
    setMethod(selectedMethod);
    setStep(2);
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();

    const postData = {
      ...formData,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
    };
    await createMutation.mutateAsync(postData);
  };

  const handleUrlSubmit = (e) => {
    e.preventDefault();
    uploadMutation.mutate({ url, type: urlType });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Post"
      size="lg"
      disableClose={isSubmitting}
    >
      {!isAuthenticated ? (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🔒</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h3>
          <p className="text-gray-600 mb-6">You need to be logged in to create posts.</p>
          <Button onClick={() => window.location.href = '/login'}>
            Go to Login
          </Button>
        </div>
      ) : step === 1 && (
        <div className="space-y-4">
          <p className="text-gray-600 mb-6">How would you like to create your post?</p>
          
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => handleMethodSelect('manual')}
              disabled={isSubmitting}
              className="p-6 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
            >
              <div className="text-4xl mb-3">📝</div>
              <h3 className="font-semibold text-lg mb-2">Manual Entry</h3>
              <p className="text-sm text-gray-600">Write your content manually</p>
            </button>

            <button
              type="button"
              onClick={() => handleMethodSelect('url')}
              disabled={isSubmitting}
              className="p-6 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
            >
              <div className="text-4xl mb-3">🔗</div>
              <h3 className="font-semibold text-lg mb-2">From URL</h3>
              <p className="text-sm text-gray-600">Import from a link (blog, repo, video, podcast)</p>
            </button>
          </div>
        </div>
      )}

      {step === 2 && method === 'manual' && (
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <Input
            label="Title"
            placeholder="Enter post title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            disabled={isSubmitting}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              disabled={isSubmitting}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="blog">Blog Post</option>
              <option value="repo">Repository</option>
              <option value="video">Video</option>
              <option value="podcast">Podcast</option>
            </select>
          </div>

          <TextArea
            label="Content (Markdown supported)"
            placeholder="Write your content..."
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            disabled={isSubmitting}
            rows={8}
            required
          />

          <Input
            label="Tags (comma-separated)"
            placeholder="react, javascript, web-dev"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            disabled={isSubmitting}
          />

          <Input
            label="Source URL (optional)"
            placeholder="https://example.com"
            value={formData.sourceUrl}
            onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
            disabled={isSubmitting}
          />

          {createMutation.isPending && (
            <p className="text-sm text-blue-700">Saving post to database...</p>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="ghost" onClick={() => setStep(1)} disabled={isSubmitting}>
              Back
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              Create Post
            </Button>
          </div>
        </form>
      )}

      {step === 2 && method === 'url' && (
        <form onSubmit={handleUrlSubmit} className="space-y-4">
          <Input
            label="Content URL"
            placeholder="https://example.com/article"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isSubmitting}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content Type</label>
            <select
              value={urlType}
              onChange={(e) => setUrlType(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="blog">Blog Post</option>
              <option value="repo">GitHub Repository</option>
              <option value="video">YouTube Video</option>
              <option value="podcast">Podcast</option>
            </select>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              {uploadMutation.isPending ? (
                <span className="flex items-center">
                  <Loader2 className="animate-spin mr-2" size={16} />
                  Fetching and processing content with AI...
                </span>
              ) : (
                'We\'ll automatically fetch the content and generate a TLDR using AI.'
              )}
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="ghost" onClick={() => setStep(1)} disabled={isSubmitting}>
              Back
            </Button>
            <Button type="submit" loading={uploadMutation.isPending}>
              Import & Create
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default CreatePostModal;
