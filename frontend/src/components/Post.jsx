import React, { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const PostCreator = ({ onPosted }) => {
    const [text, setText] = useState('');
    const [mediaFiles, setMediaFiles] = useState([]);
    const [status, setStatus] = useState(null);
    const { getIdTokenClaims } = useAuth0();

    const handleFiles = async (e) => {
        const files = Array.from(e.target.files || []);
        const dataUrls = await Promise.all(files.map(file => new Promise((res, rej) => {
            const reader = new FileReader();
            reader.onload = () => res(reader.result);
            reader.onerror = rej;
            reader.readAsDataURL(file);
        })));
        setMediaFiles(dataUrls);
    };

    const submit = async () => {
        setStatus('posting');
        try {
            const idToken = (await getIdTokenClaims())?.__raw;
            // call backend /posts with Authorization header - feedAPI uses global apiCall which doesn't set auth, so use fetch here
            const res = await fetch((import.meta.env.VITE_API_BASE || 'http://localhost:3002') + '/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
                body: JSON.stringify({ text, media: mediaFiles, mediaType: mediaFiles.length ? 'image' : undefined, tags: [] })
            });
            if (!res.ok) throw new Error((await res.json()).error || 'Post failed');
            const p = await res.json();
            setText(''); setMediaFiles([]);
            setStatus('posted');
            onPosted && onPosted(p.post || p);
        } catch (err) {
            setStatus('error');
            console.error('Post failed', err);
        }
    };

    return (
        <div className="post-creator card">
            <textarea placeholder="Share something..." value={text} onChange={(e) => setText(e.target.value)} />
            <input type="file" accept="image/*,video/*" multiple onChange={handleFiles} />
            <div style={{ marginTop: 8 }}>
                <button onClick={submit} disabled={!text && mediaFiles.length === 0}>Post</button>
                {status && <span style={{ marginLeft: 8 }}>{status}</span>}
            </div>
            {mediaFiles.length > 0 && (
                <div className="preview">
                    {mediaFiles.map((m, i) => <img key={i} src={m} style={{ maxWidth: 120, marginRight: 8 }} alt="preview" />)}
                </div>
            )}
        </div>
    );
};

export default PostCreator;
