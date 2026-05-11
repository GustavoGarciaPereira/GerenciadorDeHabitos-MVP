# Spec: Gerenciador de Hábitos (MVP) – v2.1

## 1. Visão Geral
**Nome do projeto:** Habit Tracker MVP  
**Stack:** Frontend SolidJS + Vite | Backend FastAPI + SQLite  
**Objetivo de aprendizado:**  
- Dominar SolidJS em um contexto reativo real (sinais, stores, contextos, recursos assíncronos).  
- Construir um backend FastAPI modular, extensível e com modelagem de dados robusta.  
- Praticar aceleração com agentes de IA (DeepSeek via Replit/Cursor) mantendo arquitetura limpa.  

**Objetivo de produto:**  
Resolver a dor de quem abandona hábitos por não enxergar progresso, oferecendo registro rápido e visualização motivadora (grade semanal + streak).

---

## 2. Público-alvo e dor resolvida
- **Usuário:** Qualquer pessoa que deseje criar ou manter hábitos diários/semanais.  
- **Dor principal:** “Começo hábitos, mas desisto porque não vejo evolução concreta. Preciso de algo que me mostre pequenas vitórias.”  
- **Solução proposta:** Marcação diária instantânea, grade visual dos últimos 7 períodos (dias ou semanas) e sequência (streak) que reforce o impulso de continuar.

---

## 3. Funcionalidades do MVP (escopo mínimo)
| ID    | Funcionalidade               | Descrição                                                                 |
|-------|-------------------------------|---------------------------------------------------------------------------|
| F-01  | CRUD de hábitos               | Criar, listar, editar e excluir hábitos (título, frequência: `daily` ou `weekly`). |
| F-02  | Marcação de conclusão         | Checkbox para concluir hábito **no dia de hoje** (considerando timezone do usuário). Para hábitos `weekly`, cada clique gera um registro com a data real; a consolidação semanal é feita apenas na leitura. Marcar duas vezes na mesma semana conta como uma única semana concluída no streak. |
| F-03  | Dashboard do dia              | Exibe hábitos do dia (diários e semanais pendentes nesta semana) com indicação de já concluídos. |
| F-04  | Grade de progresso            | Para hábitos `daily`, exibe os últimos 7 dias (seg‑dom) como células coloridas: verde = concluído, cinza = não. Para hábitos `weekly`, exibe as últimas 7 semanas; cada célula representa uma semana completa (verde se houve ao menos uma conclusão naquela semana, cinza caso contrário). Rótulos: dias da semana para `daily`; datas das segundas-feiras (ex: “05/05”) para `weekly`. |
| F-05  | Cálculo de streak             | Sequência consecutiva de dias (hábitos diários) ou semanas (hábitos semanais) até o período atual. Quebra se faltar uma unidade. |

**Fora do MVP (mas com arquitetura preparada):**  
- Autenticação de usuários  
- Lembretes/notificações  
- Categorias e etiquetas  
- Visualizações mensais/anuais  

---

## 4. Arquitetura da Solução

### 4.1 Visão geral
```
[ SolidJS SPA ]  --http/REST-->  [ FastAPI Backend ]  <-->  [ SQLite DB ]
        :3000                            :8000
```
- Frontend Vite + SolidJS, port 3000.  
- Backend FastAPI com SQLite, port 8000.  
- CORS configurado para desenvolvimento.

### 4.2 Backend (FastAPI)
**Estrutura de diretórios:**
```
backend/
├── app/
│   ├── api/
│   │   └── habits.py         # Rotas com prefixo /api/v1
│   ├── core/
│   │   ├── database.py       # Engine, SessionLocal, Base
│   │   └── config.py         # Configurações (opcional)
│   ├── models/
│   │   └── models.py         # SQLAlchemy
│   ├── schemas/
│   │   └── schemas.py        # Pydantic
│   ├── crud.py               # Lógica de banco
│   └── main.py               # CORS, routers
├── requirements.txt
└── .env
```

**Modelagem de dados:**
- `Habit`: id (INT PK), title (TEXT), frequency (TEXT, `'daily'` ou `'weekly'`), created_at (DATETIME).  
- `HabitCompletion`: id (INT PK), habit_id (FK), date (DATE) — unicidade por (habit_id, date).  

**Nota sobre timezone:**  
O endpoint `POST /habits/{id}/complete` aceita um parâmetro opcional `date` (formato `YYYY-MM-DD`) enviado pelo frontend, representando a data local do usuário no momento do clique. Se omitido, o backend assume a data UTC do servidor. **O banco sempre armazena a data real do clique**, sem conversões para início de semana ou agregações. A unicidade é pelo par `(habit_id, date)` com a data exata do registro.

