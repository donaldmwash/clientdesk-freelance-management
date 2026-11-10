"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness, LoaderCircle } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const supabase = createSupabaseBrowserClient();
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace("/dashboard");
        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/auth/callback?next=/dashboard" }
        });
        if (error) throw error;
        if (data.session) {
          router.replace("/dashboard");
          router.refresh();
        } else {
          setMessage("Account created. Check your email to confirm your address, then sign in.");
        }
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Authentication failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-5 py-12">
      <section className="w-full max-w-md rounded-3xl border border-line bg-white p-8 shadow-soft">
        <Link href="/" className="mb-9 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand text-white"><BriefcaseBusiness size={20}/></span>
          <span className="text-xl font-bold tracking-tight">clientdesk<span className="text-brand">.</span></span>
        </Link>
        <p className="text-xs font-bold uppercase tracking-[.16em] text-brand">Your business workspace</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
        <p className="mt-2 text-sm text-muted">{mode === "login" ? "Sign in to manage your clients, invoices and expenses." : "Start organising your freelance business in one place."}</p>
        <form onSubmit={submit} className="mt-7 space-y-4">
          <label className="block text-sm font-semibold">Email address
            <input required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-2 w-full rounded-xl border border-line px-4 py-3 text-sm outline-none focus:border-brand" placeholder="you@example.com"/>
          </label>
          <label className="block text-sm font-semibold">Password
            <input required minLength={8} type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={e => setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-line px-4 py-3 text-sm outline-none focus:border-brand" placeholder="At least 8 characters"/>
          </label>
          {message && <p role="status" className="rounded-xl bg-amber-50 px-3 py-3 text-sm text-amber-800">{message}</p>}
          <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1d5946] disabled:opacity-60">
            {busy && <LoaderCircle size={16} className="animate-spin"/>}{mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-muted">
          {mode === "login" ? "New to ClientDesk?" : "Already have an account?"}{" "}
          <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMessage(""); }} className="font-semibold text-brand hover:underline">{mode === "login" ? "Create an account" : "Sign in"}</button>
        </p>
      </section>
    </main>
  );
}
