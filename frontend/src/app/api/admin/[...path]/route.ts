import { NextResponse } from "next/server";

const BACKEND_API_URL =
  process.env.BACKEND_API_URL ?? "http://127.0.0.1:8000";

// Backend resources the admin screen may reach, optionally followed by a
// numeric id, e.g. /api/admin/services/3 -> /api/services/3.
const ALLOWED_RESOURCES = new Set([
  "leads",
  "services",
  "industry-solutions",
  "case-studies",
  "knowledge"
]);

type RouteContext = { params: Promise<{ path: string[] }> };

// Admin calls must include the "X-Admin-Key" header. It is passed through to
// the FastAPI backend, which checks it against ADMIN_API_KEY.
async function forward(request: Request, context: RouteContext) {
  const { path } = await context.params;
  const [resource, id, ...rest] = path;

  if (
    !ALLOWED_RESOURCES.has(resource) ||
    rest.length > 0 ||
    (id !== undefined && !/^\d+$/.test(id))
  ) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const adminKey = request.headers.get("x-admin-key");
  if (adminKey) {
    headers["X-Admin-Key"] = adminKey;
  }

  const hasBody = request.method === "POST" || request.method === "PUT";

  try {
    const backendResponse = await fetch(
      `${BACKEND_API_URL}/api/${resource}${id ? `/${id}` : ""}`,
      {
        method: request.method,
        headers,
        body: hasBody ? await request.text() : undefined,
        cache: "no-store"
      }
    );

    if (backendResponse.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error(`Admin ${request.method} /api/${resource} error:`, error);
    return NextResponse.json({ error: "Could not reach the backend" }, { status: 502 });
  }
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const DELETE = forward;
