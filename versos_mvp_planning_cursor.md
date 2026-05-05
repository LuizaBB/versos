# Plataforma Versos — Documentação MVP para Implementação

> Documento preparado para orientar um agente no Cursor durante a implementação do MVP da plataforma **Versos**.
>
> Protótipo visual de referência: <https://idea-to-tap-pro.lovable.app>

---

## 1. Visão Geral do Produto

A **Versos** é uma plataforma literária que centraliza três necessidades principais da vida do leitor:

1. **Organização pessoal de leituras** por meio de estantes virtuais.
2. **Interação social por nichos**, especialmente através de clubes do livro e comunidades literárias.
3. **Marketplace peer-to-peer (P2P)** para compra e venda de exemplares entre usuários.

O objetivo do produto é resolver a fragmentação da experiência do leitor, reunindo em uma única plataforma:

- registro de progresso de leitura;
- organização de livros por status;
- participação em grupos e clubes literários;
- descoberta de livros à venda;
- compra e venda segura de exemplares;
- notificações relacionadas a leituras, grupos e oportunidades de compra.

O modelo de negócio previsto para o MVP é **freemium**, com limitações no plano gratuito, especialmente relacionadas a:

- quantidade de grupos em que o usuário pode participar;
- tamanho ou recursos da estante virtual;
- possíveis recursos avançados de marketplace ou personalização.

---

## 2. Stack Tecnológica Base do MVP Local

Para esta primeira versão, o projeto deve ser tratado como um **mock funcional local** para apresentação acadêmica de MVP.

A prioridade não é infraestrutura em produção, deploy, cloud storage ou escalabilidade. A prioridade é demonstrar os fluxos centrais da plataforma de forma simples, navegável e convincente.

### 2.1 Backend

Tecnologia principal: **Python com FastAPI**

Ferramentas recomendadas:

- **FastAPI** para criação das rotas REST;
- **Uvicorn** como servidor local de desenvolvimento;
- **SQLAlchemy** ou **SQLModel** para modelagem e comunicação com o banco;
- **Alembic** para migrations, caso o agente implemente persistência real desde o início;
- **Pydantic** para schemas de entrada e saída da API.

Responsabilidades principais do backend no MVP:

- expor endpoints REST simples para o frontend;
- simular ou implementar autenticação básica;
- gerenciar livros associados aos usuários;
- gerenciar grupos literários;
- gerenciar anúncios de venda;
- gerenciar compras e vendas simuladas;
- gerar notificações simples;
- aplicar regras básicas do plano gratuito.

Observação importante: por ser um MVP para apresentação, o backend pode começar com dados mockados em memória ou seed inicial no PostgreSQL. A persistência completa deve ser implementada apenas se não atrasar a entrega visual e funcional da demonstração.

### 2.2 Banco de Dados

Banco recomendado: **PostgreSQL**

Uso esperado no MVP:

- rodar localmente;
- preferencialmente via Docker Compose;
- armazenar usuários, livros, estante, grupos, anúncios, compras e notificações;
- permitir seed de dados para demonstração.

Motivos para manter PostgreSQL:

- integridade relacional entre usuários, livros, grupos, anúncios e transações;
- suporte robusto a enums, constraints, índices e relacionamentos;
- adequado para consultas estatísticas, como “lidos no ano”;
- aproxima o MVP de uma arquitetura real, mesmo rodando localmente.

### 2.3 Frontend

Tecnologia principal: **React**

Recomendação para o MVP:

- usar **React com Vite** para desenvolvimento rápido;
- usar **React Router** para rotas;
- usar componentes simples e responsivos;
- usar CSS puro, CSS Modules ou Tailwind, conforme o agente preferir;
- usar o protótipo visual como referência de layout e estilo.

Protótipo visual de referência:

<https://idea-to-tap-pro.lovable.app>

