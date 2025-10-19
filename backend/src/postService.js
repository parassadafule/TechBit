import Post from './models/Post.js';
import User from './models/User.js';

export async function createPost({ authorId, text, media = [], mediaType, tags = [] }) {
    const post = new Post({ author: authorId, text, media, mediaType, tags });
    await post.save();
    return post.toObject();
}

export async function listPosts({ limit = 20, offset = 0 } = {}) {
    const posts = await Post.find()
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .populate('author', 'name email picture');
    return posts.map(p => ({
        id: p._id,
        text: p.text,
        media: p.media,
        mediaType: p.mediaType,
        tags: p.tags,
        likes: p.likes,
        comments: p.comments,
        shares: p.shares,
        createdAt: p.createdAt,
        author: p.author
    }));
}

export async function toggleFollow(userId, targetUserId) {
    if (userId === targetUserId) throw new Error('cannot follow yourself');
    const user = await User.findById(userId);
    const target = await User.findById(targetUserId);
    if (!user || !target) throw new Error('user not found');

    const already = user.following.find(f => f.toString() === targetUserId.toString());
    if (already) {
        user.following = user.following.filter(f => f.toString() !== targetUserId.toString());
        target.followers = target.followers.filter(f => f.toString() !== userId.toString());
    } else {
        user.following.push(target._id);
        target.followers.push(user._id);
    }

    await user.save();
    await target.save();
    return { following: !already };
}
