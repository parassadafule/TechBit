import { useMutation, useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  Github,
  Code,
  RefreshCw,
  Flame,
  MessageSquare,
  Newspaper,
} from 'lucide-react';
import { trendAPI } from '../api';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import { formatTimeAgo } from '../utils/date';
import { useEffect, useRef, useState } from 'react';

const sourceSections = [
  { key: 'github', title: 'GitHub Trending', icon: Github, badgeVariant: 'info' },
  { key: 'stackoverflow', title: 'StackOverflow Trending', icon: Code, badgeVariant: 'warning' },
  { key: 'reddit', title: 'Reddit Trending', icon: MessageSquare, badgeVariant: 'default' },
  { key: 'devto', title: 'Dev.to Trending', icon: Newspaper, badgeVariant: 'info' },
  { key: 'hackernews', title: 'Hacker News Trending', icon: Flame, badgeVariant: 'warning' },
];

const sourceFilters = [
  { value: '', label: 'All Sources', icon: TrendingUp },
  { value: 'github', label: 'GitHub', icon: Github },
  { value: 'stackoverflow', label: 'StackOverflow', icon: Code },
  { value: 'reddit', label: 'Reddit', icon: MessageSquare },
  { value: 'devto', label: 'Dev.to', icon: Newspaper },
  { value: 'hackernews', label: 'Hacker News', icon: Flame },
];

function normalizeSourceKey(value = '') {
  const key = String(value || '').trim().toLowerCase();
  if (key === 'dev.to') return 'devto';
  if (key === 'stack overflow' || key === 'stack-overflow') return 'stackoverflow';
  if (key === 'hacker news' || key === 'hacker-news') return 'hackernews';
  return key;
}

function getTrendSources(trend) {
  const merged = trend?.data?.mergedSources;
  const fromMerged = Array.isArray(merged)
    ? merged.map((entry) => normalizeSourceKey(entry)).filter(Boolean)
    : [];

  if (fromMerged.length > 0) {
    return Array.from(new Set(fromMerged));
  }

  const fallback = normalizeSourceKey(trend?.source);
  return fallback ? [fallback] : [];
}

const Trends = () => {
  const [source, setSource] = useState('');
  const [isManualRefresh, setIsManualRefresh] = useState(false);
  const initialized = useRef(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['trends', source],
    queryFn: () => {
      if (source) {
        return trendAPI.getTrends({ source, limit: 100 });
      }

      return trendAPI.getTrends({ limit: 200 });
    },
  });

  const fetchLatestMutation = useMutation({
    mutationFn: () => trendAPI.fetchLatest(),
    onSettled: () => {
      setIsManualRefresh(false);
      refetch();
    },
  });

  const handleRefresh = () => {
    setIsManualRefresh(true);
    fetchLatestMutation.mutate();
  };

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    fetchLatestMutation.mutate();
  }, []);

  const allTrends = data?.trends || [];

  const filteredTrends = source
    ? allTrends.filter((trend) => getTrendSources(trend).includes(normalizeSourceKey(source)))
    : allTrends;

  const getTrendsBySource = (sourceKey) => {
    const normalizedKey = normalizeSourceKey(sourceKey);
    return filteredTrends
      .filter((trend) => getTrendSources(trend).includes(normalizedKey))
      .sort(
        (a, b) =>
          new Date(b.fetchedAt || b.createdAt) -
          new Date(a.fetchedAt || a.createdAt)
      );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <TrendingUp size={28} className="mr-3 text-primary-600" />
            Trending Now
          </h1>
          <p className="text-gray-600 mt-1">
            Latest developer trends across platforms
          </p>
        </div>

        <Button
          onClick={handleRefresh}
          loading={isManualRefresh && fetchLatestMutation.isPending}
          variant="outline"
        >
          <RefreshCw size={18} className="mr-2" />
          Refresh
        </Button>
      </div>

      {}
      <div className="flex flex-wrap gap-2">
        {sourceFilters.map((entry) => {
          const Icon = entry.icon;
          const active = source === entry.value;

          return (
            <button
              key={entry.value || 'all'}
              onClick={() => setSource(entry.value)}
              className={`px-3 py-2 rounded-lg text-sm border flex items-center gap-2 ${
                active
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
                  : 'border-gray-200 text-gray-600 hover:border-primary-300'
              }`}
            >
              <Icon size={14} />
              {entry.label}
            </button>
          );
        })}
      </div>

      {}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : filteredTrends.length === 0 ? (
        <Card className="p-12 text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Trends Available
          </h3>
          <p className="text-gray-600">
            Try another filter or refresh trends
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {sourceSections.map(({ key, title, icon: Icon, badgeVariant }) => {
            const trends = getTrendsBySource(key);

            if (trends.length === 0) return null;

            return (
              <Card key={key} className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Icon size={24} className="text-gray-900" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    {title}
                  </h2>
                  <Badge variant={badgeVariant}>
                    {trends.length}
                  </Badge>
                </div>

                <div className="space-y-4">
                  {trends.map((trend, index) => (
                    <div
                      key={trend._id || `${trend.source}-${trend.topic}`}
                      className="flex items-start space-x-4 pb-4 border-b border-gray-100 last:border-0"
                    >
                      <div className="w-8 text-center">
                        <span className="text-lg font-bold text-gray-400">
                          #{index + 1}
                        </span>
                      </div>

                      <div className="flex-1">
                        <a
                          href={trend.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-gray-900 hover:text-primary-600 block"
                        >
                          {trend.topic}
                        </a>

                        {trend.description && (
                          <p className="text-sm text-gray-600 mb-2">
                            {trend.description}
                          </p>
                        )}

                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>
                            Score: {trend.finalScore?.toLocaleString() || 0}
                          </span>
                          <span>
                            {formatTimeAgo(
                              trend.fetchedAt || trend.createdAt
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Trends;