O frontend deve ser um **WebApp local**, simulando a experiência mobile por meio de layout responsivo. Não é necessário implementar PWA, publicação em app store ou build mobile nativo nesta fase.

### 2.4 Infraestrutura e Mídia

Nesta etapa, **não implementar AWS S3, Cloudflare R2, Supabase Storage ou qualquer serviço externo de mídia**.

Para a apresentação do MVP, utilizar uma das opções abaixo:

- imagens mockadas por URL pública estática;
- arquivos locais dentro da pasta `public/` do frontend;
- placeholders visuais para capas de livros e avatares;
- dados mockados vindos de arquivos JSON ou seed do banco.

Regra prática:

- não salvar imagens no banco;
- salvar apenas `cover_url` e `avatar_url` como string;
- para demonstração local, essas URLs podem apontar para arquivos locais ou placeholders.

### 2.5 Escopo Técnico Realista do MVP

O agente deve priorizar uma aplicação que rode localmente com poucos comandos.

Sugestão de estrutura:

```text
versos/
  backend/
    app/
      main.py
      models/
      schemas/
      routes/
      services/
      database.py
    requirements.txt
    .env.example

  frontend/
    src/
      components/
      pages/
      routes/
      services/
      data/
    package.json
    vite.config.js

  docker-compose.yml
  README.md
```

Sugestão de execução local:

