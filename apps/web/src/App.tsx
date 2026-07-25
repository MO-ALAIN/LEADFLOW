import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { api } from "./api";
import type { User } from "./types";
import PublicForm from "./pages/PublicForm";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

export default function App() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  useEffect(() => { api<{ user: User }>("/auth/me").then(r => setUser(r.user)).catch(() => setUser(null)); }, []);
  if (user === undefined) return <div className="loading">Loading LeadFlow…</div>;
  return (
    <Routes>
      <Route path="/" element={<PublicForm />} />
      <Route path="/login" element={user ? <Navigate to="/app" /> : <Login onLogin={setUser} />} />
      <Route path="/app/*" element={user ? <Dashboard user={user} onLogout={() => setUser(null)} /> : <Navigate to="/login" />} />
    </Routes>
  );
}