**Agregação semanal (leitura):**  
Para hábitos `weekly`, o endpoint `GET /habits/{id}/progress` agrupa as conclusões por semana ISO (segunda a domingo) e retorna uma lista das últimas 7 semanas. Cada entrada da lista contém a **data da segunda‑feira da semana** (formato `YYYY-MM-DD`) e um booleano indicando se houve ao menos uma conclusão. O streak é calculado contando semanas consecutivas com ao menos uma conclusão, usando a semana ISO atual como referência. Registros múltiplos na mesma semana não quebram o streak e não duplicam células no grid.

**Endpoints da API v1:**
- `POST /habits` – criar hábito  
- `GET /habits` – listar todos os hábitos  
- `PUT /habits/{id}` – editar hábito  
- `DELETE /habits/{id}` – excluir hábito  
- `POST /habits/{id}/complete?date=2025-05-11` – marcar conclusão. Idempotente: se já existe o par (habit_id, date), retorna sucesso sem duplicar.  
- `GET /habits/{id}/progress` – retorna progresso e streak.  

**Resposta do progresso (exemplo para `daily`):**
```json
{
  "habit_id": 1,
  "frequency": "daily",
  "completions": ["2025-05-05", "2025-05-06", ...],
  "streak": 5
}
```
**Para `weekly`** o campo `completions` contém as segundas-feiras das últimas 7 semanas que tiveram ao menos uma conclusão. Exemplo:
```json
{
  "habit_id": 2,
  "frequency": "weekly",
  "completions": ["2025-05-05", "2025-05-12"],
  "streak": 2
}
```

**Convenções:**  
- `APIRouter` com prefixo `/api/v1`.  
- Schemas Pydantic para request/response.  
- Tratamento de erros com HTTPException.  
- Documentação automática em `/docs`.

### 4.3 Frontend (SolidJS)
**Estrutura:**
```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/               # Loader, ErrorMessage, Modal, Button
│   │   └── habits/           # HabitCard, HabitGrid, HabitForm
│   ├── pages/
│   │   └── Home.jsx          # Dashboard (única página no MVP)
│   ├── services/
│   │   └── habitService.js   # fetch wrapper com tratamento de erros
│   ├── store/
│   │   └── habitStore.js     # Contexto global (createStore)
│   ├── App.jsx
│   ├── index.jsx
│   └── index.css
├── package.json
└── vite.config.js
```

**Decisão para o MVP (Missão 3 aliviada):**  
**Não haverá rotas separadas (ex: `/habits/:id`)**. Em vez disso, ao clicar em um hábito no dashboard, um **modal** se abre mostrando a grade de progresso ampliada e o streak. Isso elimina a complexidade de roteamento, lazy loading e Suspense/ErrorBoundary em múltiplas páginas, focando na reatividade e polimento visual.

**Principais conceitos SolidJS explorados:**
- `createSignal`, `createResource`, `createMemo`  
- `createStore` + `createContext` para estado compartilhado  
- `For`, `Show` para renderização eficiente  
- Atualização otimista com rollback em erro (na marcação de conclusão)  
- Tratamento de loading/erro com componentes `<Loader>` e `<ErrorMessage>`, usando `createResource.state`

---

## 5. Plano de Execução (Missões revisadas)

### Missão 1 – Fundação (CRUD estático + timezone básico)
**Foco:** Integração inicial, modelagem, operações básicas.  
**Entregáveis:**  
- Backend completo (todos os endpoints) testado via Swagger.  
- Endpoint de conclusão aceita `date` opcional.  
- Frontend exibe lista de hábitos (dados reais).  
- Formulário de criação/edição de hábito (com opção daily/weekly).  
- Checkbox de conclusão envia `date` (hoje local) e atualiza a lista.  
- CORS funcional.

### Missão 2 – Interatividade visual (grade semanal + streak)
**Foco:** `createResource`, `createStore`, atualização otimista, reatividade.  
**Entregáveis:**  
- `HabitGrid`: exibe 7 células conforme a frequência: dias da semana (`daily`) ou semanas (`weekly`).  
- Cálculo de streak com `createMemo` (diário conta dias; semanal conta semanas com pelo menos uma conclusão).  
- Ao marcar conclusão, update otimista no estado local; se falhar, reversão.  
- Estado global com `createContext` + `createStore`: guarda hábitos, progresso do hábito selecionado e streak.  
- Componentes refatorados para usar a store.

### Missão 3 – Polimento e resiliência (UX, loading, erros, modal)
**Foco:** Tornar o app robusto e com sensação profissional, sem sobrecarregar o aprendizado com roteamento complexo.  
**Entregáveis:**  
- Componente `Loader` para exibição durante fetching.  
- Componente `ErrorBoundary` com fallback amigável para erros de rede.  
- Tratamento de erro nas chamadas de API (toast ou mensagem inline).  
- Modal reutilizável para detalhes do hábito (progresso e streak ampliados).  
- Transições CSS simples no modal (animação de fade).  
- (Opcional) Exibição de mensagem de “hoje” considerando timezone do cliente.

**Testes manuais e cobertura:**  
- Testar criação de hábito semanal, marcar conclusão e verificar grid e streak.  
- Simular falha de rede para ver rollback e ErrorBoundary.  
- Validar comportamento ao mudar a data do sistema (para testar timezone local).

