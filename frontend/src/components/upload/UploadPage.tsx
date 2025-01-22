'use client'

import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, Home, Search, PlusSquare, Bell, User, ArrowLeft, Music } from 'lucide-react'
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Textarea } from "../ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"
import axios from 'axios'
import { useAuth } from '../../contexts/AuthContext'

interface VideoFile {
  id: string
  url: string
  thumbnail: string
  duration: string
  file?: File
}

const sampleVideos: VideoFile[] = [
  {
    id: '1',
    url: 'https://example.com/video1.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30',
    duration: '10:00'
  },
  {
    id: '2',
    url: 'https://example.com/video2.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab',
    duration: '10:00'
  },
  {
    id: '3',
    url: 'https://example.com/video3.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1579033461380-adb47c3eb938',
    duration: '10:00'
  },
]

export default function UploadPage() {
  const navigate = useNavigate()
  const { user, isAuthenticated, authenticate, token } = useAuth()
  const [selectedVideo, setSelectedVideo] = useState<VideoFile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [videoData, setVideoData] = useState({
    title: '',
    description: '',
    privacy: 'public'
  })
  const [isUploading, setIsUploading] = useState(false)
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAuthenticated) {
      try {
        await authenticate();
      } catch (error) {
        setNotification({
          type: "error",
          message: "Please log in to upload videos.",
        });
        return;
      }
    }

    const file = event.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setSelectedVideo({
        id: 'upload',
        url,
        thumbnail: url,
        duration: '00:00',
        file: file
      })
      setIsEditing(true)
    }
  }

  const handleUpload = async () => {
    if (!isAuthenticated || !token) {
      setNotification({
        type: "error",
        message: "Please log in to upload videos.",
      });
      return;
    }
    if (!selectedVideo || !videoData.title) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', videoData.title);
      formData.append('description', videoData.description);
      formData.append('privacy', videoData.privacy);
      formData.append('thumbnail', '/placeholder.svg'); // Add this line
      
      if (selectedVideo.file) {
        formData.append('video', selectedVideo.file);
      } else {
        throw new Error('No video file selected');
      }

      console.log('Sending request to:', 'http://localhost:5000/api/videos');
      console.log('FormData contents:', Object.fromEntries(formData.entries()));

      const response = await axios.post('http://localhost:5000/api/videos', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        withCredentials: true
      });
    
      console.log('Upload successful:', response.data);
      setNotification({
        type: "success",
        message: "Your video has been uploaded successfully!",
      });
    
      navigate('/');
    } catch (error) {
      console.error('Upload failed:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          message: error.message,
          code: error.code,
          request: error.request,
          response: error.response,
          config: error.config
        });
        setNotification({
          type: "error",
          message: error.response?.data?.message || "An error occurred while uploading the video.",
        });
      } else {
        setNotification({
          type: "error",
          message: "An unexpected error occurred while uploading the video.",
        });
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlUpload = () => {
    // Implement URL upload logic
    console.log('URL upload not implemented yet')
  }

  const handleVideoSelect = (video: VideoFile) => {
    setSelectedVideo(video)
    setIsEditing(true)
  }

  if (isEditing && selectedVideo) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex flex-col">
        {notification && (
          <div className={`p-4 mb-4 ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white`}>
            {notification.message}
          </div>
        )}
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setIsEditing(false)}
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <Button 
            variant="ghost"
            size="icon"
            className="text-[#d6191e]"
          >
            <Music className="h-6 w-6" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Video Preview */}
          <div className="relative h-[40vh] bg-black">
            <video
              src={selectedVideo.url}
              className="w-full h-full object-contain"
              controls
            />
          </div>

          {/* Form */}
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm text-gray-400">Title</Label>
              <div className="relative">
                <Input
                  id="title"
                  value={videoData.title}
                  onChange={(e) => setVideoData(prev => ({ ...prev, title: e.target.value }))}
                  maxLength={100}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  placeholder="Add a title to your video"
                />
                <span className="absolute right-3 top-2.5 text-xs text-gray-400">
                  {videoData.title.length}/100
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm text-gray-400">Description</Label>
              <Textarea
                id="description"
                value={videoData.description}
                onChange={(e) => setVideoData(prev => ({ ...prev, description: e.target.value }))}
                className="bg-zinc-800 border-zinc-700 text-white min-h-[100px]"
                placeholder="Add a description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="privacy" className="text-sm text-gray-400">Privacy</Label>
              <Select
                value={videoData.privacy}
                onValueChange={(value: string) => setVideoData(prev => ({ ...prev, privacy: value }))}
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="Select privacy setting" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="unlisted">Unlisted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800">
          <Button 
            className="w-full bg-[#d6191e] hover:bg-[#d6191e]/90 h-12 text-lg"
            onClick={handleUpload}
            disabled={!videoData.title || isUploading}
          >
            {isUploading ? 'Uploading...' : 'Post'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      {notification && (
        <div className={`p-4 mb-4 ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white`}>
          {notification.message}
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
        <Button variant="ghost" className="text-lg font-semibold">
          Gallery
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
        <Button 
          disabled={!selectedVideo}
          onClick={() => setIsEditing(true)}
          className="bg-[#d6191e] hover:bg-[#d6191e]/90 disabled:opacity-50"
        >
          Next
        </Button>
      </div>

      {/* Upload Options */}
      <div className="p-4 space-y-4">
        <input
          type="file"
          accept="video/*"
          onChange={handleFileUpload}
          className="hidden"
          id="file-upload"
          ref={fileInputRef}
        />
        <label
          htmlFor="file-upload"
          className="block w-full p-4 text-center border-2 border-dashed border-zinc-700 rounded-lg hover:bg-zinc-800 cursor-pointer"
        >
          Upload from device
        </label>
        <Button
          variant="outline"
          className="w-full border-zinc-700 text-white hover:bg-zinc-800"
          onClick={handleUrlUpload}
        >
          Share URL
        </Button>
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-3 gap-0.5 p-0.5">
        {sampleVideos.map((video) => (
          <div
            key={video.id}
            className="relative aspect-square cursor-pointer"
            onClick={() => handleVideoSelect(video)}
          >
            <img
              src={video.thumbnail || "/placeholder.svg"}
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 right-2 text-xs bg-black/60 px-1 rounded">
              {video.duration}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-zinc-900 border-t border-zinc-800 flex items-center justify-around px-4">
        <Button variant="ghost" size="icon" className="text-gray-400" onClick={() => navigate('/')}>
          <Home className="h-6 w-6" />
        </Button>
        <Button variant="ghost" size="icon" className="text-gray-400">
          <Search className="h-6 w-6" />
        </Button>
        <Button variant="ghost" size="icon" className="text-[#d6191e]">
          <PlusSquare className="h-8 w-8" />
        </Button>
        <Button variant="ghost" size="icon" className="text-gray-400">
          <Bell className="h-6 w-6" />
        </Button>
        <Button variant="ghost" size="icon" className="text-gray-400" onClick={() => navigate('/profile')}>
          <User className="h-6 w-6" />
        </Button>
      </div>
    </div>
  )
}































