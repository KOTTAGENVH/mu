import { NextResponse } from "next/server";
import dbConnect from "@/config/dbConnect";
import { validateCookie } from "@/app/api/services/cookieValidator/validateCookie";
import List from "@/models/list";
import { isAllowed } from "@/helper/origin_helper";
import { generateId } from "@/helper/uniqueIdGenerator";
import Activity, { ActionType, ActivityType } from "@/models/activity";
import {
  encryptName,
  decryptName,
  nameIndex,
  normalizeName,
} from "@/helper/wishList/listEnc";

const max_name_length = 100;
const no_store = { "Cache-Control": "no-store" };

// ---------- helpers ----------

async function guard(req: Request): Promise<NextResponse | null> {
  if (!isAllowed(req)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const validationResult = await validateCookie(req);
  if (!validationResult.valid) {
    console.log("Validation failed: ", validationResult.error);
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }
  return null;
}

async function readJson(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await req.json();
    return body && typeof body === "object" ? body : null;
  } catch {
    return null;
  }
}

//To prevent duplicates may look visually same but differ in unicode NFC is used in helper
function parseName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const name = normalizeName(raw);
  if (!name || name.length > max_name_length) return null;
  return name;
}

async function generateUniqueId(
  exists: (id: string) => Promise<unknown>,
): Promise<string> {
  let length = 6;
  for (;;) { //infinite loop till non dup id is genrated
    const id = generateId(length);
    if (!(await exists(id))) return id;
    length++;
  }
}

function isDuplicateKeyError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { code?: number }).code === 11000
  );
}

async function logActivity(taskname: string, action: ActionType) {
  const id = await generateUniqueId((x) => Activity.exists({ id: x }));
  const tz = "Asia/Kolkata";
  const now = new Date();
  await Activity.create({
    id,
    taskname,
    type: ActivityType.WISHLIST,
    action,
    date: now.toLocaleDateString("en-IN", { timeZone: tz }),
    time: now.toLocaleTimeString("en-IN", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }),
    timezone: "IST",
  });
}

function serverError(context: string, error: unknown) {
  console.error(`Error in ${context}:`, error);
  return NextResponse.json(
    { success: false, message: "An unexpected error occurred" },
    { status: 500 },
  );
}

// Create a list
export async function POST(req: Request) {
  await dbConnect();
  try {
    const denied = await guard(req);
    if (denied) return denied;

    const body = await readJson(req);
    const name = parseName(body?.name);
    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: `Please provide a list name (max ${max_name_length} characters)`,
        },
        { status: 400 },
      );
    }

    const index = nameIndex(name);
    if (await List.exists({ nameIndex: index })) {
      return NextResponse.json(
        { success: false, message: "List name already exists" },
        { status: 400 },
      );
    }

    const id = await generateUniqueId((x) => List.exists({ id: x }));

    try {
      await List.create({
        id,
        name: encryptName(name, id),
        nameIndex: index,
      });
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        return NextResponse.json(
          { success: false, message: "List name already exists" },
          { status: 400 },
        );
      }
      throw err;
    }

    await logActivity(
      `A new list has been created with ID: ${id}`,
      ActionType.ADD,
    );

    return NextResponse.json(
      {
        success: true,
        message: "List created successfully",
        list: { id, name },
      },
      { status: 201, headers: no_store },
    );
  } catch (error) {
    return serverError("POST list", error);
  }
}

// Get all lists
export async function GET(req: Request) {
  await dbConnect();
  try {
    const denied = await guard(req);
    if (denied) return denied;

    const docs = await List.find({})
      .select("id name -_id")
      .lean<{ id: string; name: string }[]>();

    const lists = docs.map((doc) => {
      try {
        return { id: doc.id, name: decryptName(doc.name, doc.id) };
      } catch {
        return { id: doc.id, name: "[unreadable]" };
      }
    });

    return NextResponse.json({ success: true, lists }, { headers: no_store });
  } catch (error) {
    return serverError("GET list", error);
  }
}

// Rename a list
export async function PATCH(req: Request) {
  await dbConnect();
  try {
    const denied = await guard(req);
    if (denied) return denied;

    const body = await readJson(req);
    const id = body?.id;
    const name = parseName(body?.name);

    if (typeof id !== "string" || !id) {
      return NextResponse.json(
        { success: false, message: "Please provide a list id" },
        { status: 400 },
      );
    }
    if (!name) {
      return NextResponse.json(
        { success: false, message: "Please provide a name to update" },
        { status: 400 },
      );
    }

    const index = nameIndex(name);
    if (await List.exists({ nameIndex: index, id: { $ne: id } })) {
      return NextResponse.json(
        { success: false, message: "Name already exists" },
        { status: 400 },
      );
    }

    let list;
    try {
      list = await List.findOneAndUpdate(
        { id },
        { name: encryptName(name, id), nameIndex: index },
        { new: true },
      );
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        return NextResponse.json(
          { success: false, message: "Name already exists" },
          { status: 400 },
        );
      }
      throw err;
    }

    if (!list) {
      return NextResponse.json(
        { success: false, message: "List not found" },
        { status: 404 },
      );
    }

    await logActivity(
      `The list with ID ${id} has been renamed`,
      ActionType.EDIT,
    );

    return NextResponse.json(
      { success: true, message: `${name} has been updated` },
      { headers: no_store },
    );
  } catch (error) {
    return serverError("PATCH list", error);
  }
}

// Delete a list
export async function DELETE(req: Request) {
  await dbConnect();
  try {
    const denied = await guard(req);
    if (denied) return denied;

    const body = await readJson(req);
    const id = body?.id;
    if (typeof id !== "string" || !id) {
      return NextResponse.json(
        { success: false, message: "Please provide a list id" },
        { status: 400 },
      );
    }

    const list = await List.findOneAndDelete({ id });
    if (!list) {
      return NextResponse.json(
        { success: false, message: "List not found in the database" },
        { status: 404 },
      );
    }

    await logActivity(
      `The list with ID ${id} has been deleted`,
      ActionType.DELETE,
    );

    return NextResponse.json({ success: true, message: "List deleted" });
  } catch (error) {
    return serverError("DELETE list", error);
  }
}
