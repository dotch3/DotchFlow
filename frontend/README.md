# DotchFlow Frontend

Frontend do DotchFlow - interface gamificada para controle de finanças pessoais.

## Funcionalidades

- **Dashboard** - Visão geral com saldo, XP, streak e gráficos
- **Transações** - Lista de gastos com filtros e busca
- **Metas** - Acompanhe seus objetivos financeiros
- **Loja** - Desbloqueie itens com suas coins
- **Perfil** - Estatísticas e conquistas

## Tech Stack

- **React** + **Vite**
- **Tailwind CSS**
- **Recharts** para gráficos
- **Zustand** para estado global
- **Axios** para API

## Instalação

```bash
cd frontend
npm install
```

## Executar

```bash
npm run dev
```

O app estará disponível em `http://localhost:5173`

## Configuração

O frontend espera que a API esteja rodando em `http://localhost:3001`. Para alterar, edite `src/api/client.js`:

```javascript
const api = axios.create({
  baseURL: 'http://seu-servidor:3001', // altere aqui
  // ...
});
```

## Estrutura

```
src/
├── api/          # Client API
├── components/   # Componentes reutilizáveis
├── pages/        # Páginas do app
├── store/        # Estado global (Zustand)
└── index.css    # Estilos globais
```
