# 📋 Kanban - Configurações de Perfil FinCouple

**Objetivo:** Implementar configurações completas do perfil do usuário conforme SPEC.md e CHECKLIST.md

**Status Geral:** 🟢 Em Progresso (TASK 2.6 Concluída)

---

## 📝 Backlog (Tarefas a Fazer)

### Backend - Schema & Banco de Dados

- [x] **TASK 1.1:** Campo `avatar_url` já existe na tabela `users`
- [x] **TASK 1.2:** Adicionar campos de preferências do usuário (theme, language, notifications)
- [x] **TASK 1.3:** Criar migration para novas colunas de perfil

### Backend - API Endpoints

- [x] **TASK 2.1:** Criar endpoint `PATCH /auth/profile` para atualizar dados do perfil (nome, email, avatar)
- [x] **TASK 2.2:** Criar endpoint `GET /auth/profile` para buscar dados completos do perfil (já existe /me)
- [x] **TASK 2.3:** Criar endpoint `DELETE /auth/account` para deletar conta (soft delete)
- [x] **TASK 2.4:** Criar endpoint `PATCH /auth/preferences` para atualizar preferências
- [x] **TASK 2.5:** Validação Zod implementada no endpoint PATCH /profile
- [x] **TASK 2.6:** Implementar upload de avatar (opcional - usar URL externa) ✅ CONCLUÍDO

### Frontend - Componentes UI

- [x] **TASK 3.1:** Integrar edição de perfil no SettingsScreen existente
- [x] **TASK 3.2:** Criar formulário de edição de nome com validação inline
- [x] **TASK 3.3:** Criar formulário de edição de email com validação inline
- [x] **TASK 3.4:** Componente de display de avatar (inicial ou URL)
- [x] **TASK 3.5:** Criar modal de confirmação para mudanças críticas (email, deletar conta)
- [x] **TASK 3.6:** Adicionar feedback visual (toasts) - usar error states por enquanto
- [x] **TASK 3.7:** Criar seção de preferências no SettingsScreen (theme, language, notifications)

### Frontend - Integração

- [x] **TASK 4.1:** Integrar endpoint de update de perfil no formulário
- [x] **TASK 4.2:** Atualizar contexto de auth após mudança de dados
- [x] **TASK 4.3:** Refresh automático do user context após update (via updateProfile)
- [x] **TASK 4.4:** Tratamento de erros da API na UI
- [x] **TASK 4.5:** Integrar endpoint de preferências no frontend

### Segurança & Validação

- [x] **TASK 5.1:** Implementar confirmação de senha para mudanças críticas
- [x] **TASK 5.2:** Validar unicidade de email no backend
- [x] **TASK 5.3:** Rate limiting nos endpoints de perfil
- [x] **TASK 5.4:** Logging de auditoria para mudanças de perfil ✅ CONCLUÍDO

### UX & Acessibilidade

- [x] **TASK 6.1:** Mensagens de erro claras na UI
- [x] **TASK 6.2:** Implementar skeleton screens durante loading ✅ CONCLUÍDO
- [ ] **TASK 6.3:** Garantir acessibilidade (labels, focus states)
- [ ] **TASK 6.4:** Testar responsividade em mobile

---

## 🚧 Em Progresso

*Nenhuma task em progresso no momento*

---

## ✅ Concluído

- [x] **TASK 0.1:** Analisar SPEC.md e CHECKLIST.md para entender requisitos
- [x] **TASK 0.2:** Revisar schema atual da tabela `users`
- [x] **TASK 0.3:** Revisar SettingsScreen existente no frontend
- [x] **TASK 0.4:** Criar documento Kanban para organização das tasks
- [x] **TASK 1.2:** Campos de preferências adicionados ao schema (theme, language, notifications)
- [x] **TASK 1.3:** Criar migration para novas colunas de perfil - Migrations 0001 e 0002 criadas
- [x] **TASK 2.1:** Endpoint PATCH /auth/profile implementado no backend
- [x] **TASK 2.2:** Endpoint GET /auth/profile implementado no backend
- [x] **TASK 2.3:** Endpoint DELETE /auth/account implementado no backend
- [x] **TASK 2.4:** Endpoint PATCH /auth/preferences implementado no backend
- [x] **TASK 2.5:** Validação Zod no endpoint de perfil
- [x] **TASK 2.6:** Upload de avatar via URL externa implementado ✅
  - Backend: Validação Zod (`z.string().url().optional().or(z.literal(''))`) no endpoint PATCH /profile
  - Frontend: UI com botão de câmera, input de URL, confirmar/cancelar
  - Integração: updateProfile hook atualiza contexto automaticamente
  - Schema: Campo `avatar_url` já existe na tabela users (migration 0001)
