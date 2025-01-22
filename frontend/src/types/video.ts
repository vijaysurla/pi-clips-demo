export interface Video {
  _id: string
  id: string
  title: string
  description: string
  url: string
  signedUrl?: string
  thumbnail: string
  user: {
    _id: string
    username: string
    displayName: string
    avatar: string
  }
  likes: string[]
  views: number
  comments: any[]
  shares: number
  tips: number
  music: string
  createdAt: string
  isLiked: boolean
  commentCount: number
}

export interface VideoInteraction {
  videoId: string
  userId: string
  type: "like" | "view" | "share" | "tip"
  timestamp: Date
}




  
  
  
  
  
  