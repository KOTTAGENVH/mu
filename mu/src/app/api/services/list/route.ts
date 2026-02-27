import { NextResponse } from "next/server";
import dbConnect from "@/config/dbConnect";
import { validateCookie } from "@/app/api/services/cookieValidator/validateCookie";
import { customEmail } from "@/config/customEmail";
import List from "@/models/list";
import { isAllowed } from "@/app/helper/origin_helper";
import { generateId } from "@/app/helper/uniqueIdGenerator";

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
        { success: false, message: validationResult.error },
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

    const email = process.env.EMAIL || "";
    if (email) {
      try {
        await customEmail(
          email,
          `New List Created`,
          `A new list named "${newList.name}" has been created with ID: ${newList.id}`,
        );
      } catch (emailError) {
        console.error("Failed to send email notification:", emailError);
      }
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
        { success: false, message: validationResult.error },
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

    const email = process.env.EMAIL || "";
    if (!email) {
      throw new Error("EMAIL environment variable is not set.");
    }

    await customEmail(
      email,
      `List ${list.name} has been updated`,
      `The list ${list.name} has been updated`,
    );

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
        { success: false, message: validationResult.error },
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

    // Send email notification
    const email = process.env.EMAIL || "";
    if (!email) {
      throw new Error("EMAIL environment variable is not set.");
    }

    await customEmail(
      email,
      `List ${list.name} has been deleted`,
      `The list ${list.name} has been deleted`,
    );

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
