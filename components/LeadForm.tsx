"use client";

import { useState } from "react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Status = "idle" | "submitting" | "success" | "error";

const initial = {
  full_name: "",
  email: "",
  phone: "",
  company: "",
  requirement: "",
};

export default function LeadForm() {
  const [form, setForm] = useState(initial);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  function update(field: keyof typeof initial, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function validate(): string | null {
    if (!form.full_name.trim()) return "Full name is required.";
    if (!EMAIL_RE.test(form.email.trim())) return "A valid email is required.";
    if (!form.phone.trim()) return "Phone is required.";
    if (!form.requirement.trim()) return "Requirement is required.";
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) {
      setStatus("error");
      setMessage(err);
      return;
    }

    setStatus("submitting");
    setMessage("");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setStatus("success");
      setMessage("Thanks! Check your inbox shortly.");
      setForm(initial);
    } catch (e) {
      setStatus("error");
      setMessage((e as Error).message);
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
        <p className="text-lg font-medium text-green-800">{message}</p>
        <button
          onClick={() => setStatus("idle")}
          className="mt-4 text-sm text-green-700 underline"
        >
          Submit another
        </button>
      </div>
    );
  }

  const inputCls =
    "w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900";

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Full Name
        </label>
        <input
          className={inputCls}
          value={form.full_name}
          onChange={(e) => update("full_name", e.target.value)}
          placeholder="Jane Doe"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          className={inputCls}
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          placeholder="jane@company.com"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Phone
        </label>
        <input
          className={inputCls}
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
          placeholder="+1 555 123 4567"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Company <span className="text-gray-400">(optional)</span>
        </label>
        <input
          className={inputCls}
          value={form.company}
          onChange={(e) => update("company", e.target.value)}
          placeholder="Acme Inc."
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Requirement
        </label>
        <textarea
          className={`${inputCls} min-h-24`}
          value={form.requirement}
          onChange={(e) => update("requirement", e.target.value)}
          placeholder="Tell us what you need…"
        />
      </div>

      {status === "error" && (
        <p className="text-sm text-red-600">{message}</p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full rounded-md bg-gray-900 px-4 py-2.5 font-medium text-white transition hover:bg-gray-800 disabled:opacity-60"
      >
        {status === "submitting" ? "Submitting…" : "Submit"}
      </button>
    </form>
  );
}