```bash
# Banco
docker compose up -d

# Backend
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

---

## 3. Estrutura Principal de Navegação

A navegação principal do aplicativo deve usar uma **Bottom Navigation / Tab Bar** com quatro abas centrais.

As abas principais são:

1. **Leituras**
2. **Vendidos**
3. **Comprados**
4. **Grupos**

---

## 4. Aba 1 — Leituras

### 4.1 Objetivo

A aba **Leituras** será o dashboard principal do usuário e sua estante pessoal.

Esta aba substitui a nomenclatura anterior **“Lidos”**, pois precisa contemplar livros em diferentes estados:

- Quero Ler;
- Lendo;
- Lido.

### 4.2 Elementos de Interface

A tela deve exibir:

#### Minhas leituras atuais

Lista de livros atualmente em leitura, contendo:

- capa do livro;
- título;
- autor;
- progresso detalhado;
- página ou capítulo atual;
- porcentagem de conclusão.

#### Último registro de leitura

Um destaque para o último registro de leitura feito pelo usuário.

Esse componente deve integrar o lado social da plataforma, por exemplo:

- aviso de discussão aberta em clube relacionado ao livro;
- lembrete de encontro ou votação no grupo;
- notificação de comentários recentes sobre aquele título.

#### Ação flutuante — FAB `+`

Deve existir um botão flutuante de adição.

Ao clicar no FAB, abrir o modal **Adicionar à Estante**.

O modal deve permitir registrar um livro com um dos seguintes status:

- **Quero Ler**;
- **Lendo**;
- **Concluído / Lido**.

---

## 5. Aba 2 — Vendidos

### 5.1 Objetivo

A aba **Vendidos** é o painel do vendedor.

Ela será usada para gerenciar:

- anúncios criados pelo usuário;
- negociações em andamento;
- status de entrega;
- histórico de vendas finalizadas.

### 5.2 Elementos de Interface

A tela deve exibir:

#### Ação principal — Novo Anúncio

Botão claro e destacado para:

```text
Novo Anúncio
```

ou

```text
Anunciar Livro
```

Ao clicar, iniciar o fluxo de criação de anúncio.

#### Lista de itens em negociação

Cada item deve exibir status atualizados, como:

- entrega combinada;
- pagamento confirmado;
- aguardando resposta do comprador;
- enviado;
- concluído.

#### Histórico de vendas

Link ou seção dedicada para vendas finalizadas.

---

## 6. Aba 3 — Comprados

### 6.1 Objetivo

A aba **Comprados** é o painel do comprador.

Ela será usada para acompanhar:

- pedidos em andamento;
- compras em trânsito;
- valores pagos;
- histórico de compras finalizadas.

### 6.2 Elementos de Interface

A tela deve exibir:

#### Pedidos em trânsito

Lista de pedidos ainda não finalizados, contendo:

- livro comprado;
- vendedor;
- previsão de chegada;
- valor pago;
- status da compra.

#### Histórico de compras

Seção com itens já recebidos e finalizados.

---

## 7. Aba 4 — Grupos

### 7.1 Objetivo

A aba **Grupos** será o hub social e também o principal canal de descoberta e venda da plataforma.

Ela deve reunir:

- clubes do livro;
- comunidades literárias;
- discussões;
- alertas de engajamento;
- ofertas de livros publicadas em grupos.

### 7.2 Elementos de Interface

#### Barra de pesquisa global unificada

A tela deve possuir uma barra de pesquisa capaz de buscar:

- clubes;
- autores;
- temas;
- títulos à venda.

Placeholder sugerido:

```text
Buscar clubes, autores, temas ou livros à venda
```

#### Meus grupos

Lista dos grupos dos quais o usuário participa.

Cada grupo pode exibir alertas como:

- `Hoje 19h`;
- `Novidades`;
- `Votação`;
- `Discussão aberta`.

#### Indicador de paywall

Deve existir um indicador visível, mas não intrusivo, mostrando o limite do plano gratuito.

Exemplo:

```text
Plano grátis: 3/3 grupos utilizados
```

Esse componente deve incentivar upgrade sem bloquear agressivamente a experiência principal.

---

## 8. Entidades Principais do Domínio

Abaixo estão as entidades iniciais recomendadas para modelagem do MVP.

### 8.1 User

Representa o usuário da plataforma.

Campos sugeridos:

- `id`
- `name`
- `email`
- `password_hash`
- `avatar_url`
- `plan_type`
- `created_at`
- `updated_at`

### 8.2 Book

Representa um livro no catálogo geral.

Campos sugeridos:

- `id`
- `title`
- `author`
- `description`
- `cover_url`
- `isbn`
- `publisher`
- `published_year`
- `created_at`
- `updated_at`

### 8.3 UserBook

Representa a relação entre um usuário e um livro em sua estante.

Campos sugeridos:

- `id`
- `user_id`
- `book_id`
- `status`
- `progress_page`
- `progress_chapter`
- `progress_percent`
- `started_at`
- `finished_at`
- `rating`
- `notes`
- `created_at`
- `updated_at`

Status possíveis:

```text
QUERO_LER
LENDO
LIDO
```

### 8.4 Group

Representa uma comunidade ou clube do livro.

Campos sugeridos:

- `id`
- `name`
- `description`
- `cover_url`
- `is_public`
- `created_by_user_id`
- `created_at`
- `updated_at`

### 8.5 GroupMember

Relaciona usuários aos grupos.

Campos sugeridos:

- `id`
- `group_id`
- `user_id`
- `role`
- `joined_at`

Papéis possíveis:

```text
OWNER
MODERATOR
MEMBER
```

### 8.6 Listing

Representa um anúncio de venda de livro.

Campos sugeridos:

- `id`
- `seller_id`
- `book_id`
- `user_book_id`
- `title`
- `description`
- `price`
- `condition`
- `status`
- `created_at`
- `updated_at`

Status possíveis:

```text
ACTIVE
NEGOTIATING
SOLD
CANCELLED
```

Condições possíveis:

```text
NEW
LIKE_NEW
GOOD
USED
WORN
```

### 8.7 ListingGroup

Relaciona um anúncio aos grupos onde ele foi publicado.

Campos sugeridos:

- `id`
- `listing_id`
- `group_id`
- `created_at`

### 8.8 Purchase

Representa uma compra feita por um usuário.

Campos sugeridos:

- `id`
- `listing_id`
- `buyer_id`
- `seller_id`
- `amount`
- `status`
- `delivery_status`
- `estimated_delivery_at`
- `completed_at`
- `created_at`
- `updated_at`

Status possíveis:

```text
PENDING
PAYMENT_CONFIRMED
IN_TRANSIT
DELIVERED
COMPLETED
CANCELLED
```

### 8.9 Notification

Representa notificações internas da plataforma.

Campos sugeridos:

- `id`
- `user_id`
- `type`
- `title`
- `message`
- `read_at`
- `metadata`
- `created_at`

Tipos possíveis:

```text
READING
GROUP
SALE
PURCHASE
FAVORITE_LISTING_MATCH
```

### 8.10 FavoriteBook

Representa livros favoritados ou desejados pelo usuário para alertas de compra.

Campos sugeridos:

- `id`
- `user_id`
- `book_id`
- `created_at`

---

## 9. Regras de Negócio

### 9.1 Gestão de Estado de Leitura

O sistema deve diferenciar de forma categórica o status de um livro associado a um usuário.

A tabela relacional `user_books` deve conter um enum de status:

```text
QUERO_LER
LENDO
LIDO
```

### 9.2 Estatística “Lidos no ano”

Na tela **Meu Perfil**, o contador **Lidos no ano** deve ser calculado exclusivamente com base em livros que atendam às duas condições abaixo:

1. `status = LIDO`
2. `finished_at` dentro do ano corrente

Pseudoquery:

```sql
SELECT COUNT(*)
FROM user_books
WHERE user_id = :user_id
  AND status = 'LIDO'
  AND finished_at >= DATE_TRUNC('year', CURRENT_DATE)
  AND finished_at < DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 year';
