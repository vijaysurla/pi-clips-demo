import type React from "react"
import { useState, useEffect } from "react"
import axios from "axios"
import { useAuth } from "../contexts/AuthContext"

interface Video {
  _id: string
  title: string
  description: string
  url: string
  signedUrl?: string
  contentType?: string
  thumbnail: string
  user: string
  likes: string[]
  views: number
  comments: any[]
  privacy: string
  createdAt: string
  debug?: {
    extractedKey?: string
    bucket?: string
  }
}

const HomeTest: React.FC = () => {
  const [video, setVideo] = useState<Video | null>(null)
  const [videoError, setVideoError] = useState<string | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const { token } = useAuth()

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        console.log("Fetching video...")
        const response = await axios.get("http://localhost:5000/api/videos-test/678ece731f24c5f493fab49a", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        console.log("Raw API response:", response.data)
        console.log("Debug info:", response.data.debug)

        setVideo(response.data)
      } catch (error) {
        console.error("Error fetching video:", error)
        setFetchError(error instanceof Error ? error.message : "Failed to fetch video")
      }
    }

    fetchVideo()
  }, [token])

  const handleVideoError = (error: any) => {
    console.error("Video error details:", {
      error,
      errorCode: error?.code,
      errorMessage: error?.message,
      videoUrl: video?.signedUrl,
      videoKey: video?.debug?.extractedKey,
    })

    setVideoError(error && error.message ? error.message : `Unknown error occurred`)
  }

  const handleVideoLoad = (event: React.SyntheticEvent<HTMLVideoElement>) => {
    const videoElement = event.currentTarget
    console.log("Video loaded successfully:", {
      duration: videoElement.duration,
      readyState: videoElement.readyState,
      networkState: videoElement.networkState,
      videoWidth: videoElement.videoWidth,
      videoHeight: videoElement.videoHeight,
      currentSrc: videoElement.currentSrc,
    })
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Home Test - Single Video Display</h1>

      {fetchError && (
        <div className="mb-4 p-4 bg-red-900/50 border border-red-500 rounded">
          <h2 className="text-xl font-semibold mb-2">Fetch Error</h2>
          <p>{fetchError}</p>
        </div>
      )}

      {!video && !fetchError && (
        <div className="mb-4 p-4 bg-blue-900/50 border border-blue-500 rounded">
          <p>Loading video...</p>
        </div>
      )}

      {video && (
        <div className="mb-8 p-4 bg-gray-800 rounded">
          <h2 className="text-xl font-semibold mb-2">{video.title || "Untitled"}</h2>
          <p className="mb-4">{video.description || "No description"}</p>

          {videoError && (
            <div className="mb-4 p-4 bg-red-900/50 border border-red-500 rounded">
              <p className="text-sm text-red-200">Error playing video: {videoError}</p>
            </div>
          )}

          <div className="mb-4">
            <video
              controls
              playsInline
              muted
              width="320"
              height="240"
              onError={(e) => handleVideoError(e.currentTarget.error)}
              onLoadedData={handleVideoLoad}
              key={video.signedUrl}
            >
              <source src={video.signedUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>

          <div className="space-y-2 text-sm">
            <h3 className="font-semibold">Debug Information:</h3>
            <p className="break-all">
              <strong>Video ID:</strong> {video._id}
            </p>
            <p className="break-all">
              <strong>Original URL:</strong> {video.url}
            </p>
            <p className="break-all">
              <strong>Signed URL:</strong> {video.signedUrl}
            </p>
            <p className="break-all">
              <strong>Extracted Key:</strong> {video.debug?.extractedKey}
            </p>
            <p className="break-all">
              <strong>Bucket:</strong> {video.debug?.bucket}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default HomeTest



















