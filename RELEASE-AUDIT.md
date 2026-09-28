# Auditoria de Entrega — NOVA PLAY

**Data da auditoria:** 28/09/2026  
**Escopo analisado:** branch `novaplay-release`, projeto React/Vite, preview publicado no ambiente de desenvolvimento e artefatos de scanner de streams.  
**Objetivo:** avaliar se o sistema está pronto para merge em `main` e deploy em produção, distinguindo evidência verificada de item ainda não comprovado.

## Parecer executivo

### Classificação atual: **YELLOW / NÃO LIBERAR AINDA PARA PRODUÇÃO PÚBLICA**

O fluxo principal do frontend está funcional e o build de produção passa. As categorias **Esportes** e **Filmes** foram verificadas no preview; Esportes agora mostra 14 canais catalogados para revisão e Filmes mostra 3 canais aprovados. O servidor de produção local respondeu HTTP 200 e entregou o título correto.

Entretanto, a entrega ainda não possui evidência suficiente para ser considerada pronta para usuários reais. Os principais bloqueadores são:

1. **Confiabilidade dos streams:** o scanner anterior aprovou 72 de 388 URLs; 316 ficaram para revisão. Nenhum stream esportivo foi aprovado naquela execução, portanto os 14 esportes exibidos são explicitamente links para revisão, não canais garantidos.
2. **QA automatizado insuficiente:** não existem testes unitários, de integração, E2E ou pipeline CI identificado no projeto.
3. **Segurança de dependências:** `pnpm audit --prod` reportou 17 vulnerabilidades altas, 48 moderadas e 8 baixas, sem crítica. Elas precisam ser triadas e atualizadas antes do deploy público.
4. **Deploy operacional não comprovado:** não há evidência de staging, monitoramento, plano de rollback executado, domínio, HTTPS real, limites de uso ou rotina de atualização do catálogo.

**Recomendação:** fazer o merge apenas depois de triagem de dependências, smoke test em staging e decisão formal sobre a política de exibição de links “para revisão”.

---

## 1. Auditoria do Product Backlog — Validação da elaboração

### Evidências encontradas

- O MVP implementado contém: catálogo público, busca, filtros, categorias, favoritos locais, player HLS, tratamento de autoplay, mensagens de erro, sincronização de playlists e metadados do iptv-org.
- Existe um README com instalação, execução e build.
- A correção recente de Esportes/Filmes está implementada no frontend.

### Lacunas e riscos

- Não foi fornecido um Product Backlog formal com histórias, critérios de aceite, prioridade ou definição explícita de MVP.
- Não há confirmação de requisitos de negócio para login, perfis, favoritos sincronizados, múltiplos dispositivos, EPG, histórico, controle parental ou administração de playlists.
- O sistema não tem backend ou banco de dados próprio; favoritos e tema usam armazenamento local do navegador. Isso deve ser aceito como requisito do MVP, não confundido com persistência de conta.
- “Filmes” no projeto significa canais/streams públicos classificados como filmes; não há catálogo VOD, busca de filmes por título ou reprodução sob demanda comprovada.

### Diagnóstico

**Parcialmente concluído — risco médio.** O escopo técnico do frontend existe, mas o escopo do produto não está formalmente fechado.

### Perguntas de aceite

- O MVP deve ser somente um player público local ou precisa de contas e dados sincronizados?
- “Filmes” deve significar canais lineares ou filmes individuais sob demanda?
- Canais marcados como revisão podem aparecer na navegação principal ou devem ficar ocultos até nova aprovação?

---

## 2. Auditoria do Sprint Planning — Validação do escopo final

### Evidências encontradas

- A branch `novaplay-release` contém a versão de entrega.
- O build e o typecheck foram executados com sucesso.
- A Pull Request de entrega foi aberta contra `main`.

### Débitos técnicos identificados

- Não há artefatos de Sprint Planning, Sprint Goal, burndown ou lista de tarefas no repositório.
- O bundle JavaScript final ultrapassa 500 kB após minificação; o Vite emite aviso de chunk grande.
- A rotina de playlists depende de endpoints externos e de CORS. Não existe cache persistente, proxy próprio ou estratégia de degradação além do fallback local.
- O relatório do scanner é estático: os dados de saúde podem envelhecer e não há job periódico no projeto para atualizá-los.
- A documentação menciona `/home/ubuntu/iptv-scan`, um caminho do ambiente de desenvolvimento que não existe necessariamente na máquina do usuário.

### Diagnóstico

**Parcialmente concluído — risco médio/alto.** A entrega técnica visível existe, mas os débitos operacionais e a ausência de rastreabilidade do sprint impedem afirmar que o escopo final foi formalmente aceito.

---

## 3. Auditoria de Desenvolvimento — Código e integração

