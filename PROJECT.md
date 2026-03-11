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