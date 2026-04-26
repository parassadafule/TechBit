const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');
const logger = require('../utils/logger');

const DEFAULT_USERNAME_PREFIX = 'techbit-user';

const sanitizeBaseUsername = (value) => {
  if (!value || typeof value !== 'string') {
    return '';
  }

  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
    .replace(/-{2,}/g, '-')
    .substring(0, 30);

  return normalized;
};

const randomSuffix = () => Math.random().toString(36).slice(-4);

const ensureValidBaseUsername = (base) => {
  let candidate = sanitizeBaseUsername(base);

  if (!candidate || candidate.length < 3) {
    candidate = `${DEFAULT_USERNAME_PREFIX}-${randomSuffix()}`;
  }

  return candidate;
};

const buildUsernameWithSuffix = (base, suffix) => {
  if (!suffix) {
    return base.slice(0, 50);
  }

  const suffixString = typeof suffix === 'number' ? suffix.toString() : suffix;
  const maxBaseLength = 50 - suffixString.length - 1;
  const truncatedBase = base.slice(0, Math.max(3, maxBaseLength));

  return `${truncatedBase}-${suffixString}`;
};

const generateUniqueUsername = async (rawBase) => {
  const baseUsername = ensureValidBaseUsername(rawBase);
  let username = baseUsername;
  let attempt = 0;

  while (await User.exists({ username })) {
    attempt += 1;
    const suffix = attempt < 1000 ? attempt : randomSuffix();
    username = buildUsernameWithSuffix(baseUsername, suffix);
  }

  return username;
};

const extractEmailFromProfile = (profile, fallback) => {
  if (profile.emails && profile.emails.length > 0) {
    const primaryEmail = profile.emails.find((email) => email.verified) || profile.emails[0];
    return primaryEmail.value;
  }

  return fallback;
};

const extractAvatarFromProfile = (profile) => {
  if (profile.photos && profile.photos.length > 0) {
    return profile.photos[0].value;
  }

  if (profile._json && profile._json.avatar_url) {
    return profile._json.avatar_url;
  }

  return undefined;
};

const buildUsernameCandidate = (profile, email) => {
  if (profile.username) {
    return profile.username;
  }

  if (profile.displayName) {
    return profile.displayName;
  }

  if (email) {
    return email.split('@')[0];
  }

  return DEFAULT_USERNAME_PREFIX;
};

const upsertOAuthUser = async ({ profile, provider }) => {
  const emailFallback = provider === 'github' && profile.username ? `${profile.username}@github.com` : undefined;
  const email = extractEmailFromProfile(profile, emailFallback);
  const avatarUrl = extractAvatarFromProfile(profile);
  const oauthFilter = { oauthProvider: provider, oauthId: profile.id };

  let user = await User.findOne(oauthFilter);

  if (!user && email) {
    user = await User.findOne({ email });
  }

  if (!user) {
    const usernameCandidate = buildUsernameCandidate(profile, email);
    const username = await generateUniqueUsername(usernameCandidate);

    user = new User({
      username,
      email,
      oauthProvider: provider,
      oauthId: profile.id,
      avatarUrl,
      interests: [],
      activityHistory: [],
      goals: {
        skillLevel: 'intermediate',
        career: 'full-stack-developer',
      },
      lastLoginAt: new Date(),
    });

    await user.save();

    logger.info(`New user created via ${provider} OAuth: ${user.email}, id: ${user._id}`);
    return user;
  }

  if (email && email !== user.email) {
    user.email = email;
  }

  if (avatarUrl && avatarUrl !== user.avatarUrl) {
    user.avatarUrl = avatarUrl;
  }

  user.lastLoginAt = new Date();
  await user.save();

  logger.info(`Existing user logged in via ${provider} OAuth: ${user.email}, id: ${user._id}`);
  return user;
};

passport.serializeUser((user, done) => {
  logger.info(`Serializing user: ${user._id} - ${user.email}`);
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  // logger.info(`Deserializing user: ${id}`);
  try {
    const user = await User.findById(id);
    if (user) {
      logger.info(`User found: ${user.email}`);
      done(null, user);
    } else {
      logger.warn(`User not found for id: ${id}`);
      done(null, null);
    }
  } catch (error) {
    logger.error('Error deserializing user:', error);
    done(error, null);
  }
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ['profile', 'email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await upsertOAuthUser({ profile, provider: 'google' });
        logger.info(`Calling done with user id: ${user._id}`);
        return done(null, user);
      } catch (error) {
        logger.error('Error in Google OAuth strategy:', error);
        return done(error, null);
      }
    }
  )
);

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL,
      scope: ['user:email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await upsertOAuthUser({ profile, provider: 'github' });
        logger.info(`Calling done with user id: ${user._id}`);
        return done(null, user);
      } catch (error) {
        logger.error('Error in GitHub OAuth strategy:', error);
        return done(error, null);
      }
    }
  )
);

module.exports = passport;
