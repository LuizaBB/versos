// frontend/src/pages/ChatPrivado.tsx
// Chat 1-a-1 vinculado a uma Purchase (negociação)

import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../api/client";
import { useAuth } from "../auth/AuthContext";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Sender {
  id: number;
  name: string;
  avatar_url?: string;
}

interface Message {
  id: number;
  purchase_id: number;
  sender_id: number;
  body: string;
  created_at: string;
  sender: Sender;
}

interface PurchaseInfo {
  id: number;
  buyer_id: number;
  seller_id: number;
  status: string;
  listing: {
    id: number;
    title: string;
    price: number;
    book: { title: string; author: string; cover_url?: string };
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function Avatar({ sender, size = 32 }: { sender: Sender; size?: number }) {
  const initials = sender.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (sender.avatar_url) {
    return (
      <img
        src={sender.avatar_url}
        alt={sender.name}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
        }}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "#5c4a32",
        color: "#e8d5b7",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.38,
        fontWeight: 700,
        flexShrink: 0,
        fontFamily: "Georgia, serif",
      }}
    >
      {initials}
    </div>
  );
}

// ─── Bolha de mensagem ────────────────────────────────────────────────────────

function MessageBubble({ msg, isMine }: { msg: Message; isMine: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: isMine ? "row-reverse" : "row",
        alignItems: "flex-end",
        gap: 8,
        marginBottom: 6,
        padding: "0 16px",
      }}
    >
      {!isMine && <Avatar sender={msg.sender} size={28} />}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: isMine ? "flex-end" : "flex-start",
        }}
      >
        {!isMine && (
          <span
            style={{
              fontSize: 11,
              color: "#a08060",
              marginBottom: 3,
              paddingLeft: 2,
            }}
          >
            {msg.sender.name}
          </span>
        )}
        <div
          style={{
            maxWidth: "72%",
            padding: "10px 14px",
            borderRadius: isMine
              ? "18px 18px 4px 18px"
              : "18px 18px 18px 4px",
            background: isMine ? "#5c4a32" : "#2a2118",
            color: "#e8d5b7",
            fontSize: 14,
            lineHeight: 1.5,
            wordBreak: "break-word",
          }}
        >
          <p style={{ margin: 0 }}>{msg.body}</p>
          <span
            style={{
              display: "block",
              textAlign: "right",
              fontSize: 10,
              color: "#a08060",
              marginTop: 4,
            }}
          >
            {formatTime(msg.created_at)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Separador de data ────────────────────────────────────────────────────────

function DateSeparator({ date }: { date: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 16px 6px",
      }}
    >
      <div style={{ flex: 1, height: 1, background: "#2a2118" }} />
      <span style={{ fontSize: 11, color: "#7a6040", whiteSpace: "nowrap" }}>
        {date}
      </span>
      <div style={{ flex: 1, height: 1, background: "#2a2118" }} />
    </div>
  );
}

// ─── Card do anúncio no topo ──────────────────────────────────────────────────

