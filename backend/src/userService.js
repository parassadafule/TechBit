import User from './models/User.js';

export async function findUserByAuth0Id(auth0Id) {
    return User.findOne({ auth0Id }).lean();
}

export async function createOrUpdateUserFromAuth0(profile) {
    const { sub: auth0Id, email, name, picture } = profile || {};
    if (!auth0Id) throw new Error('Invalid profile: missing sub/auth0 id');

    // Try to find by auth0Id first
    let existing = await User.findOne({ auth0Id });
    if (existing) {
        existing.email = email || existing.email;
        existing.name = name || existing.name;
        existing.picture = picture || existing.picture;
        existing.profileComplete = existing.profileComplete || !!(email && name);
        await existing.save();
        return existing.toObject();
    }

    // If no user with this auth0Id, try to find by email and link accounts
    if (email) {
        existing = await User.findOne({ email });
        if (existing) {
            existing.auth0Id = auth0Id;
            existing.name = name || existing.name;
            existing.picture = picture || existing.picture;
            existing.profileComplete = existing.profileComplete || !!(email && name);
            await existing.save();
            return existing.toObject();
        }
    }

    // Otherwise create a new user record
    const user = new User({ auth0Id, email, name, picture, profileComplete: !!(email && name) });
    await user.save();
    return user.toObject();
}

export async function findUserByEmail(email) {
    if (!email) return null;
    return User.findOne({ email }).lean();
}

export async function createLocalUser({ email, name, picture, bio }) {
    if (!email) throw new Error('Email is required for local registration');

    // Prevent duplicate email registrations
    const existing = await User.findOne({ email });
    if (existing) return existing.toObject();

    const user = new User({ email, name, picture, bio, profileComplete: !!(email && name) });
    await user.save();
    return user.toObject();
}

export async function listUsers(limit = 50) {
    return User.find().limit(limit).lean();
}

