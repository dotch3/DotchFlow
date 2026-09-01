> **Status atual (atualizado):** os prompts abaixo (seções 1 e 2) são os specs
> originais usados para gerar o projeto e foram mantidos como registro
> histórico — mas o projeto evoluiu desde então:
> - **Banco de dados:** migrado de SQLite (sql.js) para **PostgreSQL** (via `pg`),
>   porque o filesystem do Render é efêmero (perde dados a cada restart/deploy)
>   e o Neon oferece Postgres gerenciado gratuito com dados persistentes.
> - **Docs da API:** Swagger/OpenAPI real em `/api-docs`, com exemplos válidos
>   e i18n (en/es/pt-BR) nas mensagens de erro.
> - **Deploy:** o projeto está pronto para rodar em produção (Neon + Render +
>   Vercel) ou localmente via Docker/Podman — ver seção 3 abaixo.
>
> Ver [`backend/README.md`](backend/README.md) e [`frontend/README.md`](frontend/README.md)
> para a documentação técnica completa e atualizada de cada parte.

---

1. BACKEND

Atue como um Engenheiro de software sênior e especialista em arquitetura de software, e crie um backend para o app DotchFlow.

### PROMPT 1 - BACKEND DETALHADO (DotchFlow API)

"Crie uma API REST completa em **Node.js com Express** e **SQLite (via sql.js)** para o app **DotchFlow**. A arquitetura deve seguir o padrão **Clean Architecture**, dividindo o código em camadas: Domain (Entities/Usecases), Infra (Repositories/External Adapters) e UI (Controllers/Routes).

**1. Modelagem de Dados (Entidade-Relacionamento):**
- **Users:** ID, email, password_hash, xp_points, dotch_coins, level, e `streak_count` (contagem de dias consecutivos de uso para combater a falta de disciplina).
- **Transactions:** ID, user_id, amount, description, category_id, date, type (income/expense), e `is_quick_entry` (booleano). *Nota: Permitir que apenas o valor seja obrigatório no cadastro para economizar tempo do usuário*.
- **Categories:** ID, user_id, name, icon, e `monthly_limit`. O backend deve calcular o percentual de uso desse limite.
- **Goals (Sonhos):** ID, user_id, name, target_amount, current_amount, deadline, e status (em_andamento/concluido). Deve haver uma lógica para calcular quanto o usuário precisa poupar por mês para atingir o objetivo.
- **Gamification_Store:** ID, item_name, cost_in_coins, required_level, e `is_premium`.

**2. Endpoints e Lógica de Negócio Priorizada:**
- **Auth:** `/auth/register` e `/auth/login` com **JWT**.
- **Gamification Engine (`/gamification/checkin`):** Rota POST que valida o acesso diário. Se for o dia consecutivo, aumenta o `streak_count` e premia o usuário com XP e DotchCoins. Se falhar um dia, reseta a ofensiva (estratégia para retenção na primeira semana).
- **Financial Intelligence (`/finance/health`):** Rota GET que retorna o status financeiro baseado na **regra 50-15-35** (50% essencial, 15% prioridades, 35% estilo de vida). Deve retornar também um 'score de saúde' baseado no saldo e dívidas.
- **Predictive Flow (`/finance/forecast`):** Rota que analisa transações pendentes e recorrentes para prever o saldo no fim do mês (resolvendo a dor de usuários que sentem que apps não preveem o futuro).
- **Store:** `/store/unlock` para permitir que o usuário use DotchCoins para 'comprar' novas funcionalidades ou ícones, transformando o registro financeiro em um 'minigame'.

**3. Regras de Validação e Segurança:**
- Use **express-validator** para garantir que o campo `amount` nunca seja nulo ou negativo.
- Implemente um middleware de autenticação que extrai o `user_id` do token JWT para filtrar todas as consultas ao banco.
- Configure o **sql.js** para salvar o estado do banco em um arquivo local periodicamente para evitar perda de dados em ambientes de teste.