```

Não contar livros com status:

- `QUERO_LER`;
- `LENDO`;
- `LIDO` sem data de conclusão válida.

### 9.3 Modal de Registro de Leitura

O formulário de registro deve ser dinâmico.

#### Quando o status for `QUERO_LER`

Exibir ou habilitar:

- livro;
- observações opcionais;
- data de adição.

Ocultar ou desabilitar:

- progresso;
- data de início;
- data de fim;
- avaliação.

#### Quando o status for `LENDO`

Exibir ou habilitar:

- livro;
- data de início;
- progresso por página, capítulo ou porcentagem;
- observações.

Ocultar ou desabilitar:

- data de fim;
- avaliação por estrelas.

#### Quando o status for `LIDO`

Exibir ou habilitar:

- livro;
- data de início, se existir;
- data de fim;
- avaliação por estrelas;
- observações finais.

### 9.4 Gatilho opcional ao concluir livro

Ao mudar um livro para `LIDO`, o sistema pode disparar um gatilho opcional perguntando se o usuário deseja anunciá-lo para venda.

Fluxo sugerido:

1. Usuário conclui livro.
2. Sistema salva o status como `LIDO`.
3. Sistema exibe modal ou toast com CTA:

```text
Deseja anunciar este livro para venda?
```

4. Se o usuário aceitar, abrir fluxo de criação de anúncio já preenchido com os dados do livro.

### 9.5 Rotas secundárias e navegação empilhada

As telas abaixo não fazem parte da Bottom Navigation:

- **Meu Perfil**;
- **Notificações**.

Elas devem ser configuradas como rotas secundárias, empilhadas ou sobrepostas.

Regras obrigatórias:

- ao abrir uma dessas telas, ocultar a bottom navigation;
- exibir no canto superior esquerdo um botão explícito de voltar;
- o botão voltar deve executar `pop` ou comportamento equivalente;
- ao voltar, o usuário deve retornar exatamente para a aba principal onde estava.

### 9.6 Fluxo de criação de anúncio

Ao clicar em **Novo Anúncio** na aba **Vendidos**, o usuário deve escolher em qual ou quais comunidades deseja postar o livro.

Fluxo mínimo:

1. Usuário clica em `Novo Anúncio`.
2. Seleciona o livro que deseja vender.
3. Informa condição, descrição e preço.
4. Escolhe um ou mais grupos onde o anúncio será publicado.
5. Confirma publicação.
6. Anúncio aparece:
   - na aba **Vendidos** do vendedor;
   - no feed dos grupos selecionados;
   - na busca global da aba **Grupos**, se aplicável.

### 9.7 Descoberta de livros favoritados

Quando um usuário favoritar um livro na aba **Leituras**, o sistema deve ser capaz de notificá-lo caso aquele título seja anunciado em algum grupo público ou grupo do qual ele participa.

Fluxo sugerido:

1. Usuário favorita um livro.
2. Livro é salvo em `favorite_books`.
3. Outro usuário cria anúncio para o mesmo `book_id`.
4. Sistema verifica usuários que favoritaram aquele livro.
5. Sistema cria notificações do tipo `FAVORITE_LISTING_MATCH`.
6. Usuário recebe alerta em **Notificações > Compras**.

---

## 10. Rotas Sugeridas de Frontend

Abaixo está uma estrutura inicial de rotas para o MVP.

```text
/
/login
/register
/app
/app/leituras
/app/vendidos
/app/comprados
/app/grupos
/app/perfil
/app/notificacoes
/app/livros/:bookId
/app/grupos/:groupId
/app/anuncios/novo
/app/anuncios/:listingId
/app/compras/:purchaseId
```

### Regra de layout

Rotas que devem exibir Bottom Navigation:

```text
/app/leituras
/app/vendidos
/app/comprados
/app/grupos
```

Rotas que não devem exibir Bottom Navigation:

```text
/app/perfil
/app/notificacoes
/app/livros/:bookId
/app/grupos/:groupId
/app/anuncios/novo
/app/anuncios/:listingId
/app/compras/:purchaseId
```

---

## 11. API REST Sugerida

A API deve ser implementada em **FastAPI**, mantendo rotas REST simples e schemas Pydantic bem definidos. Para o MVP, priorizar respostas previsíveis e fáceis de consumir pelo React.

### 11.1 Autenticação

```http
POST /auth/register
POST /auth/login
POST /auth/logout
GET  /auth/me
```

### 11.2 Livros

```http
GET    /books
GET    /books/:id
POST   /books
PATCH  /books/:id
```

### 11.3 Estante do usuário

```http
GET    /me/books
POST   /me/books
PATCH  /me/books/:userBookId
DELETE /me/books/:userBookId
GET    /me/books/stats
```

### 11.4 Grupos

```http
GET    /groups
GET    /groups/:id
POST   /groups
POST   /groups/:id/join
POST   /groups/:id/leave
GET    /me/groups
```

### 11.5 Anúncios

```http
GET    /listings
GET    /listings/:id
POST   /listings
PATCH  /listings/:id
DELETE /listings/:id
GET    /me/listings
```

### 11.6 Compras

```http
GET   /me/purchases
POST  /purchases
GET   /purchases/:id
PATCH /purchases/:id/status
```

### 11.7 Notificações

```http
GET   /me/notifications
PATCH /me/notifications/:id/read
POST  /me/notifications/read-all
```

---

## 12. Planning de Implementação

### Fase 1 — Setup do projeto

Objetivo: criar a base técnica do MVP.

Tarefas:

- configurar repositório;
- configurar frontend;
- configurar backend FastAPI;
- configurar PostgreSQL;
- configurar variáveis de ambiente;
- configurar ORM/migrations;
- criar layout base com Bottom Navigation;
- criar tema visual inicial com base no protótipo de referência.

Critério de conclusão:

- projeto roda localmente;
- frontend acessa backend;
- banco conecta corretamente;
- navegação principal aparece com as quatro abas.

---

### Fase 2 — Modelagem e migrations

Objetivo: estruturar o banco de dados principal.

Tarefas:

- criar tabela `users`;
- criar tabela `books`;
- criar tabela `user_books`;
- criar enum de status de leitura;
- criar tabela `groups`;
- criar tabela `group_members`;
- criar tabela `listings`;
- criar tabela `listing_groups`;
- criar tabela `purchases`;
- criar tabela `notifications`;
- criar tabela `favorite_books`;
- criar índices para buscas frequentes;
- validar constraints de integridade.

Critério de conclusão:

- migrations executam sem erro;
- SQLAlchemy/SQLModel reconhece as entidades;
- banco consegue representar leitura, grupo, anúncio e compra.

---

### Fase 3 — Autenticação e sessão

Objetivo: permitir que o usuário acesse sua área privada.

Tarefas:

- implementar cadastro;
- implementar login;
- implementar logout;
- implementar endpoint `/auth/me`;
- proteger rotas privadas;
- criar fluxo visual de autenticação no frontend.

Critério de conclusão:

- usuário consegue criar conta;
- usuário consegue logar;
- abas principais ficam disponíveis apenas para usuário autenticado.

---

### Fase 4 — Aba Leituras

Objetivo: implementar a estante pessoal e o controle de progresso.

Tarefas:

- criar tela `/app/leituras`;
- listar livros do usuário;
- destacar leituras atuais;
- exibir progresso;
- implementar FAB `+`;
- implementar modal `Adicionar à Estante`;
- aplicar regras dinâmicas por status;
- permitir editar progresso;
- calcular estatísticas básicas;
- implementar contador `Lidos no ano`.

Critério de conclusão:

- usuário adiciona livro como `QUERO_LER`, `LENDO` ou `LIDO`;
- campos do modal mudam conforme status;
- estatística `Lidos no ano` considera apenas livros concluídos no ano corrente.

---

### Fase 5 — Grupos

Objetivo: implementar o hub social inicial.

Tarefas:

- criar tela `/app/grupos`;
- implementar barra de pesquisa global;
- listar grupos do usuário;
- exibir alertas de engajamento;
- implementar indicador de limite do plano grátis;
- permitir entrar e sair de grupos;
- criar visual de feed simples de grupos.

Critério de conclusão:

- usuário visualiza seus grupos;
- consegue buscar grupos, temas, autores ou títulos;
- limite freemium aparece na interface.

---

### Fase 6 — Marketplace: anúncios e vendas

Objetivo: permitir que usuários anunciem livros em grupos.

Tarefas:

- criar tela `/app/vendidos`;
- implementar botão `Novo Anúncio`;
- criar rota `/app/anuncios/novo`;
- permitir selecionar livro da estante;
- permitir preencher preço, condição e descrição;
- permitir escolher grupos de publicação;
- criar anúncio no backend;
- listar anúncios e negociações do vendedor;
- exibir histórico de vendas.

Critério de conclusão:

- usuário cria anúncio associado a um ou mais grupos;
- anúncio aparece na aba Vendidos;
- anúncio pode ser descoberto pela aba Grupos.

---

### Fase 7 — Compras

Objetivo: permitir acompanhamento de compras pelo comprador.

Tarefas:

- criar tela `/app/comprados`;
- listar compras em andamento;
- exibir status de entrega;
- exibir previsão de chegada;
- exibir valores pagos;
- criar histórico de compras finalizadas.

Critério de conclusão:

- usuário comprador visualiza compras em trânsito;
- compras finalizadas aparecem no histórico.

---

### Fase 8 — Notificações e favoritos

Objetivo: conectar leitura, marketplace e grupos por meio de alertas.

Tarefas:

- criar rota `/app/notificacoes`;
- ocultar Bottom Navigation nessa rota;
- implementar botão voltar;
- criar notificações por tipo;
- implementar favorito de livro;
- criar lógica para alertar quando livro favoritado for anunciado;
- criar seção de notificações relacionadas a compras.

Critério de conclusão:

- usuário recebe notificação quando livro favoritado aparece em anúncio elegível;
- tela de notificações respeita regra de navegação secundária.

---

### Fase 9 — Perfil

Objetivo: implementar tela de perfil e estatísticas.

Tarefas:

- criar rota `/app/perfil`;
- ocultar Bottom Navigation nessa rota;
- implementar botão voltar;
- exibir dados do usuário;
- exibir estatísticas de leitura;
- exibir contador `Lidos no ano`;
- exibir dados do plano atual.

Critério de conclusão:

- usuário acessa perfil a partir das telas principais;
- ao voltar, retorna para a aba anterior;
- estatísticas seguem as regras de negócio.

---

### Fase 10 — Polimento e preparação da apresentação

Objetivo: preparar o MVP para uma demonstração local clara, estável e visualmente coerente.

Tarefas:

- revisar responsividade mobile;
- revisar estados vazios;
- revisar loading states;
- revisar mensagens de erro;
- revisar consistência visual com o protótipo;
- criar seed de dados para demonstração;
- garantir que backend, frontend e banco rodem localmente;
- documentar comandos de execução no `README.md`;
- testar fluxos principais ponta a ponta;
- preparar dados fictícios suficientes para simular uso real da plataforma.

Critério de conclusão:

- MVP roda localmente sem depender de serviços externos;
- principais fluxos funcionam durante a apresentação;
- erros previsíveis são tratados na interface;
- existe um roteiro simples de demonstração.

---

## 13. TODO Geral de Implementação

### Setup

- [ ] Criar monorepo ou estrutura separada para frontend e backend.
- [ ] Configurar frontend React com Vite.
- [ ] Configurar backend com FastAPI.
- [ ] Configurar PostgreSQL local.
- [ ] Configurar SQLAlchemy ou SQLModel.
- [ ] Configurar `.env`.
- [ ] Criar Docker Compose para ambiente local, se aplicável.

### Banco de Dados

- [ ] Criar migration de usuários.
- [ ] Criar migration de livros.
- [ ] Criar migration de estante `user_books`.
- [ ] Criar enum `reading_status`.
- [ ] Criar migration de grupos.
- [ ] Criar migration de membros de grupos.
- [ ] Criar migration de anúncios.
- [ ] Criar migration de relação anúncio-grupo.
- [ ] Criar migration de compras.
- [ ] Criar migration de notificações.
- [ ] Criar migration de favoritos.
- [ ] Criar índices para busca por título, autor, grupo e status.

### Backend

- [ ] Implementar autenticação.
- [ ] Implementar middleware de usuário autenticado.
- [ ] Implementar CRUD básico de livros.
- [ ] Implementar endpoints da estante.
- [ ] Implementar estatísticas da estante.
- [ ] Implementar lógica de `Lidos no ano`.
- [ ] Implementar CRUD de grupos.
- [ ] Implementar entrada e saída de grupos.
- [ ] Implementar CRUD de anúncios.
- [ ] Implementar publicação de anúncio em múltiplos grupos.
- [ ] Implementar compras.
- [ ] Implementar notificações.
- [ ] Implementar favoritos.
- [ ] Implementar alerta de livro favoritado anunciado.

### Frontend

- [ ] Criar layout autenticado.
- [ ] Criar Bottom Navigation com quatro abas.
- [ ] Criar aba Leituras.
- [ ] Criar modal Adicionar à Estante.
- [ ] Criar comportamento dinâmico do modal por status.
- [ ] Criar aba Vendidos.
- [ ] Criar fluxo Novo Anúncio.
- [ ] Criar aba Comprados.
- [ ] Criar aba Grupos.
- [ ] Criar busca global em Grupos.
- [ ] Criar indicador de plano grátis.
- [ ] Criar tela Meu Perfil como rota secundária.
- [ ] Criar tela Notificações como rota secundária.
- [ ] Ocultar Bottom Navigation em rotas secundárias.
- [ ] Garantir botão voltar explícito nas rotas secundárias.

### Marketplace

- [ ] Permitir seleção de livro da estante para venda.
- [ ] Permitir cadastro de condição do livro.
- [ ] Permitir cadastro de preço.
- [ ] Permitir descrição do anúncio.
- [ ] Permitir escolha de grupos onde publicar.
- [ ] Exibir anúncios nos grupos.
- [ ] Exibir anúncios do vendedor.
- [ ] Exibir compras do comprador.
- [ ] Atualizar status de compra e venda.

### Notificações

- [ ] Criar central de notificações.
- [ ] Separar notificações por tipo.
- [ ] Criar notificação para discussões de grupo.
- [ ] Criar notificação para compras.
- [ ] Criar notificação para vendas.
- [ ] Criar notificação para livro favoritado anunciado.
- [ ] Permitir marcar notificação como lida.

### Regras Freemium

- [ ] Definir limite de grupos no plano grátis.
- [ ] Exibir indicador `Plano grátis: X/Y`.
- [ ] Bloquear entrada em novos grupos quando limite for atingido.
- [ ] Exibir CTA de upgrade de forma não intrusiva.
- [ ] Definir limite de estante no plano grátis, se aplicável.

### Qualidade e Testes

- [ ] Criar testes unitários das regras de negócio.
- [ ] Testar cálculo de `Lidos no ano`.
- [ ] Testar modal dinâmico de leitura.
- [ ] Testar criação de anúncio em múltiplos grupos.
- [ ] Testar notificação de livro favoritado.
- [ ] Testar navegação com Bottom Navigation oculta nas rotas secundárias.
- [ ] Testar retorno para aba anterior ao usar botão voltar.
- [ ] Testar responsividade em mobile.
- [ ] Testar estados vazios.
- [ ] Testar loading e erros.

---

## 14. Critérios de Aceite do MVP

O MVP pode ser considerado funcional quando cumprir os critérios abaixo:

- [ ] Usuário consegue se cadastrar e fazer login.
- [ ] Usuário consegue adicionar livros à estante.
- [ ] Usuário consegue classificar livros como `QUERO_LER`, `LENDO` ou `LIDO`.
- [ ] Usuário consegue atualizar progresso de leitura.
- [ ] Usuário visualiza estatísticas básicas no perfil.
- [ ] Contador `Lidos no ano` segue a regra correta.
- [ ] Usuário consegue visualizar e participar de grupos.
- [ ] Usuário consegue criar anúncio de venda a partir de um livro.
- [ ] Usuário consegue publicar anúncio em um ou mais grupos.
- [ ] Usuário comprador consegue acompanhar compras.
- [ ] Usuário vendedor consegue acompanhar vendas.
- [ ] Usuário recebe notificação quando livro favoritado é anunciado.
- [ ] Bottom Navigation aparece apenas nas quatro abas principais.
- [ ] Perfil e Notificações funcionam como rotas secundárias com botão voltar.
- [ ] Interface está minimamente alinhada ao protótipo visual informado.
- [ ] Aplicação roda localmente com frontend React, backend FastAPI e PostgreSQL local.
- [ ] Não há dependência obrigatória de serviços externos de storage, deploy ou cloud.

---

## 15. Observações para o Agente no Cursor

Durante a implementação, priorizar sempre a sequência abaixo:

1. Primeiro garantir o domínio e as regras de negócio.
2. Depois implementar a estrutura de dados.
3. Depois implementar APIs simples e testáveis.
4. Depois construir telas com dados mockados, se necessário.
5. Depois conectar frontend ao backend.
6. Por fim, polir UX, responsividade e estados de erro.

Evitar começar pelo marketplace completo antes de validar a estante e os grupos, pois o marketplace depende dessas duas bases.

Também evitar salvar imagens diretamente no banco. Para o MVP local, usar apenas URLs de placeholder ou caminhos para imagens dentro da pasta `public/` do frontend.

