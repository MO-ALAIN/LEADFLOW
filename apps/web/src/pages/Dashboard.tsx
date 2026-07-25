import { useCallback, useEffect, useState } from "react";
import { BarChart3, ChevronLeft, ChevronRight, LayoutDashboard, LogOut, Search, Users } from "lucide-react";
import { api } from "../api";
import type { Lead, Status, User } from "../types";
import LeadDrawer from "../components/LeadDrawer";

const statuses: Status[] = ["NEW", "CONTACTED", "QUALIFIED", "WON", "LOST"];
export default function Dashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [leads, setLeads] = useState<Lead[]>([]); const [selected, setSelected] = useState<Lead | null>(null);
  const [status, setStatus] = useState(""); const [search, setSearch] = useState(""); const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, pages: 1 }); const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "10" });
    if (status) params.set("status", status); if (search) params.set("search", search);
    const result = await api<{ items: Lead[]; pagination: { total: number; pages: number } }>(`/leads?${params}`);
    setLeads(result.items); setMeta(result.pagination); setLoading(false);
  }, [page, status, search]);
  useEffect(() => { load(); }, [load]);
  async function logout() { await api("/auth/logout", { method: "POST" }); onLogout(); }
  return <div className="app-shell">
    <aside><div className="brand brand-light"><span className="brand-mark"><BarChart3 size={19} /></span>LeadFlow</div>
      <nav><a className="active"><LayoutDashboard /> Leads</a>{user.role === "ADMIN" && <a><Users /> Team</a>}</nav>
      <div className="user-card"><span className="avatar">{user.name[0]}</span><div><strong>{user.name}</strong><small>{user.role.toLowerCase()}</small></div><button onClick={logout} title="Sign out"><LogOut /></button></div>
    </aside>
    <main className="workspace">
      <header><div><span className="eyebrow">Sales workspace</span><h1>Lead pipeline</h1><p>{user.role === "ADMIN" ? "All leads across your team" : "Leads currently assigned to you"}</p></div><div className="total-pill"><strong>{meta.total}</strong><span>Total leads</span></div></header>
      <section className="toolbar"><div className="search"><Search /><input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search name, email, company…" /></div>
      <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}><option value="">All statuses</option>{statuses.map(s => <option key={s}>{s}</option>)}</select></section>
      <section className="table-card">
        <div className="table-head"><span>Lead</span><span>Status</span><span>Assigned to</span><span>Created</span></div>
        {loading ? <div className="empty">Loading leads…</div> : leads.length === 0 ? <div className="empty">No leads match these filters.</div> : leads.map(lead =>
          <button className="lead-row" key={lead.id} onClick={async () => { const r = await api<{ lead: Lead }>(`/leads/${lead.id}`); setSelected(r.lead); }}>
            <span className="lead-person"><span className="mini-avatar">{lead.name[0]}</span><span><strong>{lead.name}</strong><small>{lead.company || lead.email}</small></span></span>
            <span><b className={`status status-${lead.status.toLowerCase()}`}>{lead.status}</b></span>
            <span>{lead.assignee?.name || <em>Unassigned</em>}</span><span>{new Date(lead.createdAt).toLocaleDateString()}</span>
          </button>)}
        <div className="pagination"><span>Page {page} of {meta.pages || 1}</span><div><button disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft /></button><button disabled={page >= meta.pages} onClick={() => setPage(p => p + 1)}><ChevronRight /></button></div></div>
      </section>
    </main>
    {selected && <LeadDrawer lead={selected} user={user} onClose={() => setSelected(null)} onChanged={async () => { await load(); const r = await api<{ lead: Lead }>(`/leads/${selected.id}`); setSelected(r.lead); }} />}
  </div>;
}
