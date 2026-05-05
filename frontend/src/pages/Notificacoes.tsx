import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";
import type { AppNotification, NotificationType } from "../types";

const typeLabel: Record<NotificationType, string> = {
  READING: "Leitura",
  GROUP: "Grupos",
  SALE: "Vendas",
  PURCHASE: "Compras",
  FAVORITE_LISTING_MATCH: "Compras",
};

export function Notificacoes() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try {
      const data = await apiFetch<AppNotification[]>("/me/notifications");
      setItems(data);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function markRead(id: number) {
    await apiFetch(`/me/notifications/${id}/read`, { method: "PATCH" });
    await load();
  }

  async function markAll() {
    await apiFetch("/me/notifications/read-all", { method: "POST" });
    await load();
  }

  const grouped = items.reduce<Record<string, AppNotification[]>>((acc, n) => {
    const k = typeLabel[n.type];
    acc[k] = acc[k] ? [...acc[k], n] : [n];
    return acc;
  }, {});

  return (
    <div className="page">
      <h1>Notificações</h1>
      <div className="row-between" style={{ marginBottom: 12 }}>
        <p className="muted small">Central de alertas</p>
        <button type="button" className="btn-ghost small" onClick={() => void markAll()}>
          Marcar todas lidas
        </button>
      </div>
      {err && <div className="banner-error">{err}</div>}
      {Object.entries(grouped).map(([label, list]) => (
        <section key={label} className="section">
          <h2>{label}</h2>
          <ul className="card-list">
            {list.map((n) => (
              <li key={n.id} className={`card${n.read_at ? " muted" : ""}`}>
                <strong>{n.title}</strong>
                <p className="small">{n.message}</p>
                <p className="muted small">{new Date(n.created_at).toLocaleString()}</p>
                {!n.read_at && (
                  <button type="button" className="btn-secondary small" onClick={() => void markRead(n.id)}>
                    Marcar lida
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
      {items.length === 0 && !err && <p className="muted">Nada por aqui ainda.</p>}
    </div>
  );
}
