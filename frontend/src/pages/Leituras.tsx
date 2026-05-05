import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { AddBookModal } from "../components/AddBookModal";
import type { AppNotification, Book, UserBook } from "../types";

export function Leituras() {
  const { user } = useAuth();
  const [items, setItems] = useState<UserBook[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [highlight, setHighlight] = useState<AppNotification | null>(null);
  const [modal, setModal] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const [shelf, catalog, favs, notifs] = await Promise.all([
        apiFetch<UserBook[]>("/me/books"),
        apiFetch<Book[]>("/books"),
        apiFetch<number[]>("/me/favorites"),
        apiFetch<AppNotification[]>("/me/notifications"),
      ]);
      setItems(shelf);
      setBooks(catalog);
      setFavorites(favs);
      const reading = notifs.find((n) => n.type === "READING" || n.type === "GROUP");
      setHighlight(reading ?? notifs[0] ?? null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao carregar");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleFavorite(bookId: number) {
    try {
      if (favorites.includes(bookId)) {
        await apiFetch(`/me/favorites/${bookId}`, { method: "DELETE" });
        setFavorites((f) => f.filter((id) => id !== bookId));
      } else {
        await apiFetch("/me/favorites", { method: "POST", body: JSON.stringify({ book_id: bookId }) });
        setFavorites((f) => [...f, bookId]);
      }
    } catch {
      /* noop */
    }
  }

  const lendo = items.filter((i) => i.status === "LENDO");
  const outros = items.filter((i) => i.status !== "LENDO");

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Leituras</h1>
          <p className="muted small">Olá, {user?.name}</p>
        </div>
        <div className="header-actions">
          <Link to="/app/notificacoes" className="btn-ghost">
            🔔
          </Link>
          <Link to="/app/perfil" className="btn-ghost">
            Perfil
          </Link>
        </div>
      </header>

      {err && <div className="banner-error">{err}</div>}

      {highlight && (
        <section className="card highlight">
          <p className="eyebrow">Último registro</p>
          <h3>{highlight.title}</h3>
          <p className="muted">{highlight.message}</p>
        </section>
      )}

      <section className="section">
        <h2>Minhas leituras atuais</h2>
        {lendo.length === 0 ? (
          <p className="muted">Nenhum livro em leitura. Adicione com o botão +.</p>
        ) : (
          <ul className="book-list">
            {lendo.map((ub) => (
              <li key={ub.id} className="book-card">
                <Link to={`/app/livros/${ub.book_id}`} className="book-cover-link">
                  <img
                    src={ub.book.cover_url || "https://placehold.co/96x140/3d3428/f5efe6?text=Livro"}
                    alt=""
                    className="cover"
                  />
                </Link>
                <div className="book-meta">
                  <Link to={`/app/livros/${ub.book_id}`} className="title-link">
                    <h3>{ub.book.title}</h3>
                  </Link>
                  <p className="muted">{ub.book.author}</p>
                  <div className="progress">
                    <div
                      className="progress-bar"
                      style={{ width: `${Math.min(100, ub.progress_percent ?? 0)}%` }}
                    />
                  </div>
                  <p className="small muted">
                    Pág. {ub.progress_page ?? "—"} · Cap. {ub.progress_chapter ?? "—"} ·{" "}
                    {ub.progress_percent != null ? `${Math.round(ub.progress_percent)}%` : "—"}
                  </p>
                  <button
                    type="button"
                    className={`btn-fav${favorites.includes(ub.book_id) ? " on" : ""}`}
                    onClick={() => void toggleFavorite(ub.book_id)}
                    aria-label="Favoritar para alertas de compra"
                  >
                    {favorites.includes(ub.book_id) ? "★ Favorito" : "☆ Favoritar"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="section">
        <h2>Estante</h2>
        {outros.length === 0 ? (
          <p className="muted">Sua estante ainda tem só leituras ativas ou está vazia.</p>
        ) : (
          <ul className="book-list compact">
            {outros.map((ub) => (
              <li key={ub.id} className="book-row">
                <img
                  src={ub.book.cover_url || "https://placehold.co/56x80/3d3428/f5efe6?text=+"}
                  alt=""
                  className="cover tiny"
                />
                <div>
                  <Link to={`/app/livros/${ub.book_id}`}>
                    <strong>{ub.book.title}</strong>
                  </Link>
                  <div className="muted small">
                    {ub.status === "QUERO_LER" ? "Quero ler" : "Lido"}
                    {ub.rating ? ` · ${"★".repeat(ub.rating)}` : ""}
                  </div>
                </div>
                <button
                  type="button"
                  className={`btn-fav small${favorites.includes(ub.book_id) ? " on" : ""}`}
                  onClick={() => void toggleFavorite(ub.book_id)}
                >
                  {favorites.includes(ub.book_id) ? "★" : "☆"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <button type="button" className="fab" onClick={() => setModal(true)} aria-label="Adicionar à estante">
        +
      </button>

      <AddBookModal
        open={modal}
        onClose={() => setModal(false)}
        onSaved={(ub) => setItems((prev) => [ub, ...prev])}
        books={books}
      />
    </div>
  );
}
