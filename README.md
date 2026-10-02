<p align="center">
  <img src="docs/logo.svg" alt="iMemory" width="72" height="72">
</p>

<h1 align="center">iMemory</h1>

<p align="center">
  Memória local, compartilhada entre agentes de código.<br>
  Interface em português para o <a href="https://github.com/akitaonrails/ai-memory">ai-memory</a> de Fabio Akita.
</p>

<p align="center">
  <img src="docs/portal.jpg" alt="Visão geral do portal iMemory: projetos, busca e memórias recentes" width="880">
</p>

O motor continua sendo o ai-memory. Este repositório é o portal que ocupa o lugar do navegador embutido: visão geral, memórias, sessões, handoffs, limpeza com prévia, exclusão com desfazer e o botão de salvar sessão. A leitura usa `/api/v1`. As alterações usam as mesmas ferramentas MCP que os agentes.

## Instalação

Instale o ai-memory pelo [guia oficial](https://github.com/akitaonrails/ai-memory/blob/main/docs/install.md). Esta interface foi feita em cima da versão 2.4.

```bash
git clone https://github.com/jordaoqualho/imemory.git
cd imemory
ai-memory serve --enable-web --web-ui-dir "$(pwd)/web-ui" --bind 127.0.0.1:49374
```

Abra [http://127.0.0.1:49374/web](http://127.0.0.1:49374/web).

Se o servidor já sobe pelo app de menu bar no macOS, grave o caminho da interface e reinicie:

```bash
export AI_MEMORY_WEB_UI_DIR="$(pwd)/web-ui"
launchctl kickstart -k "gui/$(id -u)/com.github.akitaonrails.ai-memory"
```

Para guardar os dados dentro deste clone, aponte o data dir para a pasta antes do `init`. Wiki, banco e configuração nascem aqui e o `.gitignore` deixa tudo isso fora do git.

```bash
ai-memory --data-dir "$(pwd)" init
ai-memory --data-dir "$(pwd)" serve --enable-web --web-ui-dir "$(pwd)/web-ui" --bind 127.0.0.1:49374
```

## O que não sobe no git

Esta pasta pode ser, ao mesmo tempo, o clone e o diretório de dados. O `.gitignore` ignora tudo e libera só a interface, o README, a licença e as imagens desta página. Ficam na máquina:

- `wiki/`, `db/` e `config.toml`
- `hook-spool/`, `logs/`, `voice/` e `backups/`
- `web-ui/logos/`, porque o manifesto lista projetos locais

Confira com `git status` antes de cada commit. `git add -f` fura essa regra.

## Crédito

O servidor, os hooks, o protocolo MCP e a licença do motor são do projeto [akitaonrails/ai-memory](https://github.com/akitaonrails/ai-memory), copyright Fabio Akita, MIT. Este repositório não é um fork desse código. É a interface que o próprio servidor monta com `--web-ui-dir`.

## Licença

A interface neste repositório está sob MIT. Veja [LICENSE](LICENSE).
