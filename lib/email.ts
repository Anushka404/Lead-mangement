import { Resend } from "resend";

type LeadEmailInput = {
  name: string;
  requirement: string;
  trackingId: string;
  baseUrl: string;
  ctaTarget: string;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Personalized lead email with an open pixel + a trackable CTA link. */
export function buildLeadEmailHtml({
  name,
  requirement,
  trackingId,
  baseUrl,
  ctaTarget,
}: LeadEmailInput): string {
  const clickUrl = `${baseUrl}/api/track/click?tid=${trackingId}&url=${encodeURIComponent(
    ctaTarget,
  )}`;
  const pixelUrl = `${baseUrl}/api/track/open?tid=${trackingId}`;

  return `<!doctype html>
<html>
  <body style="font-family: Arial, Helvetica, sans-serif; color: #171717; line-height: 1.6;">
    <p>Hi ${escapeHtml(name)},</p>
    <p>Thank you for reaching out. We received your requirement:</p>
    <blockquote style="border-left: 3px solid #ddd; margin: 0; padding: 8px 16px; color: #444;">
      ${escapeHtml(requirement)}
    </blockquote>
    <p>
      <a href="${clickUrl}" style="display:inline-block; background:#171717; color:#fff; padding:10px 18px; border-radius:6px; text-decoration:none;">
        Learn more
      </a>
    </p>
    <p>Regards,<br/>Team</p>
    <img src="${pixelUrl}" width="1" height="1" alt="" style="display:none" />
  </body>
</html>`;
}

type SendResult = { mocked: boolean; error?: string };

/**
 * Sends the lead email via Resend. When RESEND_API_KEY is unset the HTML is
 * logged to the server console instead (local dev without credentials).
 * Never throws — send failures are returned, the caller decides what to do.
 */
export async function sendLeadEmail(
  to: string,
  input: LeadEmailInput,
): Promise<SendResult> {
  const html = buildLeadEmailHtml(input);
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "onboarding@resend.dev";

  if (!apiKey) {
    console.log(
      `[email:mock] would send to ${to} (tracking ${input.trackingId})\n${html}`,
    );
    return { mocked: true };
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to,
      subject: "Thanks for reaching out",
      html,
    });
    if (error) return { mocked: false, error: error.message };
    return { mocked: false };
  } catch (err) {
    return { mocked: false, error: (err as Error).message };
  }
}
