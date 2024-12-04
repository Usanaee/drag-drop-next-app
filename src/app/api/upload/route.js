import { NextResponse } from "next/server";
import { fileUpload } from "@/services/s3";

export async function POST(req) {
  try {
    const { fileName, fileType } = await req.json();
    // Use the fileUpload function to get the upload URL
    const uploadURL = await fileUpload(fileName, fileType);

    return new NextResponse(
      JSON.stringify({ uploadURL }),
      {
        status: 200,
      }
    );
  } catch (error) {
    return new NextResponse(
      JSON.stringify({ error: error.message }), // Send specific error message
      {
        status: 500,
      }
    );
  }
}
