import { useState } from "react";
import { apiFetch } from "../api/client";
import type { Book, ReadingStatus, UserBook } from "../types";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: (ub: UserBook) => void;
  books: Book[];
};

const statusLabels: Record<ReadingStatus, string> = {
  QUERO_LER: "Quero ler",
  LENDO: "Lendo",
  LIDO: "Lido",
};

export function AddBookModal({ open, onClose, onSaved, books }: Props) {
  const [status, setStatus] = useState<ReadingStatus>("QUERO_LER");
  const [bookId, setBookId] = useState<number | "">("");
  const [newTitle, setNewTitle] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [useNew, setUseNew] = useState(false);
  const [notes, setNotes] = useState("");
  const [startedAt, setStartedAt] = useState("");
  const [finishedAt, setFinishedAt] = useState("");
  const [progressPage, setProgressPage] = useState("");
  const [progressChapter, setProgressChapter] = useState("");
  const [progressPercent, setProgressPercent] = useState("");
  const [rating, setRating] = useState("5");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const body: Record<string, unknown> = {
        status,
        notes: notes || undefined,
      };
      if (useNew) {
        body.new_book = { title: newTitle, author: newAuthor };
      } else {
        if (!bookId) throw new Error("Selecione um livro");
        body.book_id = bookId;
      }
      if (status === "LENDO" || status === "LIDO") {
        if (startedAt) body.started_at = new Date(startedAt).toISOString();
      }
      if (status === "LENDO") {
        if (progressPage) body.progress_page = Number(progressPage);
        if (progressChapter) body.progress_chapter = Number(progressChapter);
        if (progressPercent) body.progress_percent = Number(progressPercent);
      }
      if (status === "LIDO") {
        if (finishedAt) body.finished_at = new Date(finishedAt).toISOString();
        body.rating = Number(rating);
        if (progressPage) body.progress_page = Number(progressPage);
        if (progressPercent) body.progress_percent = Number(progressPercent);
      }
      const ub = await apiFetch<UserBook>("/me/books", { method: "POST", body: JSON.stringify(body) });
      onSaved(ub);
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal
        aria-labelledby="add-book-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="add-book-title">Adicionar à estante</h2>
          <button type="button" className="btn-ghost" onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </div>
        <form onSubmit={submit} className="form modal-form">
          {err && <div className="banner-error">{err}</div>}
          <label>
            Status
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ReadingStatus)}
            >
              {(Object.keys(statusLabels) as ReadingStatus[]).map((k) => (
                <option key={k} value={k}>
                  {statusLabels[k]}
                </option>
              ))}
            </select>
          </label>
          <label className="checkbox-row">
            <input type="checkbox" checked={useNew} onChange={(e) => setUseNew(e.target.checked)} />
            Cadastrar livro novo
          </label>
          {useNew ? (
            <>
              <label>
                Título
                <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required />
              </label>
              <label>
                Autor
                <input value={newAuthor} onChange={(e) => setNewAuthor(e.target.value)} required />
              </label>
            </>
          ) : (
            <label>
              Livro
              <select
                value={bookId}
                onChange={(e) => setBookId(e.target.value ? Number(e.target.value) : "")}
                required={!useNew}
              >
                <option value="">Selecione…</option>
                {books.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title} — {b.author}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label>
            Observações
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </label>
          {(status === "LENDO" || status === "LIDO") && (
            <label>
              Data de início
              <input type="date" value={startedAt} onChange={(e) => setStartedAt(e.target.value)} />
            </label>
          )}
          {status === "LENDO" && (
            <>
              <label>
                Página atual
                <input
                  inputMode="numeric"
                  value={progressPage}
                  onChange={(e) => setProgressPage(e.target.value)}
                />
              </label>
              <label>
                Capítulo
                <input
                  inputMode="numeric"
                  value={progressChapter}
                  onChange={(e) => setProgressChapter(e.target.value)}
                />
              </label>
              <label>
                % concluído
                <input
                  inputMode="decimal"
                  value={progressPercent}
                  onChange={(e) => setProgressPercent(e.target.value)}
                />
              </label>
            </>
          )}
          {status === "LIDO" && (
            <>
              <label>
                Data de conclusão
                <input type="date" value={finishedAt} onChange={(e) => setFinishedAt(e.target.value)} />
              </label>
              <label>
                Avaliação (1–5)
                <select value={rating} onChange={(e) => setRating(e.target.value)}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? "Salvando…" : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
