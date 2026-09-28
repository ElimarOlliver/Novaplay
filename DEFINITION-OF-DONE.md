# Definition of Done — NOVA PLAY

Uma história do MVP só é considerada pronta quando:

- [ ] Critério de aceite descrito e demonstrado.
- [ ] TypeScript sem erros.
- [ ] Build de produção concluído.
- [ ] Smoke check concluído.
- [ ] Nenhuma vulnerabilidade alta/crítica em dependências de produção.
- [ ] Fluxo testado em desktop e celular.
- [ ] Estados de carregamento, erro e autoplay bloqueado tratados.
- [ ] Alteração revisada na Pull Request.
- [ ] Documentação atualizada quando houver mudança operacional.

## Aceite do player

- [ ] O usuário consegue abrir o catálogo.
- [ ] O usuário consegue pesquisar e filtrar Canais, Esportes, Filmes e Revisar.
- [ ] A seleção de um item atualiza o player e o título do canal.
- [ ] O usuário consegue iniciar manualmente um stream quando o autoplay é bloqueado.
- [ ] Streams indisponíveis exibem motivo compreensível sem quebrar a página.
- [ ] Favoritos funcionam no mesmo navegador conforme o escopo atual.
- [ ] A interface não solicita login ou senha.

## Aceite dos dados

- [ ] O snapshot do scanner tem timestamp e contagens consistentes.
- [ ] Links aprovados e links para revisão ficam separados.
- [ ] A interface informa que a disponibilidade depende do provedor externo.
- [ ] Um stream aprovado é revalidado no staging antes da publicação.
