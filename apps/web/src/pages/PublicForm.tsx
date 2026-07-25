import { useState, type FormEvent } from "react";
import { ArrowRight, BarChart3, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../api";

export default function PublicForm() {
  const [state, setState] = useState<"idle" | "loading" | "success">("idle");
  const [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setState("loading"); setError("");
    const form = new FormData(e.currentTarget);
    try {
      await api("/leads/public", { method: "POST", body: JSON.stringify(Object.fromEntries(form)) });
      setState("success");
    } catch (err) { setError((err as Error).message); setState("idle"); }
  }
  return (
    <div className="public-page">
      <nav className="public-nav">
        <div className="brand"><span className="brand-mark"><BarChart3 size={19} /></span>LeadFlow</div>
        <Link className="text-link" to="/login">Team sign in <ArrowRight size={15} /></Link>
      </nav>
      <main className="hero">
        <section className="hero-copy">
          <span className="eyebrow"><Sparkles size={14} /> Built for focused sales teams</span>
          <h1>Turn every inquiry into your next <em>best customer.</em></h1>
          <p>Tell us what you’re working toward. Our team will review your goals and get back to you with a clear next step.</p>
          <div className="trust-row"><span><ShieldCheck /> Private & secure</span><span><CheckCircle2 /> Reply within one business day</span></div>
        </section>
        <section className="capture-card">
          {state === "success" ? (
            <div className="success"><CheckCircle2 /><h2>Thanks—we’ve got it.</h2><p>A member of our team will be in touch shortly.</p><button onClick={() => setState("idle")}>Send another inquiry</button></div>
          ) : (
            <>
              <div className="form-heading"><span>Start a conversation</span><h2>How can we help?</h2><p>A few details are all we need.</p></div>
              <form onSubmit={submit}>
                <label>Full name<input required minLength={2} name="name" placeholder="Your name" /></label>
                <div className="form-grid">
                  <label>Work email<input required type="email" name="email" placeholder="you@company.com" /></label>
                  <label>Phone <small>Optional</small><input name="phone" placeholder="+91 98765 43210" /></label>
                </div>
                <label>Company <small>Optional</small><input name="company" placeholder="Company name" /></label>
                <label>What would you like to achieve? <small>Optional</small><textarea name="message" rows={4} placeholder="Tell us a little about your goals…" /></label>
                {error && <p className="error">{error}</p>}
                <button className="primary" disabled={state === "loading"}>{state === "loading" ? "Sending…" : "Send inquiry"} <ArrowRight size={17} /></button>
              </form>
            </>
          )}
        </section>
      </main>
      <footer>Built for Digital Heroes Training Task · <a href="https://digitalheroesco.com">digitalheroesco.com</a></footer>
    </div>
  );
}
