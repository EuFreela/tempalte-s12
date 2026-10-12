# Template S-12 — Cartão de Mapa de Território

Página web standalone que recria a tela de **template de cartão de território (S-12)**.
O usuário preenche a **Localidade** e o **Terr. N.º**, envia a **imagem do mapa**,
**arrasta** para posicionar, ajusta o tamanho com **+/−** e **imprime** ou salva como PDF.

O cartão é reconstruído em HTML/CSS com as **proporções exatas do original físico
(1161×748)**, usando a unidade `cqw` (container query width) — 1 `cqw` = 1% da largura do
cartão — o que mantém a fidelidade tanto na tela quanto na impressão **A4 paisagem**.

> Implementação portada do blueprint `template.md` (originalmente um componente React
> `src/pages/TemplateCardPage.tsx`) para HTML/CSS/JS puro.
> **Sem login, sem permissão e sem build** — apenas a página do template.

---

## Funcionalidades

- Enviar ou **trocar** a imagem do mapa (seletor de arquivo).
- **Arrastar e soltar** a imagem direto na folha do cartão.
- Validação de tipo de arquivo: só aceita `image/*` (mensagem de erro em caso contrário).
- **Arrastar** a imagem para posicionar (limites de 5% a 95% em ambos os eixos).
- Ajuste de **tamanho** com passos de 2, entre 8% e 80% (padrão 36%).
- **Centralizar** volta a imagem para 50/50 e 36%.
- Campos **Localidade** e **Terr. N.º** sincronizados entre a toolbar e o cartão.
- **Imprimir / salvar PDF** em A4 paisagem, margem 0, apenas o cartão visível (277 mm).
- Suporte a **touch** (arrastar no celular/tablet).

---

## Requisitos

- **Node.js 18 ou superior** (testado no Node 22).
- Nenhuma dependência externa — usa apenas módulos nativos do Node.

Verifique a versão instalada:

```bash
node --version
```

---

## O que baixar (se a máquina não tiver o Node)

O único programa necessário é o **Node.js** (ele já inclui o `npm`, então **não** é
preciso baixar nada além dele).

### Windows

**Opção 1 — Instalador oficial (recomendado):**

1. Acesse <https://nodejs.org/pt/download>.
2. Baixe e execute o instalador **Windows Installer (.msi)** da versão **LTS** (ex.: 22.x).
3. Avance com as opções padrão (deixe as caixas *Node.js runtime* e *npm* marcadas).
4. Confirme a instalação abrindo o Prompt de Comando (ou PowerShell) e rodando:

   ```bat
   node --version
   npm --version
   ```

   Se aparecer a versão, está pronto. **Reinicie o terminal** se o comando não for
   reconhecido de imediato.

**Opção 2 — via winget (exige Windows 10/11):**

```powershell
winget install OpenJS.NodeJS.LTS
```

### Linux (Debian/Ubuntu)

```bash
sudo apt update
sudo apt install -y nodejs npm
```

> Se a versão do repositório for antiga (menor que 18), use o NodeSource:
> <https://github.com/nodesource/distributions>

### macOS

```bash
brew install node@22
```

(ou baixe o instalador .pkg em <https://nodejs.org/pt/download>).

### Alternativa universal — nvm (Node Version Manager)

Funciona em Linux e macOS (e no Windows via *nvm-windows*). Exemplo no Linux:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
nvm install --lts
nvm use --lts
```

Após instalar por qualquer um dos métodos, valide com `node --version` antes de
seguir para o próximo passo.

---

## Como rodar

1. Entre na pasta do projeto:

   ```bash
   cd template-maps
   ```

2. Inicie o servidor:

   ```bash
   npm start
   ```

3. Abra no navegador:

   ```
   http://127.0.0.1:3000
   ```

Para parar o servidor, pressione `Ctrl + C` no terminal.

### Scripts disponíveis

| Comando | Descrição |
| --- | --- |
| `npm start` | Sobe o servidor em `http://127.0.0.1:3000` |
| `npm run dev` | Igual ao `start`, mas com **auto-reload** (`node --watch`) |
| `node server.js` | Forma direta, sem passar pelo npm |

### Configuração (variáveis de ambiente)

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `PORT` | `3000` | Porta do servidor |
| `HOST` | `127.0.0.1` | Endereço de bind |

Exemplo usando outra porta e expondo na rede local:

```bash
PORT=8080 HOST=0.0.0.0 npm start
```

No Windows (PowerShell):

```powershell
$env:PORT=8080; npm start
```

---

## Como usar a página

1. Preencha **Localidade** (ex.: `Centro`) e **Terr. N.º** (ex.: `3`).
2. Clique em **Selecionar imagem** e escolha o mapa — ou arraste o arquivo e solte
   sobre o cartão.
3. **Arraste** a imagem dentro da área central para posicioná-la.
4. Use **−** e **+** para ajustar o tamanho (o valor em `%` aparece entre os botões).
5. Clique em **Centralizar** para voltar a imagem ao centro no tamanho padrão.
6. Clique em **Imprimir** e escolha a impressora ou "Salvar como PDF".
   Na caixa de impressão, mantenha **A4**, **paisagem** e margens **nenhuma**.

---

## Estrutura do projeto

```
template-maps/
├── package.json          # Metadados e scripts (start/dev)
├── server.js             # Servidor HTTP nativo do Node (sem dependências)
├── template.md           # Blueprint/especificação técnica original
├── README.md             # Este arquivo
└── public/
    ├── index.html        # Estrutura da página (cabeçalho, toolbar, cartão)
    ├── styles.css        # UI da página + CARD_CSS do cartão (medidas em cqw)
    └── app.js            # Lógica: estado, drag, zoom, toast, impressão
```

### Detalhes técnicos

- **`server.js`** — servidor HTTP com mapa de MIME types e proteção contra
  *path traversal* (só serve arquivos de `public/`).
- **`styles.css`** — o bloco `CARD_CSS` (fim do arquivo) é a transcrição fiel das
  medidas do blueprint; o restante estiliza a interface (toolbar, botões, toast).
- **`app.js`** — porta a lógica do componente React: o `<img>` condicional é criado
  dinamicamente, o estado (`uploaded`, `pos`, `size`) vive em variáveis de módulo e
  um `render()` aplica as mudanças na imagem e nos botões.
- **Impressão** — regras `@media print` com `@page { size: A4 landscape; margin: 0 }`
  e `visibility` para exibir somente o cartão.

---

## Solução de problemas

| Problema | Solução |
| --- | --- |
| `node: command not found` / `'node' não é reconhecido` | O Node não está instalado — veja a seção [O que baixar](#o-que-baixar-se-a-máquina-não-tiver-o-node). |
| `EADDRINUSE` ao iniciar | A porta já está em uso. Rode com `PORT=8080 npm start` ou encerre o processo antigo. |
| Página não abre | Confirme que o servidor está rodando e acesse exatamente `http://127.0.0.1:3000`. |
| Imagem não é aceita | O arquivo precisa ser de imagem (`image/*`); outros tipos disparam o aviso de erro. |
| Impressão sai cortada | Na caixa de impressão, selecione A4, paisagem e margens "nenhuma". |
| Ajustes não refletem na página | Recarregue com `Ctrl + F5` para limpar o cache dos arquivos estáticos. |
