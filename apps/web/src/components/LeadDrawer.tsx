import { useEffect, useState, type FormEvent } from "react";
import { Clock3, Mail, MessageSquareText, Phone, X } from "lucide-react";
import { api } from "../api";
import type { Lead, Status, User } from "../types";

const statuses: Status[] = ["NEW", "CONTACTED", "QUALIFIED", "WON", "LOST"];
export default function LeadDrawer({ lead, user, onClose, onChanged }: { lead: Lead; user: User; onClose: () => void; onChanged: () => void }) {
  const [users, setUsers] = useState<User[]>([]);
  useEffect(() => { if (user.role === "ADMIN") api<{ users: User[] }>("/users").then(r => setUsers(r.users)); }, [user.role]);
  async function update(data: object) { await api(`/leads/${lead.id}`, { method: "PATCH", body: JSON.stringify(data) }); onChanged(); }
  async function addNote(e: FormEvent<HTMLFormElement>) { e.preventDefault(); const form = e.currentTarget; const body = String(new FormData(form).get("body")); await api(`/leads/${lead.id}/notes`, { method: "POST", body: JSON.stringify({ body }) }); form.reset(); onChanged(); }
  return <div className="drawer-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}><aside className="drawer">
    <div className="drawer-top"><div><span className="eyebrow">Lead profile</span><h2>{lead.name}</h2><p>{lead.company || "Individual inquiry"}</p></div><button onClick={onClose}><X /></button></div>
    <div className="contact-strip"><a href={`mailto:${lead.email}`}><Mail />{lead.email}</a>{lead.phone && <a href={`tel:${lead.phone}`}><Phone />{lead.phone}</a>}</div>
    <div className="drawer-grid"><label>Status<select value={lead.status} onChange={e => update({ status: e.target.value })}>{statuses.map(s => <option key={s}>{s}</option>)}</select></label>
      <label>Assigned to<select disabled={user.role !== "ADMIN"} value={lead.assigneeId || ""} onChange={e => update({ assigneeId: e.target.value || null })}><option value="">Unassigned</option>{users.map(u => <option value={u.id} key={u.id}>{u.name}</option>)}</select></label></div>
    {lead.message && <section className="message-box"><span>Original message</span><p>{lead.message}</p></section>}
    <section className="drawer-section"><h3><MessageSquareText /> Notes</h3><form className="note-form" onSubmit={addNote}><textarea name="body" required placeholder="Add context, a follow-up, or a call summary…" /><button className="primary">Add note</button></form>
      <div className="timeline">{lead.notes?.map(note => <div className="timeline-item" key={note.id}><span className="dot" /><div><p>{note.body}</p><small>{note.author.name} · {new Date(note.createdAt).toLocaleString()}</small></div></div>)}</div></section>
    <section className="drawer-section"><h3><Clock3 /> Activity</h3><div className="timeline">{lead.activities?.map(item => <div className="timeline-item muted" key={item.id}><span className="dot" /><div><p>{item.details || item.action.replaceAll("_", " ").toLowerCase()}</p><small>{item.actor?.name || "System"} · {new Date(item.createdAt).toLocaleString()}</small></div></div>)}</div></section>
  </aside></div>;
}
