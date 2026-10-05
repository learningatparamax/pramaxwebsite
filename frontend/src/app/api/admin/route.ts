import { NextResponse } from "next/server";

const BACKEND_API_URL =
  process.env.BACKEND_API_URL ?? "http://127.0.0.1:8000";

// Admin calls must include the "X-Admin-Key" header. It is passed through to
// the FastAPI backend, which checks it against ADMIN_API_KEY.
function adminHeaders(request: Request): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const adminKey = request.headers.get("x-admin-key");
  if (adminKey) {
    headers["X-Admin-Key"] = adminKey;
  }
  return headers;
}

// List knowledge-base entries
export async function GET(request: Request) {
  try {
    const backendResponse = await fetch(`${BACKEND_API_URL}/api/knowledge`, {
      headers: adminHeaders(request),
      cache: "no-store"
    });

    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error("Admin knowledge list error:", error);
    return NextResponse.json({ error: "Could not load knowledge entries" }, { status: 502 });
  }
}

// Add a knowledge-base entry: { "trigger": "keyword", "response": "answer text" }
export async function POST(request: Request) {
  try {
    const { trigger, response } = await request.json();

    if (!trigger || !response) {
      return NextResponse.json(
        { error: "Trigger and response are required" },
        { status: 400 }
      );
    }

    const backendResponse = await fetch(`${BACKEND_API_URL}/api/knowledge`, {
      method: "POST",
      headers: adminHeaders(request),
      body: JSON.stringify({ trigger, response })
    });

    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error("Admin knowledge create error:", error);
    return NextResponse.json({ error: "Could not save knowledge entry" }, { status: 502 });
  }
}
