import { NextResponse } from "next/server";

const BACKEND_API_URL =
  process.env.BACKEND_API_URL ?? "http://127.0.0.1:8000";

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Forward the message to the FastAPI backend chat endpoint
    const backendResponse = await fetch(
      `${BACKEND_API_URL}/api/chat`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message })
      }
    );

    const data = await backendResponse.json();

    return NextResponse.json(
      { response: data.response },
      { status: backendResponse.status }
    );
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}