**4. Contexto de UX no Backend:**
As rotas de listagem de transações devem suportar filtros por categoria e data para alimentar gráficos de pizza (proporção) e linhas (evolução temporal), facilitando o processamento visual pelo cérebro do usuário."




2. FRONTEND
### PROMPT 2 - FRONTEND DETALHADO (DotchFlow UI/UX)

Crie o frontend de uma aplicação de gestão financeira chamada **DotchFlow** usando **React, Vite e Tailwind CSS**. A interface deve ser projetada para resolver o problema de baixa retenção (apenas 19% dos brasileiros usam esses apps) através de uma experiência extremamente visual e gamificada.

**1. Princípios de Design e UX (Baseados em Pesquisa):**
- **Mentalidade 'Quick Entry':** Implemente um Botão de Ação Flutuante (FAB) centralizado para 'Novo Gasto'. O formulário deve abrir um modal onde **apenas o valor é obrigatório**, permitindo registros rápidos em segundos para evitar o 'tédio' citado por usuários.
- **Prioridade Visual:** Substitua tabelas longas por componentes visuais. O cérebro processa imagens mais rápido que números. Use a biblioteca **Recharts** para os gráficos.
- **Micro-interações de Feedback:** Ao atingir uma meta ou fazer um registro, exiba animações sutis de 'confete' ou ganho de XP para reforçar o hábito.

**2. Arquitetura de Telas e Componentes:**

- **Dashboard (Home):**
    - **Header Gamificado:** Exiba o avatar do usuário 'dotch3', seu **Nível (Level)**, uma barra de progresso de **XP** e o contador de **Ofensiva (Streak)** (dias consecutivos de uso).
    - **Cards de Resumo:** Saldo Atual, Receitas e Despesas do mês.
    - **Gráfico de Saúde (50-15-35):** Um gráfico de pizza ou barras horizontais mostrando a divisão dos gastos entre Essenciais (50%), Prioridades (15%) e Estilo de Vida (35%).
    - **Limites de Categoria:** Use 'círculos de progresso' (como no app Julius) que se preenchem conforme o gasto aumenta, mudando de cor (azul para vermelho) ao chegar perto do limite.

- **Tela de Fluxo Futuro (Forecast):**
    - **Gráfico de Linha de Tendência:** Uma funcionalidade diferenciada que projeta o saldo do usuário para os próximos 30 dias com base em gastos recorrentes e contas agendadas (resolvendo a dor de apps que 'não sabem prever o futuro').

- **Tela de Extrato e Filtros:**
    - Lista de transações com ícones personalizados por categoria.
    - Filtros rápidos por 'Este Mês', 'Últimos 7 dias' e busca por descrição.

- **Loja de Customização (Gamificação Hub):**
    - Uma área onde o usuário vê seus **DotchCoins**. 
    - Itens de 'desbloqueio' com cards que mostram: 'Notificações Inteligentes' (nível 5 requerido) ou 'Temas Premium'.

- **Tela de Objetivos (Sonhos):**
    - Cards de progresso visual para metas como 'Viagem' ou 'Reserva de Emergência', mostrando quanto falta em valor e tempo estimado para conclusão.

**3. Especificações Técnicas:**
- Use **Axios** para chamadas à API e **Zustand** para gerenciar o estado global de autenticação e moedas/XP.
- Implemente **Responsividade Mobile-First** rigorosa, pois o sucesso de apps de finanças está na mobilidade.
- Utilize o **Lucide React** para ícones modernos e minimalistas.
- Adicione esqueletos de carregamento (**Loading Skeletons**) para uma sensação de performance fluida.


3. DEPLOY

## 3.1 Deploy em produção (Neon → Render → Vercel)

Ordem importa: o banco (Neon) precisa existir antes do backend (Render), e o
backend precisa estar rodando (com sua URL pública conhecida) antes de
configurar o frontend (Vercel), porque a URL do backend entra como variável
de ambiente no build do frontend.

### Passo 1 — Neon (banco de dados Postgres)

