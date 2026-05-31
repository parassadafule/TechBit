const axios = require('axios');
const logger = require('../utils/logger');

const STACKOVERFLOW_TRENDS_URL = 'https://api.stackexchange.com/2.3/questions';
const REDDIT_SUBREDDITS = ['programming', 'developer', 'technology'];
const HACKERNEWS_TOP_STORIES_URL = 'https://hacker-news.firebaseio.com/v0/topstories.json';
const HACKERNEWS_ITEM_URL = 'https://hacker-news.firebaseio.com/v0/item';
const DEVTO_TRENDS_URL = 'https://dev.to/api/articles';

const SOURCE_WEIGHTS = {
  github: 1.3,
  reddit: 1.2,
  devto: 1.2,
  stackoverflow: 1.1,
  hackernews: 1.15,
};

function normalizeText(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function calculateScore(trend) {
  const weight = SOURCE_WEIGHTS[trend.source] || 1;
  const createdAt = new Date(trend.createdAt || Date.now());
  const hours = (Date.now() - createdAt.getTime()) / 3600000;
  const weightedScore = Number(trend.score || 0) * weight;
  return weightedScore / (1 + hours * 0.1);
}

async function safeFetch(label, fetcher) {
  try {
    return await fetcher();
  } catch (error) {
    logger.error(`Trend engine source failed: ${label}`, { message: error.message });
    return [];
  }
}

function buildTrend({
  topic,
  source,
  score,
  description,
  url,
  createdAt,
  data = {},
}) {
  const normalizedTopic = normalizeText(topic);

  return {
    topic: String(topic || '').trim(),
    normalizedTopic,
    source,
    score: Number(score || 0),
    description: String(description || '').trim(),
    url: String(url || '').trim(),
    createdAt: new Date(createdAt || Date.now()),
    data,
  };
}

async function fetchGitHubTrends() {
  try {
    const response = await axios.get(
      'https://api.github.com/search/repositories',
      {
        params: {
          q: 'created:>2026-05-01',
          sort: 'stars',
          order: 'desc',
          per_page: 30,
        },
        headers: {
          Accept: 'application/vnd.github+json',
          ...(process.env.GITHUB_TOKEN && {
            Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          }),
        },
        timeout: 10000,
      }
    );

    const repos = response.data?.items || [];
    const now = new Date();

    return repos.map((repo) =>
      buildTrend({
        topic: repo.full_name,
        source: 'github',
        score: repo.stargazers_count || 0,
        description: repo.description || 'No description available',
        url: repo.html_url,
        createdAt: now,
        data: {
          owner: repo.owner?.login || null,
          language: repo.language || null,
          repoName: repo.full_name,
          forks: repo.forks_count || 0,
          stars: repo.stargazers_count || 0,
          watchers: repo.watchers_count || 0,
        },
      })
    );
  } catch (error) {
    console.error('GitHub Trends Fetch Error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });

    return [];
  }
}

async function fetchStackOverflowTrends() {
  const response = await axios.get(STACKOVERFLOW_TRENDS_URL, {
    params: {
      order: 'desc',
      sort: 'hot',
      site: 'stackoverflow',
      pagesize: 30,
      key: process.env.STACKEXCHANGE_KEY,
    },
    timeout: 10000,
  });

  const items = response.data?.items || [];

  return items.map((item) => buildTrend({
    topic: item.title,
    source: 'stackoverflow',
    score: (item.score || 0) + (item.answer_count || 0) + (item.view_count || 0) / 100,
    url: item.link,
    createdAt: item.creation_date ? item.creation_date * 1000 : Date.now(),
    data: {
      answerCount: item.answer_count || 0,
      viewCount: item.view_count || 0,
      tags: item.tags || [],
      questionId: item.question_id || null,
    },
  }));
}

async function fetchRedditTrendsForSubreddit(subreddit) {
  const response = await axios.get(`https://www.reddit.com/r/${subreddit}/hot.json`, {
    params: { limit: 30 },
    timeout: 10000,
    headers: {
      'User-Agent': 'TechBitTrendEngine/1.0',
    },
  });

  const posts = response.data?.data?.children || [];

  return posts.map(({ data }) => buildTrend({
    topic: data?.title,
    source: 'reddit',
    score: (data?.ups || 0) + (data?.num_comments || 0),
    description: data?.selftext || data?.title || '',
    url: data?.url_overridden_by_dest || `https://www.reddit.com${data?.permalink || ''}`,
    createdAt: data?.created_utc ? data.created_utc * 1000 : Date.now(),
    data: {
      subreddit,
      upvotes: data?.ups || 0,
      comments: data?.num_comments || 0,
      permalink: data?.permalink || null,
    },
  }));
}

async function fetchRedditTrends() {
  const groups = await Promise.all(
    REDDIT_SUBREDDITS.map((subreddit) => safeFetch(`reddit:${subreddit}`, () => fetchRedditTrendsForSubreddit(subreddit))),
  );

  return groups.flat().filter(Boolean);
}

async function fetchHackerNewsTrends() {
  const response = await axios.get(HACKERNEWS_TOP_STORIES_URL, {
    timeout: 2000,
  });

  const storyIds = Array.isArray(response.data) ? response.data.slice(0, 30) : [];

  const stories = await Promise.all(
    storyIds.map((id) => safeFetch(`hackernews:item:${id}`, async () => {
      const storyResponse = await axios.get(`${HACKERNEWS_ITEM_URL}/${id}.json`, {
        timeout: 1000,
      });
      return storyResponse.data;
    })),
  );

  return stories
    .filter((story) => story && story.title && (story.type === 'story' || !story.type))
    .map((story) => buildTrend({
      topic: story.title,
      source: 'hackernews',
      score: (story.score || 0) + (story.descendants || 0),
      description: story.description,
      url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
      createdAt: story.time ? story.time * 1000 : Date.now(),
      data: {
        storyId: story.id,
        comments: story.descendants || 0,
        author: story.by || null,
      },
    }));
}

async function fetchDevToTrends() {
  const response = await axios.get(DEVTO_TRENDS_URL, {
    params: { per_page: 30 },
    timeout: 10000,
  });

  const articles = Array.isArray(response.data) ? response.data : [];

  return articles.map((article) => buildTrend({
    topic: article.title,
    source: 'devto',
    score: (article.positive_reactions_count || 0) + (article.comments_count || 0),
    description: article.description || '',
    url: article.url,
    createdAt: article.published_at ? new Date(article.published_at) : Date.now(),
    data: { author: article.user?.username || null },
  }));
}

function mergeTrend(existingTrend, incomingTrend) {
  const existingWeighted = calculateScore(existingTrend);
  const incomingWeighted = calculateScore(incomingTrend);
  const primaryTrend = incomingWeighted > existingWeighted ? incomingTrend : existingTrend;

  const mergedScore = Number(existingTrend.score || 0) + Number(incomingTrend.score || 0);
  const mergedCreatedAt = new Date(
    Math.max(
      new Date(existingTrend.createdAt || 0).getTime(),
      new Date(incomingTrend.createdAt || 0).getTime(),
    ),
  );

  return {
    ...primaryTrend,
    score: mergedScore,
    createdAt: mergedCreatedAt,
    description: primaryTrend.description || existingTrend.description || incomingTrend.description,
    url: primaryTrend.url || existingTrend.url || incomingTrend.url,
    data: {
      ...(primaryTrend.data || {}),
      mergedSources: Array.from(new Set([
        ...(existingTrend.data?.mergedSources || [existingTrend.source]),
        ...(incomingTrend.data?.mergedSources || [incomingTrend.source]),
      ])),
      scoreBreakdown: [
        ...(existingTrend.data?.scoreBreakdown || [{ source: existingTrend.source, score: existingTrend.score }]),
        ...(incomingTrend.data?.scoreBreakdown || [{ source: incomingTrend.source, score: incomingTrend.score }]),
      ],
    },
  };
}

function deduplicateTrends(trends = []) {
  const trendMap = new Map();

  trends.forEach((trend) => {
    if (!trend.topic || !trend.normalizedTopic) {
      return;
    }

    const existingTrend = trendMap.get(trend.normalizedTopic);
    if (!existingTrend) {
      trendMap.set(trend.normalizedTopic, {
        ...trend,
        data: {
          ...(trend.data || {}),
          mergedSources: [trend.source],
          scoreBreakdown: [{ source: trend.source, score: trend.score }],
        },
      });
      return;
    }

    trendMap.set(trend.normalizedTopic, mergeTrend(existingTrend, trend));
  });

  return Array.from(trendMap.values());
}

async function fetchAllTrends() {
  const [githubTrends, stackOverflowTrends, redditTrends, hackerNewsTrends, devToTrends] = await Promise.all([
    safeFetch('github', fetchGitHubTrends),
    safeFetch('stackoverflow', fetchStackOverflowTrends),
    safeFetch('reddit', fetchRedditTrends),
    safeFetch('hackernews', fetchHackerNewsTrends),
    safeFetch('devto', fetchDevToTrends),
  ]);

  const deduplicatedTrends = deduplicateTrends([
    ...githubTrends,
    ...stackOverflowTrends,
    ...redditTrends,
    ...hackerNewsTrends,
    ...devToTrends,
  ]);

  return deduplicatedTrends
    .map((trend) => ({
      ...trend,
      finalScore: calculateScore(trend),
    }))
    .sort((left, right) => right.finalScore - left.finalScore);
}

module.exports = {
  fetchAllTrends,
  normalizeText,
  calculateScore,
};
