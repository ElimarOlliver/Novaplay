# Como executar o NOVA PLAY na sua máquina

Este documento explica, do começo ao fim, como baixar o projeto, instalar as dependências, abrir no computador e testar pelo Android.

## Resposta rápida sobre Android e APK

O projeto atual é uma **aplicação web responsiva** feita com React/Vite. Ele pode ser aberto no navegador do Android, mas **ainda não é um aplicativo Android nativo e não foi gerado nenhum arquivo `.apk`**.

Você já consegue testar no Android usando o navegador, desde que o computador e o celular estejam na mesma rede Wi-Fi. Para gerar um APK instalável, seria necessário criar uma etapa adicional usando Capacitor, Expo/React Native ou outra camada nativa, configurar o pacote Android, assinar o aplicativo e gerar o APK. Esse processo não faz parte deste projeto web atual.

---

## 1. Requisitos

Instale na máquina:

- **Git** para baixar o código;
- **Node.js 20 ou superior**;
- **pnpm 10 ou superior**;
- conexão com a internet para instalar dependências e carregar os streams públicos.

### Verificar se já estão instalados

Abra o terminal e execute:

```bash
git --version
node --version
pnpm --version
```

Se `node` ou `pnpm` não forem encontrados, instale o Node.js pelo site oficial [nodejs.org](https://nodejs.org/) e depois habilite o pnpm:

```bash
corepack enable
corepack prepare pnpm@10.4.1 --activate
```

No Windows, use o PowerShell ou o Terminal do Windows. Se o comando `corepack` não estiver disponível, instale o pnpm conforme a documentação oficial em [pnpm.io](https://pnpm.io/installation).

---

## 2. Baixar o projeto do GitHub

### Opção A — depois que a Pull Request for mesclada em `main`

```bash
git clone https://github.com/ElimarOlliver/Novaplay.git
cd Novaplay
```

### Opção B — testar diretamente a branch de entrega

Use esta opção enquanto a branch `novaplay-release` ainda não tiver sido mesclada:

```bash
git clone --branch novaplay-release https://github.com/ElimarOlliver/Novaplay.git
cd Novaplay
```

Confirme que você está no projeto correto:

```bash
git branch --show-current
ls
```

No Windows, o comando `ls` pode ser substituído por `dir`.

---

## 3. Instalar as dependências

Dentro da pasta `Novaplay`, execute:

```bash
pnpm install --frozen-lockfile
```

Esse comando lê o `pnpm-lock.yaml` e instala as versões previstas pelo projeto. Na primeira instalação pode levar alguns minutos.

Se aparecer uma mensagem de que o lockfile não está atualizado, use apenas como recuperação:

```bash
pnpm install
```

Depois, repita o comando de validação:

```bash
pnpm exec tsc --noEmit
```

---

## 4. Executar em modo de desenvolvimento

Na pasta do projeto:

```bash
pnpm dev
```

O terminal exibirá um endereço parecido com:

```text
http://localhost:3000/
```

Abra esse endereço no navegador do computador. O projeto usa a porta 3000 por padrão no ambiente atual; se ela estiver ocupada, o Vite poderá escolher outra porta e informará qual endereço usar.

Para parar o servidor, pressione:

```text
Ctrl + C
```

### O que testar no computador

1. Abrir a aplicação.
2. Clicar em **Canais**.
3. Clicar em **Esportes**.
4. Clicar em **Filmes**.
5. Clicar em **Revisar** para ver links que falharam no último scanner.
6. Pesquisar um canal no campo de busca.
7. Selecionar um canal e clicar no botão de reprodução se o navegador bloquear o autoplay.
8. Favoritar um canal e recarregar a página.
9. Confirmar que um link indisponível mostra uma mensagem de erro em vez de travar a interface.

Os streams dependem dos provedores públicos originais. Mesmo um canal aprovado no scanner pode sair do ar, mudar de endereço, exigir autorização ou bloquear determinada região.

---

## 5. Testar no Android pela mesma rede Wi-Fi

### 5.1 Descobrir o IP do computador

No Linux:

```bash
hostname -I
```

No macOS:

```bash
ipconfig getifaddr en0
```

No Windows PowerShell:

```powershell
ipconfig
```

Procure um endereço parecido com `192.168.1.25` ou `192.168.0.25`.

### 5.2 Iniciar o servidor aceitando conexões da rede

Dentro da pasta do projeto, execute:

```bash
pnpm dev --host 0.0.0.0
```

O terminal deverá mostrar a porta usada. Considerando que a porta seja 3000 e que o IP do computador seja `192.168.1.25`, abra no Android:

```text
http://192.168.1.25:3000
```

O computador e o Android precisam estar conectados à **mesma rede Wi-Fi**.

### 5.3 Se não abrir no Android

Verifique, nesta ordem:

1. O servidor ainda está rodando no computador.
2. O IP usado é o IP local correto do computador.
3. O celular não está usando dados móveis em vez do Wi-Fi.
4. O firewall do Windows/macOS/Linux permite conexões na porta 3000.
5. O endereço foi digitado com `http://` e a porta correta.
6. O roteador não possui isolamento entre dispositivos Wi-Fi.

No Windows, pode ser necessário permitir o Node.js no Firewall do Windows. Em redes corporativas, o acesso entre dispositivos pode ser bloqueado.

### 5.4 O que esperar no Android

A interface foi construída para ser responsiva e pode ser testada no navegador do celular. A reprodução HLS depende do navegador Android, do CORS do provedor, do formato do stream e da disponibilidade do canal. O usuário pode precisar tocar manualmente no botão de reprodução.

Para uma experiência de aplicativo, no Chrome Android você também pode usar **Adicionar à tela inicial**. Isso cria um atalho/PWA quando os requisitos do navegador e do site forem atendidos, mas **não é o mesmo que um APK nativo**.

---

## 6. Gerar e testar a versão de produção local

Para testar exatamente o build de produção:

```bash
pnpm exec tsc --noEmit
pnpm run build
pnpm run test:smoke
pnpm audit --prod --audit-level=high
pnpm start
```

Depois, abra o endereço informado pelo servidor, normalmente:

```text
http://localhost:3000
```

O smoke check confirma que os artefatos foram gerados e que o snapshot do scanner tem dados consistentes. O comando de auditoria deve terminar com `No known vulnerabilities found` para as dependências de produção.

O endpoint técnico de saúde é:

```text
http://localhost:3000/healthz
```

Uma resposta correta é um JSON contendo `"status":"ok"`.

---

## 7. Arquivos importantes do projeto

| Arquivo | Finalidade |
|---|---|
| `client/src/pages/Home.tsx` | Interface, catálogo, filtros e player |
| `client/src/data/stream-health.json` | Snapshot dos streams aprovados e em revisão |
| `SCAN-REPORT.md` | Relatório resumido do último scanner |
| `scripts/smoke-check.mjs` | Validação automática dos artefatos e dados |
| `OPERATIONS.md` | Staging, segurança, deploy e rollback |
| `DEFINITION-OF-DONE.md` | Critérios de aceite e Definition of Done |
| `package.json` | Scripts e dependências |
| `pnpm-lock.yaml` | Versões fixadas das dependências |

---

## 8. Comandos principais

```bash
# desenvolvimento
pnpm dev

# desenvolvimento acessível pelo Android na mesma rede
pnpm dev --host 0.0.0.0

# typecheck
pnpm exec tsc --noEmit

# build de produção
pnpm run build

# smoke check
pnpm run test:smoke

# auditoria das dependências de produção
pnpm audit --prod --audit-level=high

# iniciar o build de produção
pnpm start
```

---

## 9. Sobre o APK

No estado atual, o repositório não contém pasta Android, `AndroidManifest.xml`, projeto Expo/React Native ou arquivo `.apk`. Portanto, **não existe APK pronto para instalar**.

O próximo projeto técnico para gerar um APK deverá:

1. escolher entre Capacitor e Expo/React Native;
2. criar o projeto Android nativo;
3. reutilizar ou adaptar a interface responsiva;
4. definir nome do pacote e ícone;
5. testar reprodução HLS em aparelhos reais;
6. configurar assinatura de debug/release;
7. gerar o APK ou AAB;
8. validar permissões, armazenamento e publicação.

Até essa etapa, a forma correta de testar no Android é abrir o NOVA PLAY pelo navegador usando o endereço local da máquina ou uma URL de hospedagem HTTPS.
