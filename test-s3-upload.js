require('dotenv').config();
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const fs = require('fs').promises;

const s3Client = new S3Client({ region: process.env.AWS_REGION });
const bucketName = 'pi-clips-videos';
const fileName = 'test-file.txt';
const fileContent = 'This is a test file for S3 upload and retrieval.';

async function testS3UploadAndRetrieve() {
  try {
    console.log('Starting S3 upload and retrieval test...');

    // Create a test file
    await fs.writeFile(fileName, fileContent);
    console.log(`Created test file: ${fileName}`);

    // Upload the file to S3
    const uploadParams = {
      Bucket: bucketName,
      Key: fileName,
      Body: await fs.readFile(fileName)
    };
    await s3Client.send(new PutObjectCommand(uploadParams));
    console.log(`Successfully uploaded ${fileName} to ${bucketName}`);

    // Retrieve file metadata
    const headParams = {
      Bucket: bucketName,
      Key: fileName
    };
    const headResult = await s3Client.send(new GetObjectCommand(headParams));
    console.log('File metadata:', headResult.Metadata);

    // Download the file content
    const getParams = {
      Bucket: bucketName,
      Key: fileName
    };
    const { Body } = await s3Client.send(new GetObjectCommand(getParams));
    const downloadedContent = await streamToString(Body);
    console.log('Downloaded file content:', downloadedContent);

    // Delete the file from S3
    const deleteParams = {
      Bucket: bucketName,
      Key: fileName
    };
    await s3Client.send(new DeleteObjectCommand(deleteParams));
    console.log(`Successfully deleted ${fileName} from ${bucketName}`);

    // Clean up local test file
    await fs.unlink(fileName);
    console.log(`Deleted local test file: ${fileName}`);

    console.log('S3 upload and retrieval test completed successfully!');
  } catch (error) {
    console.error('Error:', error.message);
    if (error.$metadata) {
      console.error('Error details:', {
        requestId: error.$metadata.requestId,
        cfId: error.$metadata.cfId,
        extendedRequestId: error.$metadata.extendedRequestId
      });
    }
  }
}

// Helper function to convert a readable stream to a string
async function streamToString(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf-8');
}

testS3UploadAndRetrieve();