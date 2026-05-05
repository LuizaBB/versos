import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../api/client";
import type { GroupDetail, Listing } from "../types";

export function GrupoDetalhe() {
  const { groupId } = useParams();
  const id = Number(groupId);
  const nav = useNavigate();
  const [g, setG] = useState<GroupDetail | null>(null);
  const [feed, setFeed] = useState<Listing[]>([]);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try {
      const detail = await apiFetch<GroupDetail>(`/groups/${id}`);
      setG(detail);
      const all = await apiFetch<Listing[]>("/listings");
      setFeed(all.filter((l) => l.group_ids.includes(id)));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro");
    }
  }

  useEffect(() => {
    if (!Number.isFinite(id)) return;
    void load();
  }, [id]);

  async function join() {
    try {
      await apiFetch(`/groups/${id}/join`, { method: "POST" });
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro ao entrar");
    }
  }

  async function leave() {
    try {
      await apiFetch(`/groups/${id}/leave`, { method: "POST" });
      nav("/app/grupos");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro ao sair");
    }
  }

  if (!g) {
    return err ? <div className="banner-error">{err}</div> : <p className="muted">Carregando…</p>;
  }

  return (
    <div className="page">
      <h1>{g.name}</h1>
      <p className="muted">{g.description}</p>
      <p className="small">Membros: {g.member_count}</p>
      {g.my_role ? (
        <button type="button" className="btn-secondary" onClick={() => void leave()}>
          Sair do grupo
        </button>
      ) : (
        <button type="button" className="btn-primary" onClick={() => void join()}>
          Entrar no grupo
        </button>
      )}

      <section className="section">
        <h2>Ofertas no grupo</h2>
        {feed.length === 0 ? (
          <p className="muted">Nenhum anúncio publicado aqui ainda.</p>
        ) : (
          <ul className="card-list">
            {feed.map((l) => (
              <li key={l.id} className="card">
                <Link to={`/app/anuncios/${l.id}`}>
                  <strong>{l.title}</strong>
                </Link>
                <p className="muted small">
                  R$ {l.price.toFixed(2)} · {l.book.title}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
