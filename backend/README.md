# DotchFlow Backend

API REST do DotchFlow - um app de finanças pessoais gamificado que transforma o controle financeiro em uma experiência divertida e motivadora.

## Funcionalidades

- **Controle de Gastos** - Registro rápido de receitas e despesas com categorias
- **Saúde Financeira** - Análise pela regra 50-15-35 (essenciais, prioridades, lifestyle)
- **Projeção de Saldo** - Previsão de 30 dias baseada em transações recorrentes
- **Gamificação** - Sistema de XP, levels, coins e streak diário
- **Metas (Sonhos)** - Organize seus objetivos financeiros
- **Loja** - Desbloqueie itens com suas coins conquistadas

## Tech Stack

- **Node.js** + **Express**
- **SQLite** (sql.js)
- **JWT** para autenticação

## Instalação

```bash
cd backend
npm install
```

## Variáveis de Ambiente

Crie um arquivo `.env`:

```env
PORT=3001
JWT_SECRET=sua_chave_secreta_aqui
```

## Executar

```bash
npm run dev
```

A API estará disponível em `http://localhost:3001`

## Endpoints

### Autenticação
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/auth/register` | Criar conta |
| POST | `/auth/login` | Login |
| GET | `/auth/me` | Dados do usuário |

### Gamificação
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/gamification/checkin` | Check-in diário |
| GET | `/gamification/status` | Status de XP, level, streak |

### Finanças
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/finance/health` | Saúde financeira (regra 50-15-35) |
| GET | `/finance/forecast` | Projeção de 30 dias |

### Transações
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/transactions` | Listar (filtros: category, type, date) |
| POST | `/transactions` | Criar |
| PUT | `/transactions/:id` | Editar |
| DELETE | `/transactions/:id` | Excluir |

### Metas
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/goals` | Listar metas |
| POST | `/goals` | Criar meta |
| POST | `/goals/:id/deposit` | Depositar |
| DELETE | `/goals/:id` | Excluir |

### Loja
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/store` | Listar itens |
| POST | `/store/unlock` | Desbloquear item |

### Categorias
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/categories` | Listar |
| POST | `/categories` | Criar |
| PUT | `/categories/:id` | Editar |
| DELETE | `/categories/:id` | Excluir |
