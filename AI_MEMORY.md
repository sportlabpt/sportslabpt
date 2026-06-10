# SportsLabPT - Memória do Projeto para a Inteligência Artificial

Este documento serve como **memória e contexto** para futuras sessões de Inteligência Artificial trabalharem neste projeto. Sempre que um agente começar uma nova tarefa, deve ler este documento para compreender a arquitetura, o design e as lógicas estabelecidas.

## 1. Stack Tecnológico e Estrutura
- **Frontend**: React (criado via Vite), JavaScript (JSX).
- **Styling**: TailwindCSS (utilização extensiva de utilitários de Tailwind para dark mode, flexbox, e grids).
- **Backend/DB (Simulado)**: A aplicação utiliza o `localStorage` intensivamente para simular uma base de dados local, permitindo o funcionamento completo das features (sem necessidade de backend ativo por enquanto).

## 2. Design System & Estética (MUITO IMPORTANTE)
- **Cores Principais**: 
  - Fundo principal: Preto (`bg-black` ou `bg-neutral-950`).
  - Painéis / Cartões: Cinza escuro/Azulado (`bg-[#1e2330]`, `bg-[#141824]`, `bg-[#2a303c]`).
  - Cores de Ação (Accent): Esmeralda/Verde (`bg-[#1dae4c]`, `text-emerald-400`), que traz uma estética "neon" premium e desportiva.
- **Tipografia**: Uso forte da tipografia `font-mono` para dados estatísticos, tempos e contadores, garantindo uma estética analítica. O resto usa fontes modernas sem-serifa (`font-sans`).
- **Filosofia de Design**: Tudo deve parecer *pixel-perfect*, focado em alta performance, desportivo, sem barras de scroll desnecessárias (uso de `custom-scrollbar` e ajustes de padding).

## 3. Principais Componentes e Lógicas Construídas

### A. Quadro Tático (`TacticalBoard.jsx`)
- Reconstruído para ser milimetricamente fiel a um design premium.
- **Header/Timeline**: Colocado no topo, com a fonte `text-xs` para evitar *horizontal scroll*.
- **Barra de Ferramentas Esquerda**: Controla o tipo de ferramenta (Desenhar, Linhas, Setas).
- **Barra Inferior**: As opções de exportação (Exportar Imagem) e Frames (1, 2, 3) estão **encaixadas e agrupadas à direita** sob o primeiro bloco de ferramentas (Campo, Cores), para evitar rolagem horizontal indesejada.

### B. Diário do Atleta (`AthleteJournal.jsx`)
- Funciona como um CRUD completo ligado às "Estatísticas".
- **Configuração**: Permite definir "Clube que represento", "Nova Categoria", e "Novo Pavilhão".
- **Abas de Gestão**: Competições, Adversários e Jogos têm modais próprios de inserção de dados.
- **Aba Análise (Gravador de Jogo)**: Contém um cronómetro interativo (1ª Parte, 2ª Parte). Clicar numa ação regista imediatamente o evento na `timeline` e no `localStorage` sob a chave `sportluiz_events_${gameId}`.
- Estes eventos alimentam diretamente a aba "Estatísticas".

### C. Menu de Navegação Esquerdo (`Callups.jsx`)
- Atualizado com as abas "Rações", "Exercícios" e "Caderno" além das que já existiam, permitindo o download em PDF do layout visualizado.

### D. Planos e Preços (`Plans.jsx`)
- Preços ajustados para a moeda Euro (€). Plano FREE (€0), Plano PRO (€14) e Plano ENTERPRISE (€25).

## 4. Persistência de Dados (`localStorage`)
- **`sportluiz_callups_db`**: Guarda o objeto `data` global (jogadores, equipa, competições, adversários, jogos, pavilhões, categorias).
- **`sportluiz_events_${gameId}`**: Guarda arrays de objetos com os eventos específicos de cada jogo gravados através da aba "Análise".
- **`user` e `token`**: Utilizado para simular a autenticação e estado do plano (ex: `FREE`, `PRO`, `ENTERPRISE`).

---
**Instrução à IA futura**: Ao criar novas features, mantenha *sempre* a coerência destas cores, adicione os eventos correspondentes no `localStorage` quando fizer sentido e evite ao máximo quebrar o layout *pixel-perfect* sem barras de rolagem.
