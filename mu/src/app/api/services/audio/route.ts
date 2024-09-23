import { NextResponse } from "next/server";
import dbConnect from "@/config/dbConnect";
import Upload from "@/models/upload";
import { validateCookie } from "@/app/api/services/cookieValidator/validateCookie";
import { customEmail } from "@/config/customEmail";
import { storage1 } from "@/config/firebase1";
import { ref, deleteObject } from "@firebase/storage";

// Handle the GET request for audio
export async function GET(req: Request) {
  await dbConnect();

  try {
    // Validate the cookie
    const validationResult = await validateCookie(req);
    if (!validationResult.valid) {
      console.log("Validation failed: ", validationResult.error);
      return NextResponse.json(
        { success: false, message: validationResult.error },
        { status: 401 }
      );
    }

    // Get all uploads
    const uploads = await Upload.find({});
    if (!uploads) {
      return NextResponse.json(
        { success: false, message: "No uploads found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, uploads });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    } else {
      return NextResponse.json(
        { success: false, message: "An unknown error occurred" },
        { status: 500 }
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
        { status: 401 }
      );
    }

    const { _id, favourite } = await req.json();
    const audio = await Upload.findByIdAndUpdate(
      _id,
      { favourite },
      { new: true }
    );
    if (!audio) {
      return NextResponse.json(
        { success: false, message: "Audio not found" },
        { status: 404 }
      );
    }

    await customEmail(
      "nowenportfolio@gmail.com",
      `Favourite status of ${audio.name} has been updated`,
      `The favourite status of ${audio.name} has been updated to ${audio.favourite}`
    );

    return NextResponse.json({ success: true, message: "Favourite updated" });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    } else {
      return NextResponse.json(
        { success: false, message: "An unknown error occurred" },
        { status: 500 }
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
        { status: 401 }
      );
    }

    const { _id, name, category } = await req.json();

    //Check if the name and category are empty
    if (!name || !category) {
      return NextResponse.json(
        { success: false, message: "Name and category are required" },
        { status: 400 }
      );
    }

    //Check if the Name is already taken
    const nameExists = await Upload.findOne({ name }).where("_id").ne(_id);
    if (nameExists) {
      return NextResponse.json(
        { success: false, message: "Name already exists" },
        { status: 400 }
      );
    }
    const audio = await Upload.findByIdAndUpdate(
      _id,
      { name, category },
      { new: true }
    );
    if (!audio) {
      return NextResponse.json(
        { success: false, message: "Audio not found" },
        { status: 404 }
      );
    }

    await customEmail(
      "nowenportfolio@gmail.com",
      `Audio ${audio.name} has been updated`,
      `The audio ${audio.name} has been updated`
    );

    return NextResponse.json({ success: true, message: "Audio updated" });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    } else {
      return NextResponse.json(
        { success: false, message: "An unknown error occurred" },
        { status: 500 }
      );
    }
  }
}

//Handle delete
export async function DELETE(req: Request) {
  await dbConnect();
  try {
    // Validate the cookie
    const validationResult = await validateCookie(req);
    if (!validationResult.valid) {
      console.log("Validation failed: ", validationResult.error);
      return NextResponse.json(
        { success: false, message: validationResult.error },
        { status: 401 }
      );
    }

    const { _id } = await req.json();

    //Delete the audio from firebase Storage
    const audioDetail = await Upload.findById(_id);
    if (!audioDetail) {
      return NextResponse.json(
        { success: false, message: "Audio not found" },
        { status: 404 }
      );
    }

    //Extract File Path From Firebase
    const extractFilePathFromUrl = (fileUrl: string) => {
      const bucketName = "muaudio1.appspot.com";
      const pathStart = fileUrl.indexOf(bucketName) + bucketName.length + 1;

      const filePath = fileUrl.substring(pathStart);

      return decodeURIComponent(filePath);
    };

    // Extract the file path from the fileUrl
    const filePath = extractFilePathFromUrl(audioDetail.fileUrl);

    //Delete the audio from firebase Storage
    const audioRef = ref(storage1, filePath);
    await deleteObject(audioRef).catch((error) => {
      console.error("Error deleting the audio file:", error);
      return NextResponse.json(
        { success: false, message: "Error deleting the audio file" },
        { status: 500 }
      );
    });

    const audio = await Upload.findByIdAndDelete(_id);
    if (!audio) {
      return NextResponse.json(
        { success: false, message: "Audio not found" },
        { status: 404 }
      );
    }

    await customEmail(
      "nowenportfolio@gmail.com",
      `Audio ${audio.name} has been deleted`,
      `The audio ${audio.name} has been deleted`
    );

    return NextResponse.json({ success: true, message: "Audio deleted" });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    } else {
      return NextResponse.json(
        { success: false, message: "An unknown error occurred" },
        { status: 500 }
      );
    }
  }
}
