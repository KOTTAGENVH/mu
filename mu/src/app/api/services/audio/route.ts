import { NextResponse } from "next/server";
import dbConnect from "@/config/dbConnect";
import Upload from "@/models/upload";
import { validateCookie } from "@/app/api/services/cookieValidator/validateCookie";
import { customEmail } from "@/config/customEmail";
import { s3Client } from "@/app/lib/r2";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import Category from "@/models/category";
import { isAllowed } from "@/app/helper/origin_helper";

//get audio
export async function POST(req: Request) {
  await dbConnect();

  try {
    if (!isAllowed(req)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

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

    let categoryObjectId = null;

    if (category) {
      const categoryDoc = (await Category.findOne({ id: category })
        .select("_id")
        .lean()) as any;

      if (categoryDoc) {
        categoryObjectId = categoryDoc._id;
      } else {
        return NextResponse.json({
          success: true,
          pagination: {
            totalAudio: 0,
            totalPages: 0,
            currentPage: pageNumber,
            perPage: limitNumber,
          },
          uploads: [],
        });
      }
    }

    if (search && useVector) {
      const agg: any[] = [
        {
          $search: {
            index: "mubyNK",
            compound: {
              should: [
                {
                  autocomplete: {
                    query: search,
                    path: "name",
                    fuzzy: { maxEdits: 1 },
                  },
                },
                {
                  autocomplete: {
                    query: search,
                    path: "artist",
                    fuzzy: { maxEdits: 1 },
                  },
                },
              ],
              minimumShouldMatch: 1,
            },
          },
        },
      ];
      if (categoryObjectId) {
        agg.push({
          $match: {
            category: categoryObjectId,
          },
        });
      }
      agg.push({
        $facet: {
          metadata: [{ $count: "total" }],
          data: [
            { $sort: { score: { $meta: "searchScore" } } },
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

      await Upload.populate(uploads, { path: "category" });

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

    if (categoryObjectId) {
      query.category = categoryObjectId;
    }

    const uploadsPromise = Upload.find(query)
      .sort({ createdAt: -1, _id: -1 })
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

    // if (!uploads || uploads.length === 0) {
    //   return NextResponse.json(
    //     { success: true, message: "No uploads found" },
    //     { status: 404 },
    //   );
    // }

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

//Handle audio update
export async function PATCH(req: Request) {
  await dbConnect();
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

    const body = await req.json();
    const { id, favourite, name, categoryid, artist } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID is required" },
        { status: 400 },
      );
    }

    const updateFields: any = {};

    if (name) {
      updateFields.name = name.replace(/[^a-zA-Z]/g, "");
    }

    if (artist) {
      updateFields.artist = artist.replace(/[^a-zA-Z]/g, "");
    }

    if (categoryid) {
      const catrgory = await Category.findOne({ id: categoryid });
      updateFields.category = catrgory?._id;
    }

    if (favourite !== undefined) {
      updateFields.favourite = favourite;
    }

    const audio = await Upload.findOneAndUpdate(
      { id: id },
      { $set: updateFields },
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
      `Details for ${audio.name} have been updated`,
      `The details for ${audio.name} have been updated successfully.`,
    );

    return NextResponse.json({
      success: true,
      message: `${audio.name} audio updated successfully`,
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

    const { id } = await req.json();

    // Fetch audio details
    const audioDetail = await Upload.findOne({ id: id });
    if (!audioDetail) {
      return NextResponse.json(
        { success: false, message: "Audio not found" },
        { status: 404 },
      );
    }

    const fileKey = audioDetail.fileUrl;

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
    const audio = await Upload.findOneAndDelete({ id: id });
    if (!audio) {
      return NextResponse.json(
        { success: false, message: "Audio found but failed to delete from DB" },
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
