const BASE = process.env.FASTAPI_BASE_URL || "http://localhost:8000";

export async function POST(request) {
  try {
    const body = await request.json();
    const res = await fetch(`${BASE}/api/v1/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return Response.json(data, { status: res.status });
  } catch (err) {
    return Response.json(
      { success: false, error: { type: "ProxyError", message: err.message } },
      { status: 502 },
    );
  }
}
