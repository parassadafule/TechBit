import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    auth0Id: { type: String, required: true, unique: true },
    email: { type: String },
    name: { type: String },
    picture: { type: String },
    bio: { type: String },
    createdAt: { type: Date, default: Date.now },
    profileComplete: { type: Boolean, default: false }
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);
export default User;
