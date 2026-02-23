import { NextResponse } from "next/server";
import dbConnect from "@/config/dbConnect";
import { validateCookie } from "@/app/api/services/cookieValidator/validateCookie";
import { customEmail } from "@/config/customEmail";
import { s3Client } from "@/app/lib/r2";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import Category from "@/models/category";
import { isAllowed } from "@/app/helper/origin_helper";

//Get all Category
export async function GET(req: Request) {
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

    // Get all Category
    const category = await Category.find({}).select("-_id");

    if (!category || category.length === 0) {
      return NextResponse.json(
        { success: false, message: "No categories found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, category });
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

// Update category name
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

    const { id, name } = await req.json();

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide a name to update",
        },
        { status: 400 },
      );
    }

    const updateData: Partial<{ name: string }> = {};

    const nameExists = await Category.findOne({ name }).where("id").ne(id);

    if (nameExists) {
      return NextResponse.json(
        { success: false, message: "Name already exists" },
        { status: 400 },
      );
    }

    updateData.name = name;

    const category = await Category.findOneAndUpdate({ id: id }, updateData, {
      new: true,
    });

    if (!category) {
      return NextResponse.json(
        { success: false, message: "Category not found" },
        { status: 404 },
      );
    }

    const email = process.env.EMAIL || "";
    if (!email) {
      throw new Error("EMAIL environment variable is not set.");
    }

    await customEmail(
      email,
      `Category ${category.name} has been updated`,
      `The category ${category.name} has been updated`,
    );

    return NextResponse.json({
      success: true,
      message: `${category.name} is being updated`,
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

//Delete category
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

    // Fetch category details
    const categoryDetail = await Category.findOneAndUpdate({ id: id });
    if (!categoryDetail) {
      return NextResponse.json(
        { success: false, message: "Category not found" },
        { status: 404 },
      );
    }

    const urlObj = new URL(categoryDetail.fileUrl);

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
    const category = await Category.findOneAndDelete({ id: id });
    if (!category) {
      return NextResponse.json(
        { success: false, message: "Category not found in the database" },
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
      `Category ${category.name} has been deleted`,
      `The category ${category.name} has been deleted`,
    );

    return NextResponse.json({
      success: true,
      message: `${category.name} is being deleted`,
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
