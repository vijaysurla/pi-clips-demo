require("dotenv").config()
const { S3Client, ListBucketsCommand, ListObjectsV2Command } = require("@aws-sdk/client-s3")

const s3Client = new S3Client({ region: process.env.AWS_REGION })

async function testS3Connection() {
  try {
    console.log("Testing S3 connection...")

    // List all buckets
    const listBucketsCommand = new ListBucketsCommand({})
    const { Buckets } = await s3Client.send(listBucketsCommand)

    console.log("Successfully connected to S3!")
    console.log(
      "Available buckets:",
      Buckets.map((b) => b.Name),
    )

    // Test specific bucket access
    const bucketName = "pi-clips-videos" // Replace with your actual bucket name if different
    const listObjectsCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      MaxKeys: 5,
    })

    const response = await s3Client.send(listObjectsCommand)

    console.log(`\nSuccessfully accessed '${bucketName}' bucket!`)

    if (response.Contents && response.Contents.length > 0) {
      console.log("First 5 objects in the bucket:")
      response.Contents.forEach((item) => console.log(` - ${item.Key}`))
    } else {
      console.log("The bucket is empty or you may not have permission to list its contents.")
    }

    console.log("\nBucket details:")
    console.log(JSON.stringify(response, null, 2))
  } catch (error) {
    console.error("Error:", error.message)
    if (error.$metadata) {
      console.error("Error details:", {
        requestId: error.$metadata.requestId,
        cfId: error.$metadata.cfId,
        extendedRequestId: error.$metadata.extendedRequestId,
      })
    }
  }
}

testS3Connection()



