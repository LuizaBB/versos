// frontend/src/pages/GrupoHistorico.tsx
// Histórico de anúncios de um grupo MARKETPLACE, organizado por mês/ano

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../api/client";

interface BookSnippet {
  title: string;
  author: string;
  cover_url?: string;
}

interface ListingSnippet {
  id: number;
  title: string;
  price: number;
  condition: string;
  book: BookSnippet;
}

interface Sender {
  id: number;
  name: string;
  avatar_url?: string;
}

interface Message {
  id: number;
  kind: "TEXT" | "LISTING_REF";
  created_at: string;
  sender: Sender;
  listing?: ListingSnippet;
}

interface GroupDetail {
  id: number;
  name: string;
  group_type: string;
}

const conditionLabel: Record<string, string> = {
  NEW: "Novo",
  LIKE_NEW: "Seminovo",
  GOOD: "Bom",
  USED: "Usado",
  WORN: "Desgastado",
};

function monthLabel(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

export default function GrupoHistorico() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const groupId = Number(id);

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /*useEffect(() => {
    apiFetch<GroupDetail>(`/groups/${groupId}`).then(setGroup).catch(() => navigate("/grupos"));
  }, [groupId, navigate]);*/

  useEffect(() => {
  apiFetch<GroupDetail>(`/groups/${groupId}`).then(setGroup).catch(() => navigate("/app/grupos"));
}, [groupId, navigate]);

  useEffect(() => {
    apiFetch<Message[]>(`/groups/${groupId}/history`)
      .then((msgs) => setMessages(msgs.filter((m) => m.kind === "LISTING_REF")))
      .catch(() => setError("Não foi possível carregar o histórico."))
      .finally(() => setLoading(false));
  }, [groupId]);

  // Agrupa por "Mês AAAA"
  const grouped: { label: string; items: Message[] }[] = [];
  for (const m of messages) {
    const label = monthLabel(m.created_at);
    const last = grouped[grouped.length - 1];
    if (!last || last.label !== label) grouped.push({ label, items: [m] });
    else last.items.push(m);
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#120e09",
        color: "#e8d5b7",
        fontFamily: "Georgia, 'Times New Roman', serif",
        maxWidth: 480,
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 16px",
          background: "#1a150f",
          borderBottom: "1px solid #2a2118",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <button
          onClick={() => navigate(`/app/grupos/${groupId}/chat`)}
          style={{
            background: "none",
            border: "none",
            color: "#c8a87a",
            fontSize: 20,
            cursor: "pointer",
            padding: 4,
            lineHeight: 1,
          }}
        >
          ←
        </button>
        <div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>Histórico de Anúncios</p>
          <p style={{ margin: 0, fontSize: 11, color: "#7a6040" }}>{group?.name}</p>
        </div>
      </div>

      {/* Conteúdo */}
      <div style={{ padding: "16px 0 32px" }}>
        {loading && (
          <p style={{ textAlign: "center", color: "#7a6040", marginTop: 60 }}>Carregando…</p>
        )}
        {!loading && error && (
          <p style={{ textAlign: "center", color: "#c0392b", marginTop: 40 }}>{error}</p>
        )}
        {!loading && !error && grouped.length === 0 && (
          <p style={{ textAlign: "center", color: "#7a6040", marginTop: 60, fontSize: 14 }}>
            Nenhum anúncio compartilhado ainda.
          </p>
        )}

        {grouped.map(({ label, items }) => (
          <div key={label}>
            {/* Separador de mês — estilo linha do tempo */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "20px 16px 10px",
              }}
            >
              <div style={{ flex: 1, height: 1, background: "#2a2118" }} />
              <span
                style={{
                  fontSize: 11,
                  color: "#7a6040",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  whiteSpace: "nowrap",
                  fontFamily: "Georgia, serif",
                }}
              >
                {label}
              </span>
              <div style={{ flex: 1, height: 1, background: "#2a2118" }} />
            </div>

            {/* Grid de cards 2 colunas (igual galeria de mídia) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
                padding: "0 16px",
              }}
            >
              {items.map((m) =>
                m.listing ? (
                  <ListingHistoryCard
                    key={m.id}
                    listing={m.listing}
                    sender={m.sender}
                    date={m.created_at}
                  />
                ) : null
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ListingHistoryCard({
  listing,
  sender,
  date,
}: {
  listing: ListingSnippet;
  sender: Sender;
  date: string;
}) {
  const navigate = useNavigate();
  const [hover, setHover] = useState(false);

  return (
    <div
      onClick={() => navigate(`/anuncios/${listing.id}`)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? "#2a2118" : "#1a150f",
        border: `1px solid ${hover ? "#5c4a32" : "#2a2118"}`,
        borderRadius: 10,
        overflow: "hidden",
        cursor: "pointer",
        transition: "background 0.15s, border-color 0.15s",
      }}
    >
      {/* Capa do livro */}
      <div style={{ width: "100%", aspectRatio: "2/3", background: "#2a2118", position: "relative" }}>
        {listing.book.cover_url ? (
          <img
            src={listing.book.cover_url}
            alt={listing.book.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 36,
            }}
          >
            📖
          </div>
        )}
        {/* Badge de condição */}
        <span
          style={{
            position: "absolute",
            top: 6,
            right: 6,
            background: "rgba(18,14,9,0.85)",
            color: "#c8a87a",
            fontSize: 9,
            padding: "2px 6px",
            borderRadius: 4,
            fontFamily: "Georgia, serif",
          }}
        >
          {conditionLabel[listing.condition] ?? listing.condition}
        </span>
      </div>

      {/* Info */}
      <div style={{ padding: "8px 10px 10px" }}>
        <p
          style={{
            margin: 0,
            fontSize: 12,
            fontWeight: 700,
            color: "#e8d5b7",
            lineHeight: 1.3,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {listing.title}
        </p>
        <p style={{ margin: "3px 0 0", fontSize: 10, color: "#7a6040" }}>{listing.book.author}</p>
        <p style={{ margin: "6px 0 0", fontSize: 13, fontWeight: 700, color: "#c8a87a" }}>
          R$ {listing.price.toFixed(2)}
        </p>
        <p style={{ margin: "4px 0 0", fontSize: 10, color: "#5c4a32" }}>
          por {sender.name} ·{" "}
          {new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
        </p>
      </div>
    </div>
  );
}
