'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Edit2, Grid, Heart, Settings, Camera, Play, Pause, Trash2, AlertCircle, Video } from 'lucide-react'
import { Button } from "./ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'
import { User } from '../types/user'
import { useToast } from "./ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog"

interface Video {
  _id: string;
  title: string;
  description: string;
  url: string;
  user: string;
  likes: string[];
  views: number;
  createdAt: string;
}

interface UserProfile extends User {
  uploadedVideos: Video[];
  likedVideos: Video[];
  uploadedVideosCount: number;
}

export default function Profile() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { user: currentUser, token } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [playingVideo, setPlayingVideo] = useState<string | null>(null)
  const { toast } = useToast()
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; videoId: string | null }>({
    isOpen: false,
    videoId: null,
  });

  const fetchUserProfile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const userId = id || currentUser?._id;
      if (!userId) {
        throw new Error('No user ID available');
      }

      const userResponse = await axios.get(`http://localhost:5000/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let uploadedVideos = [];
      let likedVideos = [];
      try {
        const uploadedVideosResponse = await axios.get(`http://localhost:5000/api/videos/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        uploadedVideos = uploadedVideosResponse.data;

        const likedVideosResponse = await axios.get(`http://localhost:5000/api/videos/liked/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        likedVideos = likedVideosResponse.data;
      } catch (videoError) {
        console.error('Error fetching user videos:', videoError);
      }
      
      const userProfile: UserProfile = {
        ...userResponse.data,
        uploadedVideos: uploadedVideos,
        likedVideos: likedVideos,
        uploadedVideosCount: userResponse.data.uploadedVideosCount || 0,
      };
      
      setProfile(userProfile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Failed to load profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [id, currentUser, token]);

  const handleVideoPlay = (videoId: string) => {
    if (playingVideo === videoId) {
      setPlayingVideo(null);
    } else {
      setPlayingVideo(videoId);
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    setDeleteConfirmation({ isOpen: true, videoId });
  };

  const confirmDeleteVideo = async () => {
    const videoId = deleteConfirmation.videoId;
    if (!videoId || !token) return;

    try {
      const response = await axios.delete(`http://localhost:5000/api/videos/${videoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update the profile state to remove the deleted video
      setProfile(prevProfile => {
        if (!prevProfile) return null;
        return {
          ...prevProfile,
          uploadedVideos: prevProfile.uploadedVideos.filter(video => video._id !== videoId),
          likedVideos: prevProfile.likedVideos.filter(video => video._id !== videoId),
          uploadedVideosCount: prevProfile.uploadedVideosCount - 1
        };
      });

      toast({
        title: "Video deleted",
        description: "Your video has been successfully deleted.",
      });

      // Refresh the user profile to ensure all data is up to date
      fetchUserProfile();
    } catch (error) {
      console.error('Error deleting video:', error);
      if (axios.isAxiosError(error)) {
        toast({
          title: "Error",
          description: `Failed to delete the video: ${error.response?.data?.message || error.message}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "An unexpected error occurred while deleting the video.",
          variant: "destructive",
        });
      }
    } finally {
      setDeleteConfirmation({ isOpen: false, videoId: null });
    }
  };

  const displayVideos = (videos: Video[]) => {
    return (
      <div className="grid grid-cols-3 gap-0.5">
        {videos.map((video) => (
          <div 
            key={video._id} 
            className="relative aspect-square group cursor-pointer overflow-hidden bg-zinc-800"
          >
            <video
              src={`http://localhost:5000${video.url}`}
              className="w-full h-full object-cover"
              loop
              muted
              playsInline
              onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
              onMouseLeave={(e) => {
                (e.target as HTMLVideoElement).pause();
                (e.target as HTMLVideoElement).currentTime = 0;
              }}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            <div className="absolute bottom-2 left-2 right-2 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <p className="text-sm font-medium truncate">{video.title}</p>
              <div className="flex items-center gap-2 text-xs mt-1">
                <span className="flex items-center gap-1">
                  <Heart className="w-3 h-3" />
                  {video.likes.length.toLocaleString()}
                </span>
                <span>{video.views.toLocaleString()} views</span>
              </div>
            </div>
            {profile?._id === currentUser?._id && (
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteVideo(video._id);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
    );
  };

  const getInitials = (name: string | undefined): string => {
    if (!name) return '';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
  }

  const getTotalLikes = (videos: Video[]): number => {
    return videos.reduce((total, video) => total + video.likes.length, 0);
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(-1)}
            className="text-white hover:bg-zinc-800"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-lg font-semibold">{profile?.displayName || profile?.username}</h1>
        </div>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate('/settings')}
          className="text-white hover:bg-zinc-800"
        >
          <Settings className="h-6 w-6" />
        </Button>
      </div>

      {/* Profile Info */}
      <div className="px-4 py-6">
        <div className="flex flex-col items-center">
          <div className="relative group">
            <Avatar className="h-24 w-24 border-2 border-zinc-700">
              <AvatarImage 
                src={`http://localhost:5000${profile?.avatar || "/placeholder.svg"}?t=${Date.now()}`} 
                alt={profile?.displayName || profile?.username}
              />
              <AvatarFallback className="bg-zinc-800 text-white text-xl">
                {getInitials(profile?.displayName || profile?.username || '')}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="ghost"
              size="icon"
              className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-[#d6191e] hover:bg-[#d6191e]/90 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              onClick={() => navigate('/profile/edit')}
            >
              <Camera className="h-4 w-4" />
            </Button>
          </div>
          
          <h2 className="mt-4 text-xl font-semibold">@{profile?.username}</h2>
          
          <p className="mt-2 text-center text-zinc-400 max-w-md">
            {profile?.bio || 'No bio added yet'}
          </p>

          <div className="flex gap-8 mt-6">
            <div className="text-center">
              <div className="text-xl font-semibold">{profile?.following?.length}</div>
              <div className="text-sm text-zinc-400">Following</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-semibold">{profile?.followers?.length}</div>
              <div className="text-sm text-zinc-400">Followers</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-semibold">{getTotalLikes(profile?.uploadedVideos || [])}</div>
              <div className="text-sm text-zinc-400">Likes</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-semibold">{profile?.uploadedVideosCount || 0}</div>
              <div className="text-sm text-zinc-400">Videos</div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <div className="flex items-center justify-center gap-1 text-[#d6191e] font-semibold">
              <span>{profile?.tokenBalance}</span>
              <span>π</span>
            </div>
            <Button 
              className="mt-2 bg-[#d6191e] text-white hover:bg-[#d6191e]/90"
              onClick={() => navigate('/tokens')}
            >
              Buy Tokens
            </Button>
          </div>

          <div className="w-full mt-6">
            <Button
              variant="outline"
              className="w-full border-zinc-700 text-white hover:bg-zinc-800"
              onClick={() => navigate('/profile/edit')}
            >
              Edit Profile
            </Button>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="videos" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-zinc-900 border-b border-zinc-800">
          <TabsTrigger 
            value="videos" 
            className="flex items-center gap-2 data-[state=active]:text-[#d6191e]"
          >
            <Grid className="h-4 w-4" />
            Videos
          </TabsTrigger>
          <TabsTrigger 
            value="liked" 
            className="flex items-center gap-2 data-[state=active]:text-[#d6191e]"
          >
            <Heart className="h-4 w-4" />
            Liked
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="videos" className="mt-0">
          {profile?.uploadedVideos.length ? (
            displayVideos(profile.uploadedVideos)
          ) : (
            <div className="text-center py-4 text-zinc-400">
              No videos uploaded yet
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="liked" className="mt-0">
          {profile?.likedVideos.length ? (
            displayVideos(profile.likedVideos)
          ) : (
            <div className="text-center py-4 text-zinc-400">
              No liked videos yet
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmation.isOpen} onOpenChange={(isOpen) => setDeleteConfirmation({ isOpen, videoId: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this video?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your video.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteVideo}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}































































