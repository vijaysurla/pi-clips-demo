import express from "express"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { Video } from "../models/schemas"

const router = express.Router()

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

// GET route to fetch a specific video
router.get("/:id", async (req, res) => {
  console.log("Received request for video ID:", req.params.id)
  try {
    const video = await Video.findById(req.params.id).populate("user", "username displayName avatar")
    if (!video) {
      console.log("Video not found in database")
      return res.status(404).json({ message: "Video not found" })
    }

    console.log("Video found:", video)

    // Extract the key correctly from the URL
    const fullUrl = video.url
    const key = fullUrl.includes("amazonaws.com") ? `videos/${fullUrl.split("/videos/")[1]}` : fullUrl

    console.log("Generating signed URL with key:", key)

    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key,
      ResponseContentType: "video/mp4",
      ResponseContentDisposition: "inline",
    })

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    })

    console.log("Generated signed URL:", signedUrl)

    res.json({
      ...video.toObject(),
      signedUrl,
      debug: {
        originalUrl: video.url,
        extractedKey: key,
        bucket: process.env.S3_BUCKET_NAME,
      },
    })
  } catch (error) {
    console.error("Error fetching video:", error)
    res.status(500).json({
      message: "Server error while fetching video",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
})

export default router



