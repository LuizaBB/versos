import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api/client";
import type { Listing, ListingStatus, Purchase } from "../types";

function statusLabel(s: ListingStatus) {
  switch (s) {
    case "ACTIVE":
      return "Ativo";
    case "NEGOTIATING":
      return "Em negociação";
    case "SOLD":
      return "Vendido";
    case "CANCELLED":
      return "Cancelado";
  }
}

export function Vendidos() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [sales, setSales] = useState<Purchase[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [me, mine, purchases] = await Promise.all([
          apiFetch<{ id: number }>("/auth/me"),
          apiFetch<Listing[]>("/me/listings"),
          apiFetch<Purchase[]>("/me/purchases"),
        ]);
        setListings(mine);
        setSales(purchases.filter((p) => p.seller_id === me.id));
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Erro");
      }
    })();
  }, []);

  const active = listings.filter((l) => l.status === "ACTIVE" || l.status === "NEGOTIATING");
  const done = listings.filter((l) => l.status === "SOLD" || l.status === "CANCELLED");
  const salesHistory = sales.filter((p) => p.status === "COMPLETED" || p.status === "CANCELLED");
  const inProgress = sales.filter((p) => p.status !== "COMPLETED" && p.status !== "CANCELLED");

  return (
    <div className="page">
      <header className="page-header">
        <h1>Vendidos</h1>
        <Link to="/app/anuncios/novo" className="btn-primary small">
          Novo anúncio
        </Link>
      </header>
      {err && <div className="banner-error">{err}</div>}

      <section className="section">
        <h2>Em negociação</h2>
        {inProgress.length === 0 ? (
          <p className="muted">Nenhuma venda em andamento.</p>
        ) : (
          <ul className="card-list">
            {inProgress.map((p) => (
              <li key={p.id} className="card">
                <Link to={`/app/compras/${p.id}`}>
                  <strong>{p.listing.title}</strong>
                </Link>
                <p className="muted small">
                  {p.delivery_status ?? p.status} · R$ {p.amount.toFixed(2)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="section">
        <h2>Meus anúncios</h2>
        {active.length === 0 ? (
          <p className="muted">Nenhum anúncio ativo.</p>
        ) : (
          <ul className="card-list">
            {active.map((l) => (
              <li key={l.id} className="card">
                <Link to={`/app/anuncios/${l.id}`}>
                  <strong>{l.title}</strong>
                </Link>
                <p className="muted small">
                  {statusLabel(l.status)} · R$ {l.price.toFixed(2)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="section">
        <h2>Histórico de vendas</h2>
        {salesHistory.length === 0 ? (
          <p className="muted">Sem vendas finalizadas ainda.</p>
        ) : (
          <ul className="card-list">
            {salesHistory.map((p) => (
              <li key={p.id} className="card">
                <Link to={`/app/compras/${p.id}`}>
                  <strong>{p.listing.title}</strong>
                </Link>
                <p className="muted small">
                  {p.status} · R$ {p.amount.toFixed(2)}
                </p>
              </li>
            ))}
          </ul>
        )}
        {done.length > 0 && (
          <>
            <h3 className="small-heading">Anúncios encerrados</h3>
            <ul className="card-list">
              {done.map((l) => (
                <li key={l.id} className="card muted">
                  <span>{l.title}</span>
                  <span className="tag">{statusLabel(l.status)}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
