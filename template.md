# Template S-12 — Especificação Técnica Completa (Blueprint de Recriação)

> Documento autossuficiente: contém todas as informações necessárias para
> **recriar a tela** `/territories/template` do zero, sem depender do código
> existente. Todo o código relevante está incluído verbatim.

---

## 1. Visão geral

Tela de **template de cartão de território (S-12)**. O usuário:
1. Preenche **Localidade** e **Terr. N.º**;
2. Envia uma **imagem do mapa** (seletor de arquivo ou arrastar e soltar);
3. **Arrasta** a imagem para posicionar e usa **+/−** para ajustar o tamanho;
4. **Imprime** ou salva como PDF.

O cartão é reconstruído em HTML/CSS com as **proporções exatas** do original
físico (1161×748), usando a unidade `cqw` (container query width) — 1 `cqw` =
1% da largura do cartão = **11,61 px** do original — o que mantém a fidelidade
tanto na tela quanto na impressão A4 paisagem.

- **Rota:** `/territories/template`
- **Arquivo de referência (a recriar):** `src/pages/TemplateCardPage.tsx`
- **Idioma da interface:** PT-BR

---

## 2. Requisitos de acesso

### 2.1 Rota (em `App.tsx`)

A rota fica dentro de `<ProtectedRoute />` e é protegida por `RequirePermission`
com escopo `territory:update`:

```tsx
<Route
  path="/territories/template"
  element={
    <RequirePermission scope="territory:update">
      <TemplateCardPage />
    </RequirePermission>
  }
/>
```

O componente deve ser carregado com `lazy`:

```tsx
const TemplateCardPage = lazy(() => import('./pages/TemplateCardPage'));
```

### 2.2 Menu (em `AppShell.tsx`)

- Item **Template** aparece dentro do menu suspenso **Territórios** apenas se
  `can('territory:update')`.
- Estado ativo: `const templateCardActive = location.pathname === '/territories/template';`
- O item usa a classe `menuItemClass(templateCardActive)` e ícone
  `IconImage` com `className="h-4 w-4 shrink-0 text-apple-tertiary"`.
- A entrada do menu **Territórios** fica ativa quando
  `territoriesMenuActive = territoriesActive || finishedActive || templateCardActive`.

---

## 3. Dependências e imports

```tsx
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { IconImage, IconPrinter, IconUndo } from '@/components/Map/mapIcons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
```

Componentes UI (shadcn/ui, Tailwind v4):

- `Button` — variantes `outline`, `icon` (size="icon") e padrão
- `Input` — campo de texto
- `Label` — rótulo de formulário
- `toast` do `sonner` — feedback de erro
- Ícones: `IconImage` (Lucide `Image`), `IconPrinter` (Lucide `Printer`),
  `IconUndo` (Lucide `Undo2`)

---

## 4. Constantes do módulo

```ts
const MAP_MIN_CQW = 8;       // tamanho mínimo da imagem (% / cqw)
const MAP_MAX_CQW = 80;      // tamanho máximo da imagem
const SIZE_STEP_CQW = 2;     // passo do +/-
const DEFAULT_SIZE_CQW = 36; // tamanho padrão

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}
```

---

## 5. Estado e refs do componente

| Símbolo | Tipo | Inicial | Descrição |
| --- | --- | --- | --- |
| `uploaded` | `string \| null` | `null` | URL `blob:` da imagem carregada |
| `localidade` | `string` | `''` | Valor do campo Localidade (toolbar + cartão) |
| `numero` | `string` | `''` | Valor do campo Terr. N.º (toolbar + cartão) |
| `pos` | `{ x: number; y: number }` | `{ x: 50, y: 50 }` | Posição da imagem em % (centro) |
| `size` | `number` | `DEFAULT_SIZE_CQW` (36) | Largura da imagem em `cqw` |
| `inputRef` | `useRef<HTMLInputElement>` | — | Input de arquivo oculto |
| `mapRef` | `useRef<HTMLDivElement>` | — | Div da área do mapa (referência de tamanho) |
| `dragRef` | `useRef<{ startX; startY; px; py } \| null>` | `null` | Snapshot do início do arrasto |

---

## 6. Handlers (lógica de comportamento)

### 6.1 Carregar arquivo

