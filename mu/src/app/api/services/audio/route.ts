import { NextResponse } from "next/server";
import dbConnect from "@/config/dbConnect";
import Upload from "@/models/upload";
import { validateCookie } from "@/app/api/services/cookieValidator/validateCookie";
import { customEmail } from "@/config/customEmail";
import { ref, deleteObject, StorageError, type FirebaseStorage } from "@firebase/storage";
import { storage5 } from "@/config/firebase5";

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

    const email = process.env.NEXT_PUBLIC_EMAIL || "";
    if (!email) {
      throw new Error("EMAIL environment variable is not set.");
    }

    await customEmail(
      email,
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

    const email = process.env.NEXT_PUBLIC_EMAIL || "";
    if (!email) {
      throw new Error("EMAIL environment variable is not set.");
    }

    await customEmail(
      email,
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

    // Fetch audio details
    const audioDetail = await Upload.findById(_id);
    if (!audioDetail) {
      return NextResponse.json(
        { success: false, message: "Audio not found" },
        { status: 404 }
      );
    }

    // Helper: Extract File Path From Firebase URL
    const extractFilePathFromUrl = (fileUrl: string) => {
      const bucketNames = [
        process.env.BUCKET5,
      ];
    
      for (const bucket of bucketNames) {
        if (!bucket) {
          throw new Error("Bucket environment variable is not set properly.");
        }
        if (fileUrl.includes(bucket)) {
          const pathStart = fileUrl.indexOf(`${bucket}/o/`) + `${bucket}/o/`.length;
          const encodedFilePath = fileUrl.substring(pathStart).split("?")[0]; // Remove query params
          const filePath = decodeURIComponent(encodedFilePath); // Decode %2F to /
          return { bucketName: bucket, filePath };
        }
      }
    
      throw new Error("Bucket not found in the file URL");
    };
    

    // Extract bucket name and file path
    const { bucketName, filePath } = extractFilePathFromUrl(audioDetail.fileUrl);

    // Helper: Map bucket name to storage instance
    const getStorageInstance = (bucketName: string): FirebaseStorage => {
      const storageMap: Record<string, FirebaseStorage> = {
        [process.env.BUCKET5!]: storage5 as FirebaseStorage,
      };
    
      const storageInstance = storageMap[bucketName];
      if (!storageInstance) {
        throw new Error(`No storage instance mapped for bucket: ${bucketName}`);
      }
      return storageInstance;
    };

    // Get the storage instance
    const storageInstance = getStorageInstance(bucketName);

    // Reference to the file in storage
    const audioRef = ref(storageInstance, filePath);

    // Attempt to delete the file
    try {
      await deleteObject(audioRef);
    } catch (error) {
      if (error instanceof StorageError && error.code === "storage/object-not-found") {
        console.warn(`File not found: ${filePath}`);
      } else {
        throw error; // Rethrow if it's a different error
      }
    }

    // Delete the database record
    const audio = await Upload.findByIdAndDelete(_id);
    if (!audio) {
      return NextResponse.json(
        { success: false, message: "Audio not found in the database" },
        { status: 404 }
      );
    }

    // Send email notification
    const email = process.env.NEXT_PUBLIC_EMAIL || "";
    if (!email) {
      throw new Error("EMAIL environment variable is not set.");
    }

    await customEmail(
      email,
      `Audio ${audio.name} has been deleted`,
      `The audio ${audio.name} has been deleted`
    );

    return NextResponse.json({ success: true, message: "Audio deleted" });
  } catch (error: unknown) {
    console.error("Error handling DELETE request:", error);
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { success: false, message: "An unknown error occurred" },
      { status: 500 }
    );
  }
}
