import { NextResponse } from "next/server";

const BACKEND_API_URL =
  process.env.BACKEND_API_URL ?? "http://127.0.0.1:8000";

export async function POST(request: Request) {
  try {
    const { name, email, subject, requirements } = await request.json();

    const backendResponse = await fetch(
      `${BACKEND_API_URL}/api/leads`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          email,
          message: subject ?? requirements ?? null
        })
      }
    );

    const data = await backendResponse.json();

    return NextResponse.json(data, {
      status: backendResponse.status
    });
  } catch (error) {
    console.error("Lead forwarding error:", error);

    return NextResponse.json(
      { error: "Could not submit the lead request" },
      { status: 502 }
    );
  }
}