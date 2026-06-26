import Link from "next/link";
import LeadForm from "@/components/LeadForm";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900">Get in touch</h1>
        <p className="mt-1 mb-6 text-sm text-gray-500">
          Tell us about your requirement and we&apos;ll reach out.
        </p>
        <LeadForm />
        <div className="mt-6 text-center">
          <Link href="/dashboard" className="text-sm text-gray-400 underline">
            View dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