- [x] **TASK 3.1:** Edição de perfil integrada ao SettingsScreen
- [x] **TASK 3.2:** Formulário de edição de nome
- [x] **TASK 3.3:** Formulário de edição de email
- [x] **TASK 3.4:** Display de avatar (suporte a URL ou inicial)
- [x] **TASK 3.5:** Modal de confirmação para email e deletar conta
- [x] **TASK 3.6:** Feedback visual com error states
- [x] **TASK 3.7:** Seção de preferências no SettingsScreen
- [x] **TASK 4.1:** Integração frontend-backend do updateProfile
- [x] **TASK 4.2:** Contexto de auth atualizado após mudança
- [x] **TASK 4.3:** Refresh automático do user context
- [x] **TASK 4.4:** Tratamento de erros na UI
- [x] **TASK 4.5:** Integração do updatePreferences no frontend
- [x] **TASK 5.1:** Confirmação de senha para mudanças críticas (email, delete)
- [x] **TASK 5.2:** Validação de unicidade de email no backend
- [x] **TASK 5.3:** Rate limiting nos endpoints de perfil
- [x] **TASK 6.2:** Skeleton screens implementados ✅
  - Componente `Skeleton.tsx` criado com variantes (text, circular, rectangular, rounded)
  - Animação de shimmer com gradient e motion
  - Skeletons específicos: ProfileSkeleton, PreferencesSkeleton, SecuritySectionSkeleton, DataSectionSkeleton, DangerZoneSkeleton
  - SettingsSkeleton composto integrado ao SettingsScreen
  - Loading state do useAuth agora exibe skeleton durante carregamento do usuário

---

## 📌 Notas de Implementação

### Prioridades

1. **Alta Prioridade:**
   - ~~TASK 2.1: Endpoint PATCH /auth/profile~~ ✅ CONCLUÍDO
   - ~~TASK 3.2: Formulário de edição de nome~~ ✅ CONCLUÍDO
   - ~~TASK 4.1: Integração frontend-backend~~ ✅ CONCLUÍDO

2. **Média Prioridade:**
   - ~~TASK 5.1: Confirmação de senha para email~~ ✅ CONCLUÍDO
   - ~~TASK 3.5: Modal de confirmação~~ ✅ CONCLUÍDO
   - ~~TASK 2.3: Deletar conta~~ ✅ CONCLUÍDO

3. **Baixa Prioridade:**
   - ~~TASK 1.2: Preferências do usuário~~ ✅ CONCLUÍDO
   - ~~TASK 2.6: Upload de avatar~~ ✅ CONCLUÍDO - Implementado com URL externa no frontend e backend
   - TASK 6.2: Skeleton screens

### Dependências

```
TASK 1.x (Schema) → TASK 2.x (API) → TASK 4.x (Integração)
                         ↓
                    TASK 3.x (UI)
```

### Guidelines Específicas

**Backend:**
- Seguir padrão Hono com zValidator ✅
- Usar requireAuth middleware em todas as rotas ✅
- Respostas no formato `{ data: {...} }` ou `{ error: "..." }` ✅
- Hash de senha com SHA-256 + salt ✅

**Frontend:**
- Componentes com Motion para animações ✅
- Tipagem TypeScript estrita ✅
- Hooks customizados para state management ✅
- Design system: cores, bordas (24px-32px), dark mode ✅

---

## 📊 Progresso

| Categoria | Total | Feito | Em Progresso | Pendente |
|-----------|-------|-------|--------------|----------|
| Backend - Schema | 3 | 3 | 0 | 0 |
| Backend - API | 6 | 6 | 0 | 0 |
| Frontend - UI | 6 | 5 | 0 | 1 |
| Frontend - Integração | 4 | 4 | 0 | 0 |
| Segurança | 4 | 4 | 0 | 0 |
| UX | 4 | 1 | 0 | 3 |
| **Total** | **27** | **21** | **0** | **6** |

**Progresso Geral:** ~85% (23/27 tasks)

---

*Última atualização: Dezembro 2024 - TASK 5.4 concluída (logging de auditoria implementado para mudanças de perfil com tabela audit_logs, função logAudit reutilizável e rastreamento de profile_update, preferences_update e account_delete)*
