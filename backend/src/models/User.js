import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    // auth0Id is optional for locally-registered users. Use a sparse unique index so multiple
    // documents without an auth0Id are allowed.
    auth0Id: { type: String, unique: true, sparse: true },
    // Make email unique for user lookup; sparse ensures documents without email can exist.
    email: { type: String, unique: true, sparse: true },
    name: { type: String },
    picture: { type: String },
    bio: { type: String },
    createdAt: { type: Date, default: Date.now },
    profileComplete: { type: Boolean, default: false }
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);
export default User;