```tsx
function loadFile(file: File | undefined) {
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    toast.error('Envie um arquivo de imagem.');
    return;
  }
  const url = URL.createObjectURL(file);
  setUploaded((prev) => {
    if (prev) URL.revokeObjectURL(prev);
    return url;
  });
}
```

Regras:
- Aceita **somente** arquivos cujo `file.type` comece com `image/`;
- Arquivo inválido → `toast.error('Envie um arquivo de imagem.')`;
- URL anterior é revogada com `URL.revokeObjectURL` ao trocar a imagem.

### 6.2 Centralizar

```tsx
function reset() {
  setPos({ x: 50, y: 50 });
  setSize(DEFAULT_SIZE_CQW);
}
```

### 6.3 Arrastar a imagem (pointer events)

```tsx
function onPointerDown(e: React.PointerEvent<HTMLImageElement>) {
  dragRef.current = { startX: e.clientX, startY: e.clientY, px: pos.x, py: pos.y };
  e.currentTarget.setPointerCapture(e.pointerId);
}

function onPointerMove(e: React.PointerEvent<HTMLImageElement>) {
  const drag = dragRef.current;
  const frame = mapRef.current;
  if (!drag || !frame) return;
  const dx = ((e.clientX - drag.startX) / frame.clientWidth) * 100;
  const dy = ((e.clientY - drag.startY) / frame.clientHeight) * 100;
  setPos({
    x: clamp(drag.px + dx, 5, 95),
    y: clamp(drag.py + dy, 5, 95),
  });
}
```

- Em `onPointerUp` e `onPointerCancel`: `dragRef.current = null;`
- A `<img>` deve ter `draggable={false}` (evita conflito com drag nativo).
- Delta é convertido em % da área do mapa (`frame.clientWidth/Height`).
- Posição limitada (clamp) entre **5 e 95%** em ambos os eixos.

---

## 7. CSS embutido — constante `CARD_CSS`

Injetado na página via `<style>{CARD_CSS}</style>`:

```css
.s12-sheet { width: min(860px, 100%); margin-top: 2rem; }
.s12-card {
  container-type: inline-size;
  aspect-ratio: 1161 / 748;
  display: flex; flex-direction: column;
  box-sizing: border-box;
  background: #fff; color: #111;
  padding: 3.44cqw 6.1cqw 3cqw 6.2cqw;
  border: 1px solid rgb(0 0 0 / 0.12);
  font-family: 'Times New Roman', Times, Georgia, serif;
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}

/* Título centralizado (x282..882, y40..75 no original). */
.s12-title { margin: 0; padding: 0; text-align: center;
  font-size: 3cqw; font-weight: 700; letter-spacing: 0; line-height: 1.1; }

/* Linha de campos: rótulo à esquerda e campo à frente, tudo na mesma linha. */
.s12-fields { display: flex; align-items: baseline; margin-top: 2.24cqw; }
.s12-label { font-size: 1.6cqw; font-weight: 400; }
.s12-input {
  flex: 0 0 auto;
  background: transparent; color: #111; border: none;
  border-bottom: 0.17cqw solid #111;
  font-family: inherit; font-size: 1.7cqw; line-height: 1.35;
  margin: 0; padding: 0 0.4cqw 0 0;
  min-width: 0;
}
.s12-input:focus { outline: none; border-bottom-color: #2563eb; }

/* Área do mapa (espaço livre y~130..578, sem moldura). */
.s12-map { position: relative; flex: 1 1 auto; margin-top: 2.24cqw;
  overflow: hidden; touch-action: none; }
.s12-hint { position: absolute; left: 0; right: 0; bottom: 1.1cqw;
  margin: 0; text-align: center;
  font-size: 1.4cqw; color: #555; pointer-events: none; }
.s12-map-img { position: absolute; transform: translate(-50%, -50%);
  cursor: move; user-select: none; }

/* Notas em negrito, ocupando a largura do cartão (y606..684). */
.s12-notes { margin-top: 1.1cqw; font-size: 1.64cqw; font-weight: 700;
  line-height: 2.24cqw; text-align: justify; }
.s12-notes p { margin: 0 0 0.0cqw; }

/* Rodapé: Ss-12-T à esquerda, Impresso no Brasil à direita (y688..705). */
.s12-foot { display: flex; justify-content: space-between; align-items: baseline;
  margin-top: 1.4cqw; font-size: 1.3cqw; }
.s12-foot span { white-space: nowrap; }

@media print {
  @page { size: A4 landscape; margin: 0; }
  body * { visibility: hidden; }
  .s12-sheet, .s12-sheet * { visibility: visible; }
  .s12-sheet { position: fixed; left: 0; top: 0; width: 277mm; margin: 0; }
  .s12-card { border: none; }
  .s12-input { border-bottom: 0.17cqw solid #111; }
  .s12-input:focus { border-bottom-color: #111; }
}
```

