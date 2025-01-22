require("dotenv").config()
const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3")
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner")

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

const bucketName = "pi-clips-videos"
const fileName = "test.txt"
const fileContent = "This is a test file to verify S3 permissions."

async function uploadFile() {
  const params = {
    Bucket: bucketName,
    Key: fileName,
    Body: fileContent,
  }

  try {
    const command = new PutObjectCommand(params)
    await s3Client.send(command)
    console.log(`File uploaded successfully to ${bucketName}/${fileName}`)
  } catch (err) {
    console.error("Error uploading file:", err)
  }
}

async function readFile() {
  const params = {
    Bucket: bucketName,
    Key: fileName,
  }

  try {
    const command = new GetObjectCommand(params)
    const { Body } = await s3Client.send(command)
    const content = await streamToString(Body)
    console.log("File content:", content)

    // Generate a signed URL
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 })
    console.log("Signed URL:", signedUrl)
  } catch (err) {
    console.error("Error reading file:", err)
  }
}

function streamToString(stream) {
  return new Promise((resolve, reject) => {
    const chunks = []
    stream.on("data", (chunk) => chunks.push(chunk))
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")))
    stream.on("error", reject)
  })
}

async function runTest() {
  console.log("AWS Region:", process.env.AWS_REGION)
  console.log("AWS Access Key ID:", process.env.AWS_ACCESS_KEY_ID ? "Set" : "Not set")
  console.log("AWS Secret Access Key:", process.env.AWS_SECRET_ACCESS_KEY ? "Set" : "Not set")

  await uploadFile()
  await readFile()
}

runTest()



