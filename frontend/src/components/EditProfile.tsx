'use client'

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Video } from 'lucide-react';
import { Button } from "./ui/button";
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { useToast } from "./ui/use-toast";

interface FormData {
  displayName: string;
  username: string;
  bio: string;
  instagram: string;
  youtube: string;
}

export default function EditProfile() {
  const navigate = useNavigate();
  const { user, token, updateUser } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormData>({
    displayName: '',
    username: '',
    bio: '',
    instagram: '',
    youtube: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.avatar) {
      setPreviewImage(null); // Reset preview to use the actual avatar
    }
    return () => {
      // Cleanup any object URLs when component unmounts
      if (previewImage?.startsWith('blob:')) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [user?.avatar]);

  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.displayName || '',
        username: user.username || '',
        bio: user.bio || '',
        instagram: user.instagram || '',
        youtube: user.youtube || '',
      });
      if (user.avatar) {
        setPreviewImage(null); // Reset preview to use the actual avatar
      }
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Set preview immediately using local file
    const localPreview = URL.createObjectURL(file);
    setPreviewImage(localPreview);

    // Upload
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await axios.post(
        `http://localhost:5000/api/users/${user?._id}/avatar`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      // Update the user's avatar in the AuthContext with the new URL
      if (response.data.avatar) {
        const updatedUser = { 
          ...user, 
          avatar: response.data.avatar 
        };
        updateUser(updatedUser);
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Error",
        description: "Failed to update profile picture",
        variant: "destructive",
      });
      // Revert to previous avatar on error
      setPreviewImage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?._id || !token) return;

    setIsSubmitting(true);
    try {
      const response = await axios.put(
        `http://localhost:5000/api/users/${user._id}`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Update the user in the AuthContext
      updateUser({ ...user, ...formData });

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      
      navigate('/profile');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate(-1)}
          className="text-white hover:bg-zinc-800"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-semibold">Edit profile</h1>
        <div className="w-10" /> {/* Spacer for alignment */}
      </div>

      {/* Profile Photo and Video */}
      <div className="flex justify-center gap-12 py-8">
        <div className="flex flex-col items-center gap-2">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-zinc-800">
              <img
                src={previewImage || (user?.avatar ? `http://localhost:5000${user.avatar}` : "/placeholder.svg")}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-[#d6191e] hover:bg-[#d6191e]/90 text-white"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="h-4 w-4" />
            </Button>
          </div>
          <span className="text-sm text-zinc-400">Change photo</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center">
              <Video className="h-8 w-8 text-zinc-600" />
            </div>
          </div>
          <span className="text-sm text-zinc-400">Change video</span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="px-4 space-y-6">
        <div className="space-y-4">
          <div className="border-b border-zinc-800 py-2">
            <label className="block text-sm text-zinc-400">Name</label>
            <input
              type="text"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              className="w-full mt-1 bg-transparent text-white focus:outline-none"
              placeholder="Add your name"
            />
          </div>

          <div className="border-b border-zinc-800 py-2">
            <label className="block text-sm text-zinc-400">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full mt-1 bg-transparent text-white focus:outline-none"
              placeholder="Add username"
            />
          </div>

          <div className="border-b border-zinc-800 py-2">
            <label className="block text-sm text-zinc-400">Bio</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Add a bio to your profile"
              className="w-full mt-1 bg-transparent text-white focus:outline-none resize-none"
              rows={3}
            />
          </div>

          <div className="border-b border-zinc-800 py-2">
            <label className="block text-sm text-zinc-400">Instagram</label>
            <input
              type="text"
              name="instagram"
              value={formData.instagram}
              onChange={handleChange}
              placeholder="Add Instagram to your profile"
              className="w-full mt-1 bg-transparent text-white focus:outline-none"
            />
          </div>

          <div className="border-b border-zinc-800 py-2">
            <label className="block text-sm text-zinc-400">YouTube</label>
            <input
              type="text"
              name="youtube"
              value={formData.youtube}
              onChange={handleChange}
              placeholder="Add YouTube to your profile"
              className="w-full mt-1 bg-transparent text-white focus:outline-none"
            />
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full bg-[#d6191e] text-white hover:bg-[#d6191e]/90"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Save'}
        </Button>
      </form>
    </div>
  );
}































