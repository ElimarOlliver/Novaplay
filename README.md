# NOVA PLAY

Player web responsivo para streams públicos de IPTV, com catálogo brasileiro, filtros de canais, esportes e filmes, reprodução HLS e separação entre streams aprovados e links para revisão.

> O projeto usa somente playlists e metadados públicos. Os links podem expirar, exigir autorização do provedor ou deixar de funcionar por região/CORS.

## Requisitos

- Node.js 20+
- pnpm 10+

## Rodar na máquina

```bash
pnpm install
pnpm dev
```

Depois, abra o endereço mostrado pelo Vite, normalmente `http://localhost:5173`.

## Validar e gerar produção

```bash
pnpm exec tsc --noEmit
pnpm run build
pnpm start
```

## Organização do catálogo

- **Aprovados:** streams que passaram pelo scanner de manifesto, primeiro segmento e CORS no momento do teste.
- **Revisar:** links que falharam por CORS, HTTP inseguro, erro de segmento, rede, 403, 404 ou outro motivo técnico.
- **Esportes:** quando não há esportes aprovados, a categoria abre os canais esportivos catalogados para revisão e informa essa condição ao usuário.
- **Filmes:** exibe os streams de filmes aprovados e os links de revisão quando necessário.

## Fontes públicas

- Playlists: [iptv-org/iptv](https://github.com/iptv-org/iptv)
- Metadados: [iptv-org/database](https://github.com/iptv-org/database)

## Relatório do scanner

O relatório e as listas geradas estão em `SCAN-REPORT.md` e no diretório `/home/ubuntu/iptv-scan` durante o desenvolvimento local. O arquivo `client/src/data/stream-health.json` é usado pelo frontend para separar os links conforme o último teste.

## Observação sobre o GitHub

A branch de entrega deste projeto é `novaplay-release`. Após revisar a solicitação de pull request, ela pode ser mesclada em `main` e definida como branch padrão nas configurações do repositório.
