import { useState, type FormEvent } from "react";
import { BarChart3, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../api";
import type { User } from "../types";

export default function Login({ onLogin }: { onLogin: (user: User) => void }) {
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true); setError("");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try { const result = await api<{ user: User }>("/auth/login", { method: "POST", body: JSON.stringify(data) }); onLogin(result.user); }
    catch (err) { setError((err as Error).message); setLoading(false); }
  }
  return <div className="login-page">
    <Link to="/" className="brand"><span className="brand-mark"><BarChart3 size={19} /></span>LeadFlow</Link>
    <div className="login-card"><span className="eyebrow">Team workspace</span><h1>Welcome back</h1><p>Sign in to manage your leads and follow-ups.</p>
      <form onSubmit={submit}><label>Email<input name="email" type="email" required defaultValue="admin@leadflow.dev" /></label><label>Password<input name="password" type="password" required defaultValue="DemoPass123!" /></label>
      {error && <p className="error">{error}</p>}<button className="primary" disabled={loading}>{loading ? "Signing in…" : "Sign in"} <ArrowRight size={17} /></button></form>
      <p className="demo-hint">Demo: admin@leadflow.dev / DemoPass123!</p>
    </div>
  </div>;
}
