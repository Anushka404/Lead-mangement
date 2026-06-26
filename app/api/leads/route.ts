import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { sendLeadEmail } from "@/lib/email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Payload = {
  full_name?: string;
  email?: string;
  phone?: string;
  company?: string;
  requirement?: string;
};

export async function POST(req: Request) {
  let body: Payload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const full_name = body.full_name?.trim();
  const email = body.email?.trim();
  const phone = body.phone?.trim();
  const requirement = body.requirement?.trim();
  const company = body.company?.trim() || null;

  if (!full_name || !email || !phone || !requirement) {
    return NextResponse.json(
      { error: "full_name, email, phone and requirement are required" },
      { status: 400 },
    );
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const supabase = getServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Server not configured (missing Supabase env)" },
      { status: 500 },
    );
  }

  // Insert lead.
  const { data: lead, error: leadErr } = await supabase
    .from("leads")
    .insert({ full_name, email, phone, company, requirement })
    .select("id")
    .single();

  if (leadErr || !lead) {
    return NextResponse.json(
      { error: leadErr?.message ?? "Failed to save lead" },
      { status: 500 },
    );
  }

  // Create the email tracking row.
  const trackingId = crypto.randomUUID();
  const { error: emailErr } = await supabase
    .from("emails")
    .insert({ lead_id: lead.id, tracking_id: trackingId });

  if (emailErr) {
    return NextResponse.json({ error: emailErr.message }, { status: 500 });
  }

  // Send the email. A send failure does not fail the request — the lead is
  // already captured.
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const ctaTarget = process.env.CTA_TARGET_URL || "https://example.com";
  const sendResult = await sendLeadEmail(email, {
    name: full_name,
    requirement,
    trackingId,
    baseUrl,
    ctaTarget,
  });
  if (sendResult.error) {
    console.error("[leads] email send failed:", sendResult.error);
  }

  return NextResponse.json({ ok: true, leadId: lead.id });
}
