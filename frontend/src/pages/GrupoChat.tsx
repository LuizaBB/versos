// frontend/src/pages/GrupoChat.tsx
// Tela de chat de um grupo — discussão ou marketplace
// Polling a cada 5 s para novas mensagens

import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../api/client";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Sender {
  id: number;
  name: string;
  avatar_url?: string;
}

interface ReplySnippet {
  id: number;
  body?: string;
  sender: Sender;
}

interface ListingSnippet {
  id: number;
  title: string;
  price: number;
  condition: string;
  book: { title: string; author: string; cover_url?: string };
}

interface Message {
  id: number;
  group_id: number;
  sender_id: number;
  kind: "TEXT" | "LISTING_REF";
  body?: string;
  listing_id?: number;
  reply_to_id?: number;
  created_at: string;
  sender: Sender;
  listing?: ListingSnippet;
  reply_to?: ReplySnippet;
}

interface GroupDetail {
  id: number;
  name: string;
  description?: string;
  cover_url?: string;
  group_type: "DISCUSSION" | "MARKETPLACE";
  member_count: number;
  my_role?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const conditionLabel: Record<string, string> = {
  NEW: "Novo",
  LIKE_NEW: "Seminovo",
  GOOD: "Bom",
  USED: "Usado",
  WORN: "Desgastado",
};

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
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

function MessageBubble({
  msg,
  isMine,
  onReply,
}: {
  msg: Message;
  isMine: boolean;
  onReply: (m: Message) => void;
}) {
  const [hover, setHover] = useState(false);

  const bubbleStyle: React.CSSProperties = {
    maxWidth: "72%",
    padding: "10px 14px",
    borderRadius: isMine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
    background: isMine ? "#5c4a32" : "#2a2118",
    color: "#e8d5b7",
    fontSize: 14,
    lineHeight: 1.5,
    position: "relative",
    cursor: "pointer",
    boxShadow: hover ? "0 2px 8px rgba(0,0,0,0.35)" : "0 1px 3px rgba(0,0,0,0.2)",
    transition: "box-shadow 0.15s",
    wordBreak: "break-word",
  };

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
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {!isMine && <Avatar sender={msg.sender} size={28} />}

      <div style={{ display: "flex", flexDirection: "column", alignItems: isMine ? "flex-end" : "flex-start" }}>
        {!isMine && (
          <span style={{ fontSize: 11, color: "#a08060", marginBottom: 3, paddingLeft: 2 }}>
            {msg.sender.name}
          </span>
        )}

        <div
          style={bubbleStyle}
          onDoubleClick={() => onReply(msg)}
          title="Duplo clique para responder"
        >
          {/* Reply snippet */}
          {msg.reply_to && (
            <div
              style={{
                borderLeft: "3px solid #a08060",
                paddingLeft: 8,
                marginBottom: 8,
                opacity: 0.75,
                fontSize: 12,
              }}
            >
              <span style={{ fontWeight: 600, color: "#c8a87a" }}>{msg.reply_to.sender.name}</span>
              <p style={{ margin: "2px 0 0", color: "#c8b090" }}>
                {msg.reply_to.body?.slice(0, 80) ?? "Anúncio"}
                {(msg.reply_to.body?.length ?? 0) > 80 ? "…" : ""}
              </p>
            </div>
          )}

          {/* Listing card */}
          {msg.kind === "LISTING_REF" && msg.listing && (
            <ListingCard listing={msg.listing} />
          )}

          {/* Text body */}
          {msg.body && <p style={{ margin: 0 }}>{msg.body}</p>}

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

        {hover && (
          <button
            onClick={() => onReply(msg)}
            style={{
              marginTop: 3,
              background: "none",
              border: "none",
              color: "#a08060",
              fontSize: 11,
              cursor: "pointer",
              padding: "0 2px",
            }}
          >
            ↩ responder
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Card de anúncio dentro da bolha ─────────────────────────────────────────

function ListingCard({ listing }: { listing: ListingSnippet }) {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(`/app/anuncios/${listing.id}`)}
      style={{
        display: "flex",
        gap: 10,
        background: "#1a150f",
        borderRadius: 10,
        padding: 10,
        marginBottom: 8,
        cursor: "pointer",
        border: "1px solid #3d2e1a",
      }}
    >
      {listing.book.cover_url ? (
        <img
          src={listing.book.cover_url}
          alt={listing.book.title}
          style={{ width: 44, height: 60, objectFit: "cover", borderRadius: 4, flexShrink: 0 }}
        />
      ) : (
        <div
          style={{
            width: 44,
            height: 60,
            background: "#3d2e1a",
            borderRadius: 4,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
          }}
        >
          📖
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: "#e8d5b7", lineHeight: 1.3 }}>
          {listing.title}
        </p>
        <p style={{ margin: "3px 0 0", fontSize: 11, color: "#a08060" }}>
          {listing.book.author}
        </p>
        <div style={{ display: "flex", gap: 8, marginTop: 6, alignItems: "center" }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#c8a87a" }}>
            R$ {listing.price.toFixed(2)}
          </span>
          <span
            style={{
              fontSize: 10,
              background: "#3d2e1a",
              color: "#a08060",
              padding: "2px 6px",
              borderRadius: 4,
            }}
          >
            {conditionLabel[listing.condition] ?? listing.condition}
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
      <span style={{ fontSize: 11, color: "#7a6040", whiteSpace: "nowrap" }}>{date}</span>
      <div style={{ flex: 1, height: 1, background: "#2a2118" }} />
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function GrupoChat() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const groupId = Number(id);

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastIdRef = useRef<number>(0);

  // Busca detalhes do grupo
  /*useEffect(() => {
    apiFetch<GroupDetail>(`/groups/${groupId}`)
      .then(setGroup)
      .catch(() => navigate("/grupos"));
  }, [groupId, navigate]);*/

  useEffect(() => {
  apiFetch<GroupDetail>(`/groups/${groupId}`)
    .then(setGroup)
    .catch(() => navigate("/app/grupos"));
}, [groupId, navigate]);
  
  // Carrega mensagens iniciais
  const fetchMessages = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const msgs = await apiFetch<Message[]>(`/groups/${groupId}/messages?limit=60`);
        setMessages(msgs);
        if (msgs.length > 0) lastIdRef.current = msgs[msgs.length - 1].id;
      } catch {
        if (!silent) setError("Não foi possível carregar as mensagens.");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [groupId]
  );

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Polling a cada 5 s
  useEffect(() => {
    const interval = setInterval(() => fetchMessages(true), 5000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // Scroll automático ao receber novas mensagens
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const msg = await apiFetch<Message>(`/groups/${groupId}/messages`, {
        method: "POST",
        body: JSON.stringify({ body: text.trim(), reply_to_id: replyTo?.id ?? null }),
      });
      setMessages((prev) => [...prev, msg]);
      setText("");
      setReplyTo(null);
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

  // Agrupa mensagens por data
  function groupByDate(msgs: Message[]) {
    const groups: { date: string; msgs: Message[] }[] = [];
    for (const m of msgs) {
      const d = new Date(m.created_at).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
      if (!groups.length || groups[groups.length - 1].date !== d) {
        groups.push({ date: d, msgs: [m] });
      } else {
        groups[groups.length - 1].msgs.push(m);
      }
    }
    return groups;
  }

  const currentUserId = (() => {
    try {
      const raw = localStorage.getItem("versos_token");
      if (!raw) return -1;
      const payload = JSON.parse(atob(raw.split(".")[1]));
      return payload.sub as number;
    } catch {
      return -1;
    }
  })();

  const isMarketplace = group?.group_type === "MARKETPLACE";

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
        position: "relative",
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
          onClick={() => navigate("/app/grupos")}
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
        {group?.cover_url && (
          <img
            src={group.cover_url}
            alt={group.name}
            style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }}
          />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: "#e8d5b7" }}>
            {group?.name ?? "Carregando…"}
          </p>
          <p style={{ margin: 0, fontSize: 11, color: "#7a6040" }}>
            {group ? `${group.member_count} membro${group.member_count !== 1 ? "s" : ""}` : ""}
            {isMarketplace ? " · Marketplace" : " · Discussão"}
          </p>
        </div>
        {isMarketplace && (
          <button
            onClick={() => navigate(`/app/grupos/${groupId}/historico`)}
            style={{
              background: "#2a2118",
              border: "1px solid #3d2e1a",
              color: "#c8a87a",
              fontSize: 11,
              padding: "4px 10px",
              borderRadius: 12,
              cursor: "pointer",
            }}
          >
            Histórico
          </button>
        )}
      </div>

      {/* ── Mensagens ── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          paddingBottom: 8,
          paddingTop: 8,
        }}
      >
        {loading && (
          <p style={{ textAlign: "center", color: "#7a6040", marginTop: 40 }}>Carregando…</p>
        )}
        {!loading && messages.length === 0 && (
          <p style={{ textAlign: "center", color: "#7a6040", marginTop: 60, fontSize: 14 }}>
            Nenhuma mensagem ainda. Seja o primeiro! ✍️
          </p>
        )}

        {groupByDate(messages).map(({ date, msgs }) => (
          <div key={date}>
            <DateSeparator date={date} />
            {msgs.map((m) => (
              <MessageBubble
                key={m.id}
                msg={m}
                isMine={m.sender_id === currentUserId}
                onReply={setReplyTo}
              />
            ))}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* ── Reply preview ── */}
      {replyTo && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 16px",
            background: "#1a150f",
            borderTop: "1px solid #2a2118",
          }}
        >
          <div style={{ flex: 1, borderLeft: "3px solid #c8a87a", paddingLeft: 8 }}>
            <span style={{ fontSize: 11, color: "#c8a87a", fontWeight: 700 }}>
              {replyTo.sender.name}
            </span>
            <p style={{ margin: 0, fontSize: 12, color: "#a08060" }}>
              {replyTo.body?.slice(0, 60) ?? "Anúncio"}
              {(replyTo.body?.length ?? 0) > 60 ? "…" : ""}
            </p>
          </div>
          <button
            onClick={() => setReplyTo(null)}
            style={{ background: "none", border: "none", color: "#7a6040", fontSize: 18, cursor: "pointer" }}
          >
            ×
          </button>
        </div>
      )}

      {/* ── Input ── */}
      {error && (
        <p style={{ textAlign: "center", color: "#c0392b", fontSize: 12, margin: "4px 0" }}>{error}</p>
      )}
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
