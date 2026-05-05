import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/client";
import type { BookCondition, Listing, MyGroup, UserBook } from "../types";

const conditions: { value: BookCondition; label: string }[] = [
  { value: "NEW", label: "Novo" },
  { value: "LIKE_NEW", label: "Como novo" },
  { value: "GOOD", label: "Bom" },
  { value: "USED", label: "Usado" },
  { value: "WORN", label: "Desgastado" },
];

export function NovoAnuncio() {
  const nav = useNavigate();
  const [shelf, setShelf] = useState<UserBook[]>([]);
  const [groups, setGroups] = useState<MyGroup[]>([]);
  const [userBookId, setUserBookId] = useState<number | "">("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("29.9");
  const [condition, setCondition] = useState<BookCondition>("GOOD");
  const [selectedGroups, setSelectedGroups] = useState<number[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const [s, g] = await Promise.all([apiFetch<UserBook[]>("/me/books"), apiFetch<MyGroup[]>("/me/groups")]);
        setShelf(s);
        setGroups(g);
        if (g[0]) setSelectedGroups([g[0].group.id]);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Erro");
      }
    })();
  }, []);

  const selectedUb = shelf.find((u) => u.id === userBookId);

  useEffect(() => {
    if (selectedUb) {
      setTitle(`${selectedUb.book.title} — ${selectedUb.book.author}`);
    }
  }, [selectedUb]);

  function toggleGroup(id: number) {
    setSelectedGroups((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUb) {
      setErr("Selecione um livro da estante");
      return;
    }
    if (selectedGroups.length === 0) {
      setErr("Escolha ao menos um grupo");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const listing = await apiFetch<Listing>("/listings", {
        method: "POST",
        body: JSON.stringify({
          book_id: selectedUb.book_id,
          user_book_id: selectedUb.id,
          title,
          description: description || undefined,
          price: Number(price),
          condition,
          group_ids: selectedGroups,
        }),
      });
      nav(`/app/anuncios/${listing.id}`, { replace: true });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao publicar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <h1>Novo anúncio</h1>
      <form onSubmit={submit} className="form">
        {err && <div className="banner-error">{err}</div>}
        <label>
          Livro da estante
          <select
            value={userBookId}
            onChange={(e) => setUserBookId(e.target.value ? Number(e.target.value) : "")}
            required
          >
            <option value="">Selecione…</option>
            {shelf.map((ub) => (
              <option key={ub.id} value={ub.id}>
                {ub.book.title} — {ub.status}
              </option>
            ))}
          </select>
        </label>
        <label>
          Título do anúncio
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>
        <label>
          Descrição
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </label>
        <label>
          Preço (R$)
          <input
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </label>
        <label>
          Condição
          <select value={condition} onChange={(e) => setCondition(e.target.value as BookCondition)}>
            {conditions.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <fieldset>
          <legend>Publicar nos grupos</legend>
          {groups.map((g) => (
            <label key={g.group.id} className="checkbox-row">
              <input
                type="checkbox"
                checked={selectedGroups.includes(g.group.id)}
                onChange={() => toggleGroup(g.group.id)}
              />
              {g.group.name}
            </label>
          ))}
        </fieldset>
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? "Publicando…" : "Publicar"}
        </button>
      </form>
    </div>
  );
}
