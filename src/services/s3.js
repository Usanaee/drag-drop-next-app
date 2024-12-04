import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// env varibles
const BUCKET_NAME = process.env.AWS_BUCKET_NAME;
const AWS_REGION = process.env.AWS_REGION;
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const WASABI_ENDPOINT_URL = process.env.WASABI_ENDPOINT_URL;

// Initialize S3 client
const s3 = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
  endpoint: WASABI_ENDPOINT_URL,
  forcePathStyle: true,
});

// Function to get to uppload file
export async function fileUpload(fileName, fileType) {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: `uploads/${fileName}`,
      ContentType: fileType,
    };

    const command = new PutObjectCommand(params);
    const uploadURL = await getSignedUrl(s3, command, { expiresIn: 3600 });

    return uploadURL;
  } catch (error) {
    throw new Error("Error generating pre-signed URL: " + error.message);
  }
}
