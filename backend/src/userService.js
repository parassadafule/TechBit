import User from './models/User.js';

export async function findUserByAuth0Id(auth0Id) {
    return User.findOne({ auth0Id }).lean();
}

export async function createOrUpdateUserFromAuth0(profile) {
    const { sub: auth0Id, email, name, picture } = profile || {};
    if (!auth0Id) throw new Error('Invalid profile: missing sub/auth0 id');

    const existing = await User.findOne({ auth0Id });
    if (existing) {
        existing.email = email || existing.email;
        existing.name = name || existing.name;
        existing.picture = picture || existing.picture;
        await existing.save();
        return existing.toObject();
    }

    const user = new User({ auth0Id, email, name, picture, profileComplete: !!(email && name) });
    await user.save();
    return user.toObject();
}

export async function listUsers(limit = 50) {
    return User.find().limit(limit).lean();
}

