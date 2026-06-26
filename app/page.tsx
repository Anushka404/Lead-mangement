import Link from "next/link";
import LeadForm from "@/components/LeadForm";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 bg-[radial-gradient(50rem_40rem_at_top,theme(colors.indigo.950),transparent)] px-4 py-12 text-slate-100">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-xs font-medium text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            Lead Capture
          </span>
          <h1 className="mt-4 bg-gradient-to-r from-indigo-400 via-sky-400 to-cyan-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
            Get in touch
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Tell us about your requirement and we&apos;ll reach out.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 shadow-2xl shadow-indigo-950/40 backdrop-blur">
          <LeadForm />
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/dashboard"
            className="text-sm text-slate-500 transition hover:text-slate-300"
          >
            View dashboard →
          </Link>
        </div>
      </div>
    </main>
  );
}
