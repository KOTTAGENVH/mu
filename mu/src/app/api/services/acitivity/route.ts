import { NextResponse } from "next/server";
import dbConnect from "@/config/dbConnect";
import { validateCookie } from "@/app/api/services/cookieValidator/validateCookie";
import { isAllowed } from "@/app/helper/origin_helper";
import Activity from "@/models/activity";
import { customEmail } from "@/config/customEmail";

//Get all Activity
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
        { success: false, message: validationResult.error },
        { status: 401 },
      );
    }

    const body = await req.json();
    const page = parseInt(body.page) || 1;
    const limit = parseInt(body.limit) || 10;
    const skip = (page - 1) * limit;

    const [activities, totalCount] = await Promise.all([
      Activity.find({})
        .select("-_id")
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit),
      Activity.countDocuments({}),
    ]);

    return NextResponse.json({
      success: true,
      activities,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
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

//Delete Activity
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

    const IST_TIMEZONE = "Asia/Kolkata";
    const now = new Date().toLocaleString("en-IN", { timeZone: IST_TIMEZONE });
    const { id, ip } = await req.json();
    const email = process.env.EMAIL || "";
    if (!email) {
      throw new Error("EMAIL environment variable is not set.");
    }

    if (id) {
      // Delete one activty by id
      const deletedActivity = await Activity.findOneAndDelete({ id: id });

      if (!deletedActivity) {
        return NextResponse.json(
          { success: false, message: "Activity not found in the database" },
          { status: 404 },
        );
      }
      await customEmail(
        email,
        `Activity ${deletedActivity.taskname} has been deleted at  at ${now}`,
        `The activity with ID ${id} was deleted successfully.`,
        ip,
      );

      return NextResponse.json({
        success: true,
        message: "Activity deleted successfully",
      });
    } else {
      const result = await Activity.deleteMany({});

      if (!result.acknowledged) {
        return NextResponse.json(
          { success: false, message: "Activity logs could not be reset" },
          { status: 500 },
        );
      }

      await customEmail(
        email,
        `Activity Logs have been reset`,
        `All activity logs were cleared at ${now}.`,
        ip,
      );
    }
    return NextResponse.json({
      success: true,
      message: "All activities have been cleared",
    });
  } catch (error: unknown) {
    console.error("Error handling DELETE request:", error);
    // if (error instanceof Error) {
    //   return NextResponse.json(
    //     { success: false, message: error.message },
    //     { status: 500 },
    //   );
    // }
    return NextResponse.json(
      { success: false, message: "An unknown error occurred" },
      { status: 500 },
    );
  }
}
