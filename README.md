<p align="center">
  <img src="docs/logo.svg" alt="iMemory" width="72" height="72">
</p>

<h1 align="center">iMemory</h1>

<p align="center">
  Portal em português para o <a href="https://github.com/akitaonrails/ai-memory">ai-memory</a>.<br>
  A memória dos seus agentes de código, num só lugar, neste computador.
</p>

<p align="center">
  <img src="docs/overview.png" alt="Visão geral do iMemory: seletor de projetos, busca, contagens e memórias recentes" width="920">
</p>

O ai-memory guarda o que os agentes fizeram: páginas em Markdown, sessões, handoffs e busca. A interface que vem com ele é somente leitura. O iMemory ocupa o lugar dessa interface e completa o ciclo no navegador: consultar, gravar, revisar e deixar o contexto para a próxima sessão.

A leitura usa a API `/api/v1`. Gravar, excluir, resumir, revisar e avaliar usam as mesmas ferramentas MCP que os agentes.

## O que dá para fazer

- Ver a memória de todos os projetos ou de um só, com busca, filtro por tipo e por idade.
- Abrir uma sessão e ver os arquivos que ela gravou, mesmo quando o resumo automático não descreve o trabalho.
- Salvar a sessão na memória, e ver se o resumo automático está na fila, rodando, salvo ou falhou.
- Deixar um handoff com resumo, próximos passos, perguntas e arquivos.
- Criar uma página permanente, no projeto atual ou para todos os projetos.
- Marcar uma memória como útil, pouco útil, desatualizada ou errada.
- Revisar um projeto em busca de páginas vazias, duplicadas, paradas ou em conflito, sem apagar nada.
- Excluir com desfazer, e rodar a faxina de retenção com prévia.
- Ver, no indicador do servidor, se o ai-memory instalado está na mesma versão publicada no GitHub. O clique confere de novo.

## Requisitos

- [ai-memory](https://github.com/akitaonrails/ai-memory) 2.6.0 ou mais recente, no mesmo computador.
- Um navegador. Não há etapa de build: a interface é HTML, CSS e JavaScript.

## Começar

```bash
git clone https://github.com/jordaoqualho/imemory.git
cd imemory
ai-memory serve --enable-web --web-ui-dir "$(pwd)/web-ui" --bind 127.0.0.1:49374
```

Abra [http://127.0.0.1:49374/web](http://127.0.0.1:49374/web).

O guia dentro do portal, em **Como funciona**, descreve o ciclo de captura e os pedidos que os agentes entendem.

### macOS, com o servidor já instalado

Se o ai-memory sobe pelo LaunchAgent, aponte a interface e reinicie o serviço:

```bash
export AI_MEMORY_WEB_UI_DIR="$(pwd)/web-ui"
launchctl kickstart -k "gui/$(id -u)/com.github.akitaonrails.ai-memory"
```

Para o caminho valer em todo login, grave `--web-ui-dir` nos argumentos do LaunchAgent, ao lado de `--enable-web`.

### Dados neste clone

Wiki, banco e configuração podem morar nesta pasta. O `.gitignore` deixa isso de fora do Git.

```bash
ai-memory --data-dir "$(pwd)" init
ai-memory --data-dir "$(pwd)" serve --enable-web --web-ui-dir "$(pwd)/web-ui" --bind 127.0.0.1:49374
```

Antes de cada commit, `git status` deve mostrar só a interface, `tools/sync-logos.py`, esta página, a licença e `docs/`. `git add -f` ignora essa proteção.

As cópias geradas em `web-ui/logos/` não sobem. O script `tools/sync-logos.py` copia o ícone de cada repositório. Marcas feitas à mão ficam em `web-ui/logos/overrides/`.

## Crédito

O servidor, os hooks, o protocolo MCP e a licença do motor são do [ai-memory](https://github.com/akitaonrails/ai-memory), copyright Fabio Akita, MIT. Este repositório é a interface que o servidor entrega com `--web-ui-dir`.

## Licença

A interface está sob MIT. Veja [LICENSE](LICENSE).
