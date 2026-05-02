function toPlainPost(post) {
  if (!post) {
    return null;
  }

  if (typeof post.toObject === 'function') {
    return post.toObject({ virtuals: true });
  }

  return { ...post };
}

function normalizeId(value) {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value.toString === 'function') {
    return value.toString();
  }

  return null;
}

function serializePost(post, currentUserId = null) {
  const plainPost = toPlainPost(post);
  if (!plainPost) {
    return null;
  }

  const likedBy = Array.isArray(plainPost.likedBy) ? plainPost.likedBy : [];
  const normalizedCurrentUserId = normalizeId(currentUserId);
  const likedByUser = normalizedCurrentUserId
    ? likedBy.some((userId) => normalizeId(userId) === normalizedCurrentUserId)
    : false;

  plainPost.likes = Math.max(Number(plainPost.likes) || 0, likedBy.length);
  plainPost.likedByUser = likedByUser;

  delete plainPost.likedBy;
  delete plainPost.embedding;

  return plainPost;
}

function serializePosts(posts = [], currentUserId = null) {
  return posts
    .map((post) => serializePost(post, currentUserId))
    .filter(Boolean);
}

module.exports = {
  serializePost,
  serializePosts,
};
