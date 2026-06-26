import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// 1x1 transparent GIF.
const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64",
);

function pixelResponse() {
  return new NextResponse(new Uint8Array(PIXEL), {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Content-Length": String(PIXEL.length),
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}

export async function GET(req: Request) {
  const tid = new URL(req.url).searchParams.get("tid");
  if (!tid) return pixelResponse();

  const supabase = getServiceClient();
  if (!supabase) return pixelResponse();

  // Look up by opaque tracking id, then mark opened. Never error to the
  // mail client — always return the pixel.
  try {
    const { data: email } = await supabase
      .from("emails")
      .select("id, opened_at, open_count")
      .eq("tracking_id", tid)
      .single();

    if (email) {
      await supabase
        .from("emails")
        .update({
          opened_at: email.opened_at ?? new Date().toISOString(),
          open_count: (email.open_count ?? 0) + 1,
        })
        .eq("id", email.id);
    }
  } catch (err) {
    console.error("[track/open]", err);
  }

  return pixelResponse();
}
