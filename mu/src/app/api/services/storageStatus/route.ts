import { NextResponse } from "next/server";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { s3Client } from "@/app/lib/r2";
import { validateCookie } from "../cookieValidator/validateCookie";

export async function GET(req: Request) {
  try {
    // Validate the cookie
    const validationResult = await validateCookie(req);
    if (!validationResult.valid) {
      console.log("Validation failed: ", validationResult.error);
      return NextResponse.json(
        { success: false, message: validationResult.error },
        { status: 401 },
      );
    }
    
    const r2_limit_gb = 10;
    const r2_limit_bytes = r2_limit_gb * 1024 * 1024 * 1024;

    let totalSize = 0;
    let totalObjects = 0;
    let continuationToken: string | undefined = undefined;
    let isTruncated = true;

    while (isTruncated) {
      const command: ListObjectsV2Command = new ListObjectsV2Command({
        Bucket: process.env.R2_BUCKET_NAME,
        ContinuationToken: continuationToken,
      });

      const response = await s3Client.send(command);

      if (response.Contents) {
        for (const file of response.Contents) {
          totalSize += file.Size || 0;
          totalObjects++;
        }
      }

      isTruncated = response.IsTruncated || false;
      continuationToken = response.NextContinuationToken;
    }

    const availableBytes = r2_limit_bytes - totalSize;
    const usedPercentage = (totalSize / r2_limit_bytes) * 100;

    return NextResponse.json({
      success: true,
      storage: {
        limitGB: r2_limit_gb,
        totalBytes: r2_limit_bytes,
        usedBytes: totalSize,
        availableBytes: availableBytes > 0 ? availableBytes : 0,
        usedPercentage: usedPercentage.toFixed(2) + "%",
        usedMB: (totalSize / (1024 * 1024)).toFixed(2),
        usedGB: (totalSize / (1024 * 1024 * 1024)).toFixed(2),
        fileCount: totalObjects,
      },
    });
  } catch (error: unknown) {
    console.error("R2 Storage Check Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to calculate storage" },
      { status: 500 },
    );
  }
}
