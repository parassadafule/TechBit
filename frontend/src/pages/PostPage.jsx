import React from 'react';
import PostCreator from '../components/Post';
import { useNavigate } from 'react-router-dom';

const PostPage = () => {
    const navigate = useNavigate();
    return (
        <div style={{ padding: 20 }}>
            <h2>Create a Post</h2>
            <p>Share photos, videos or short updates with the community.</p>
            <PostCreator onPosted={() => {
                // after posting, go to feed to see all posts
                navigate('/feed');
            }} />
        </div>
    );
};

export default PostPage;
