import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import type { Listing, Purchase } from "../types";

export function AnuncioDetalhe() {
  const { listingId } = useParams();
  const id = Number(listingId);
  const { user } = useAuth();
  const nav = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(id)) return;
    void (async () => {
      try {
        const l = await apiFetch<Listing>(`/listings/${id}`);
        setListing(l);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Erro");
      }
    })();
  }, [id]);

  async function buy() {
    if (!listing) return;
    setBusy(true);
    try {
      const p = await apiFetch<Purchase>("/purchases", {
        method: "POST",
        body: JSON.stringify({ listing_id: listing.id }),
      });
      nav(`/app/compras/${p.id}`, { replace: true });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro");
    } finally {
      setBusy(false);
    }
  }

  if (err) return <div className="banner-error">{err}</div>;
  if (!listing) return <p className="muted">Carregando…</p>;

  const isSeller = user?.id === listing.seller_id;

  return (
    <div className="page">
      <h1>{listing.title}</h1>
      <p className="muted">{listing.book.title}</p>
      <p className="lead">R$ {listing.price.toFixed(2)}</p>
      {listing.description && <p>{listing.description}</p>}
      <p className="small muted">Status: {listing.status}</p>
      {!isSeller && listing.status === "ACTIVE" && (
        <button type="button" className="btn-primary" disabled={busy} onClick={() => void buy()}>
          {busy ? "Processando…" : "Comprar"}
        </button>
      )}
      {isSeller && <p className="muted">Este é o seu anúncio.</p>}
    </div>
  );
}
