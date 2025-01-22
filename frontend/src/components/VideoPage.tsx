import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Video } from '../types/video';
import { useAuth } from '../contexts/AuthContext';
import CommentsSheet from './comments/CommentsSheet';
import { Button } from './ui/button';
import { ArrowLeft } from 'lucide-react';
import axios from 'axios';

const VideoPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [video, setVideo] = useState<Video | null>(null);
  const [commentCount, setCommentCount] = useState<number>(0);

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const response = await axios.get(`/api/videos/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setVideo(response.data);
        setCommentCount(response.data.commentCount || 0);
      } catch (error) {
        console.error('Error fetching video:', error);
        // Handle error (e.g., show error message or redirect)
      }
    };

    if (id) {
      fetchVideo();
    }
  }, [id, token]);

  if (!video) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      <div className="flex items-center justify-between px-4 py-2 bg-[#1a1819]">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-white">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-semibold">Video</h1>
        <div className="w-10" /> {/* Spacer for alignment */}
      </div>
      <div className="p-4">
        <video
          src={video.url}
          className="w-full aspect-[9/16] object-cover rounded-lg"
          controls
          autoPlay
          playsInline
        />
        <h2 className="text-xl font-semibold mt-4">{video.description}</h2>
        <p className="text-sm text-zinc-400 mt-2">
          By {video.user.username} • {new Date(video.createdAt).toLocaleDateString()}
        </p>
      </div>
      <CommentsSheet
        video={video}
        isOpen={true}
        onClose={() => {}} // This is now always open
        currentUser={user ? {
          id: user._id,
          username: user.username,
          avatar: user.avatar
        } : null}
        token={token}
        setCommentCount={setCommentCount}
      />
    </div>
  );
};

export default VideoPage;



