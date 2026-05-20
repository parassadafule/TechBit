import { useMutation, useQuery } from '@tanstack/react-query';
import { TrendingUp, Github, Code, RefreshCw, Flame, MessageSquare, Newspaper } from 'lucide-react';
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
    <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center flex-wrap">
            <TrendingUp
              size={28}
              className="mr-3 text-primary-600 flex-shrink-0"
            />
            Trending Now
          </h1>

          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Latest developer trends across platforms
          </p>
        </div>

        <Button
          onClick={handleRefresh}
          loading={isManualRefresh && fetchLatestMutation.isPending}
          variant="outline"
          className="w-full sm:w-auto"
        >
          <RefreshCw size={18} className="mr-2" />
          Refresh
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {sourceFilters.map((entry) => {
          const Icon = entry.icon;
          const active = source === entry.value;

          return (
            <button
              key={entry.value || 'all'}
              onClick={() => setSource(entry.value)}
              className={`
                px-3 py-2 rounded-lg text-sm border flex items-center gap-2
                transition-all duration-200
                ${
                  active
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-gray-200 text-gray-600 hover:border-primary-300'
                }
              `}
            >
              <Icon size={14} />
              <span className="whitespace-nowrap">
                {entry.label}
              </span>
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : filteredTrends.length === 0 ? (
        <Card className="p-6 sm:p-12 text-center">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
            No Trends Available
          </h3>

          <p className="text-gray-600 text-sm sm:text-base">
            Try another filter or refresh trends
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {sourceSections.map(
            ({ key, title, icon: Icon, badgeVariant }) => {
              const trends = getTrendsBySource(key);

              if (trends.length === 0) return null;

              return (
                <Card key={key} className="p-4 sm:p-6">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <Icon
                      size={24}
                      className="text-gray-900 flex-shrink-0"
                    />

                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
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
                        className="
                          flex flex-col sm:flex-row
                          items-start
                          gap-3 sm:gap-4
                          pb-4
                          border-b border-gray-100
                          last:border-0
                        "
                      >
                        <div className="w-auto sm:w-8 text-left sm:text-center flex-shrink-0">
                          <span className="text-lg font-bold text-gray-400">
                            #{index + 1}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0 w-full">
                          <a
                            href={trend.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="
                              font-semibold text-gray-900
                              hover:text-primary-600
                              block
                              break-words
                              text-sm sm:text-base
                            "
                          >
                            {trend.topic}
                          </a>

                          {trend.description && (
                            <p
                              className="
                                text-sm text-gray-600
                                mb-2 mt-1
                                break-words
                                leading-relaxed
                              "
                            >
                              {trend.description}
                            </p>
                          )}

                          <div
                            className="
                              flex flex-wrap
                              items-center
                              gap-x-4 gap-y-1
                              text-xs sm:text-sm
                              text-gray-500
                            "
                          >
                            <span>
                              Score:{' '}
                              {trend.finalScore?.toLocaleString() || 0}
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
            }
          )}
        </div>
      )}
    </div>
  );
};

export default Trends;