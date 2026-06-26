import Link from "next/link";
import StatCard from "@/components/StatCard";
import { getServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type Stats = {
  leads: number;
  sent: number;
  opened: number;
  clicked: number;
  configured: boolean;
};

async function getStats(): Promise<Stats> {
  const supabase = getServiceClient();
  if (!supabase) {
    return { leads: 0, sent: 0, opened: 0, clicked: 0, configured: false };
  }

  const [leadsRes, sentRes, openedRes, clicksRes] = await Promise.all([
    supabase.from("leads").select("*", { count: "exact", head: true }),
    supabase.from("emails").select("*", { count: "exact", head: true }),
    supabase
      .from("emails")
      .select("*", { count: "exact", head: true })
      .not("opened_at", "is", null),
    // Pull email_ids to count distinct emails that received >=1 click.
    supabase.from("clicks").select("email_id"),
  ]);

  const clicked = new Set(
    (clicksRes.data ?? []).map((r) => r.email_id),
  ).size;

  return {
    leads: leadsRes.count ?? 0,
    sent: sentRes.count ?? 0,
    opened: openedRes.count ?? 0,
    clicked,
    configured: true,
  };
}

function rate(part: number, whole: number): string {
  if (whole === 0) return "0%";
  return `${Math.round((part / whole) * 100)}%`;
}

export default async function Dashboard() {
  const s = await getStats();

  return (
    <main className="min-h-screen bg-gray-50 p-6 sm:p-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Lead Analytics
            </h1>
            <p className="text-sm text-gray-500">
              Email engagement at a glance.
            </p>
          </div>
          <Link href="/" className="text-sm text-gray-500 underline">
            Back to form
          </Link>
        </div>

        {!s.configured && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Supabase env not configured — showing zeros. Fill{" "}
            <code>.env.local</code> to see live data.
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Total Leads" value={s.leads} />
          <StatCard label="Emails Sent" value={s.sent} />
          <StatCard label="Emails Opened" value={s.opened} />
          <StatCard label="Open Rate" value={rate(s.opened, s.sent)} />
          <StatCard label="Links Clicked" value={s.clicked} />
          <StatCard label="Click Rate" value={rate(s.clicked, s.sent)} />
        </div>

        <p className="mt-6 text-xs text-gray-400">
          Open tracking via pixel is approximate — email clients that block
          images will under-count opens, and proxy prefetching may over-count.
        </p>
      </div>
    </main>
  );
}
