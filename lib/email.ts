import nodemailer from "nodemailer";

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
    <img src="${pixelUrl}" width="1" height="1" alt="" style="width:1px;height:1px;border:0;opacity:0" />
  </body>
</html>`;
}

type SendResult = { mocked: boolean; error?: string };

/**
 * Sends the lead email via Gmail SMTP (Nodemailer). Sends to any recipient.
 * When GMAIL_USER / GMAIL_APP_PASSWORD are unset the HTML is logged to the
 * server console instead (local dev without credentials).
 * Never throws — send failures are returned, the caller decides what to do.
 */
export async function sendLeadEmail(
  to: string,
  input: LeadEmailInput,
): Promise<SendResult> {
  const html = buildLeadEmailHtml(input);
  const user = process.env.GMAIL_USER;
  // App Passwords are shown with spaces — strip them before use.
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "");
  const fromName = process.env.EMAIL_FROM_NAME || "Team";

  if (!user || !pass) {
    console.log(
      `[email:mock] would send to ${to} (tracking ${input.trackingId})\n${html}`,
    );
    return { mocked: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });
    await transporter.sendMail({
      from: `"${fromName}" <${user}>`,
      to,
      subject: "Thanks for reaching out",
      html,
    });
    return { mocked: false };
  } catch (err) {
    return { mocked: false, error: (err as Error).message };
  }
}
