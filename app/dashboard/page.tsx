import Link from "next/link";
import StatCard from "@/components/StatCard";
import { getServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type LeadRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  company: string | null;
  created_at: string;
  opened: boolean;
  clicked: boolean;
};

type Data = {
  configured: boolean;
  leads: LeadRow[];
  sent: number;
  opened: number;
  clicked: number;
};

async function getData(): Promise<Data> {
  const supabase = getServiceClient();
  if (!supabase) {
    return { configured: false, leads: [], sent: 0, opened: 0, clicked: 0 };
  }

  const [leadsRes, emailsRes, clicksRes] = await Promise.all([
    supabase
      .from("leads")
      .select("id, full_name, email, phone, company, created_at")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase.from("emails").select("id, lead_id, opened_at"),
    supabase.from("clicks").select("email_id"),
  ]);

  const emails = emailsRes.data ?? [];
  const clickSet = new Set((clicksRes.data ?? []).map((c) => c.email_id));

  // Aggregate email open/click status per lead.
  const byLead = new Map<string, { opened: boolean; clicked: boolean }>();
  for (const e of emails) {
    const cur = byLead.get(e.lead_id) ?? { opened: false, clicked: false };
    if (e.opened_at) cur.opened = true;
    if (clickSet.has(e.id)) cur.clicked = true;
    byLead.set(e.lead_id, cur);
  }

  const leads: LeadRow[] = (leadsRes.data ?? []).map((l) => ({
    ...l,
    opened: byLead.get(l.id)?.opened ?? false,
    clicked: byLead.get(l.id)?.clicked ?? false,
  }));

  return {
    configured: true,
    leads,
    sent: emails.length,
    opened: emails.filter((e) => e.opened_at).length,
    clicked: clickSet.size,
  };
}

function rate(part: number, whole: number): string {
  if (whole === 0) return "0%";
  return `${Math.round((part / whole) * 100)}%`;
}

function StatusPill({ on, label }: { on: boolean; label: string }) {
  return on ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/30">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
      {label}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-500/10 px-2.5 py-1 text-xs font-medium text-slate-500 ring-1 ring-slate-700">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
      —
    </span>
  );
}

export default async function Dashboard() {
  const d = await getData();

  return (
    <main className="min-h-screen bg-slate-950 bg-[radial-gradient(60rem_40rem_at_top,theme(colors.indigo.950),transparent)] px-4 py-10 text-slate-100 sm:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="bg-gradient-to-r from-indigo-400 via-sky-400 to-cyan-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
              Lead Analytics
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/30">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Live
            </span>
          </div>
          <Link
            href="/"
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-600 hover:bg-slate-800/50"
          >
            ← Back to form
          </Link>
        </div>

        {!d.configured && (
          <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
            Supabase env not configured — showing zeros. Fill{" "}
            <code className="rounded bg-amber-500/20 px-1">.env.local</code> to
            see live data.
          </div>
        )}

        {/* Stat grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Total Leads" value={d.leads.length} accent="indigo" />
          <StatCard label="Emails Sent" value={d.sent} accent="violet" />
          <StatCard label="Emails Opened" value={d.opened} accent="emerald" />
          <StatCard
            label="Open Rate"
            value={rate(d.opened, d.sent)}
            accent="cyan"
            hint={`${d.opened} of ${d.sent} sent`}
          />
          <StatCard label="Links Clicked" value={d.clicked} accent="amber" />
          <StatCard
            label="Click Rate"
            value={rate(d.clicked, d.sent)}
            accent="rose"
            hint={`${d.clicked} of ${d.sent} sent`}
          />
        </div>

        {/* Lead records table */}
        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur">
          <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
            <h2 className="text-lg font-semibold text-white">Lead Records</h2>
            <span className="text-sm text-slate-500">
              {d.leads.length} total
            </span>
          </div>

          {d.leads.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm text-slate-500">
              No leads yet. Submit the form to see records here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wider text-slate-500">
                  <tr className="border-b border-slate-800">
                    <th className="px-6 py-3 font-medium">Name</th>
                    <th className="px-6 py-3 font-medium">Email</th>
                    <th className="px-6 py-3 font-medium">Phone</th>
                    <th className="px-6 py-3 font-medium">Company</th>
                    <th className="px-6 py-3 font-medium">Opened</th>
                    <th className="px-6 py-3 font-medium">Clicked</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {d.leads.map((l) => (
                    <tr
                      key={l.id}
                      className="transition hover:bg-slate-800/30"
                    >
                      <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-100">
                        {l.full_name}
                      </td>
                      <td className="px-6 py-4 text-slate-400">{l.email}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-slate-400">
                        {l.phone}
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {l.company || (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <StatusPill on={l.opened} label="Opened" />
                      </td>
                      <td className="px-6 py-4">
                        <StatusPill on={l.clicked} label="Clicked" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p className="mt-6 text-xs text-slate-600">
          Open tracking via pixel is approximate — clients that block images
          under-count opens, and proxy prefetching may over-count.
        </p>
      </div>
    </main>
  );
}
