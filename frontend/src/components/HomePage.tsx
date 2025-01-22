import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "../components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs"
import {
  Heart,
  MessageCircle,
  Share2,
  Home,
  Search,
  PlusSquare,
  Coins,
  User,
  ArrowLeft,
  Music2,
  Volume2,
  VolumeX,
  LogOut,
  Play,
  Pause,
} from "lucide-react"
import CommentsSheet from "./comments/CommentsSheet"
import ShareSheet from "./ShareSheet"
import type { Video, VideoInteraction } from "../types/video"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { PlusCircle, CheckCircle } from "lucide-react"
import axios from "axios"
import { useAuth } from "../contexts/AuthContext"
import TipSheet from "./tips/TipSheet"

interface VideoPlayerProps {
  video: Video
  isActive: boolean
  isMuted: boolean
  onToggleMute: () => void
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ video, isActive, isMuted, onToggleMute }) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted
    }
  }, [isMuted])

  useEffect(() => {
    if (isActive && videoRef.current && isVideoLoaded) {
      videoRef.current.play().catch((error) => {
        console.error("Autoplay failed:", error)
        setErrorMessage(`Autoplay failed: ${error.message}`)
      })
      setIsPlaying(true)
    } else if (!isActive && videoRef.current) {
      videoRef.current.pause()
      setIsPlaying(false)
    }
  }, [isActive, isVideoLoaded])

  const handleLoadedData = () => {
    console.log("Video loaded successfully:", {
      url: video.signedUrl || video.url,
      duration: videoRef.current?.duration,
      readyState: videoRef.current?.readyState,
    })
    setIsVideoLoaded(true)
    setHasError(false)
    setErrorMessage("")
  }

  const handleError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const target = e.target as HTMLVideoElement
    setHasError(true)
    const errorDetails = {
      code: target.error?.code,
      message: target.error?.message,
      networkState: target.networkState,
      readyState: target.readyState,
      src: target.src,
      currentTime: target.currentTime,
    }
    console.error("Video error details:", errorDetails)
    setErrorMessage(`Video error: ${target.error?.message || "Unknown error"}. Code: ${target.error?.code}`)
  }

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play().catch((error) => {
          console.error("Play failed:", error)
          setErrorMessage(`Play failed: ${error.message}`)
        })
      }
      setIsPlaying(!isPlaying)
    }
  }

  // Ensure we're using the signed URL if available
  const videoUrl = video.url
  console.log("Using video URL:", videoUrl)

  return (
    <div className="relative h-full w-full flex items-center justify-center bg-black">
      <div className="relative w-full pb-[177.77%]">
        <div className="absolute inset-0 flex items-center justify-center">
          {hasError ? (
            <div className="text-white text-center p-4">
              <p className="text-lg font-semibold mb-2">Error loading video</p>
              <p className="text-sm opacity-80 mb-4">{errorMessage}</p>
              <img
                src={video.thumbnail || "/placeholder.svg"}
                alt={video.description || "Video thumbnail"}
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                src={videoUrl}
                className="absolute w-full h-full object-contain"
                loop
                playsInline
                muted={isMuted}
                onLoadedData={handleLoadedData}
                onError={handleError}
                controlsList="nodownload nofullscreen noremoteplayback"
                onClick={togglePlayPause}
                data-video-id={video.id}
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute inset-0 w-full h-full bg-transparent hover:bg-black/10"
                onClick={togglePlayPause}
              >
                {!isPlaying && (
                  <Play className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
                {isPlaying && (
                  <Pause className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const HomePage: React.FC = () => {
  const { user, isAuthenticated, authenticate, signOut, token } = useAuth()
  const navigate = useNavigate()
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [isMuted, setIsMuted] = useState(true)
  const [videos, setVideos] = useState<Video[]>([])
  const [isCommentsOpen, setIsCommentsOpen] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [interactions, setInteractions] = useState<VideoInteraction[]>([])
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set())
  const [isTipSheetOpen, setIsTipSheetOpen] = useState(false)

  useEffect(() => {
    fetchVideos()
  }, [user])

  const fetchVideos = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/videos", {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      console.log("Raw response data:", response.data)

      const fetchedVideos: Video[] = response.data.map((video: any) => ({
        ...video,
        id: video._id,
        url: video.signedUrl || video.url,
        thumbnail: video.thumbnail?.startsWith("http")
          ? video.thumbnail
          : `http://localhost:5000${video.thumbnail || "/placeholder.svg"}`,
        user: {
          _id: video.user?._id || "unknown",
          username: video.user?.username || "Anonymous",
          displayName: video.user?.displayName || "Anonymous",
          avatar: video.user?.avatar ? `http://localhost:5000${video.user.avatar}?t=${Date.now()}` : "/placeholder.svg",
        },
        likes: video.likes || [],
        views: video.views || 0,
        comments: video.comments || [],
        shares: video.shares || 0,
        tips: video.tips || 0,
        music: video.music || "Original Audio",
        isLiked: video.likes?.includes(user?._id) || false,
        commentCount: video.comments?.length || 0,
      }))

      console.log("Processed videos:", fetchedVideos)

      setVideos(fetchedVideos)
    } catch (error) {
      console.error("Error fetching videos:", error)
    }
  }

  const handleToggleMute = () => {
    setIsMuted(!isMuted)
  }

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = event.currentTarget
    const newIndex = Math.round(scrollTop / clientHeight)
    if (newIndex !== currentVideoIndex) {
      setCurrentVideoIndex(newIndex)
    }
  }

  const handleInteraction = async (videoId: string, type: VideoInteraction["type"]) => {
    if (!user) {
      await authenticate()
      return
    }

    try {
      // Optimistically update the UI
      setVideos((prev) =>
        prev.map((video) =>
          video.id === videoId
            ? {
                ...video,
                isLiked: !video.isLiked,
                likes: video.isLiked ? video.likes.filter((id) => id !== user._id) : [...video.likes, user._id],
              }
            : video,
        ),
      )

      const response = await axios.post(
        `http://localhost:5000/api/videos/${videoId}/like`,
        {
          userId: user._id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      // Update with the server response
      setVideos((prev) =>
        prev.map((video) =>
          video.id === videoId
            ? {
                ...video,
                isLiked: response.data.isLiked,
                likes: Array.isArray(response.data.likes) ? response.data.likes : video.likes,
              }
            : video,
        ),
      )

      setInteractions((prev) => [
        ...prev,
        {
          videoId,
          userId: user._id,
          type,
          timestamp: new Date(),
        },
      ])
    } catch (error) {
      console.error("Error interacting with video:", error)
      // Revert the optimistic update if there's an error
      setVideos((prev) =>
        prev.map((video) =>
          video.id === videoId
            ? {
                ...video,
                isLiked: !video.isLiked,
                likes: video.isLiked ? [...video.likes, user._id] : video.likes.filter((id) => id !== user._id),
              }
            : video,
        ),
      )
    }
  }

  const handleTip = (video: Video) => {
    setSelectedVideo(video)
    setIsTipSheetOpen(true)
  }

  const handleOpenComments = (video: Video) => {
    setSelectedVideo(video)
    setIsCommentsOpen(true)
  }

  const handleOpenShare = (videoId: string) => {
    setSelectedVideoId(videoId)
    setIsShareOpen(true)
    handleInteraction(videoId, "share")
  }

  const getCurrentVideo = () => videos[currentVideoIndex]

  const handleFollow = async (userId: string, event: React.MouseEvent) => {
    event.preventDefault()
    if (!user) {
      await authenticate()
      return
    }

    try {
      const response = await axios.post(`http://localhost:5000/api/users/${userId}/follow`, {
        followerId: user._id,
      })

      setFollowedUsers((prev) => {
        const next = new Set(prev)
        if (next.has(userId)) {
          next.delete(userId)
        } else {
          next.add(userId)
        }
        return next
      })
    } catch (error) {
      console.error("Error following/unfollowing user:", error)
    }
  }

  const updateCommentCount = useCallback((videoId: string, count: number) => {
    setVideos((prevVideos) =>
      prevVideos.map((video) => (video.id === videoId ? { ...video, commentCount: count } : video)),
    )
  }, [])

  console.log("Current videos state:", videos)

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1a1819]">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-white">
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div className="flex items-center">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/piclips-logo-FLVfMvms8t5OMg9lyHWtQDVtiKHkgs.png"
              alt="227 Clips"
              className="h-8"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <span className="text-white text-base font-medium">{user?.username}</span>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-[#d6191e]/10 flex items-center"
                onClick={signOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="sm" className="text-white hover:bg-[#d6191e]/10" onClick={authenticate}>
              Authenticate with Pi
            </Button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs defaultValue="for-you" className="w-full">
        <TabsList className="bg-transparent h-12">
          <TabsTrigger
            value="following"
            className="text-gray-400 data-[state=active]:text-white data-[state=active]:font-semibold"
          >
            Following
          </TabsTrigger>
          <TabsTrigger
            value="for-you"
            className="text-gray-400 data-[state=active]:text-[#d6191e] data-[state=active]:font-semibold"
          >
            For You
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Video Content */}
      <div className="flex-1 overflow-y-auto snap-y snap-mandatory" onScroll={handleScroll}>
        {videos.map((video, index) => (
          <div key={video.id} className="h-full snap-start">
            <div className="relative h-full">
              <VideoPlayer
                video={video}
                isActive={index === currentVideoIndex}
                isMuted={isMuted}
                onToggleMute={handleToggleMute}
              />

              {/* Interaction Buttons */}
              <div className="absolute right-4 bottom-32 flex flex-col items-center gap-6">
                <div className="flex flex-col items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full bg-transparent hover:bg-white/10"
                    onClick={() => handleInteraction(video.id, "like")}
                  >
                    <Heart className={`h-7 w-7 ${video.isLiked ? "fill-[#d6191e] text-[#d6191e]" : "text-white"}`} />
                  </Button>
                  <span className="text-sm">{video.likes.length.toLocaleString()}</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full bg-transparent hover:bg-white/10"
                    onClick={() => handleOpenComments(video)}
                  >
                    <MessageCircle className="h-7 w-7" />
                  </Button>
                  <span className="text-sm">{video.commentCount.toLocaleString()}</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full bg-transparent hover:bg-white/10"
                    onClick={() => handleOpenShare(video.id)}
                  >
                    <Share2 className="h-7 w-7" />
                  </Button>
                  <span className="text-sm">{video.shares.toLocaleString()}</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full bg-transparent hover:bg-[#d6191e]/10"
                    onClick={() => handleTip(video)}
                  >
                    <Coins className="h-7 w-7 text-[#d6191e]" />
                  </Button>
                  <span className="text-sm">{video.tips.toLocaleString()}</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full bg-transparent hover:bg-white/10"
                    onClick={handleToggleMute}
                  >
                    {isMuted ? <VolumeX className="h-7 w-7" /> : <Volume2 className="h-7 w-7" />}
                  </Button>
                  <span className="text-sm">{isMuted ? "Unmute" : "Mute"}</span>
                </div>
              </div>

              {/* Video Info */}
              <div className="absolute bottom-24 left-4 right-20">
                <div className="flex items-center gap-2">
                  <Link to={`/profile/${video.user._id}`} className="relative group">
                    <Avatar className="h-12 w-12 border-2 border-white/20">
                      <AvatarImage src={video.user.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{video.user.username[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-[#d6191e] hover:bg-[#d6191e]/90 p-0.5"
                      onClick={(e) => handleFollow(video.user._id, e)}
                    >
                      {followedUsers.has(video.user._id) ? (
                        <CheckCircle className="h-full w-full text-white" />
                      ) : (
                        <PlusCircle className="h-full w-full text-white" />
                      )}
                    </Button>
                  </Link>
                  <div className="flex flex-col">
                    <Link to={`/profile/${video.user._id}`} className="text-lg font-semibold hover:underline">
                      {video.user.username}
                    </Link>
                    <p className="text-sm mt-1">{video.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Music2 className="h-4 w-4" />
                  <span className="text-sm">{video.music}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Navigation */}
      <div className="h-16 bg-black border-t border-gray-800 flex items-center justify-around px-4">
        <Button variant="ghost" size="icon" className="text-white">
          <Home className="h-6 w-6" />
        </Button>
        <Button variant="ghost" size="icon" className="text-white" onClick={() => navigate("/search")}>
          <Search className="h-6 w-6" />
        </Button>
        <Button variant="ghost" size="icon" className="text-[#d6191e]" onClick={() => navigate("/upload")}>
          <PlusSquare className="h-8 w-8" />
        </Button>
        <Button variant="ghost" size="icon" className="text-[#d6191e]" onClick={() => navigate("/tokens")}>
          <Coins className="h-6 w-6" />
        </Button>
        <Button variant="ghost" size="icon" className="text-white" onClick={() => navigate("/profile")}>
          {user && user.avatar ? (
            <img
              src={user.avatar.startsWith("http") ? user.avatar : `http://localhost:5000${user.avatar}?t=${Date.now()}`}
              alt={user.username}
              className="h-6 w-6 rounded-full object-cover"
            />
          ) : (
            <User className="h-6 w-6" />
          )}
        </Button>
      </div>

      {/* Comments Sheet */}
      <CommentsSheet
        video={selectedVideo}
        isOpen={isCommentsOpen}
        onClose={() => {
          setIsCommentsOpen(false)
          setSelectedVideo(null)
        }}
        currentUser={
          user
            ? {
                id: user._id || "",
                username: user.username || "",
                avatar: user.avatar ? `${user.avatar}?t=${Date.now()}` : "/placeholder.svg",
              }
            : null
        }
        setCommentCount={(newCount) => {
          if (selectedVideo) {
            if (typeof newCount === "function") {
              updateCommentCount(selectedVideo.id, newCount(selectedVideo.commentCount))
            } else {
              updateCommentCount(selectedVideo.id, newCount)
            }
          }
        }}
        token={token}
      />

      {/* Tip Sheet */}
      <TipSheet
        video={selectedVideo}
        isOpen={isTipSheetOpen}
        onClose={() => {
          setIsTipSheetOpen(false)
          setSelectedVideo(null)
        }}
        currentUser={
          user
            ? {
                id: user._id,
                username: user.username,
                avatar: user.avatar,
                tokenBalance: user.tokenBalance,
              }
            : null
        }
        token={token}
      />

      {/* Share Sheet */}
      {selectedVideoId && (
        <ShareSheet
          videoId={selectedVideoId}
          videoUrl={`${window.location.origin}/video/${selectedVideoId}`}
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
        />
      )}
    </div>
  )
}

export default HomePage
































































































































