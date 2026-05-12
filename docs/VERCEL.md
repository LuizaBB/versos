# Deploy na Vercel — **um repositório, dois serviços** (`experimentalServices`)

A Vercel detecta `frontend/` (Vite) e `backend/` (FastAPI) e pede um `vercel.json` com **`experimentalServices`**. Esse é o formato oficial para monorepo na mesma URL.

- **Frontend** → `routePrefix: /` (site React).
- **Backend** → `routePrefix: /_/backend` (API FastAPI).
- O front chama a API em **`/_/backend`** (já configurado em `frontend/src/api/client.ts` em produção).
- O back remove o prefixo **`/_/backend`** antes de rotear (middleware em `backend/app/strip_prefix.py` quando `VERCEL=1` ou `BACKEND_ROUTE_PREFIX`).

**Banco:** use Postgres na nuvem (ex.: [Neon](https://neon.tech)) e defina `DATABASE_URL` nas variáveis de ambiente do projeto na Vercel.

---

## Passo a passo

1. **Variáveis de ambiente** no projeto Vercel (Production + Preview):
   - `DATABASE_URL` — URI do Postgres (ex.: `postgresql+psycopg://...?sslmode=require`).
   - `SECRET_KEY` — JWT (ex.: `openssl rand -hex 32`).
2. **Migrations** (no seu PC, apontando para o mesmo banco):

   ```bash
   cd backend && source .venv/bin/activate
   export DATABASE_URL="postgresql+psycopg://..."
   alembic upgrade head
   ```

3. **Deploy** (push na `main` ou botão Deploy). O arquivo na raiz [`vercel.json`](../vercel.json) já contém o bloco `experimentalServices`.

4. Testes:
   - `https://SEU-PROJETO.vercel.app/` — interface.
   - `https://SEU-PROJETO.vercel.app/_/backend/health` — API.

---

## Variáveis opcionais (API)

| Variável | Descrição |
|----------|-----------|
| `BACKEND_ROUTE_PREFIX` | Se vazio e `VERCEL` estiver definido, o código usa `/_/backend`. Defina explicitamente se a Vercel mudar o prefixo. |
| `CORS_ORIGINS` | URLs extras (já entram `localhost:5173` e regex `*.vercel.app`). |
| `CORS_ORIGIN_REGEX` | Defina vazio no painel para desativar o regex padrão. |

---

## `VITE_API_URL` (frontend)

Só precisa se a API estiver **fora** do mesmo domínio. No modo dois serviços na Vercel, o padrão é **`/_/backend`** relativo — **não** defina `VITE_API_URL` no build, a menos que queira sobrescrever.

---

## O que faltava na tela da Vercel

O aviso *“vercel.json required to deploy projects with multiple services”* aparece quando existem **dois** stacks (Vite + Python) sem o bloco `experimentalServices`. Com o [`vercel.json`](../vercel.json) atualizado no repositório e **push** feito, clique em **Refresh** na interface de importação ou faça um novo deploy.

---

## Modo antigo (um único ASGI na raiz)

A abordagem anterior (`vercel_app.py` + `buildCommand` copiando `dist` para `public/`) foi substituída por este modelo, que é o que a UI da Vercel espera hoje.
