import { S3Client } from "@aws-sdk/client-s3";

//validate env variables
if (
  !process.env.CLOUDFLARE_ACCOUNT_ID ||
  !process.env.CLOUDFLARE_ACCESS_KEY_ID ||
  !process.env.CLOUDFLARE_SECRET_ACCESS_KEY ||
  !process.env.R2_BUCKET_NAME ||
  !process.env.S3_ENDPOINT ||
  !process.env.S3_ENDPOINT_IMG ||
  !process.env.CLOUDFLARE_IMG_ACCESS_KEY_ID ||
  !process.env.CLOUDFLARE_IMG_SECRET_ACCESS_KEY ||
  !process.env.R2_IMG_BUCKET_NAME
) {
  throw new Error("Missing required Cloudflare R2 environment variables");
}

export const s3Client = new S3Client({
  region: "auto",
  endpoint: `${process.env.S3_ENDPOINT}`,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY || "",
  },
});

export const s3Client2 = new S3Client({
  region: "auto",
  endpoint: `${process.env.S3_ENDPOINT_IMG}`,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_IMG_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.CLOUDFLARE_IMG_SECRET_ACCESS_KEY || "",
  },
});
