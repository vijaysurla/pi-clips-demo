import express, { type Request, type Response, NextFunction } from "express"
import multer from "multer"
import path from "path"
import fs from "fs"
import mongoose, { Types, ObjectId } from "mongoose"
import {
  Video,
  User,
  Comment,
  Tip,
  VideoDocument,
  type UserDocument,
  CommentDocument,
  TipDocument,
} from "../models/schemas"
import { verifyToken } from "./users"
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { v4 as uuidv4 } from "uuid"
import type { PutObjectCommandInput } from "@aws-sdk/client-s3"

const router = express.Router()

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const upload = multer({ storage: multer.memoryStorage() })

router.post("/", verifyToken, upload.single("video"), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: "No video file uploaded" })
  }

  const file = req.file
  const { title, description, privacy, thumbnail } = req.body
  const userId = (req as any).userId

  try {
    console.log("Starting video upload process")
    console.log("File details:", { name: file.originalname, size: file.size, type: file.mimetype })

    const fileKey = `videos/${uuidv4()}-${file.originalname}`
    const uploadParams: PutObjectCommandInput = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileKey,
      Body: file.buffer,
      ContentType: file.mimetype,
    }

    console.log("Uploading to S3 with params:", { Bucket: uploadParams.Bucket, Key: uploadParams.Key })

    await s3Client.send(new PutObjectCommand(uploadParams))

    console.log("Video uploaded to S3 successfully")

    const video = new Video({
      title,
      description,
      url: `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`,
      thumbnail: thumbnail || "/placeholder.svg",
      user: userId,
      privacy: privacy || "public",
    })

    console.log("Saving video to MongoDB")
    const savedVideo = await video.save()
    console.log("Video saved to MongoDB:", savedVideo)

    await User.findByIdAndUpdate(userId, { $inc: { uploadedVideosCount: 1 } })
    res.status(201).json(savedVideo)
  } catch (error) {
    console.error("Error in video upload process:", error)
    if (error instanceof Error) {
      res.status(500).json({ message: "Server error while uploading video", error: error.message })
    } else {
      res.status(500).json({ message: "Server error while uploading video", error: "Unknown error" })
    }
  }
})

router.get("/user/:userId", verifyToken, async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId
    const videos = await Video.find({ user: new Types.ObjectId(userId) }).sort({ createdAt: -1 })
    res.json(videos)
  } catch (error) {
    console.error("Error fetching user videos:", error)
    res.status(500).json({ message: "Server error while fetching user videos" })
  }
})

router.get("/", async (req: Request, res: Response) => {
  try {
    console.log("Fetching videos from database")
    const videos = await Video.find({ privacy: "public" })
      .populate("user", "username displayName avatar")
      .sort({ createdAt: -1 })

    console.log(`Found ${videos.length} videos in database`)

    const videosWithSignedUrls = await Promise.all(
      videos.map(async (video) => {
        const fullUrl = video.url
        const key = fullUrl.includes("amazonaws.com") ? `videos/${fullUrl.split("/videos/")[1]}` : fullUrl

        const command = new GetObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME!,
          Key: key,
          ResponseContentType: "video/mp4",
          ResponseContentDisposition: "inline",
        })

        console.log(`Generating signed URL for video ${video._id} with key ${key}`)
        const signedUrl = await getSignedUrl(s3Client, command, {
          expiresIn: 3600,
        })

        console.log(`Generated signed URL for video ${video._id}`)
        return {
          ...video.toObject(),
          signedUrl,
          contentType: "video/mp4",
          debug: {
            originalUrl: video.url,
            extractedKey: key,
            bucket: process.env.S3_BUCKET_NAME,
          },
        }
      }),
    )

    res.json(videosWithSignedUrls)
  } catch (error) {
    console.error("Error fetching videos:", error)
    res.status(500).json({
      message: "Server error while fetching videos",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
})

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const video = await Video.findById(req.params.id).populate("user", "username displayName avatar")
    if (!video) {
      return res.status(404).json({ message: "Video not found" })
    }

    const fullUrl = video.url
    const key = fullUrl.includes("amazonaws.com") ? `videos/${fullUrl.split("/videos/")[1]}` : fullUrl

    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key,
      ResponseContentType: "video/mp4",
      ResponseContentDisposition: "inline",
    })
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 })

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
    res.status(500).json({ message: "Server error while fetching video" })
  }
})

