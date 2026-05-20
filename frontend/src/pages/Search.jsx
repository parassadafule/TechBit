import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search as SearchIcon, Sparkles } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { searchAPI } from '../api';
import PostCard from '../components/PostCard';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';

const Search = () => {
  const [query, setQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [semantic, setSemantic] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const nextQuery = params.get('q') || '';
    const nextTags = params
      .get('tags')
      ?.split(',')
      .map((tag) => tag.trim())
      .filter(Boolean) || [];
    const nextType = params.get('type') || '';
    const nextSemantic = params.get('semantic') === 'true';

    setQuery(nextQuery);
    setSearchQuery(nextQuery);
    setSelectedTags(nextTags);
    setSelectedType(nextType);
    setSemantic(nextSemantic);
  }, [location.search]);

  const { data, isLoading } = useQuery({
    queryKey: ['search', searchQuery, selectedTags, selectedType, semantic],
    queryFn: () =>
      searchAPI.search({
        q: searchQuery,
        tags: selectedTags.join(','),
        type: selectedType,
        semantic,
      }),
    enabled: true,
  });

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchQuery(query);
  };

  const contentTypes = [
    { value: '', label: 'All' },
    { value: 'blog', label: 'Blogs' },
    { value: 'repo', label: 'Repositories' },
    { value: 'video', label: 'Videos' },
    { value: 'podcast', label: 'Podcasts' },
  ];

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="space-y-6">
      {}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Search</h1>
        <p className="text-gray-600">Find content across blogs, repos, videos, and podcasts</p>
      </div>

      {}
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search for topics, technologies, tutorials..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Button type="submit">
            <SearchIcon size={20} className="mr-2" />
            Search
          </Button>
        </div>

        {}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setSemantic(!semantic)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-colors ${
              semantic
                ? 'border-purple-500 bg-purple-50 text-purple-700'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Sparkles size={18} />
            <span className="font-medium">AI Semantic Search</span>
          </button>
          {semantic && (
            <p className="text-sm text-gray-600">
              Search by meaning, not just keywords
            </p>
          )}
        </div>
      </form>

      {}
      <div className="space-y-4">
        {}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Content Type</h3>
          <div className="flex flex-wrap gap-2">
            {contentTypes.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setSelectedType(value)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedType === value
                    ? 'bg-primary-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {}
        {(selectedTags.length > 0 || selectedType) && (
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Active filters:</span>
            {selectedTags.map((tag) => (
              <Badge key={tag} variant="primary">
                {tag}
                <button
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className="ml-2 hover:text-primary-900"
                >
                  x
                </button>
              </Badge>
            ))}
            {selectedType && (
              <Badge variant="info">
                {contentTypes.find(t => t.value === selectedType)?.label}
                <button
                  type="button"
                  onClick={() => setSelectedType('')}
                  className="ml-2 hover:text-blue-900"
                >
                  x
                </button>
              </Badge>
            )}
          </div>
        )}
      </div>

      {}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : data?.results?.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No results found</h3>
          <p className="text-gray-600">Try different keywords or filters</p>
        </div>
      ) : data?.results ? (
        <div className="space-y-6">
          <p className="text-gray-600">
            Found {data.results.length} result{data.results.length !== 1 ? 's' : ''}
          </p>
          {data.results.map((post) => (
            <PostCard key={post._id} post={post} />
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default Search;
