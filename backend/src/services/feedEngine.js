function getLikesCount(post = {}) {
  if (Array.isArray(post.likes)) {
    return post.likes.length;
  }

  return Number(post.likes || 0);
}

function getCommentsCount(post = {}) {
  if (Array.isArray(post.comments)) {
    return post.comments.length;
  }

  if (Number.isFinite(post.commentsCount)) {
    return Number(post.commentsCount);
  }

  return Number(post.commentCount || 0);
}

function normalizeText(value = '') {
  return String(value || '').toLowerCase();
}

function calculateRelevance(post = {}, user = {}) {
  const interests = Array.isArray(user.interests) ? user.interests : [];
  if (interests.length === 0) {
    return 0;
  }

  const title = normalizeText(post.title);
  const content = normalizeText(post.content);
  const tags = Array.isArray(post.tags) ? post.tags.map(normalizeText) : [];

  return interests.reduce((score, interestValue) => {
    const interest = normalizeText(interestValue).trim();
    if (!interest) {
      return score;
    }

    let nextScore = score;

    if (title.includes(interest)) {
      nextScore += 12;
    }
    if (content.includes(interest)) {
      nextScore += 6;
    }
    if (tags.some((tag) => tag.includes(interest) || interest.includes(tag))) {
      nextScore += 18;
    }

    return nextScore;
  }, 0);
}

function calculateScore(post, user) {
  const likesCount = getLikesCount(post);
  const commentsCount = getCommentsCount(post);
  const engagementScore = likesCount + (commentsCount * 2);

  const createdAt = new Date(post.createdAt || Date.now());
  const hours = (Date.now() - createdAt.getTime()) / 3600000;
  const recencyScore = 100 / (1 + (Math.max(hours, 0) * 0.5));

  const relevanceScore = calculateRelevance(post, user);
  const trendBoost = post.isTrending ? 30 : 0;

  return Number((engagementScore + recencyScore + relevanceScore + trendBoost).toFixed(4));
}

function applyDiversityFilter(scoredPosts, limit = 20) {
  const tagUsage = new Map();
  const selected = [];
  const deferred = [];

  for (const scoredPost of scoredPosts) {
    const tags = Array.isArray(scoredPost.tags)
      ? scoredPost.tags.map(normalizeText).filter(Boolean)
      : [];

    const repeatedTag = tags.find((tag) => (tagUsage.get(tag) || 0) >= 2);

    if (repeatedTag && selected.length < limit) {
      deferred.push(scoredPost);
      continue;
    }

    selected.push(scoredPost);
    tags.forEach((tag) => {
      tagUsage.set(tag, (tagUsage.get(tag) || 0) + 1);
    });

    if (selected.length >= limit) {
      return selected;
    }
  }

  for (const scoredPost of deferred) {
    if (selected.length >= limit) {
      break;
    }
    selected.push(scoredPost);
  }

  return selected;
}

function generateFeed(posts = [], user = {}, limit = 20) {
  const scoredPosts = posts
    .map((post) => ({
      ...post,
      feedScore: calculateScore(post, user),
    }))
    .sort((left, right) => right.feedScore - left.feedScore);

  return applyDiversityFilter(scoredPosts, limit).slice(0, limit);
}

module.exports = {
  calculateScore,
  generateFeed,
};
