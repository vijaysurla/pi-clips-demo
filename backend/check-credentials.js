require("dotenv").config()
const { fromEnv } = require("@aws-sdk/credential-providers")

function checkEnvironmentVariables() {
  console.log("Checking environment variables:")
  console.log("AWS_ACCESS_KEY_ID:", process.env.AWS_ACCESS_KEY_ID ? "Set" : "Not set")
  console.log("AWS_SECRET_ACCESS_KEY:", process.env.AWS_SECRET_ACCESS_KEY ? "Set" : "Not set")
  console.log("AWS_REGION:", process.env.AWS_REGION || "Not set")
}

async function checkAWSCredentials() {
  try {
    const credentialsProvider = fromEnv()
    const credentials = await credentialsProvider()

    console.log("\nChecking AWS credentials:")
    if (credentials.accessKeyId && credentials.secretAccessKey) {
      console.log("Access Key ID:", credentials.accessKeyId)
      console.log("Secret Access Key (first 5 characters):", credentials.secretAccessKey.substring(0, 5) + "...")
      console.log("Session Token:", credentials.sessionToken ? "Present" : "Not Present")
      console.log("Region:", process.env.AWS_REGION)
    } else {
      console.log("AWS credentials not found.")
    }
  } catch (error) {
    console.error("Error retrieving AWS credentials:", error.message)
  }
}

checkEnvironmentVariables()
checkAWSCredentials()