---

## 6. Interface do Usuário (Wireframe textual)

### Dashboard
```
+---------------------------------------------+
|  Habit Tracker                     [+ Novo]  |
+---------------------------------------------+
|  🟢 Hábitos de Hoje (sexta, 11 mai)         |
|                                              |
|  ✅ Beber 2L de água   🔥 5 dias             |
|  ⬜ Exercício (semanal)  [v]  (concluir)     |
|                                              |
|  📊 Clique em um hábito para ver progresso   |
+---------------------------------------------+
```

### Modal para hábito diário (`daily`)
```
+--------------------------------------------------+
|  🏃 Exercício (diário)                     [✕]   |
|                                                  |
|  Semana:  [🟢][🟢][⬜][⬜][⬜][⬜][⬜]              |
|           seg ter qua qui sex sáb  dom           |
|                                                  |
|  🔥 Streak atual: 2 dias                         |
+--------------------------------------------------+
```

### Modal para hábito semanal (`weekly`)
```
+--------------------------------------------------+
|  📚 Leitura (semanal)                      [✕]   |
|                                                  |
|  Semanas: [🟢][🟢][⬜][⬜][⬜][⬜][⬜]              |
|           05/05 12/05 19/05 26/05 02/06 09/06    |
|           (S-6) (S-5) ...                        |
|                                                  |
|  (verde = ao menos 1 conclusão na semana)        |
|  🔥 Streak atual: 2 semanas                      |
+--------------------------------------------------+
```

---

## 7. Estratégia de Testes e Validação
- **Backend:**  
  - Testes manuais de todos os endpoints no Swagger.  
  - Verificar idempotência da conclusão (duplo clique não duplica).  
  - Testar hábito semanal: marcar dois dias na mesma semana deve contar como apenas uma unidade no streak.  
- **Frontend:**  
  - Verificar atualização reativa com dados mockados.  
  - Testar atualização otimista: desconectar rede, completar e garantir que o estado reverte.  
  - Testar timezone: alterar fuso do sistema e verificar se a data enviada corresponde ao dia local.  
  - (Opcional) Testes unitários com `@solidjs/testing-library` para `HabitCard` e `HabitGrid`.  

---

## 8. Uso de Agentes de IA (DeepSeek)

O desenvolvimento será acelerado por agentes, mas sempre sob supervisão humana e com regras claras de qualidade.

**Abordagem em 4 passos (aplicada em cada missão):**  
1. **Gerar** – usar prompts específicos para obter esqueletos de código (ex.: “Crie o modelo SQLAlchemy …”, “Implemente o componente HabitGrid …”).  
2. **Testar** – rodar manualmente (backend com Swagger, frontend com `npm run dev`), verificar se atende à especificação e corrigir erros óbvios.  
3. **Ajustar** – pedir refinamentos pontuais ao agente ou fazer pequenas correções manualmente.  
4. **Refatorar** – após a funcionalidade estar estável, pedir ao agente que reorganize o código seguindo a arquitetura definida (ex.: “Migre o estado para createStore e contexto”).

**Regra de ouro:**  
Não aceitar código que você não conseguiria escrever sozinho depois de ler a documentação oficial da ferramenta. Se o agente gerar algo obscuro, peça explicação ou reescreva de forma compreensível.

**Exemplos de prompts por missão:**  
- *Missão 1*: “Gere o backend FastAPI com os modelos Habit e HabitCompletion usando SQLAlchemy e SQLite. Inclua endpoint POST /habits/{id}/complete que aceita parâmetro opcional date.”  
- *Missão 2*: “Crie o componente HabitGrid: recebe habitId, busca progresso (últimas 7 unidades) e renderiza células coloridas. Use createResource e exiba streak calculado com createMemo. Para weekly, agrupa conclusões por semana ISO.”  
- *Missão 3*: “Adicione tratamento de loading/erro: envolva o dashboard com Suspense e ErrorBoundary, crie componentes Loader e ErrorMessage, e implemente modal com transição CSS.”

**Política de commits:**  
Fazer commits frequentes e atômicos (idealmente a cada “passo” do ciclo gerar‑testar‑ajustar) para permitir rollback rápido se o agente introduzir regressões. Mensagens claras como “feat: adiciona endpoint de conclusão com date param”.

---

## 9. Extensibilidade Futura
- **Autenticação:** Tabela `User`, endpoints de login, middleware JWT. O frontend passará token no header, já previsto no `habitService`.  
- **Notificações:** Model `Reminder`, integração com Service Workers.  
- **Categorias:** Relacionamento `Category` no modelo `Habit`.  
- **Heatmap anual:** Expansão da lógica de progresso para matriz maior.

---

## 10. Referências
- [SolidJS Docs](https://www.solidjs.com/)
- [FastAPI Docs](https://fastapi.tiangolo.com/)
- Inspiração visual: GitHub contributions graph, Duolingo streak.
