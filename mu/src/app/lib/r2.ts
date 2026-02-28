import { S3Client} from "@aws-sdk/client-s3";

//validate env variables
if (!process.env.CLOUDFLARE_ACCOUNT_ID ||
    !process.env.CLOUDFLARE_ACCESS_KEY_ID ||
    !process.env.CLOUDFLARE_SECRET_ACCESS_KEY ||
    !process.env.R2_BUCKET_NAME) {
  throw new Error("Missing required Cloudflare R2 environment variables");
}

export const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY || "",
  },
});