### 7.1 Regras de impressão

- `@page`: **A4 paisagem**, margem 0;
- Somente `.s12-sheet` e filhos ficam visíveis (`visibility` — preserva layout);
- Folha fixada em `left: 0; top: 0` com `width: 277mm`;
- Cartão **sem borda**; linhas dos campos pretas (sem azul de foco).

---

## 8. Estrutura JSX da página

Container principal (padrão do projeto):

```tsx
<div className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
```

### 8.1 Cabeçalho

```tsx
<p className="text-sm font-medium text-muted-foreground">Cartão de território</p>
<h1 className="mt-1 text-[1.75rem] font-semibold tracking-tight sm:text-[2rem]">
  Template S-12
</h1>
<p className="mt-1 text-[15px] leading-relaxed text-muted-foreground">
  Preencha os dados, suba a imagem do mapa e arraste para encaixar no cartão. Depois
  imprima ou salve como PDF.
</p>
```

### 8.2 Barra de controles

Container: `mt-6 flex flex-wrap items-end gap-3`

```tsx
<div className="mt-6 flex flex-wrap items-end gap-3">
  {/* Localidade */}
  <div className="grid gap-1.5">
    <Label htmlFor="s12-localidade">Localidade</Label>
    <Input
      id="s12-localidade"
      className="w-56"
      placeholder="Ex.: Centro"
      value={localidade}
      onChange={(e) => setLocalidade(e.target.value)}
    />
  </div>

  {/* Terr. N.º */}
  <div className="grid gap-1.5">
    <Label htmlFor="s12-num">Terr. N.º</Label>
    <Input
      id="s12-num"
      className="w-24"
      placeholder="3"
      value={numero}
      onChange={(e) => setNumero(e.target.value)}
    />
  </div>

  {/* Selecionar / trocar imagem */}
  <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
    <IconImage className="size-4" />
    {uploaded ? 'Trocar imagem' : 'Selecionar imagem'}
  </Button>

  {/* Controle de tamanho − / % / + */}
  <div className="flex items-center gap-1.5">
    <Button
      type="button"
      variant="outline"
      size="icon"
      disabled={!uploaded || size <= MAP_MIN_CQW}
      onClick={() => setSize((s) => Math.max(MAP_MIN_CQW, s - SIZE_STEP_CQW))}
      aria-label="Diminuir mapa"
    >
      −
    </Button>
    <span className="w-14 text-center text-sm tabular-nums text-muted-foreground">
      {size}%
    </span>
    <Button
      type="button"
      variant="outline"
      size="icon"
      disabled={!uploaded || size >= MAP_MAX_CQW}
      onClick={() => setSize((s) => Math.min(MAP_MAX_CQW, s + SIZE_STEP_CQW))}
      aria-label="Aumentar mapa"
    >
      +
    </Button>
  </div>

  {/* Centralizar */}
  <Button type="button" variant="outline" disabled={!uploaded} onClick={reset}>
    <IconUndo className="size-4" />
    Centralizar
  </Button>

  {/* Imprimir */}
  <Button type="button" onClick={() => window.print()}>
    <IconPrinter className="size-4" />
    Imprimir
  </Button>
</div>
```

**Regras de habilitação dos botões:**

| Botão | Desabilitado quando |
| --- | --- |
| `−` (Diminuir) | `!uploaded` **ou** `size <= MAP_MIN_CQW` |
| `+` (Aumentar) | `!uploaded` **ou** `size >= MAP_MAX_CQW` |
| Centralizar | `!uploaded` |
| Imprimir | nunca |
| Selecionar/Trocar | nunca |

### 8.3 Folha do cartão (com drop de imagem)

