# REASONIX.md — Habit Tracker MVP

> **O que é este arquivo:** Reasonix lê `REASONIX.md` da raiz do projeto e injeta seu conteúdo no system prompt a cada sessão. Ele define as regras, a stack, a arquitetura e as convenções que o agente deve seguir ao gerar ou modificar código neste repositório.

---

## Stack
- **Frontend:** SolidJS + Vite (porta 3000)
- **Backend:** FastAPI (Python 3.10+) + SQLite + SQLAlchemy (porta 8000)
- **Agente:** Reasonix (DeepSeek V4 flash/pro)

## Estrutura do projeto
```
habits-mvp/
├── backend/
│   ├── app/
│   │   ├── api/          # Rotas (prefixo /api/v1)
│   │   ├── core/         # database.py, config.py
│   │   ├── models/       # SQLAlchemy
│   │   ├── schemas/      # Pydantic
│   │   ├── crud.py       # Lógica de acesso a dados
│   │   └── main.py       # Ponto de entrada, CORS
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/   # ui/ e habits/
│   │   ├── pages/        # Home.jsx (dashboard)
│   │   ├── services/     # habitService.js (fetch wrapper)
│   │   ├── store/        # habitStore.js (createContext + createStore)
│   │   ├── App.jsx
│   │   └── index.jsx
│   └── package.json
├── spec.md               # Especificação completa do MVP
└── REASONIX.md           # Este arquivo
```

## Regras fundamentais
1. **Commits frequentes e atômicos.** Use mensagens no formato: `feat:`, `fix:`, `refactor:`, `test:`.
2. **Nunca gere código que você não entenda.** Se o modelo gerar algo obscuro, peça explicação ou reescreva.
3. **Sempre teste manualmente após gerar.** Backend: Swagger (`/docs`). Frontend: `npm run dev`.
4. **Respeite a arquitetura definida na `spec.md`.** Não invente endpoints ou componentes fora do escopo.
5. **Mantenha a separação de responsabilidades:** serviços (chamadas HTTP) → store (estado global) → componentes (UI pura).
6. **Tratamento de erros obrigatório:** todo `fetch`/`axios` deve ter catch com mensagem amigável.
7. **Nada de `any` no TypeScript** (se aplicável); use tipos explícitos.

## Contexto do produto
Este é um **Gerenciador de Hábitos MVP** que resolve a dor de quem abandona hábitos por não enxergar progresso. Funcionalidades principais:
- CRUD de hábitos (`daily` e `weekly`)
- Marcação de conclusão diária com timezone local
- Grade de progresso visual (7 dias para daily, 7 semanas para weekly)
- Cálculo de streak (sequência consecutiva)

## Modelagem de dados (resumo)
- `Habit`: id (INT PK), title (TEXT), frequency (`daily`|`weekly`), created_at (DATETIME)
- `HabitCompletion`: id (INT PK), habit_id (FK), date (DATE) — unicidade por (habit_id, date)
- **Time zone:** o frontend envia a data local (`YYYY-MM-DD`) no parâmetro `date`; o backend armazena a data real do clique.
- **Agregação semanal:** para `weekly`, o endpoint de progresso agrupa por semana ISO (seg-dom) e retorna a segunda-feira como data canônica.

## Convenções de código
- **Python:** type hints em todas as funções; use `async def` para endpoints; schemas Pydantic com `response_model`.
- **SolidJS:** prefira `createStore` + `createContext` para estado global; use `createResource` para dados assíncronos; `createMemo` para valores derivados.
- **CSS:** use CSS modules ou Tailwind; nada de inline styles.

## Testes
- Backend: testar todos os endpoints pelo Swagger antes de passar ao frontend.
- Frontend: verificar reatividade, atualização otimista (rollback em erro), timezone local.
- Teste de integração: marcar um hábito, verificar grade e streak.

## Referências
- Spec completa: `spec.md`
- SolidJS: https://www.solidjs.com/
- FastAPI: https://fastapi.tiangolo.com/
- Reasonix: https://github.com/esengine/DeepSeek-Reasonix