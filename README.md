# Versos — MVP local

Plataforma literária (estante, grupos e marketplace P2P) conforme o planejamento em `versos_mvp_planning_cursor.md`.

**Repositório no GitHub:** [github.com/robsonpcs1/versos](https://github.com/robsonpcs1/versos)

**Deploy na Vercel:** [`docs/VERCEL.md`](docs/VERCEL.md) — ASGI único na raiz (`vercel_app.py` + build Vite para `public/`); Postgres na nuvem (`DATABASE_URL`).

---

## Pré-requisitos

Instale antes de começar:

- **Docker Desktop** (ou Docker Engine + Compose) — para o PostgreSQL
- **Python 3.12+**
- **Node.js 20+** e npm

---

## Passo a passo para rodar tudo integrado

São **três partes** que precisam estar ativas ao mesmo tempo: **banco (Docker)**, **backend (Uvicorn)** e **frontend (Vite)**. Use **terminais separados** para backend e frontend.

### 1) Subir o PostgreSQL

Na **raiz** do repositório (`versos/`, onde está o `docker-compose.yml`):

```bash
docker compose up -d
```

Opcional — conferir se o container está rodando:

```bash
docker compose ps
```

### 2) Backend — primeira configuração (só na primeira vez ou após clonar de novo)

Entre na pasta do backend:

```bash
cd backend
```

Crie e ative o ambiente virtual Python:

```bash
python -m venv .venv
```

**Ativar o venv** (use o comando do seu ambiente):

| Ambiente | Comando |
|----------|---------|
| **Windows — PowerShell** | `.\.venv\Scripts\Activate.ps1` |
| **Windows — cmd** | `.venv\Scripts\activate.bat` |
| **Windows — Git Bash** | `source .venv/Scripts/activate` |
| **Linux / macOS** | `source .venv/bin/activate` |

Com o venv ativo, instale dependências e configure o `.env`:

```bash
pip install -r requirements.txt
```

**Windows (Git Bash):** se `cp` não existir, copie manualmente `backend/.env.example` para `backend/.env`.

```bash
cp .env.example .env
```

Crie as tabelas e carregue dados de demonstração:

```bash
alembic upgrade head
python -m scripts.seed
```

O seed só popula na primeira execução (se `demo@versos.com` já existir, ele avisa e não duplica).

### 3) Backend — subir a API (sempre que for desenvolver)

Ainda em `backend/`, com o **venv ativo**:

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8080
```

Deixe esse terminal **aberto**. A API fica em:

- **Base:** `http://127.0.0.1:8080`
- **Documentação interativa (Swagger):** `http://localhost:8080/docs`

### 4) Frontend — instalação (só na primeira vez)

Abra **outro** terminal, na pasta do frontend:

```bash
cd frontend
npm install
```

### 5) Frontend — subir o app web (sempre que for desenvolver)

Ainda em `frontend/`:

```bash
npm run dev
```

Deixe esse terminal **aberto**. O Vite costuma servir em **`http://localhost:5173`**.

A URL do backend está em `frontend/.env.development`:

```text
VITE_API_URL=http://localhost:8080
```

Se você alterar esse arquivo, **pare e rode de novo** `npm run dev` para o Vite recarregar as variáveis.

### 6) Usar a aplicação no navegador

1. Abra **`http://localhost:5173`**
2. Faça login com uma conta de demo (após o seed):
   - **`demo@versos.com`** / **`demo1234`**
   - **`maria@versos.com`** / **`demo1234`**

   Se o seed foi corrido **antes** desta alteração, as contas demo podem ainda ter a senha antiga no banco — apague os utilizadores na BD ou use um Postgres limpo e volte a correr o seed.

Se o login falhar, confira: Docker no ar, Uvicorn na porta **8080**, e no navegador (F12 → Rede) se as requisições vão para `http://localhost:8080`.

---

## Resumo do dia a dia (já configurado uma vez)

| Ordem | Onde | Comando |
|-------|------|---------|
| 1 | Raiz `versos/` | `docker compose up -d` |
| 2 | `backend/` (venv ativo) | `uvicorn app.main:app --reload --host 127.0.0.1 --port 8080` |
| 3 | `frontend/` | `npm run dev` |

Não é necessário repetir `pip install`, `alembic upgrade head` nem `python -m scripts.seed` todo dia — só quando mudar dependências, migrations ou quiser repovoar o banco (nesse caso, ajuste dados ou use um banco limpo).

---

## Problemas comuns

### Erro ao subir o Uvicorn (Windows: acesso ao soquete / porta)

Se a porta **8080** estiver ocupada, escolha outra (ex.: **8001**) e alinhe o frontend:

1. Suba com: `uvicorn app.main:app --reload --host 127.0.0.1 --port 8001`
2. Em `frontend/.env.development`, use `VITE_API_URL=http://localhost:8001`
3. Reinicie `npm run dev`

Para ver o que usa uma porta no Windows:

```text
netstat -ano | findstr :8080
```

### Frontend não fala com o backend

- Confirme que o backend responde em `http://localhost:8080/docs`
- Confirme `VITE_API_URL` e reinicie o `npm run dev`

---

## Fluxos principais na interface

1. Login ou cadastro → abas **Leituras**, **Vendidos**, **Comprados**, **Grupos**
2. **Leituras**: botão flutuante `+` abre **Adicionar à estante** (campos conforme status). Favoritar livro habilita alerta quando houver anúncio elegível
3. **Grupos**: busca, entrada em grupos (limite 3 no plano grátis), ofertas por grupo
4. **Vendidos** → **Novo anúncio**: livro da estante, preço, condição, grupos de publicação
5. **Anúncio** (outro usuário): **Comprar** cria pedido; acompanhe em **Comprados** ou simule status na tela da compra

Rotas secundárias (**Perfil**, **Notificações**, detalhes) escondem a barra inferior e exibem **Voltar**.
