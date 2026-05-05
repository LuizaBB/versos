import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api/client";
import type { Purchase, PurchaseStatus } from "../types";

function prettyStatus(s: PurchaseStatus) {
  const map: Record<PurchaseStatus, string> = {
    PENDING: "Pendente",
    PAYMENT_CONFIRMED: "Pagamento confirmado",
    IN_TRANSIT: "Em trânsito",
    DELIVERED: "Entregue",
    COMPLETED: "Concluído",
    CANCELLED: "Cancelado",
  };
  return map[s];
}

export function Comprados() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const data = await apiFetch<Purchase[]>("/me/purchases");
        setPurchases(data);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Erro");
      }
    })();
  }, []);

  const active = purchases.filter((p) => p.status !== "COMPLETED" && p.status !== "CANCELLED");
  const done = purchases.filter((p) => p.status === "COMPLETED" || p.status === "CANCELLED");

  return (
    <div className="page">
      <header className="page-header">
        <h1>Comprados</h1>
      </header>
      {err && <div className="banner-error">{err}</div>}

      <section className="section">
        <h2>Pedidos em trânsito</h2>
        {active.length === 0 ? (
          <p className="muted">Nenhuma compra em andamento.</p>
        ) : (
          <ul className="card-list">
            {active.map((p) => (
              <li key={p.id} className="card">
                <Link to={`/app/compras/${p.id}`}>
                  <strong>{p.listing.title}</strong>
                </Link>
                <p className="muted small">Vendedor #{p.seller_id}</p>
                <p className="small">
                  {prettyStatus(p.status)} · R$ {p.amount.toFixed(2)}
                </p>
                {p.estimated_delivery_at && (
                  <p className="muted small">
                    Previsão: {new Date(p.estimated_delivery_at).toLocaleDateString()}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="section">
        <h2>Histórico</h2>
        {done.length === 0 ? (
          <p className="muted">Sem compras finalizadas.</p>
        ) : (
          <ul className="card-list">
            {done.map((p) => (
              <li key={p.id} className="card">
                <Link to={`/app/compras/${p.id}`}>
                  <strong>{p.listing.title}</strong>
                </Link>
                <p className="muted small">
                  {prettyStatus(p.status)} · R$ {p.amount.toFixed(2)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
