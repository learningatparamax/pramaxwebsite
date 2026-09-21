import { NextResponse } from "next/server";

const BACKEND_API_URL =
  process.env.BACKEND_API_URL ?? "http://127.0.0.1:8000";

export async function GET() {
  try {
    const backendResponse = await fetch(
      `${BACKEND_API_URL}/api/services`,
      {
        cache: "no-store"
      }
    );

    const data = await backendResponse.json();

    return NextResponse.json(data, {
      status: backendResponse.status
    });
  } catch (error) {
    console.error("Services forwarding error:", error);

    return NextResponse.json(
      { error: "Could not load services" },
      { status: 502 }
    );
  }
}