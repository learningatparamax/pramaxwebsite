import { NextResponse } from "next/server";

const BACKEND_API_URL =
  process.env.BACKEND_API_URL ?? "http://127.0.0.1:8000";

// First X-Forwarded-For entry, without the ":port" suffix Azure App Service
// adds (the port changes per connection and would defeat per-visitor limits).
function visitorIpFrom(request: Request): string | null {
  const first = request.headers.get("x-forwarded-for")?.split(",")[0].trim();
  if (!first) return null;
  const bracketed = first.match(/^\[([^\]]+)\](?::\d+)?$/); // [IPv6]:port
  if (bracketed) return bracketed[1];
  const ipv4WithPort = first.match(/^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/);
  if (ipv4WithPort) return ipv4WithPort[1];
  return first;
}

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Forward the message to the FastAPI backend chat endpoint, with the
    // visitor's IP so the backend can rate-limit per visitor (every request
    // reaches the backend from this server, not from the visitor).
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const visitorIp = visitorIpFrom(request);
    if (visitorIp) {
      headers["X-Visitor-IP"] = visitorIp;
    }

    const backendResponse = await fetch(
      `${BACKEND_API_URL}/api/chat`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ message })
      }
    );

    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: typeof data.detail === "string" ? data.detail : "Chat request failed" },
        { status: backendResponse.status }
      );
    }

    return NextResponse.json(
      { response: data.response },
      { status: backendResponse.status }
    );
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}