# Relatório do scanner de streams do NOVA PLAY

**Data do teste:** 2026-09-25T01:31:03Z  
**Fonte:** playlists públicas atuais do iptv-org para Brasil.

## Conclusão

O scanner encontrou **72 streams aprovados** e **316 links para revisão**, em **388 URLs únicas**. A lista principal do aplicativo foi configurada para mostrar somente os aprovados. Os demais ficam em uma lista separada para teste manual.

> “Aprovado” significa que o manifesto respondeu, foi identificado como HLS ou vídeo, o primeiro segmento respondeu e o cabeçalho CORS foi encontrado. Isso não garante disponibilidade futura nem qualidade contínua de áudio e imagem.

## Distribuição das falhas

| Motivo | Quantidade |
|---|---:|
| Primeiro segmento retornou erro HTTP (`segment_httperror`) | 116 |
| Link HTTP bloqueado em página HTTPS (`mixed_content_http`) | 89 |
| Falha de rede ou DNS (`network_urlerror`) | 37 |
| CORS ausente no navegador (`cors_missing`) | 31 |
| Acesso proibido (403) (`http_403`) | 17 |
| Recurso não encontrado (404) (`http_404`) | 14 |
| Não é HLS nem vídeo direto (`not_hls_or_video`) | 5 |
| Requisição inválida (400) (`http_400`) | 2 |
| Timeout no gateway (504) (`http_504`) | 2 |
| Servidor encerrou a conexão (`error_remotedisconnected`) | 1 |
| Erro do proxy/origem (530) (`http_530`) | 1 |
| Serviço indisponível (503) (`http_503`) | 1 |

A playlist `br_pluto.m3u` retornou **404** durante o teste. Por isso, ela não foi considerada uma segunda fonte válida nesta execução. Os 388 links vieram da playlist brasileira principal.

## Arquivos gerados

Os CSVs contêm todos os campos técnicos coletados. As playlists M3U podem ser abertas em um reprodutor compatível.

- `working.csv`: os 72 links aprovados.
- `needs-review.csv`: os 316 links não aprovados, com motivo individual.
- `all-results.csv`: resultado completo do scanner.
- `working.m3u`: playlist somente com streams aprovados.
- `needs-review.m3u`: playlist dos links que precisam de revisão.

## Limitações

O teste foi executado a partir do sandbox e avaliou o primeiro manifesto e o primeiro segmento. Alguns provedores podem variar por região, horário, endereço IP, cabeçalhos de referência ou disponibilidade temporária. Um link aprovado pode falhar depois, e um link reprovado pode voltar a funcionar sem alteração no aplicativo.

## Referências

[1]: https://github.com/iptv-org/iptv "iptv-org/iptv — playlists públicas"
[2]: https://github.com/iptv-org/database "iptv-org/database — banco público de metadados"
