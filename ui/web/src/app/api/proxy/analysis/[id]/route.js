const BASE = process.env.FASTAPI_BASE_URL || "http://localhost:8000";

export async function GET(request, { params }) {
  try {
    const res = await fetch(`${BASE}/api/v1/analysis/${params.id}`);
    const data = await res.json();
    return Response.json(data, { status: res.status });
  } catch (err) {
    return Response.json(
      { success: false, error: { type: "ProxyError", message: err.message } },
      { status: 502 },
    );
  }
}
