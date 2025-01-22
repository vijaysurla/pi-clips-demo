import type React from "react"
import { useState, useEffect, useRef } from "react"
import axios from "axios"
import { useAuth } from "../contexts/AuthContext"

interface Video {
  _id: string
  title: string
  description: string
  url: string
  signedUrl?: string
}

interface DebugInfo {
  apiResponse?: {
    status: number
    headers: Record<string, string>
    dataLength: number
  }
  fetchError?: {
    message: string
    stack?: string
  }
  urlTests: {
    [key: string]: {
      status?: number
      headers?: Record<string, string>
      error?: string
      timestamp: string
    }
  }
  videoErrors: {
    [key: string]: {
      errorType: string
      errorMessage?: string
      networkState?: number
      readyState?: number
      errorCode?: number
      timestamp: string
    }
  }
  videoLoaded: {
    [key: string]: {
      timestamp: string
      success: boolean
    }
  }
}

const VideoDebug: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([])
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    urlTests: {},
    videoErrors: {},
    videoLoaded: {},
  })
  const { token } = useAuth()
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({})

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        console.log("Making request to /api/videos with token:", token?.substring(0, 10) + "...")

        const response = await axios.get<Video[]>("http://localhost:5000/api/videos", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        console.log("Full API Response:", JSON.stringify(response.data, null, 2))

        setVideos(response.data)

        setDebugInfo((prev) => ({
          ...prev,
          apiResponse: {
            status: response.status,
            headers: response.headers as Record<string, string>,
            dataLength: response.data.length,
          },
        }))
      } catch (error) {
        console.error("Error fetching videos:", error)
        setDebugInfo((prev) => ({
          ...prev,
          fetchError:
            error instanceof Error
              ? {
                  message: error.message,
                  stack: error.stack,
                }
              : { message: "Unknown error" },
        }))
      }
    }

    fetchVideos()
  }, [token])

  const testVideoUrl = async (videoId: string, url: string) => {
    try {
      const response = await fetch(url, { method: "HEAD" })

      setDebugInfo((prev) => ({
        ...prev,
        urlTests: {
          ...prev.urlTests,
          [videoId]: {
            status: response.status,
            headers: Object.fromEntries(response.headers.entries()),
            timestamp: new Date().toISOString(),
          },
        },
      }))
    } catch (error) {
      setDebugInfo((prev) => ({
        ...prev,
        urlTests: {
          ...prev.urlTests,
          [videoId]: {
            error: error instanceof Error ? error.message : "Unknown error",
            timestamp: new Date().toISOString(),
          },
        },
      }))
    }
  }

  const handleVideoError = (videoId: string, event: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const videoElement = event.currentTarget
    setDebugInfo((prev) => ({
      ...prev,
      videoErrors: {
        ...prev.videoErrors,
        [videoId]: {
          errorType: "MediaError",
          errorMessage: videoElement.error?.message || "Unknown error",
          networkState: videoElement.networkState,
          readyState: videoElement.readyState,
          errorCode: videoElement.error?.code,
          timestamp: new Date().toISOString(),
        },
      },
    }))
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Video Debug Page</h1>

      <div className="mb-8 p-4 bg-gray-800 rounded">
        <h2 className="text-xl font-semibold mb-2">Debug Information</h2>
        <pre className="whitespace-pre-wrap break-all bg-black p-4 rounded text-xs">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>

      {videos.map((video) => (
        <div key={video._id} className="mb-8 p-4 bg-gray-800 rounded">
          <h2 className="text-xl font-semibold mb-2">{video.title || "Untitled"}</h2>

          <div className="mb-4">
            <button
              onClick={() => testVideoUrl(video._id, video.signedUrl || video.url)}
              className="px-4 py-2 bg-blue-600 rounded mb-4"
            >
              Test URL
            </button>

            <video
              ref={(el) => {
                if (el) videoRefs.current[video._id] = el
              }}
              controls
              width="320"
              height="240"
              onError={(e) => handleVideoError(video._id, e)}
              onLoadedData={() => {
                setDebugInfo((prev) => ({
                  ...prev,
                  videoLoaded: {
                    ...prev.videoLoaded,
                    [video._id]: {
                      timestamp: new Date().toISOString(),
                      success: true,
                    },
                  },
                }))
              }}
            >
              <source src={video.signedUrl || video.url} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>

          <div className="space-y-2 text-sm">
            <h3 className="font-semibold">Video Details:</h3>
            <p className="break-all">
              <strong>Video ID:</strong> {video._id}
            </p>
            <p className="break-all">
              <strong>URL:</strong> {video.signedUrl || video.url}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default VideoDebug





