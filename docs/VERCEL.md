# Deploy na Vercel — **ASGI único na raiz** (`vercel_app.py`)

Um único runtime Python serve a **API** (montada em `/api`) e o **SPA** a partir da pasta **`spa/`** (cópia do build Vite). **Não** usamos `public/` na raiz: na Vercel essa pasta é tratada como estática na CDN e os pedidos podem **não chegar ao Python** (404 `NOT_FOUND` na edge, **sem linhas em Runtime Logs**).

**Preset na Vercel:** o [`vercel.json`](../vercel.json) usa **`"framework": "fastapi"`** (em conjunto com `[tool.vercel]` no `pyproject.toml`). Se o projeto ainda estiver como **Services** no painel, altera para **FastAPI** ou **Other** em **Settings → General → Framework Preset** para evitar conflitos.

- **Raiz:** [`vercel.json`](../vercel.json) chama [`scripts/vercel-install.sh`](../scripts/vercel-install.sh) e [`scripts/vercel-build.sh`](../scripts/vercel-build.sh) (log verboso com `set -x`).
- **Build:** o script copia `frontend/dist` → **`spa/`** na raiz (ver [`scripts/vercel-build.sh`](../scripts/vercel-build.sh)). **Evita `public/`**, que a Vercel serve na CDN e pode bloquear `/api/*` sem invocar a função.
- **Entrypoint:** [`vercel_app.py`](../vercel_app.py) — define `BACKEND_ROUTE_PREFIX` vazio e monta a FastAPI em **`/api`**. O SPA e os assets vêm de **`spa/`** (servidos pelo Python em `/`, `/assets/*`, etc.).
- **Dependências Python na raiz:** [`pyproject.toml`](../pyproject.toml) (manter `dependencies` alinhadas com `backend/pyproject.toml`) e [`requirements.txt`](../requirements.txt) duplicado para referência.
- **`.vercelignore`:** ignora `backend/pyproject.toml` no upload para não haver segundo “projeto Python” detetado.

**Banco:** Postgres na nuvem (ex.: [Neon](https://neon.tech)); `DATABASE_URL` e `SECRET_KEY` nas variáveis de ambiente do projeto (Production + Preview).

---

## Passo a passo

1. **Variáveis de ambiente** (Production + Preview):
   - `DATABASE_URL` — ex.: `postgresql+psycopg://...?sslmode=require`
   - `SECRET_KEY` — JWT (ex.: `openssl rand -hex 32`)
2. **Migrations** no teu PC com a mesma `DATABASE_URL`:

   ```bash
   cd backend && source .venv/bin/activate
   export DATABASE_URL="postgresql+psycopg://..."
   alembic upgrade head
   ```

3. **Deploy** — push na `main` ou Redeploy na Vercel.

4. **Testes**
   - `https://SEU-PROJETO.vercel.app/` — SPA
   - `https://SEU-PROJETO.vercel.app/api/health` — API

---

## Logs em runtime (erros de login, 500, etc.)

- **Build** (npm, cópia para `spa/`): separador **Building** do deployment.
- **Pedidos à API** (Python): **Deployments → [deployment] → Logs** (ou **Runtime Logs** / **Functions**), filtro **Production** e intervalo de tempo certo. Erros no handler aparecem aqui, não no log de build.
- Se não aparecer nada: confirma que estás a abrir os **logs desse deployment** e não só o ecrã de *Overview*. Em planos gratuitos o retention é curto.

- Se vês **404** com corpo `NOT_FOUND` / `gru1::` na rede do browser e **0 linhas** em Runtime Logs: o pedido ficou na **edge/CDN** e **não invocou a função Python** (ex.: `public/` na raiz ou roteamento errado). Com **`spa/`** em vez de `public/` e API em **`/api`**, `/api/*` deve aparecer nos logs quando a função corre.

---

## Log de build detalhado

Os scripts usam **`set -x`** (cada comando aparece no log) e marcas `=== [versos] ... ===`. Procura no log da Vercel:

- Onde parou entre **vercel-install** e **vercel-build**
- Saída de **`npm ci`** (verbose) e **`npm run build --loglevel verbose`**
- Listagens de **`dist/`** e **`spa/`** após o build

Se o log cortar **depois** de `Build Completed` mas **durante** `Deploying outputs`, costuma ser falha interna da Vercel: redeploy sem cache, outra região, ou suporte com o Deployment ID.

---

## Variáveis opcionais (API)

| Variável | Descrição |
|----------|-----------|
| `BACKEND_ROUTE_PREFIX` | Só para layouts com prefixo (ex. multi-serviço). No deploy unificado o `vercel_app.py` força vazio antes do import. |
| `CORS_ORIGINS` | URLs extra (já entram `localhost:5173` e regex `*.vercel.app`). |
| `CORS_ORIGIN_REGEX` | Vazio no painel desliga o regex padrão. |

---

## `VITE_API_URL` (frontend)

Só se a API estiver **fora** do mesmo domínio ou noutro prefixo. No deploy unificado na Vercel o padrão é **`/api`** na mesma origem — **não** definas `VITE_API_URL` salvo se precisares de outro host ou prefixo.
