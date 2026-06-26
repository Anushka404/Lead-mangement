import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

/** Allow redirect only to the configured CTA host (open-redirect guard). */
function isAllowed(target: string): boolean {
  const allowed = process.env.CTA_TARGET_URL;
  if (!allowed) return false;
  try {
    return new URL(target).host === new URL(allowed).host;
  } catch {
    return false;
  }
}

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const tid = params.get("tid");
  const url = params.get("url");

  if (!url || !isAllowed(url)) {
    return NextResponse.json({ error: "Invalid redirect target" }, { status: 400 });
  }

  // Best-effort logging — never block the redirect on a db error.
  const supabase = getServiceClient();
  if (supabase && tid) {
    try {
      const { data: email } = await supabase
        .from("emails")
        .select("id")
        .eq("tracking_id", tid)
        .single();
      if (email) {
        await supabase
          .from("clicks")
          .insert({ email_id: email.id, target_url: url });
      }
    } catch (err) {
      console.error("[track/click]", err);
    }
  }

  return NextResponse.redirect(url, 302);
}
