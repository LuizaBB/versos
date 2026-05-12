# Deploy na Vercel — **um único projeto** (raiz `versos/`)

Você pode importar o repositório inteiro na Vercel **sem** separar `frontend/` e `backend/` em dois projetos.

- **Build:** o `vercel.json` na raiz instala dependências Python + npm, roda `npm run build` no `frontend/` e copia o `dist/` para `public/` na raiz.
- **Runtime:** o arquivo `vercel_app.py` expõe a mesma FastAPI de `backend/app` e serve arquivos estáticos + fallback SPA a partir de `public/`.
- **API no browser:** em produção o front usa URLs **relativas** (mesmo domínio), então **não** precisa definir `VITE_API_URL` na Vercel para esse modo.

**Banco:** a Vercel não roda Docker. Use Postgres na nuvem (ex.: [Neon](https://neon.tech)) e defina `DATABASE_URL` nas variáveis de ambiente do projeto.

Referência: [Deploy FastAPI on Vercel](https://vercel.com/docs/frameworks/backend/fastapi).

---

## Passo a passo (faculdade / simples)

1. Crie um banco Postgres na nuvem (Neon é gratuito e rápido) e copie a URI.  
2. No painel do projeto na Vercel → **Settings → Environment Variables** (Production e Preview):
   - `DATABASE_URL` — URI do Postgres (com `?sslmode=require` se o provedor pedir).
   - `SECRET_KEY` — string longa aleatória (ex.: saída de `openssl rand -hex 32`).
   - Opcional: `ACCESS_TOKEN_EXPIRE_MINUTES` (padrão no código: 7 dias).
3. **Antes do primeiro deploy útil**, rode migrations apontando para esse banco (no seu PC, com o `.venv` do backend):

   ```bash
   cd backend
   source .venv/bin/activate   # Windows: .venv\Scripts\activate
   export DATABASE_URL="postgresql+psycopg://..."   # mesma URI da Vercel
   alembic upgrade head
   ```

   Opcional: `python -m scripts.seed` para dados demo.

4. Faça **Deploy** (push na `main` ou “Redeploy”).  
5. Teste `https://SEU-PROJETO.vercel.app/health` e abra a home do app no mesmo domínio.

---

## Arquivos importantes na raiz

| Arquivo | Função |
|---------|--------|
| `pyproject.toml` | `[tool.vercel] entrypoint = "vercel_app:app"`. |
| `requirements.txt` | `-r backend/requirements.txt` (deps da API). |
| `vercel.json` | `installCommand` + `buildCommand` (npm build + cópia para `public/`). |
| `vercel_app.py` | ASGI: API + estáticos + SPA. |
| `.python-version` | `3.12` (sugestão para o runtime Python). |

A pasta `public/` é gerada no build e está no **`.gitignore`** (não commitar).

---

## Variáveis de ambiente (resumo)

| Variável | Obrigatório | Descrição |
|----------|-------------|-----------|
| `DATABASE_URL` | Sim | Postgres na nuvem. |
| `SECRET_KEY` | Sim | JWT — não use valor de desenvolvimento. |
| `CORS_ORIGINS` | Não | URLs extras (o código já cobre `*.vercel.app` e localhost). |
| `VITE_API_URL` | Não | Só se quiser apontar o front para **outra** API; vazio = mesma origem (modo único projeto). |

---

## Problemas comuns

- **500 / erro de DB:** `DATABASE_URL` incorreta ou migrations não rodadas.  
- **Página em branco:** build falhou — veja logs do deploy; precisa existir `public/index.html` após o `buildCommand`.  
- **API ok, mas front chama localhost:** você definiu `VITE_API_URL` no build com valor antigo — remova ou use URL relativa (redeploy sem `VITE_API_URL`).

---

## Modo avançado (dois projetos)

Se no futuro quiser só o front na Vercel e a API em outro lugar, volte a definir `VITE_API_URL` com a URL pública da API e faça deploy só da pasta `frontend/` (Root Directory). Para o MVP em um único import, use a configuração da raiz descrita acima.
