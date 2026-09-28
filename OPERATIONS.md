# Operação e entrega do NOVA PLAY

## 1. Staging

Antes de produção, publique exatamente o commit que será promovido em um ambiente de staging com HTTPS.

```bash
pnpm install --frozen-lockfile
pnpm exec tsc --noEmit
pnpm run build
NODE_ENV=production PORT=4173 pnpm start
curl -fsS http://127.0.0.1:4173/healthz
```

O health check deve retornar JSON com `status: "ok"`. No staging, valide também:

- carregamento inicial e imagens;
- busca por canal;
- Canais, Esportes, Filmes e Revisar;
- reprodução manual de pelo menos três streams aprovados;
- mensagem de erro para um stream reprovado;
- favoritos e recarregamento da página;
- desktop, celular e ao menos um navegador adicional.

## 2. Segurança mínima

- Servir somente por HTTPS.
- Configurar headers adicionais no proxy/hosting quando possível: CSP, HSTS e `frame-ancestors`.
- Não adicionar tokens, senhas ou arquivos `.env` ao Git.
- Executar `pnpm audit --prod --audit-level=high` em cada release.
- Manter as playlists externas como dados não confiáveis; não executar conteúdo recebido delas como HTML ou JavaScript.

## 3. Atualização dos streams

O arquivo `client/src/data/stream-health.json` é um snapshot. Ele deve ser regenerado antes de uma release e conter:

- timestamp da execução;
- contagem total;
- contagem aprovada;
- contagem para revisão;
- motivo técnico por URL;
- playlist com erro separada.

Um resultado aprovado no scanner não é garantia de disponibilidade contínua: streams podem expirar, exigir autorização, sofrer geoblocking ou mudar CORS.

## 4. Deploy

1. Abrir Pull Request para `main`.
2. Aguardar CI verde: instalação congelada, typecheck, build, smoke check e audit.
3. Publicar o commit aprovado no staging.
4. Executar o roteiro de aceite.
5. Criar uma tag imutável, por exemplo `v1.0.0`.
6. Promover o mesmo commit para produção.
7. Verificar `/healthz`, HTML, console do navegador e um stream aprovado.

## 5. Rollback

1. Identificar a última tag/versão estável.
2. Reverter o hosting para o commit anterior; não corrigir diretamente em produção.
3. Verificar `/healthz` e o carregamento do HTML.
4. Reproduzir um stream aprovado conhecido.
5. Registrar causa, horário, commit revertido e impacto.
6. Manter a release problemática bloqueada até nova revisão.

## 6. Critérios para liberar

A release só pode ser marcada como `GO` quando:

- CI estiver verde;
- audit de produção não tiver vulnerabilidades altas ou críticas;
- staging estiver acessível por HTTPS;
- Product Owner confirmar o roteiro de aceite;
- rollback tiver sido demonstrado;
- a equipe decidir e documentar como links “para revisão” serão apresentados.
