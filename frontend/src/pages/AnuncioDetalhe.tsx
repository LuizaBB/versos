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

  // useEffect(() => {
  //   if (!Number.isFinite(id)) return;
  //   void (async () => {
  //     try {
  //       const l = await apiFetch<Listing>(`/listings/${id}`);
  //       setListing(l);
  //     } catch (e) {
  //       setErr(e instanceof Error ? e.message : "Erro");
  //     }
  //   })();
  // }, [id]);

  useEffect(() => {
  if (!Number.isFinite(id)) return;
  void (async () => {
    try {
      const l = await apiFetch<Listing>(`/listings/${id}`);
      setListing(l);
      // busca compradores se for o vendedor
      if (user && l.seller_id === user.id) {
        const b = await apiFetch<Buyer[]>(`/listings/${id}/buyers`);
        setBuyers(b);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro");
    }
  })();
}, [id, user]);

  // async function buy() {
  //   if (!listing) return;
  //   setBusy(true);
  //   try {
  //     const p = await apiFetch<Purchase>("/purchases", {
  //       method: "POST",
  //       body: JSON.stringify({ listing_id: listing.id }),
  //     });
  //     nav(`/app/compras/${p.id}`, { replace: true });
  //   } catch (e) {
  //     alert(e instanceof Error ? e.message : "Erro");
  //   } finally {
  //     setBusy(false);
  //   }
  // }
  async function buy() {
  if (!listing) return;
  setBusy(true);
  try {
    const p = await apiFetch<Purchase>("/purchases", {
      method: "POST",
      body: JSON.stringify({ listing_id: listing.id }),
    });
    // redireciona para o chat em vez de CompraDetalhe
    nav(`/app/compras/${p.id}/chat`, { replace: true });
  } catch (e) {
    alert(e instanceof Error ? e.message : "Erro");
  } finally {
    setBusy(false);
  }
}

  if (err) return <div className="banner-error">{err}</div>;
  if (!listing) return <p className="muted">Carregando…</p>;

  const isSeller = user?.id === listing.seller_id;

//   return (
//     <div className="page">
//       <h1>{listing.title}</h1>
//       <p className="muted">{listing.book.title}</p>
//       <p className="lead">R$ {listing.price.toFixed(2)}</p>
//       {listing.description && <p>{listing.description}</p>}
//       <p className="small muted">Status: {listing.status}</p>
//       {!isSeller && listing.status === "ACTIVE" && (
//         <button type="button" className="btn-primary" disabled={busy} onClick={() => void buy()}>
//           {busy ? "Processando…" : "Comprar"}
//         </button>
//       )}
//       {isSeller && <p className="muted">Este é o seu anúncio.</p>}
//     </div>
//   );
// }

  return (
  <div className="page">
    <h1>{listing.title}</h1>
    <p className="muted">{listing.book.title}</p>
    <p className="lead">R$ {listing.price.toFixed(2)}</p>
    {listing.description && <p>{listing.description}</p>}
    <p className="small muted">Status: {listing.status}</p>

    {/* Comprador: botão de interesse */}
    {!isSeller && listing.status === "ACTIVE" && (
      <button
        type="button"
        className="btn-primary"
        disabled={busy}
        onClick={() => void buy()}
      >
        {busy ? "Processando…" : "Tenho interesse"}
      </button>
    )}

    {/* Vendedor: lista de interessados */}
    {isSeller && (
      <section className="section">
        <h2>Interessados</h2>
        {buyers.length === 0 ? (
          <p className="muted">Nenhum interessado ainda.</p>
        ) : (
          <ul className="card-list">
            {buyers.map((b) => (
              <li key={b.purchase_id} className="card">
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {b.buyer_avatar && (
                    <img
                      src={b.buyer_avatar}
                      alt={b.buyer_name}
                      style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }}
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <strong>{b.buyer_name}</strong>
                    <p className="muted small">
                      {new Date(b.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => nav(`/app/compras/${b.purchase_id}/chat`)}
                  >
                    Negociar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    )}
  </div>
);

const [buyers, setBuyers] = useState<Buyer[]>([]);

interface Buyer {
  purchase_id: number;
  buyer_id: number;
  buyer_name: string;
  buyer_avatar?: string;
  status: string;
  created_at: string;
}