function ListingHeader({
  purchase,
  onPress,
}: {
  purchase: PurchaseInfo;
  onPress: () => void;
}) {
  const statusLabel: Record<string, string> = {
    PENDING: "Aguardando",
    PAYMENT_CONFIRMED: "Pagamento confirmado",
    IN_TRANSIT: "Em trânsito",
    DELIVERED: "Entregue",
    COMPLETED: "Concluído",
    CANCELLED: "Cancelado",
  };

  return (
    <div
      onClick={onPress}
      style={{
        display: "flex",
        gap: 10,
        padding: "10px 16px",
        background: "#1a150f",
        borderBottom: "1px solid #2a2118",
        cursor: "pointer",
      }}
    >
      {purchase.listing.book.cover_url ? (
        <img
          src={purchase.listing.book.cover_url}
          alt={purchase.listing.book.title}
          style={{
            width: 40,
            height: 54,
            objectFit: "cover",
            borderRadius: 4,
            flexShrink: 0,
          }}
        />
      ) : (
        <div
          style={{
            width: 40,
            height: 54,
            background: "#2a2118",
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            flexShrink: 0,
          }}
        >
          📖
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontWeight: 700,
            fontSize: 13,
            color: "#e8d5b7",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {purchase.listing.title}
        </p>
        <p style={{ margin: "2px 0 0", fontSize: 11, color: "#a08060" }}>
          {purchase.listing.book.author}
        </p>
        <div
          style={{ display: "flex", gap: 8, marginTop: 4, alignItems: "center" }}
        >
          <span style={{ fontSize: 13, fontWeight: 700, color: "#c8a87a" }}>
            R$ {purchase.listing.price.toFixed(2)}
          </span>
          <span
            style={{
              fontSize: 10,
              background: "#2a2118",
              color: "#7a6040",
              padding: "2px 6px",
              borderRadius: 4,
              border: "1px solid #3d2e1a",
            }}
          >
            {statusLabel[purchase.status] ?? purchase.status}
          </span>
        </div>
      </div>
      <span style={{ fontSize: 18, color: "#5c4a32", alignSelf: "center" }}>
        ›
      </span>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ChatPrivado() {
  const { purchaseId } = useParams<{ purchaseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const pid = Number(purchaseId);

  const [purchase, setPurchase] = useState<PurchaseInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Carrega dados da compra
  useEffect(() => {
    apiFetch<PurchaseInfo>(`/purchases/${pid}`)
      .then(setPurchase)
      .catch(() => navigate("/app/comprados"));
  }, [pid, navigate]);

  // Carrega mensagens
  const fetchMessages = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const msgs = await apiFetch<Message[]>(
          `/purchases/${pid}/messages?limit=60`
        );
        setMessages(msgs);
      } catch {
        if (!silent) setError("Não foi possível carregar as mensagens.");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [pid]
  );

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Polling a cada 5s
  useEffect(() => {
    const interval = setInterval(() => fetchMessages(true), 5000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // Scroll automático
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const msg = await apiFetch<Message>(`/purchases/${pid}/messages`, {
        method: "POST",
        body: JSON.stringify({ body: text.trim() }),
      });
      setMessages((prev) => [...prev, msg]);
      setText("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao enviar.");
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // Agrupa por data
  function groupByDate(msgs: Message[]) {
    const groups: { date: string; msgs: Message[] }[] = [];
    for (const m of msgs) {
      const d = formatDate(m.created_at);
      if (!groups.length || groups[groups.length - 1].date !== d) {
        groups.push({ date: d, msgs: [m] });
      } else {
        groups[groups.length - 1].msgs.push(m);
      }
    }
    return groups;
  }

  // Determina o outro participante para o título
  const otherName = (() => {
    if (!purchase || !user) return "…";
    if (user.id === purchase.buyer_id) return "Vendedor";
    return "Comprador";
  })();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        background: "#120e09",
        color: "#e8d5b7",
        fontFamily: "Georgia, 'Times New Roman', serif",
        maxWidth: 480,
        margin: "0 auto",
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 16px",
          background: "#1a150f",
          borderBottom: "1px solid #2a2118",
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => navigate(-1)}
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
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: "#e8d5b7" }}>
            Negociação
          </p>
          <p style={{ margin: 0, fontSize: 11, color: "#7a6040" }}>
            {otherName}
          </p>
        </div>
      </div>

      {/* ── Card do anúncio ── */}
      {purchase && (
        <ListingHeader
          purchase={purchase}
          onPress={() => navigate(`/app/anuncios/${purchase.listing.id}`)}
        />
      )}

      {/* ── Mensagens ── */}
      <div style={{ flex: 1, overflowY: "auto", paddingTop: 8, paddingBottom: 8 }}>
        {loading && (
          <p style={{ textAlign: "center", color: "#7a6040", marginTop: 40 }}>
            Carregando…
          </p>
        )}
        {!loading && messages.length === 0 && (
          <p
            style={{
              textAlign: "center",
              color: "#7a6040",
              marginTop: 60,
              fontSize: 14,
              padding: "0 32px",
            }}
          >
            Nenhuma mensagem ainda. Combine os detalhes da negociação aqui! 🤝
          </p>
        )}

        {groupByDate(messages).map(({ date, msgs }) => (
          <div key={date}>
            <DateSeparator date={date} />
            {msgs.map((m) => (
              <MessageBubble
                key={m.id}
                msg={m}
                isMine={m.sender_id === user?.id}
              />
            ))}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* ── Erro ── */}
      {error && (
        <p
          style={{
            textAlign: "center",
            color: "#c0392b",
            fontSize: 12,
            margin: "4px 0",
          }}
        >
          {error}
        </p>
      )}

      {/* ── Input ── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 10,
          padding: "10px 16px",
          background: "#1a150f",
          borderTop: "1px solid #2a2118",
          flexShrink: 0,
        }}
      >
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite uma mensagem…"
          rows={1}
          style={{
            flex: 1,
            background: "#2a2118",
            border: "1px solid #3d2e1a",
            borderRadius: 20,
            padding: "10px 16px",
            color: "#e8d5b7",
            fontSize: 14,
            fontFamily: "Georgia, serif",
            resize: "none",
            outline: "none",
            lineHeight: 1.5,
            maxHeight: 120,
            overflowY: "auto",
          }}
        />
        <button
          onClick={handleSend}
          disabled={sending || !text.trim()}
          style={{
            width: 42,
            height: 42,
            borderRadius: "50%",
            background: sending || !text.trim() ? "#2a2118" : "#5c4a32",
            border: "none",
            color: sending || !text.trim() ? "#4a3822" : "#e8d5b7",
            fontSize: 18,
            cursor: sending || !text.trim() ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "background 0.15s",
          }}
        >
          ➤
        </button>
      </div>
    </div>
  );
}
