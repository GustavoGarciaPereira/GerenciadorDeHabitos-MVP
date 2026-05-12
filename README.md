# Habit Tracker MVP

Um **gerenciador de hábitos** minimalista e reativo, construído para resolver a dor de quem abandona novos hábitos por não visualizar o progresso. Oferece uma **grade de progresso** inspirada no GitHub e **streaks** (sequências) que motivam a continuidade.

> **Status:** MVP funcional com backend e frontend completos, testes automatizados (102 passando) e duas missões concluídas de um plano de três fases.

![Backend](https://img.shields.io/badge/backend-FastAPI-009688?logo=fastapi)
![Frontend](https://img.shields.io/badge/frontend-SolidJS-4B8BBE?logo=solid)
![Tests](https://img.shields.io/badge/tests-102%20passing-success)
![Python](https://img.shields.io/badge/python-3.8+-blue)
![Node](https://img.shields.io/badge/node-18+-green)

---

## ✨ Funcionalidades

- ✅ **CRUD de hábitos** — crie, edite, remova hábitos diários ou semanais.
- ✅ **Marcação de conclusão** — "check" para o dia de hoje (com suporte a timezone local).
- ✅ **Atualização otimista** — o checkbox responde instantaneamente, com rollback em caso de erro.
- ✅ **Grade de progresso** — últimos 7 dias (diário) ou 7 semanas (semanal) como células coloridas.
- ✅ **Streak (sequência) atual** — quantos dias/semanas consecutivos você concluiu até hoje.
- ✅ **Melhor sequência histórica** — sua maior sequência de todos os tempos.
- ✅ **Seleção de hábito** — clique em um hábito para ver seu progresso detalhado.
- ✅ **Tratamento de erros** — feedback visual claro para falhas de rede ou API.

---

## 🧰 Stack

| Camada       | Tecnologia                |
|--------------|---------------------------|
| Frontend     | SolidJS + Vite            |
| Backend      | FastAPI (Python 3.8+)     |
| Banco de dados | SQLite + SQLAlchemy     |
| Testes       | pytest (backend) / vitest + testing-library (frontend) |
| IaC/Agentes  | Reasonix (DeepSeek)       |

---

## 📂 Estrutura do projeto

```
habits-mvp/
├── backend/
│   ├── app/
│   │   ├── api/          # Rotas da API (/api/v1)
│   │   ├── core/         # database.py, config.py
│   │   ├── models/       # Modelos SQLAlchemy
│   │   ├── schemas/      # Esquemas Pydantic
│   │   ├── crud.py       # Lógica de acesso a dados
│   │   └── main.py       # Ponto de entrada, CORS
│   ├── tests/
│   │   ├── conftest.py
│   │   ├── test_crud.py
│   │   └── test_api.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/   # ui/ e habits/
│   │   ├── pages/        # Home.jsx
│   │   ├── services/     # habitService.js
│   │   ├── store/        # habitStore.jsx
│   │   ├── tests/        # testes do frontend
│   │   ├── App.jsx
│   │   └── index.jsx
│   ├── package.json
│   └── vite.config.js
├── spec.md               # Especificação completa do MVP
├── REASONIX.md           # Guia do agente de codificação
└── README.md
```

---

## 🚀 Como rodar localmente

### Pré-requisitos

- **Python 3.8+** com `pip` e `venv`
- **Node.js 18+** com `npm`
- (opcional) Git

### 1. Backend (FastAPI)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate          # no Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload     # roda em http://localhost:8000
```

A documentação interativa (Swagger) estará em [http://localhost:8000/docs](http://localhost:8000/docs).

### 2. Frontend (SolidJS)

Em outro terminal:

```bash
cd frontend
npm install
npm run dev                       # roda em http://localhost:3000
```

### 3. Testar a aplicação

- Acesse `http://localhost:3000` no navegador.
- Crie hábitos, marque a conclusão, veja a grade de progresso atualizar.

---

## 🧪 Testes automatizados

### Backend

```bash
cd backend
source venv/bin/activate
pytest tests/ -v
```

### Frontend

```bash
cd frontend
npm run test -- --run
```

**Cobertura atual:** 63 testes de backend + 39 testes de frontend = **102 testes passando**.

---

## 🗺️ Roadmap (próximas missões)

- [x] **Missão 1** – CRUD de hábitos + dashboard básico
- [x] **Missão 2** – Grade de progresso, streak, atualização otimista
- [ ] **Missão 3** – Polimento final (modal de detalhes, transições, UX refinada)
- [ ] **Design** – Responsividade, tema escuro, microinterações
- [ ] **Autenticação** – Suporte a múltiplos usuários (futuro)
- [ ] **Lembretes** – Notificações (Service Workers)

---

## 🤖 Agentes de IA

O projeto foi acelerado com **Reasonix** (DeepSeek). O guia do agente está em [`REASONIX.md`](REASONIX.md).  
Para iniciar uma sessão de codificação assistida, consulte a seção **Uso de Agentes de IA** na [`spec.md`](spec.md).

---

## 📄 Licença

MIT — sinta-se à vontade para usar, modificar e distribuir.

---

**Feito com 💚 por Gustavo • [GitHub](https://github.com/esengine)**