import { NextResponse } from "next/server";
import dbConnect from "@/config/dbConnect";
import { validateCookie } from "@/app/api/services/cookieValidator/validateCookie";
import List from "@/models/list";
import { isAllowed } from "@/app/helper/origin_helper";
import { generateId } from "@/app/helper/uniqueIdGenerator";
import Activity, { ActionType, ActivityType } from "@/models/activity";

//Post new list
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

      const existingAudio = await List.findOne({ id: uniqueId });

      if (!existingAudio) {
        isUnique = true;
      } else {
        idLength++;
      }
    }

    const { name } = await req.json();

    if (!name) {
      return NextResponse.json(
        { success: false, message: "Please provide a list name" },
        { status: 400 },
      );
    }

    const existingName = await List.findOne({ name });
    if (existingName) {
      return NextResponse.json(
        { success: false, message: "List name already exists" },
        { status: 400 },
      );
    }
    const newList = await List.create({
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
      taskname: `A new list named "${newList.name}" has been created with ID: ${newList.id}`,
      type: ActivityType.WISHLIST,
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
            "Sorry, an error occurred while recording the whistlist activity.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "List created successfully",
        list: newList,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error("Error in POST list:", error);
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

//Get all lists
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

    // Get all lists
    const lists = await List.find({}).select("-_id");

    // if (!lists || lists.length === 0) {
    //   return NextResponse.json(
    //     { success: false, message: "No lists found" },
    //     { status: 404 },
    //   );
    // }

    return NextResponse.json({ success: true, lists });
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

// Update list name
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

    const nameExists = await List.findOne({ name }).where("id").ne(id);

    if (nameExists) {
      return NextResponse.json(
        { success: false, message: "Name already exists" },
        { status: 400 },
      );
    }

    updateData.name = name;

    const list = await List.findOneAndUpdate({ id: id }, updateData, {
      new: true,
    });

    if (!list) {
      return NextResponse.json(
        { success: false, message: "List not found" },
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
      taskname: `The list ${list.name} has been updated`,
      type: ActivityType.WISHLIST,
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
            "Sorry, an error occurred while recording the update wishlist activity.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: `${list.name} is being updated`,
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

//Delete list
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
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await req.json();

    // Delete the database record
    const list = await List.findOneAndDelete({ id: id });
    if (!list) {
      return NextResponse.json(
        { success: false, message: "List not found in the database" },
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
      taskname: `The list ${list.name} has been deleted`,
      type: ActivityType.WISHLIST,
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
            "Sorry, an error occurred while recording the delete wishlist activity.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: `${list.name} is being deleted`,
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
