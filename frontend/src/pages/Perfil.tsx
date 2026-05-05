import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { apiFetch } from "../api/client";
import type { ShelfStats } from "../types";

export function Perfil() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<ShelfStats | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const s = await apiFetch<ShelfStats>("/me/books/stats");
        setStats(s);
      } catch {
        /* noop */
      }
    })();
  }, []);

  return (
    <div className="page">
      <h1>Meu perfil</h1>
      {user && (
        <div className="profile-head">
          <img
            src={user.avatar_url || "https://placehold.co/80x80/3d3428/f5efe6?text=U"}
            alt=""
            className="avatar"
          />
          <div>
            <h2>{user.name}</h2>
            <p className="muted">{user.email}</p>
            <p className="tag">Plano: {user.plan_type === "FREE" ? "Grátis" : "Premium"}</p>
          </div>
        </div>
      )}

      {stats && (
        <section className="section stats-grid">
          <div className="stat">
            <span className="stat-value">{stats.total_books}</span>
            <span className="muted small">Na estante</span>
          </div>
          <div className="stat">
            <span className="stat-value">{stats.lendo}</span>
            <span className="muted small">Lendo</span>
          </div>
          <div className="stat">
            <span className="stat-value">{stats.lidos_no_ano}</span>
            <span className="muted small">Lidos no ano</span>
          </div>
          <div className="stat">
            <span className="stat-value">{stats.quero_ler}</span>
            <span className="muted small">Quero ler</span>
          </div>
        </section>
      )}

      <button type="button" className="btn-secondary" onClick={() => void logout()}>
        Sair
      </button>
    </div>
  );
}
