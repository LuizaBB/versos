import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiFetch } from "../api/client";
import type { Purchase, PurchaseStatus } from "../types";

const nextStatus: Partial<Record<PurchaseStatus, PurchaseStatus>> = {
  PENDING: "PAYMENT_CONFIRMED",
  PAYMENT_CONFIRMED: "IN_TRANSIT",
  IN_TRANSIT: "DELIVERED",
  DELIVERED: "COMPLETED",
};

export function CompraDetalhe() {
  const { purchaseId } = useParams();
  const id = Number(purchaseId);
  const [p, setP] = useState<Purchase | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try {
      const data = await apiFetch<Purchase>(`/purchases/${id}`);
      setP(data);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro");
    }
  }

  useEffect(() => {
    if (!Number.isFinite(id)) return;
    void load();
  }, [id]);

  async function advance() {
    if (!p) return;
    const n = nextStatus[p.status];
    if (!n) return;
    try {
      const updated = await apiFetch<Purchase>(`/purchases/${p.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status: n,
          delivery_status:
            n === "IN_TRANSIT"
              ? "Enviado"
              : n === "DELIVERED"
                ? "Entregue"
                : p.delivery_status,
        }),
      });
      setP(updated);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro");
    }
  }

  if (err) return <div className="banner-error">{err}</div>;
  if (!p) return <p className="muted">Carregando…</p>;

  return (
    <div className="page">
      <h1>{p.listing.title}</h1>
      <p className="muted">Valor: R$ {p.amount.toFixed(2)}</p>
      <p>Status: {p.status}</p>
      {p.delivery_status && <p className="small">{p.delivery_status}</p>}
      {p.estimated_delivery_at && (
        <p className="muted small">
          Previsão: {new Date(p.estimated_delivery_at).toLocaleDateString()}
        </p>
      )}
      {nextStatus[p.status] && (
        <button type="button" className="btn-secondary" onClick={() => void advance()}>
          Simular próximo status
        </button>
      )}
    </div>
  );
}
