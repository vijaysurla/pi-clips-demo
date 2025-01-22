'use client'

import React, { useState, useRef, useEffect } from 'react'
import { X, Minus, Plus, Coins } from 'lucide-react'
import { Button } from "../ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { ScrollArea } from "../ui/scroll-area"
import {
  Sheet,
  SheetContent,
} from "../ui/sheet"
import { useToast } from "../ui/use-toast"
import { useNavigate } from 'react-router-dom';

interface Tip {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  amount: number;
  timeAgo: string;
}

interface Video {
  url: string;
  _id: string;
  user: {
    _id: string;
    username: string;
    avatar: string;
  };
}

interface TipSheetProps {
  video: Video | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: {
    id: string;
    username: string;
    avatar: string;
    tokenBalance: number;
  } | null;
  token: string | null;
}

export default function TipSheet({ video, isOpen, onClose, currentUser, token }: TipSheetProps) {
  const [tipAmount, setTipAmount] = useState(1)
  const [tips, setTips] = useState<Tip[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const { toast } = useToast()
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && video) {
      fetchTips()
      if (videoRef.current) {
        videoRef.current.currentTime = 0
        videoRef.current.play().then(() => {
          setIsPlaying(true)
        }).catch(err => console.error('Video autoplay failed:', err))
      }
    }
  }, [isOpen, video])

  const fetchTips = async () => {
    if (!video || !token) return
    
    try {
      const response = await fetch(`http://localhost:5000/api/videos/${video._id}/tips`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      setTips(data.map((tip: any) => ({
        id: tip._id,
        userId: tip.user._id,
        username: tip.user.username,
        avatar: tip.user.avatar,
        amount: tip.amount,
        timeAgo: formatTimeAgo(tip.createdAt)
      })))
    } catch (error) {
      console.error('Error fetching tips:', error)
    }
  }

  const handleDecrease = () => {
    setTipAmount(prev => Math.max(1, prev - 1))
  }

  const handleIncrease = () => {
    setTipAmount(prev => Math.min(100, prev + 1))
  }

  const handleSubmitTip = async () => {
    if (!currentUser || !video || !token) return
    if (currentUser.tokenBalance < tipAmount) {
      toast({
        title: "Insufficient tokens",
        description: "Please get more tokens to send this tip",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`http://localhost:5000/api/videos/${video._id}/tip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: tipAmount })
      })

      if (!response.ok) throw new Error('Failed to send tip')

      const newTip = {
        id: Date.now().toString(),
        userId: currentUser.id,
        username: currentUser.username,
        avatar: currentUser.avatar,
        amount: tipAmount,
        timeAgo: 'Just now'
      }

      setTips(prev => [newTip, ...prev])
      setTipAmount(1)
      
      toast({
        title: "Tip sent!",
        description: `You sent ${tipAmount} tokens to ${video.user.username}`,
      })
    } catch (error) {
      console.error('Error sending tip:', error)
      toast({
        title: "Error",
        description: "Failed to send tip. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
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

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="bottom" 
        className="h-[85vh] bg-zinc-900 text-white border-zinc-800 px-0"
      >
        {video ? (
          <>
            <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
              <div className="text-base font-normal">
                Add Tip to the Video
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={onClose}
                className="text-white hover:bg-zinc-800"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="h-1/3 bg-black relative">
              <video
                ref={videoRef}
                src={video.url.startsWith('http') ? video.url : `http://localhost:5000${video.url}`}
                className="w-full h-full object-contain"
                playsInline
                muted={false}
                loop
                onError={(e) => console.error('Video playback error:', e)}
              />
            </div>

            <div className="p-4 space-y-6">
              {/* Token Amount Selector */}
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleDecrease}
                  disabled={tipAmount <= 1}
                  className="h-10 w-10 rounded-full border-zinc-700 text-white hover:bg-zinc-800"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center gap-2 min-w-[100px] justify-center">
                  <Coins className="h-5 w-5 text-[#d6191e]" />
                  <span className="text-2xl font-semibold">{tipAmount}</span>
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleIncrease}
                  disabled={tipAmount >= 100}
                  className="h-10 w-10 rounded-full border-zinc-700 text-white hover:bg-zinc-800"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Balance and Get More */}
              <div className="flex items-center justify-center gap-2">
                <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-zinc-800">
                  <span className="text-sm text-zinc-400">Balance:</span>
                  <span className="text-sm font-semibold">{currentUser?.tokenBalance || 0}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/tokens')}
                  className="text-[#d6191e] hover:text-[#d6191e] hover:bg-[#d6191e]/10"
                >
                  Get More
                </Button>
              </div>

              {/* Send Tip Button */}
              <Button 
                className="w-full bg-[#d6191e] hover:bg-[#d6191e]/90 h-12"
                onClick={handleSubmitTip}
                disabled={isSubmitting || !currentUser || currentUser.tokenBalance < tipAmount}
              >
                {isSubmitting ? 'Sending...' : `Pay ${tipAmount} Token${tipAmount !== 1 ? 's' : ''}`}
              </Button>

              {/* Tips List */}
              <div className="mt-6">
                <div className="text-sm font-medium px-4 mb-2">Recent Tips</div>
                <ScrollArea className="h-[calc(66vh-320px)]">
                  <div className="space-y-4 p-4">
                    {tips.map((tip) => (
                      <div key={tip.id} className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage 
                            src={tip.avatar.startsWith('http') ? tip.avatar : `http://localhost:5000${tip.avatar}`} 
                          />
                          <AvatarFallback>{tip.username[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{tip.username}</span>
                            <span className="text-xs text-zinc-400">{tip.timeAgo}</span>
                          </div>
                          <div className="text-sm text-zinc-400">
                            Sent {tip.amount} token{tip.amount !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    ))}
                    {tips.length === 0 && (
                      <div className="text-center text-zinc-400 text-sm">
                        No tips yet. Be the first to send a tip!
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
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