### Arquitetura real

- Frontend: React 19 + Vite + TypeScript + Tailwind.
- Player: Hls.js e suporte HLS nativo quando disponível.
- Dados: playlists e API públicas externas do iptv-org; relatório local `client/src/data/stream-health.json`.
- Backend/banco: não há backend de negócio nem banco de dados da aplicação. O `server/index.ts` serve arquivos estáticos e faz fallback de rota.
- Persistência local: favoritos e tema em `localStorage`.

### Testes executados

- `pnpm exec tsc --noEmit`: **passou**.
- `pnpm run build`: **passou**.
- Servidor de produção local em `PORT=4173`: **HTTP 200**, título `NOVA PLAY · IPTV público` entregue.
- Preview manual: Esportes abriu 14 resultados de revisão e selecionou Band Sports; Filmes apresenta 3 resultados aprovados.

### Riscos técnicos

- A aplicação depende de endpoints externos, CORS, disponibilidade regional e formatos de stream que podem mudar sem aviso.
- O frontend filtra links HTTP quando está em HTTPS, o que reduz mixed content, mas também remove canais que só fornecem HTTP sem apresentar uma alternativa segura.
- O `server/index.ts` não configura headers de segurança como CSP, HSTS, `X-Content-Type-Options` ou `Referrer-Policy`; isso deve ser tratado no hosting ou no servidor.
- O HTML ainda contém placeholders de analytics `%VITE_ANALYTICS_ENDPOINT%` e `%VITE_ANALYTICS_WEBSITE_ID%`; confirmar se são substituídos ou removidos no ambiente final.
- Não há rate limit, observabilidade ou proteção operacional para o servidor, embora ele seja apenas estático.

### Diagnóstico

**Build estável; integração externa frágil — risco alto para disponibilidade.** Não há “back-end conversando com banco” para validar porque essa arquitetura não existe no produto atual.

---

## 4. Auditoria de QA — Foco máximo

### Regressão manual realizada

- Carregamento inicial do catálogo aprovado: **passou**.
- Navegação para Esportes: **passou**; mostra 14 links de revisão e seleciona um canal esportivo.
- Navegação para Filmes: **passou** anteriormente; mostra 3 canais aprovados.
- Separação entre aprovados e revisão: **passou**; interface mostra 71/72 aprovados conforme a sincronização atual e 316 para revisão.
- Build e servidor de produção local: **passaram**.

### Scanner de streams

Execução registrada:

- 388 URLs únicas analisadas.
- 72 aprovadas no momento do teste.
- 316 não aprovadas.
- Principais motivos: 116 erros no primeiro segmento, 89 links HTTP bloqueados em HTTPS, 37 falhas de rede, 31 CORS ausente, 17 respostas 403 e 14 respostas 404.
- `br_pluto.m3u` respondeu 404 naquela execução.

O scanner verifica manifesto, primeiro segmento e CORS; não comprova uma sessão contínua de áudio e vídeo por vários minutos.

### Testes não comprovados

- Não há testes automatizados no repositório.
- Não há evidência de teste de carga, concorrência, estresse ou longa duração do player.
- Não há evidência de teste em Safari/iOS, Firefox, Android TV, TVs com navegador ou dispositivos de baixa memória.
- Não há DAST/SAST configurado.
- Não há painel de bugs ou evidência de que bugs críticos foram encerrados.

### Dependências

`pnpm audit --prod` reportou:

| Severidade | Quantidade |
|---|---:|
| Crítica | 0 |
| Alta | 17 |
| Moderada | 48 |
| Baixa | 8 |

A saída cita problemas em dependências/transitivas como Axios, nanoid, form-data, qs, DOMPurify, Mermaid e outras. É necessário atualizar ou justificar cada alta antes de produção; não aplicar `audit fix` cegamente sem repetir build e regressão.

### Diagnóstico

**Não concluído — bloqueador de release.** O smoke test passou, mas o nível de cobertura não sustenta a afirmação “pronto para produção”.

---

## 5. Auditoria de Sprint Review — Negócio e demonstração

### Evidências encontradas

- O preview foi demonstrado e os fluxos de categorias foram observados.
- O README documenta como rodar localmente.

### Não comprovado

- Não há aceite formal do Product Owner/cliente.
- Não há ambiente de homologação/staging independente do preview do desenvolvimento.
- Não há roteiro de aceite ponta a ponta assinado.
- Não há Definition of Done formal no repositório.

### Diagnóstico

**Parcialmente concluído — risco alto de expectativa.** O software pode estar tecnicamente demonstrável, mas o aceite de negócio ainda não está registrado.

### Critérios mínimos de aceite sugeridos

