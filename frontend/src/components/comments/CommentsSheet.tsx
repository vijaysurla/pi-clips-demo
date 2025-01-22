'use client'

import React, { useState, useEffect, useRef } from 'react'
import { X, Heart, AtSign, SmilePlus, MoreHorizontal, Check, Play } from 'lucide-react'
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar"
import { ScrollArea } from "../../components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
} from "../../components/ui/sheet"
import axios from 'axios'

interface Video {
  url: string;
  _id: string; // Added _id property
  // Add other video properties as needed
}

interface Comment {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  text: string;
  timeAgo: string;
  likes: number;
  isLiked: boolean;
  replies: Comment[];
  verified?: boolean;
}

interface CommentsSheetProps {
  video: Video | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: {
    id: string
    username: string
    avatar: string
  } | null;
  setCommentCount: React.Dispatch<React.SetStateAction<number>>;
  token: string | null;
}

export default function CommentsSheet({ video, isOpen, onClose, currentUser, setCommentCount, token }: CommentsSheetProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set())
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (isOpen && video) {
      fetchComments()
      // Play video automatically when sheet opens
      if (videoRef.current) {
        videoRef.current.currentTime = 0
        videoRef.current.play().then(() => {
          setIsPlaying(true)
        }).catch(err => console.error('Video autoplay failed:', err))
      }
    }
  }, [isOpen, video])

  const fetchComments = async () => {
    if (!video) return;
    try {
      const response = await axios.get(`http://localhost:5000/api/videos/${video._id}/comments`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const fetchedComments = response.data.map((comment: any) => ({
        id: comment._id,
        userId: comment.user._id,
        username: comment.user.username,
        avatar: comment.user.avatar,
        text: comment.content,
        timeAgo: formatTimeAgo(comment.createdAt),
        likes: comment.likes,
        isLiked: false,
        replies: [],
        verified: false
      }));
      setComments(fetchedComments);
      setCommentCount(fetchedComments.length);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleAddComment = async () => {
    if (!currentUser || !newComment.trim() || !token || !video) return

    try {
      const response = await axios.post(`http://localhost:5000/api/videos/${video._id}/comment`, {
        content: newComment
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const { comment, commentCount } = response.data;
      const newCommentObj: Comment = {
        id: comment._id,
        userId: comment.user._id,
        username: comment.user.username,
        avatar: comment.user.avatar,
        text: comment.content,
        timeAgo: 'Just now',
        likes: 0,
        isLiked: false,
        replies: []
      };

      setComments(prev => [newCommentObj, ...prev]);
      setCommentCount(commentCount);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  }

  const handleLikeComment = (commentId: string) => {
    // Implement like functionality
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!currentUser || !token || !video) return;

    try {
      await axios.delete(`http://localhost:5000/api/videos/${video._id}/comments/${commentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setComments(prevComments => prevComments.filter(comment => comment.id !== commentId));
      setCommentCount(prev => prev - 1);
    } catch (error) {
      console.error('Error deleting comment:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', error.response?.data);
      }
    }
  };

  const toggleReplies = (commentId: string) => {
    setExpandedReplies(prev => {
      const next = new Set(prev)
      if (next.has(commentId)) {
        next.delete(commentId)
      } else {
        next.add(commentId)
      }
      return next
    })
  }

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const past = new Date(dateString)
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(error => {
          console.error('Error playing video:', error);
          // Handle the error (e.g., show an error message to the user)
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className="flex gap-3 py-3">
      <Avatar className="h-8 w-8">
        <AvatarImage src={`${comment.avatar.startsWith('http') ? comment.avatar : `http://localhost:5000${comment.avatar}`}?t=${Date.now()}`} />
        <AvatarFallback>{comment.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-1">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold inline-flex items-center gap-1">
              {comment.username}
              {comment.verified && (
                <Check className="h-3 w-3 text-[#d6191e]" />
              )}
            </p>
            <p className="text-sm">{comment.text}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-gray-400 hover:text-white"
              onClick={() => handleLikeComment(comment.id)}
            >
              <Heart className={`h-4 w-4 ${comment.isLiked ? 'fill-[#d6191e] text-[#d6191e]' : ''}`} />
            </Button>
            {currentUser?.id === comment.userId && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                  <DropdownMenuItem 
                    className="text-red-500 focus:text-red-500"
                    onClick={() => handleDeleteComment(comment.id)}
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        <div className="flex gap-4 text-xs text-gray-400">
          <span>{comment.timeAgo}</span>
          <span>{comment.likes} likes</span>
          {!isReply && comment.replies.length > 0 && (
            <button 
              className="hover:text-white"
              onClick={() => toggleReplies(comment.id)}
            >
              View replies ({comment.replies.length})
            </button>
          )}
        </div>
        {!isReply && expandedReplies.has(comment.id) && (
          <div className="mt-3 ml-8 space-y-3">
            {comment.replies.map(reply => renderComment(reply, true))}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="bottom" 
        className="h-[85vh] bg-zinc-900 text-white border-zinc-800 px-0"
        style={{ '--sheet-close-button-display': 'none' } as React.CSSProperties}
      >
        {video ? (
          <>
            <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
              <div className="text-base font-normal">
                {comments.length} comments
              </div>
            </div>

            <div className="h-1/3 bg-black relative">
              <video
                ref={videoRef}
                src={video.url.startsWith('http') ? video.url : `http://localhost:5000${video.url}`}
                className="w-full h-full object-contain"
                playsInline
                muted={false}
                autoPlay
                onError={(e) => console.error('Video playback error:', e)}
              />
              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full bg-white/20 hover:bg-white/30"
                    onClick={togglePlayPause}
                  >
                    <Play className="h-12 w-12 text-white" />
                  </Button>
                </div>
              )}
            </div>

            <ScrollArea className="h-[calc(66%-130px)] px-4">
              <div className="space-y-1 pt-2">
                {comments.map(comment => renderComment(comment))}
              </div>
            </ScrollArea>

            {currentUser ? (
              <div className="absolute bottom-0 left-0 right-0 border-t border-zinc-800 bg-zinc-900 p-4">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={`${currentUser.avatar.startsWith('http') ? currentUser.avatar : `http://localhost:5000${currentUser.avatar}`}?t=${Date.now()}`} />
                    <AvatarFallback>{currentUser.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex items-center gap-2">
                    <Input 
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add comment..."
                      className="flex-1 bg-transparent border-none text-sm text-white placeholder:text-gray-400 focus-visible:ring-0"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleAddComment()
                        }
                      }}
                    />
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                        <AtSign className="h-5 w-5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                        <SmilePlus className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="absolute bottom-0 left-0 right-0 border-t border-zinc-800 bg-zinc-900 p-4">
                <p className="text-center text-sm text-gray-400">
                  Please sign in to comment
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p>No video selected</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}



































































