import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api/client";
import type { FreemiumInfo, Group, MyGroup } from "../types";

export function Grupos() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Group[]>([]);
  const [mine, setMine] = useState<MyGroup[]>([]);
  const [freemium, setFreemium] = useState<FreemiumInfo | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function loadMine() {
    const [m, f] = await Promise.all([apiFetch<MyGroup[]>("/me/groups"), apiFetch<FreemiumInfo>("/me/freemium")]);
    setMine(m);
    setFreemium(f);
  }

  useEffect(() => {
    void (async () => {
      try {
        await loadMine();
        const r = await apiFetch<Group[]>(`/groups${q ? `?q=${encodeURIComponent(q)}` : ""}`);
        setResults(r);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Erro");
      }
    })();
  }, []);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      const r = await apiFetch<Group[]>(`/groups${q ? `?q=${encodeURIComponent(q)}` : ""}`);
      setResults(r);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro na busca");
    }
  }

  async function join(id: number) {
    try {
      await apiFetch(`/groups/${id}/join`, { method: "POST" });
      await loadMine();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Não foi possível entrar");
    }
  }

  const myIds = new Set(mine.map((m) => m.group.id));

  return (
    <div className="page">
      <header className="page-header">
        <h1>Grupos</h1>
        <Link to="/app/notificacoes" className="btn-ghost">
          🔔
        </Link>
      </header>

      {freemium && (
        <div className="paywall-hint">
          Plano grátis: {freemium.groups_used}/{freemium.max_groups_free} grupos utilizados
          {!freemium.can_join_more && (
            <span className="tag warn"> Limite atingido — faça upgrade para participar de mais.</span>
          )}
        </div>
      )}

      <form onSubmit={search} className="search-bar">
        <input
          placeholder="Buscar clubes, autores, temas ou livros à venda"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button type="submit" className="btn-secondary">
          Buscar
        </button>
      </form>

      {err && <div className="banner-error">{err}</div>}

      <section className="section">
        <h2>Meus grupos</h2>
        {mine.length === 0 ? (
          <p className="muted">Você ainda não entrou em grupos.</p>
        ) : (
          <ul className="card-list">
            {mine.map((m) => (
              <li key={m.group.id} className="card">
                <Link to={`/app/grupos/${m.group.id}`}>
                  <strong>{m.group.name}</strong>
                </Link>
                {m.alert_label && <span className="tag">{m.alert_label}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="section">
        <h2>Descobrir</h2>
        <ul className="card-list">
          {results.map((g) => (
            <li key={g.id} className="card row-between">
              <div>
                <Link to={`/app/grupos/${g.id}`}>
                  <strong>{g.name}</strong>
                </Link>
                <p className="muted small line-clamp">{g.description}</p>
              </div>
              {!myIds.has(g.id) && (
                <button
                  type="button"
                  className="btn-secondary small"
                  onClick={() => void join(g.id)}
                  disabled={freemium != null && !freemium.can_join_more}
                >
                  Entrar
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