```tsx
<div
  className="s12-sheet"
  onDragOver={(e) => e.preventDefault()}
  onDrop={(e) => {
    e.preventDefault();
    loadFile(e.dataTransfer.files?.[0]);
  }}
>
  <div className="s12-card">
    <p className="s12-title">Cartão de Mapa de Território</p>

    {/* Localidade ______   Terr. N.º ____  (mesma linha, na frente do rótulo) */}
    <div className="s12-fields">
      <span className="s12-label" style={{ flex: '0 0 12cqw' }}>
        Localidade
      </span>
      <input
        className="s12-input"
        style={{ width: '50.7cqw' }}
        value={localidade}
        onChange={(e) => setLocalidade(e.target.value)}
      />
      <span style={{ flex: '1 1 auto' }} />
      <span className="s12-label" style={{ flex: '0 0 9.3cqw', whiteSpace: 'nowrap' }}>
        Terr. N.º
      </span>
      <input
        className="s12-input"
        style={{ width: '12.6cqw' }}
        value={numero}
        onChange={(e) => setNumero(e.target.value)}
      />
    </div>

    <div ref={mapRef} className="s12-map">
      <p className="s12-hint">Cole o mapa acima ou desenhe o território</p>
      {uploaded ? (
        <img
          src={uploaded}
          alt="Mapa do território"
          draggable={false}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={() => { dragRef.current = null; }}
          onPointerCancel={() => { dragRef.current = null; }}
          style={{ left: `${pos.x}%`, top: `${pos.y}%`, width: `${size}cqw` }}
          className="s12-map-img"
        />
      ) : null}
    </div>

    <div className="s12-notes">
      <p>
        Guarde este cartão no envelope. Tome cuidado para não o manchar, marcar ou dobrar.
        Cada vez que o território for coberto, queira informar disso o irmão que cuida do
        arquivo de territórios.
      </p>
    </div>

    <div className="s12-foot">
      <span>Ss-12-T 6/72</span>
      <span>Impresso no Brasil</span>
    </div>
  </div>
</div>
```

### 8.4 Texto de ajuda (após o cartão)

```tsx
<p className="mt-3 text-sm text-muted-foreground">
  O mapa é solto dentro da área central: arraste para posicionar e use os botões +/− para
  ajustar o tamanho.
</p>
```

### 8.5 Input de arquivo oculto

```tsx
<input
  ref={inputRef}
  type="file"
  accept="image/*"
  className="hidden"
  onChange={(e) => {
    loadFile(e.target.files?.[0]);
    e.target.value = '';
  }}
/>
```

---

## 9. Ordem final dos elementos (template do componente)

```tsx
export default function TemplateCardPage() {
  // ... refs e estado
  // ... handlers (loadFile, reset, onPointerDown, onPointerMove)

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
      <style>{CARD_CSS}</style>
      {/* 1. cabeçalho da página */}
      {/* 2. barra de controles */}
      {/* 3. folha .s12-sheet com .s12-card */}
      {/* 4. texto de ajuda */}
      {/* 5. input type="file" oculto */}
    </div>
  );
}
```

---

## 10. Checklist de aceite (critérios para considerar a recriação correta)

- [ ] Rota `/territories/template` exige login + permissão `territory:update`.
- [ ] Menu **Territórios → Template** visível apenas com `territory:update` e
      marcado como ativo na rota.
- [ ] Cabeçalho com eyebrow `Cartão de território`, h1 `Template S-12` e
      subtítulo descritivo (PT-BR).
- [ ] Toolbar com: Localidade (w-56), Terr. N.º (w-24), Selecionar/Trocar
      imagem, −/%/+ , Centralizar e Imprimir.
- [ ] Enviar arquivo não-imagem → `toast.error('Envie um arquivo de imagem.')`.
- [ ] Soltar imagem (`drop`) na folha do cartão também carrega o arquivo.
- [ ] Imagem aparece centrada (default 50/50, 36cqw) dentro da área do mapa,
      sem moldura.
- [ ] Arrastar posiciona a imagem com limites de 5–95%; `touch-action: none`
      permite arrastar no touch.
- [ ] +/− ajusta tamanho em passos de 2, entre 8 e 80; botão Centralizar volta
      para 50/50 e 36%.
- [ ] Textos do cartão exatos: título `Cartão de Mapa de Território`, nota de
      guarda do cartão, rodapé `Ss-12-T 6/72` e `Impresso no Brasil`.
- [ ] `window.print()` produz A4 paisagem, margem 0, apenas cartão visível
      (277mm), sem borda.
- [ ] Medidas do cartão em `cqw` (aspect-ratio 1161/748) — fiel ao original.