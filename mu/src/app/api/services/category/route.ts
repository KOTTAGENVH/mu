import { NextResponse } from "next/server";
import dbConnect from "@/config/dbConnect";
import { validateCookie } from "@/app/api/services/cookieValidator/validateCookie";
import Category from "@/models/category";
import { isAllowed } from "@/app/helper/origin_helper";
import { generateId } from "@/app/helper/uniqueIdGenerator";
import Upload from "@/models/upload";
import Activity, { ActionType, ActivityType } from "@/models/activity";

//Post new category
export async function POST(req: Request) {
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
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }
    let uniqueId = "";
    let idLength = 6;
    let isUnique = false;

    while (!isUnique) {
      uniqueId = generateId(idLength);

      const existingAudio = await Category.findOne({ id: uniqueId });

      if (!existingAudio) {
        isUnique = true;
      } else {
        idLength++;
      }
    }

    const { name } = await req.json();

    if (!name) {
      return NextResponse.json(
        { success: false, message: "Please provide a category name" },
        { status: 400 },
      );
    }

    const existingName = await Category.findOne({ name });
    if (existingName) {
      return NextResponse.json(
        { success: false, message: "Category name already exists" },
        { status: 400 },
      );
    }
    const newCategory = await Category.create({
      id: uniqueId,
      name: name,
    });

    // Add Activty
    let uniqueActivtyId = "";
    let activityIdLength = 6;
    let isActivtyUnique = false;

    while (!isActivtyUnique) {
      uniqueActivtyId = generateId(activityIdLength);

      const existingActivityID = await Activity.findOne({
        id: uniqueActivtyId,
      });

      if (!existingActivityID) {
        isActivtyUnique = true;
      } else {
        activityIdLength++;
      }
    }

    const IST_TIMEZONE = "Asia/Kolkata";
    const now = new Date();

    const activity = await Activity.create({
      id: uniqueActivtyId,
      taskname: `A new category named "${newCategory.name}" has been created with ID: ${newCategory.id}`,
      type: ActivityType.CATEGORY,
      action: ActionType.ADD,
      date: now.toLocaleDateString("en-IN", { timeZone: IST_TIMEZONE }),
      time: now.toLocaleTimeString("en-IN", {
        timeZone: IST_TIMEZONE,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }),
      timezone: "IST",
    });

    if (!activity) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Sorry, an error occurred while recording the creating category activity.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Category created successfully",
        category: newCategory,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error("Error in POST category:", error);
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
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    // Get all Category
    const category = await Category.find({}).select("-_id");

    // if (!category || category.length === 0) {
    //   return NextResponse.json(
    //     { success: false, message: "No categories found" },
    //     { status: 404 },
    //   );
    // }

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
        { success: false, message: "Unauthorized" },
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

    // Add Activty
    let uniqueActivtyId = "";
    let activityIdLength = 6;
    let isActivtyUnique = false;

    while (!isActivtyUnique) {
      uniqueActivtyId = generateId(activityIdLength);

      const existingActivityID = await Activity.findOne({
        id: uniqueActivtyId,
      });

      if (!existingActivityID) {
        isActivtyUnique = true;
      } else {
        activityIdLength++;
      }
    }

    const IST_TIMEZONE = "Asia/Kolkata";
    const now = new Date();

    const activity = await Activity.create({
      id: uniqueActivtyId,
      taskname: `The category ${category.name} has been updated`,
      type: ActivityType.CATEGORY,
      action: ActionType.EDIT,
      date: now.toLocaleDateString("en-IN", { timeZone: IST_TIMEZONE }),
      time: now.toLocaleTimeString("en-IN", {
        timeZone: IST_TIMEZONE,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }),
      timezone: "IST",
    });

    if (!activity) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Sorry, an error occurred while recording the category update activity.",
        },
        { status: 500 },
      );
    }

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
      // console.log("Validation failed: ", validationResult.error);
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await req.json();

    const categoryToDelete = await Category.findOne({ id: id });

    if (!categoryToDelete) {
      return NextResponse.json(
        { success: false, message: "Category not found" },
        { status: 404 },
      );
    }

    const associatedUploads = await Upload.countDocuments({
      category: categoryToDelete._id,
    });

    if (associatedUploads > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot delete. There are ${associatedUploads} songs using this category. Please delete or reassign them first.`,
        },
        { status: 400 },
      );
    }

    await Category.findOneAndDelete({ id: id });

    // Add Activty
    let uniqueActivtyId = "";
    let activityIdLength = 6;
    let isActivtyUnique = false;

    while (!isActivtyUnique) {
      uniqueActivtyId = generateId(activityIdLength);

      const existingActivityID = await Activity.findOne({
        id: uniqueActivtyId,
      });

      if (!existingActivityID) {
        isActivtyUnique = true;
      } else {
        activityIdLength++;
      }
    }

    const IST_TIMEZONE = "Asia/Kolkata";
    const now = new Date();

    const activity = await Activity.create({
      id: uniqueActivtyId,
      taskname: `The category "${categoryToDelete.name}" has been deleted.`,
      type: ActivityType.CATEGORY,
      action: ActionType.DELETE,
      date: now.toLocaleDateString("en-IN", { timeZone: IST_TIMEZONE }),
      time: now.toLocaleTimeString("en-IN", {
        timeZone: IST_TIMEZONE,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }),
      timezone: "IST",
    });

    if (!activity) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Sorry, an error occurred while recording the category delete activity.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: `${categoryToDelete.name} has been deleted`,
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
