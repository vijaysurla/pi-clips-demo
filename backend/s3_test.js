require('dotenv').config();

const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const fetch = require('node-fetch');

// Log environment variables
console.log('Environment variables:');
console.log('AWS_REGION:', process.env.AWS_REGION);
console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? '[REDACTED]' : 'undefined');
console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? '[REDACTED]' : 'undefined');
console.log('S3_BUCKET_NAME:', process.env.S3_BUCKET_NAME);

// Initialize the S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function testS3Access() {
  try {
    // Add the "videos/" prefix to the file path
    const videoKey = "videos/eb70afac-bb7b-4252-b736-0469af2fb0b3-5040711-hd_1920_1080_30fps.mp4";
    
    // Generate a signed URL
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: videoKey,
      ResponseContentType: "video/mp4",
    });
    
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    console.log("Generated signed URL:", signedUrl);

    // Try to fetch the video using the signed URL
    const response = await fetch(signedUrl);
    
    if (response.ok) {
      console.log("Successfully fetched video. Status:", response.status);
      console.log("Content-Type:", response.headers.get('content-type'));
      console.log("Content-Length:", response.headers.get('content-length'));
    } else {
      console.error("Failed to fetch video. Status:", response.status);
      console.error("Error message:", await response.text());
    }
  } catch (error) {
    console.error("Error accessing S3:", error);
  }
}

testS3Access();