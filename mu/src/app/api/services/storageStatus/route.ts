import { NextResponse } from "next/server";
import {
  ListObjectsV2Command,
  ListObjectsV2CommandOutput,
} from "@aws-sdk/client-s3";
import { s3Client, s3Client2 } from "@/app/lib/r2";
import { validateCookie } from "../cookieValidator/validateCookie";
import { isAllowed } from "@/app/helper/origin_helper";

export async function GET(req: Request) {
  try {
    if (!isAllowed(req)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

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

    const bucketsConfig = [
      { name: process.env.R2_BUCKET_NAME, client: s3Client },
      { name: process.env.R2_IMG_BUCKET_NAME, client: s3Client2 },
    ];

    const bucketStats = await Promise.all(
      bucketsConfig.map(async (config) => {
        if (!config.name) return { size: 0, count: 0 };

        let size = 0;
        let count = 0;
        let continuationToken: string | undefined = undefined;
        let isTruncated = true;

        while (isTruncated) {
          const command = new ListObjectsV2Command({
            Bucket: config.name,
            ContinuationToken: continuationToken,
          });

          const response: ListObjectsV2CommandOutput =
            await config.client.send(command);

          if (response.Contents) {
            for (const file of response.Contents) {
              size += file.Size || 0;
              count++;
            }
          }

          isTruncated = response.IsTruncated ?? false;
          continuationToken = response.NextContinuationToken;
        }

        return { size, count };
      }),
    );

    let totalSize = 0;
    let totalObjects = 0;

    for (const stat of bucketStats) {
      totalSize += stat.size;
      totalObjects += stat.count;
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
