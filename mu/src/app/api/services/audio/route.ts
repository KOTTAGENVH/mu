import { NextResponse } from "next/server";
import dbConnect from "@/config/dbConnect";
import Upload from "@/models/upload";
import { validateCookie } from "@/app/api/services/cookieValidator/validateCookie";
import { customEmail } from "@/config/customEmail";
import { s3Client } from "@/app/lib/r2";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import Category from "@/models/category";
import mongoose from "mongoose";

//get audio
export async function POST(req: Request) {
  await dbConnect();

  try {
    // Validate Cookie
    const validationResult = await validateCookie(req);
    if (!validationResult.valid) {
      return NextResponse.json(
        { success: false, message: validationResult.error },
        { status: 401 },
      );
    }

    const {
      page = 1,
      limit = 10,
      search = "",
      category = "",
      useVector = false,
    } = await req.json();

    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const skip = (pageNumber - 1) * limitNumber;

    if (search && useVector) {
      const agg: any[] = [
        {
          $search: {
            index: "mubyNK", 
            text: {
              query: search,
              path: ["name", "artist"],
              fuzzy: {
                maxEdits: 2,
              },
            },
          },
        },
      ];
      if (category) {
        agg.push({
          $match: {
            category: new mongoose.Types.ObjectId(category),
          },
        });
      }
      agg.push({
        $facet: {
          metadata: [{ $count: "total" }],
          data: [
            { $skip: skip },
            { $limit: limitNumber },
            {
              $project: {
                _id: 0,
                id: 1,
                name: 1,
                artist: 1,
                category: 1,
                fileUrl: 1,
                favourite: 1,
                lastPlayedAt: 1,
                playCount: 1,
                skipCount: 1,
                score: { $meta: "searchScore" },
              },
            },
          ],
        },
      });

      const result = await Upload.aggregate(agg);

      const totalDocs = result[0]?.metadata[0]?.total || 0;
      const uploads = result[0]?.data || [];

      return NextResponse.json({
        success: true,
        pagination: {
          totalAudio: totalDocs,
          totalPages: Math.ceil(totalDocs / limitNumber),
          currentPage: pageNumber,
          perPage: limitNumber,
        },
        uploads,
      });
    }

    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { artist: { $regex: search, $options: "i" } },
      ];
    }

    if (category) {
      query.category = category;
    }

    const uploadsPromise = Upload.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber)
      .select("-_id")
      .populate("category")
      .lean();

    const countPromise = Upload.countDocuments(query);

    const [uploads, totalDocs] = await Promise.all([
      uploadsPromise,
      countPromise,
    ]);

    if (!uploads || uploads.length === 0) {
      return NextResponse.json(
        { success: false, message: "No uploads found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      pagination: {
        totalAudio: totalDocs,
        totalPages: Math.ceil(totalDocs / limitNumber),
        currentPage: pageNumber,
        perPage: limitNumber,
      },
      uploads,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 },
      );
    } else {
      return NextResponse.json(
        { success: false, message: "An unknown error occurred" },
        { status: 500 },
      );
    }
  }
}

//Handle favourite update
export async function PUT(req: Request) {
  await dbConnect();
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

    const { id, favourite } = await req.json();
    const audio = await Upload.findOneAndUpdate(
      { id: id },
      { favourite },
      { new: true },
    );
    if (!audio) {
      return NextResponse.json(
        { success: false, message: "Audio not found" },
        { status: 404 },
      );
    }

    const email = process.env.EMAIL || "";
    if (!email) {
      throw new Error("EMAIL environment variable is not set.");
    }

    await customEmail(
      email,
      `Favourite status of ${audio.name} has been updated`,
      `The favourite status of ${audio.name} has been updated to ${audio.favourite}`,
    );

    return NextResponse.json({
      success: true,
      message: `${audio.name} added to favourites`,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 },
      );
    } else {
      return NextResponse.json(
        { success: false, message: "An unknown error occurred" },
        { status: 500 },
      );
    }
  }
}

//Handle category and name update
export async function PATCH(req: Request) {
  await dbConnect();
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

    const { id, name, categoryid } = await req.json();

    //Check if the name and categoryid are empty
    if (!name && !categoryid) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide a name or category to update",
        },
        { status: 400 },
      );
    }

    const updateData: Partial<{ name: string; category: string }> = {};

    if (name) {
      const nameExists = await Upload.findOne({ name }).where("id").ne(id);
      if (nameExists) {
        return NextResponse.json(
          { success: false, message: "Name already exists" },
          { status: 400 },
        );
      }
      updateData.name = name;
    }

    if (categoryid) {
      if (!mongoose.Types.ObjectId.isValid(categoryid)) {
        return NextResponse.json(
          { success: false, message: "Invalid category ID format" },
          { status: 400 },
        );
      }

      const categoryExists = await Category.findById(categoryid);
      if (!categoryExists) {
        return NextResponse.json(
          { success: false, message: "Category not found" },
          { status: 404 },
        );
      }

      updateData.category = categoryid;
    }

    const audio = await Upload.findOneAndUpdate({ id: id }, updateData, {
      new: true,
    });

    if (!audio) {
      return NextResponse.json(
        { success: false, message: "Audio not found" },
        { status: 404 },
      );
    }

    const email = process.env.EMAIL || "";
    if (!email) {
      throw new Error("EMAIL environment variable is not set.");
    }

    await customEmail(
      email,
      `Audio ${audio.name} has been updated`,
      `The audio ${audio.name} has been updated`,
    );

    return NextResponse.json({
      success: true,
      message: `${audio.name} is being updated`,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 },
      );
    } else {
      return NextResponse.json(
        { success: false, message: "An unknown error occurred" },
        { status: 500 },
      );
    }
  }
}

//Delete audio
export async function DELETE(req: Request) {
  await dbConnect();
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

    const { id } = await req.json();

    // Fetch audio details
    const audioDetail = await Upload.findOneAndUpdate({ id: id });
    if (!audioDetail) {
      return NextResponse.json(
        { success: false, message: "Audio not found" },
        { status: 404 },
      );
    }

    const urlObj = new URL(audioDetail.fileUrl);

    const fileKey = decodeURIComponent(urlObj.pathname.slice(1));

    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: fileKey,
        }),
      );
    } catch (error) {
      console.warn(
        `Failed to delete file from R2 or file didn't exist: ${fileKey}`,
      );
      return NextResponse.json(
        { success: false, message: "Failed to delete file from R2" },
        { status: 500 },
      );
    }

    // Delete the database record
    const audio = await Upload.findOneAndUpdate({ id: id });
    if (!audio) {
      return NextResponse.json(
        { success: false, message: "Audio not found in the database" },
        { status: 404 },
      );
    }

    // Send email notification
    const email = process.env.EMAIL || "";
    if (!email) {
      throw new Error("EMAIL environment variable is not set.");
    }

    await customEmail(
      email,
      `Audio ${audio.name} has been deleted`,
      `The audio ${audio.name} has been deleted`,
    );

    return NextResponse.json({
      success: true,
      message: `${audio.name} is being deleted`,
    });
  } catch (error: unknown) {
    console.error("Error handling DELETE request:", error);
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { success: false, message: "An unknown error occurred" },
      { status: 500 },
    );
  }
}
