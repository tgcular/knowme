"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const router = useRouter();
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true); setMsg("");
    const { error } = mode === "signup"
      ? await supabase.auth.signUp({ email, password, options: { data: { display_name: name } } })
      : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return setMsg(error.message);
    if (mode === "signup") return setMsg("Check your email to confirm your account, then sign in.");
    router.replace("/home");
  }
  const google = () => supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${location.origin}/home` } });

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-6">
      <p className="text-white/60">Welcome to</p>
      <h1 className="-mt-3 text-5xl font-extrabold tracking-tight">KnowMe</h1>
      {mode === "signup" && <input className="input" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />}
      <input className="input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className="input" type="password" placeholder="Password (6+ characters)" value={password} onChange={(e) => setPassword(e.target.value)} />
      {msg && <p className="text-sm text-blush">{msg}</p>}
      <button className="btn" disabled={busy || !email || password.length < 6} onClick={submit}>
        {mode === "signup" ? "Create account" : "Sign in"}
      </button>
      <button className="btn-ghost" onClick={google}>Continue with Google</button>
      <button className="text-sm text-white/60" onClick={() => setMode(mode === "signup" ? "signin" : "signup")}>
        {mode === "signup" ? "Have an account? Sign in" : "New here? Create an account"}
      </button>
    </main>
  );
}