1. Abrir a aplicação em desktop e celular.
2. Pesquisar um canal.
3. Abrir Canais, Esportes, Filmes e Revisar.
4. Selecionar um item e iniciar reprodução manual.
5. Confirmar mensagem clara para link indisponível/autoplay/CORS.
6. Favoritar, recarregar a página e confirmar o comportamento esperado.
7. Confirmar que nenhum login, senha ou dado privado é solicitado.

---

## 6. Auditoria de Retrospectiva — Equipe e documentação

### Documentação existente

- README com requisitos, comandos, fontes públicas e explicação das listas aprovadas/revisão.
- Código contém mensagens de erro e estados de carregamento.

### Lacunas

- Não há manual de usuário separado.
- Não há runbook de atualização do scanner, diagnóstico de CORS ou procedimento de troca de playlist.
- Não há documentação de arquitetura, matriz de compatibilidade ou política de disponibilidade.
- Não há registro de decisões técnicas, riscos aceitos ou responsáveis pós-deploy.
- Não há instrução de rollback operacional testada.

### Diagnóstico

**Parcialmente concluído — risco médio.** A documentação permite iniciar o projeto, mas não operar e sustentar o produto em produção.

---

## 7. Auditoria de Deploy — Checklist de produção

### Confirmado

- Build de produção gera `dist/public` e `dist/index.js`.
- Servidor local de produção respondeu HTTP 200.
- O projeto está versionado em branch `novaplay-release` e há uma Pull Request para `main`.

### Não confirmado / pendente

- Hosting de produção, domínio, DNS e HTTPS real.
- Variáveis de ambiente do ambiente final.
- Headers de segurança e política de CORS no hosting.
- Monitoramento, logs, alertas e health check.
- Limite de tráfego e comportamento sob carga.
- Processo automático de build/deploy a partir do GitHub.
- Plano de rollback testado.
- Política de atualização do `stream-health.json` e das playlists.

### Plano de rollback mínimo

1. Manter `main` como última versão estável.
2. Publicar cada release por commit imutável ou tag, por exemplo `v1.0.0`.
3. Em falha, reverter o hosting para a tag/commit anterior.
4. Verificar HTTP 200, carregamento do app e reprodução de pelo menos um stream aprovado.
5. Registrar o incidente e bloquear novo deploy até a causa ser conhecida.

### Diagnóstico

**Não concluído — bloqueador operacional.** O build está pronto, mas a implantação real e o rollback ainda não foram comprovados.

---

## Matriz consolidada de riscos

| ID | Risco | Probabilidade | Impacto | Severidade | Ação antes do deploy |
|---|---|---:|---:|---:|---|
| R1 | Streams externos instáveis ou bloqueados | Alta | Alta | Crítica | Definir política de revisão, reexecutar scanner e medir reprodução contínua |
| R2 | Vulnerabilidades altas em dependências | Média | Alta | Alta | Atualizar/triar, repetir audit, build e regressão |
| R3 | Falta de testes automatizados | Alta | Alta | Alta | Criar smoke/E2E mínimo para categorias, busca e player |
| R4 | Deploy/rollback não comprovados | Média | Alta | Alta | Configurar staging, tag e rollback real |
| R5 | Ausência de observabilidade | Média | Média | Média | Adicionar health check, logs e alerta de falhas |
| R6 | Escopo de produto não formalizado | Média | Alta | Alta | Registrar histórias, critérios de aceite e Definition of Done |
| R7 | Dados externos sem cache/versão operacional | Alta | Média | Alta | Agendar atualização, guardar último catálogo bom e documentar fallback |
| R8 | Bundle grande e dependências excessivas | Média | Média | Média | Remover componentes não usados e aplicar code splitting |

---

## Checklist de saída recomendado

### Bloqueadores P0

- [ ] Triar e resolver as 17 vulnerabilidades altas de produção.
- [ ] Validar um staging real com HTTPS.
- [ ] Definir se canais “para revisão” podem ser exibidos e reproduzidos.
- [ ] Reexecutar o scanner e testar pelo menos alguns streams por 5–10 minutos.
- [ ] Criar e executar smoke tests automatizados básicos.
- [ ] Confirmar aceite do Product Owner.
- [ ] Testar rollback.

### Melhorias P1

- [ ] Adicionar GitHub Actions para `pnpm install`, typecheck, build e testes.
- [ ] Adicionar atualização periódica do scanner com timestamp visível.
- [ ] Adicionar CSP, HSTS e demais headers no hosting.
- [ ] Documentar matriz de navegadores/dispositivos.
- [ ] Reduzir bundle com code splitting.

### Decisão final

**Não apertar o botão de entrega ainda.** O produto está em estado de **release candidate técnico**, não em estado de produção validado. Após resolver os P0 e obter aceite formal, a recomendação pode mudar para **GO condicionado**.
