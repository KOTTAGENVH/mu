import { customEmail } from "@/config/customEmail";
import { NextResponse } from 'next/server';


  
//Generate a token
export async function POST(){
    try {
      // Generate a random token
      const token = Math.floor(1000 + Math.random() * 9000).toString();
  
      // Send the token to the user via email
      await customEmail(
        "nowenportfolio@gmail.com",
        "Token for MU",
        `Your token is ${token}.`
      );
  
      // Return the token in the response
      return NextResponse.json({ success: true, token });
    } catch (error: unknown) {
      if (error instanceof Error) {
        // Return the error response as a plain object
        return NextResponse.json(
          { success: false, message: error.message },
          { status: 500 }
        );
      }
    }
  
    // Fallback in case something unexpected happens
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
  