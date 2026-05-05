import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiFetch } from "../api/client";
import type { Book } from "../types";

export function LivroDetalhe() {
  const { bookId } = useParams();
  const id = Number(bookId);
  const [book, setBook] = useState<Book | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(id)) return;
    void (async () => {
      try {
        const b = await apiFetch<Book>(`/books/${id}`);
        setBook(b);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Erro");
      }
    })();
  }, [id]);

  if (err) return <div className="banner-error">{err}</div>;
  if (!book) return <p className="muted">Carregando…</p>;

  return (
    <div className="page book-detail">
      <img
        src={book.cover_url || "https://placehold.co/160x240/3d3428/f5efe6?text=Livro"}
        alt=""
        className="cover large"
      />
      <h1>{book.title}</h1>
      <p className="lead">{book.author}</p>
      {book.published_year && <p className="muted">Ano: {book.published_year}</p>}
      {book.description && <p>{book.description}</p>}
    </div>
  );
}