1. Cria conta em [neon.tech](https://neon.tech) (dá pra entrar com GitHub).
2. "Create a project" → dá um nome (ex: `dotchflow`) → escolhe a região mais
   próxima.
3. No dashboard do projeto, copia a **Connection String** (Neon já mostra
   isso na tela inicial). Formato:
   ```
   postgresql://neondb_owner:SENHA@ep-xxxx-yyyy.aws.neon.tech/neondb?sslmode=require
   ```
   Essa string vai ser o `DATABASE_URL` do passo 2. Guarda em lugar seguro —
   **nunca commita isso em nenhum arquivo do repo**.
4. Não precisa rodar nada mais no Neon agora — as tabelas são criadas
   automaticamente quando o backend conecta pela primeira vez (`migrate()`
   em `backend/src/infra/database/db.js`).

### Passo 2 — Render (backend / API)

1. Cria conta em [render.com](https://render.com).
2. **New → Blueprint** → conecta o repo `dotch3/DotchFlow`. O Render lê o
   `render.yaml` da raiz do repo automaticamente e já propõe o Web Service
   com `rootDir: backend`, build/start commands e health check certos.
   (Se em vez disso você criar o serviço manualmente via **New → Web
   Service**, o `render.yaml` não é lido — tem que preencher Root
   Directory=`backend`, Build Command=`npm install`, Start
   Command=`npm start` na mão.)
3. Preenche as variáveis de ambiente marcadas como secretas
   (`sync: false` no `render.yaml`):

   | Variável | Valor | Como gerar |
   |---|---|---|
   | `DATABASE_URL` | connection string do Neon (passo 1.3) | copiada do dashboard do Neon |
   | `DATABASE_SSL` | `true` | fixo — Neon exige SSL |
   | `JWT_SECRET` | string aleatória longa | `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` — roda local e cola o resultado. **Nunca reusa um valor que já apareceu em chat, commit ou log.** |
   | `CORS_ORIGINS` | deixa vazio por enquanto | volta aqui no passo 3.3, depois que o Vercel existir |

4. Deploy. Ao terminar, o Render dá uma URL pública, ex:
   `https://dotchflow-api.onrender.com`.
5. Confirma que subiu: abre `<sua-url>/health` no navegador — deve responder
   `{"status":"ok",...}`.
6. (Opcional) Popula dados de teste rodando localmente, apontado pro Neon:
   ```bash
   cd backend
   DATABASE_URL="<connection string do Neon>" DATABASE_SSL=true npm run dev-seed
   ```

**Nota sobre auto-deploy:** o Render normalmente redeploya sozinho a cada
push na branch conectada. Se um push não gerar deploy novo (acontece às
vezes), confirma em Settings se "Auto-Deploy" está ligado, ou dispara um
"Manual Deploy" na aba Deploys.

### Passo 3 — Vercel (frontend)

1. Cria conta em [vercel.com](https://vercel.com) (GitHub facilita o import).
2. **Add New → Project** → importa `dotch3/DotchFlow`.
3. **Root Directory** = `frontend` (é um monorepo, então isso é obrigatório).
4. Build settings — o Vercel detecta Vite automaticamente:
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Environment Variables:

   | Variável | Valor |
   |---|---|
   | `VITE_API_URL` | URL do backend no Render **+ `/api`**, ex: `https://dotchflow-api.onrender.com/api` |

   O Vercel avisa que `VITE_*` expõe o valor no navegador (prefixo público
   do framework) — isso é esperado e correto aqui, **não** marca como
   "Sensitive"/"Secret", só confirma/mantém como "Config"/público.
6. Deploy. Gera uma URL tipo `https://dotch-flow.vercel.app`.

### Passo 4 — Fechar o CORS (volta pro Render)

Com a URL do Vercel em mãos, volta em Render → Environment → atualiza:
```
CORS_ORIGINS=https://dotch-flow.vercel.app
```
Salva — o Render reinicia o serviço sozinho.

### Passo 5 — Teste de ponta a ponta

Abre a URL do Vercel, tenta registrar/logar, confirma no Network tab do
navegador que as chamadas vão para `<url-do-render>/api/...` e voltam sem
erro de CORS.

### Resumo de todas as variáveis

| Onde | Variável | Valor |
|---|---|---|
| Render | `DATABASE_URL` | connection string do Neon |
| Render | `DATABASE_SSL` | `true` |
| Render | `JWT_SECRET` | hex de 128 chars, gerado com `crypto.randomBytes` |
| Render | `CORS_ORIGINS` | URL de produção do Vercel |
| Vercel | `VITE_API_URL` | URL do Render + `/api` |

---

## 3.2 Deploy local (Docker / Podman)

Sobe o projeto inteiro (Postgres + backend + frontend) localmente em
containers, sem depender de Neon/Render/Vercel — útil para desenvolvimento
ou para rodar os testes de API (Playwright) contra um ambiente isolado e
descartável. Definido em `docker-compose.yml` na raiz do repo, com
`backend/Dockerfile` e `frontend/Dockerfile` (build multi-stage, servido via
Nginx com fallback de SPA).

Funciona igual com **Docker** ou **Podman** — o arquivo `docker-compose.yml`
é o mesmo para os dois, só muda o comando.

### Pré-requisitos

- Docker: [Docker Desktop](https://www.docker.com/products/docker-desktop/)
  ou Docker Engine + `docker compose` (plugin v2, já vem por padrão em
  instalações recentes).
- Podman: [Podman Desktop](https://podman-desktop.io/) ou `podman` +
  `podman-compose` (`pip install podman-compose`, ou `brew install
  podman-compose` no Mac). Podman v4+ também tem `podman compose` embutido.

### Passos

1. Copia o `.env.example` da raiz e preenche o `JWT_SECRET`:
   ```bash
   cp .env.example .env
   ```
   Edita o `.env` gerado e cola um valor pra `JWT_SECRET`:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```
   (`POSTGRES_PASSWORD` já tem um valor padrão pro Postgres local; só troca
   se quiser.)

2. Sobe tudo:

   **Com Docker:**
   ```bash
   docker compose up --build
   ```

   **Com Podman:**
   ```bash
   podman compose up --build
   # ou, se estiver usando podman-compose standalone:
   podman-compose up --build
   ```

3. Espera os três serviços subirem (`db` precisa passar o healthcheck antes
   do `backend` iniciar — o compose já cuida da ordem). As tabelas do banco
   são criadas automaticamente na primeira conexão do backend.

4. (Opcional) Popula dados de teste dentro do container já rodando:

   **Docker:**
   ```bash
   docker compose exec backend npm run dev-seed
   ```

   **Podman:**
   ```bash
   podman compose exec backend npm run dev-seed
   # ou: podman-compose exec backend npm run dev-seed
   ```

   Credenciais de teste após o seed: `test@dotchflow.com` / `myPassword123`.

5. Acessa:
   - Frontend: [http://localhost:5173](http://localhost:5173)
   - Backend / health check: [http://localhost:3001/health](http://localhost:3001/health)
   - Swagger: [http://localhost:3001/api-docs](http://localhost:3001/api-docs)

6. Pra derrubar tudo:
   ```bash
   docker compose down        # ou: podman compose down
   ```
   Adiciona `-v` no final (`down -v`) se quiser apagar também os dados do
   Postgres local (volume `dotchflow_pgdata`).

### Notas

- O Postgres local roda como container próprio (`db`, imagem
  `postgres:16-alpine`) — não precisa instalar Postgres na máquina nem usar
  o Neon para isso, são ambientes independentes.
- `VITE_API_URL` do frontend é fixado em build time no `docker-compose.yml`
  como `http://localhost:3001/api` — é a URL que o **navegador** (rodando
  no host, fora dos containers) usa para falar com o backend, por isso é
  `localhost`, não o nome do serviço Docker (`backend`).
- Se mudar a porta do backend no `docker-compose.yml`, lembra de atualizar
  também o `VITE_API_URL` do serviço `frontend` (ele é baked-in no build,
  não lê env var em runtime).
