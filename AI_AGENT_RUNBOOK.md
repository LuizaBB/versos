# Runbook para agente de IA — Versos (MVP local)

Este arquivo é para **agentes autônomos** (Cursor, CI local, etc.) que precisam **entender e executar** o projeto sem interpretação ambígua. O guia para humanos está em `README.md`.

**Repositório remoto:** [https://github.com/robsonpcs1/versos](https://github.com/robsonpcs1/versos)

**Vercel:** `experimentalServices` em `vercel.json` (front + API em `/_/backend`). Ver `docs/VERCEL.md`.

---

## Objetivo

Subir **PostgreSQL (Docker)**, **API FastAPI na porta 8080** e **frontend Vite (porta 5173)** e confirmar que a integração responde.

---

## Estrutura do repositório (relevante)

```text
versos/
  docker-compose.yml          # Postgres 16
  backend/
    .env.example              # Copiar para .env
    requirements.txt
    alembic/
    app/                      # FastAPI
    scripts/seed.py
  frontend/
    .env.development          # VITE_API_URL → backend
    package.json
```

---

## Pré-condições (verificar antes)

- `docker compose version` ou `docker compose` disponível.
- `python --version` ≥ 3.12.
- `node --version` ≥ 20 e `npm` disponível.

Se Docker não estiver disponível, **não prossiga** com o backend real: a API usa `DATABASE_URL` apontando para Postgres (ver `backend/.env.example`).

---

## Protocolo de execução (ordem obrigatória)

Execute a partir da **raiz do repositório** (`versos/`). Use caminhos relativos como abaixo.

### Fase A — Banco de dados

```bash
docker compose up -d
```

**Verificação:** `docker compose ps` deve mostrar o serviço `db` como rodando. Aguardar alguns segundos após o primeiro `up` se a conexão falhar imediatamente.

### Fase B — Backend (setup idempotente onde possível)

```bash
cd backend
python -m venv .venv
```

Ativar o venv conforme o SO:

- **Linux/macOS:** `source .venv/bin/activate`
- **Windows cmd:** `.venv\Scripts\activate.bat`
- **Windows PowerShell:** `.\.venv\Scripts\Activate.ps1`

```bash
pip install -r requirements.txt
```

Garantir `backend/.env`:

- Se `backend/.env` não existir, copiar de `backend/.env.example` (equivalente: mesmo conteúdo mínimo com `DATABASE_URL` alinhado ao `docker-compose.yml`: usuário `versos`, senha `versos`, db `versos`, host `localhost`, porta `5432`).

```bash
alembic upgrade head
python -m scripts.seed
```

**Nota:** `scripts.seed` imprime mensagem e **não duplica** usuário `demo@versos.com` se já existir — isso é esperado.

### Fase C — Backend (servidor HTTP)

Com venv ativo e `cwd` em `backend/`:

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8080
```

**Verificação (outro shell, sem encerrar o uvicorn):**

```bash
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8080/health
```

Esperado: código **200** e corpo JSON `{"status":"ok"}`.

Opcional:

```bash
curl -s http://127.0.0.1:8080/openapi.json | head -c 80
```

Deve retornar JSON (não vazio).

### Fase D — Frontend

Em novo processo, `cwd` em `frontend/`:

```bash
npm install
npm run dev
```

**Contrato de ambiente:** `frontend/.env.development` deve definir:

```text
VITE_API_URL=http://localhost:8080
```

Se o agente alterar essa URL, **reiniciar** `npm run dev`.

**Verificação:** abrir ou requisitar `http://127.0.0.1:5173` (ou a URL que o Vite imprimir no terminal). A UI deve carregar sem erro de rede para `VITE_API_URL` ao fazer login.

**Smoke test API com login (opcional):**

```bash
curl -s -X POST http://127.0.0.1:8080/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"demo@versos.com\",\"password\":\"demo123\"}"
```

Resposta deve conter `access_token`.

---

## Contas de demonstração (após seed)

| E-mail | Senha |
|--------|--------|
| `demo@versos.com` | `demo123` |
| `maria@versos.com` | `demo123` |

---

## Portas e conflitos

| Serviço | Porta padrão |
|---------|----------------|
| PostgreSQL (container) | 5432 (host) |
| FastAPI (Uvicorn) | **8080** |
| Vite | **5173** |

Se **8080** estiver indisponível (ex.: `WinError 10013` ou EADDRINUSE):

1. Subir Uvicorn em outra porta (ex. `8001`).
2. Atualizar `frontend/.env.development` → `VITE_API_URL=http://localhost:8001`.
3. Reiniciar `npm run dev`.

No Windows, inspecionar uso de porta: `netstat -ano | findstr :8080`.

---

## O que o agente não deve fazer

- Não commitar `backend/.env` com segredos reais (o `.gitignore` já ignora `.env` no backend).
- Não alterar `node_modules/` ou `.venv/` manualmente para “corrigir” dependências — usar `pip install` / `npm install`.
- Não assumir que o backend está em `8000`: o padrão do projeto é **8080** (ver `README.md` e `.env.development`).

---

## Referência rápida de documentação humana

- Fluxo detalhado e troubleshooting: `README.md`
- Domínio e escopo do produto: `versos_mvp_planning_cursor.md`

---

## Critério de sucesso mínimo

1. `docker compose ps` → Postgres up.  
2. `GET http://127.0.0.1:8080/health` → 200.  
3. `POST /auth/login` com `demo@versos.com` / `demo123` → `access_token`.  
4. Frontend em `5173` carrega e consegue autenticar contra a API configurada em `VITE_API_URL`.
