export interface User {
    _id: string;
    uid: string;
    username: string;
    displayName: string;
    avatar: string;
    bio?: string;
    instagram?: string;
    youtube?: string;
    following: string[];
    followers: string[];
    likes: number;
    tokenBalance: number;
  }
  
  
  
  