router.post("/:id/like", verifyToken, async (req: Request, res: Response) => {
  try {
    const videoId = req.params.id
    const userId = (req as any).userId

    const video = await Video.findById(videoId)
    if (!video) {
      return res.status(404).json({ message: "Video not found" })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    const likedIndex = video.likes.findIndex((id) => id.equals(new Types.ObjectId(userId)))
    if (likedIndex === -1) {
      video.likes.push(new Types.ObjectId(userId))
      if (!user.likedVideos) {
        user.likedVideos = []
      }
      user.likedVideos.push(new Types.ObjectId(videoId))
    } else {
      video.likes.splice(likedIndex, 1)
      if (user.likedVideos) {
        user.likedVideos = user.likedVideos.filter((id) => !id.equals(new Types.ObjectId(videoId)))
      }
    }

    await video.save()
    await user.save()

    res.json({ likes: video.likes.length, isLiked: likedIndex === -1 })
  } catch (error) {
    console.error("Error liking/unliking video:", error)
    res.status(500).json({ message: "Server error while processing like/unlike" })
  }
})

router.post("/:id/comment", verifyToken, async (req: Request, res: Response) => {
  try {
    const videoId = req.params.id
    const userId = (req as any).userId
    const { content } = req.body

    const video = await Video.findById(videoId)
    if (!video) {
      return res.status(404).json({ message: "Video not found" })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    const newComment = new Comment({
      content,
      user: new Types.ObjectId(userId),
      video: new Types.ObjectId(videoId),
    })

    await newComment.save()

    video.comments.push(newComment._id as unknown as Types.ObjectId)
    await video.save()

    const populatedComment = await Comment.findById(newComment._id).populate("user", "username displayName avatar")

    res.status(201).json({
      comment: populatedComment,
      commentCount: video.comments.length,
    })
  } catch (error) {
    console.error("Error adding comment:", error)
    res.status(500).json({ message: "Server error while adding comment" })
  }
})

router.get("/:id/comments", async (req: Request, res: Response) => {
  try {
    const videoId = req.params.id

    const comments = await Comment.find({ video: new Types.ObjectId(videoId) })
      .populate("user", "username displayName avatar")
      .sort({ createdAt: -1 })

    res.json(comments)
  } catch (error) {
    console.error("Error fetching comments:", error)
    res.status(500).json({ message: "Server error while fetching comments" })
  }
})

router.delete("/:id/comments/:commentId", verifyToken, async (req: Request, res: Response) => {
  try {
    const { id: videoId, commentId } = req.params
    const userId = (req as any).userId

    const comment = await Comment.findById(commentId)
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" })
    }

    if (!comment.user.equals(userId)) {
      return res.status(403).json({ message: "You are not authorized to delete this comment" })
    }

    await Comment.findByIdAndDelete(commentId)

    const video = await Video.findById(videoId)
    if (video) {
      video.comments = video.comments.filter((id: Types.ObjectId) => !id.equals(new Types.ObjectId(commentId)))
      await video.save()
    }

    res.json({ message: "Comment deleted successfully" })
  } catch (error) {
    console.error("Error deleting comment:", error)
    res.status(500).json({ message: "Server error while deleting comment" })
  }
})

router.get("/liked/:userId", verifyToken, async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    const likedVideos = await Video.find({ _id: { $in: user.likedVideos } })
      .populate("user", "username displayName avatar")
      .sort({ createdAt: -1 })

    const videosWithSignedUrls = await Promise.all(
      likedVideos.map(async (video) => {
        const fullUrl = video.url
        const key = fullUrl.includes("amazonaws.com") ? `videos/${fullUrl.split("/videos/")[1]}` : fullUrl

        const command = new GetObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME!,
          Key: key,
          ResponseContentType: "video/mp4",
          ResponseContentDisposition: "inline",
        })
        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 })
        return {
          ...video.toObject(),
          signedUrl,
          debug: {
            originalUrl: video.url,
            extractedKey: key,
            bucket: process.env.S3_BUCKET_NAME,
          },
        }
      }),
    )

    res.json(videosWithSignedUrls)
  } catch (error) {
    console.error("Error fetching liked videos:", error)
    res.status(500).json({ message: "Server error while fetching liked videos" })
  }
})

router.delete("/:id", verifyToken, async (req: Request, res: Response) => {
  try {
    const videoId = req.params.id
    const userId = (req as any).userId

    console.log("Attempting to delete video:", videoId)
    console.log("User ID:", userId)

    const video = await Video.findById(videoId)
    if (!video) {
      console.log("Video not found:", videoId)
      return res.status(404).json({ message: "Video not found" })
    }

    console.log("Video found:", video)

    if (video.user.toString() !== userId) {
      console.log("Unauthorized deletion attempt. Video user:", video.user, "Request user:", userId)
      return res.status(403).json({ message: "You are not authorized to delete this video" })
    }

    const deleteParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: video.url.split("/").pop()!,
    }

    await s3Client.send(new DeleteObjectCommand(deleteParams))
    console.log("Video file deleted from S3")

    const deletedVideo = await Video.findByIdAndDelete(videoId)
    console.log("Video document deleted:", deletedVideo)

    const updateResult = await User.updateMany({ likedVideos: videoId }, { $pull: { likedVideos: videoId } })
    console.log("Users updated:", updateResult)

    const deleteCommentsResult = await Comment.deleteMany({ video: videoId })
    console.log("Comments deleted:", deleteCommentsResult)

    await User.findByIdAndUpdate(userId, { $inc: { uploadedVideosCount: -1 } })
    console.log("Updated user video count")
    res.json({ message: "Video deleted successfully" })
  } catch (error) {
    console.error("Error deleting video:", error)
    res.status(500).json({ message: "Server error while deleting video" })
  }
})

router.post("/:id/tip", verifyToken, async (req: Request, res: Response) => {
  try {
    const videoId = req.params.id
    const senderId = (req as any).userId
    const { amount } = req.body

    if (!amount || amount < 1) {
      return res.status(400).json({ message: "Invalid tip amount" })
    }

    const video = await Video.findById(videoId).populate("user", "_id tokenBalance")
    if (!video) {
      return res.status(404).json({ message: "Video not found" })
    }

    const sender = await User.findById(senderId)
    if (!sender) {
      return res.status(404).json({ message: "Sender not found" })
    }

    if (sender.tokenBalance < amount) {
      return res.status(400).json({ message: "Insufficient tokens" })
    }

    const receiverId = (video.user as UserDocument)._id

    const tip = new Tip({
      sender: senderId,
      receiver: receiverId,
      video: videoId,
      amount,
      createdAt: new Date(),
    })

    sender.tokenBalance -= amount
    await User.findByIdAndUpdate(receiverId, {
      $inc: { tokenBalance: amount },
    })

    await Promise.all([tip.save(), sender.save()])

    const populatedTip = await Tip.findById(tip._id)
      .populate("sender", "username displayName avatar")
      .populate("receiver", "username displayName avatar")

    res.status(201).json(populatedTip)
  } catch (error) {
    console.error("Error processing tip:", error)
    res.status(500).json({ message: "Server error while processing tip" })
  }
})

router.get("/:id/tips", verifyToken, async (req: Request, res: Response) => {
  try {
    const videoId = req.params.id

    const tips = await Tip.find({ video: videoId })
      .populate("sender", "username displayName avatar")
      .populate("receiver", "username displayName avatar")
      .sort({ createdAt: -1 })

    res.json(tips)
  } catch (error) {
    console.error("Error fetching tips:", error)
    res.status(500).json({ message: "Server error while fetching tips" })
  }
})

router.get("/:id/tips/summary", verifyToken, async (req: Request, res: Response) => {
  try {
    const videoId = req.params.id

    const tips = await Tip.find({ video: videoId })
    const totalAmount = tips.reduce((sum, tip) => sum + tip.amount, 0)
    const uniqueSenders = new Set(tips.map((tip) => tip.sender.toString())).size

    res.json({
      totalAmount,
      tipCount: tips.length,
      uniqueSenders,
    })
  } catch (error) {
    console.error("Error fetching tips summary:", error)
    res.status(500).json({ message: "Server error while fetching tips summary" })
  }
})

export default router




































































































































