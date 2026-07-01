# LookPilot — Documento de Design

> Copiloto de compras de moda. Antes de comprar, responde: **esta peça vale o preço? Vai durar? É boa para viajar?**

Última atualização: 2026-06-27

---

## 1. Princípio central: **uma só superfície de resultado**

A regra que governa toda a arquitetura de UI:

> **As duas interfaces (popup e floating card) nunca coexistem mostrando resultado. Só uma de cada vez.**

O **floating card** (injetado na página da loja) é a superfície primária de resultado.
O **popup** (ícone da extensão na toolbar) é apenas uma **camada de disparo** — nunca mostra o resultado da análise.

Decisão validada com as heurísticas `ux-ui-verification`: o utilizador está a navegar na loja, não no popup. O resultado deve aparecer no contexto onde a decisão de compra acontece.

---

## 2. Duas superfícies, dois papéis

### 2.1 Floating card (`content.js`) — superfície primária

Injetado no canto inferior direito da página (`position:fixed;bottom:20px;right:20px`).
Reposiciona-se automaticamente (`avoidCartButton`) se sobrepuser o botão "adicionar ao carrinho" da loja.

Três estados visuais:

| Estado | Quando | Conteúdo |
|--------|--------|----------|
| **Loading** | Durante o scan (`showScanningCard`) | Logo LookPilot + ícone scan com animação `pulse` + "A analisar a peça…" |
| **Resultado** | Composição encontrada (`injectCard`) | Buy Score /100, veredito, dimensões, Travel Score, fibras, botões Partilhar / Ver análise completa |
| **Não encontrado** | Scan falha (`injectEmptyCard`) | Mensagem para inserir composição manualmente via popup |

Identidade visual do card de resultado:
- Tipografia de display: **DM Serif Display** (itálico) no veredito e score, via `@import` do Google Fonts. Fallback `Georgia,serif` em lojas com CSP estrita que bloqueiam o Google Fonts (ex: Reserved).
- Cor de marca: **#FF009D** (rosa)
- Fundo: `#FAFAF8`, borda `#E0DBD4`

### 2.2 Popup (`popup.html` + `popup.js`) — camada de disparo

Estados (geridos por `showOnly(id)`):

| Tela | Função |
|------|--------|
| `onboarding` | Primeira utilização (`isFirstRun`) — 3 passos + "Vamos analisar!" |
| `product-ready` | Entrada mínima: logo + **"Analisar esta peça"** + link "Ver histórico" (oculto se vazio) |
| `app` | Fallback manual + histórico (só quando o scan automático falha) |
| `wrong-context` | Página não-produto (`chrome://`, listagem, etc.) |

O popup **nunca renderiza o resultado da análise**. Ao disparar o scan, fecha-se.

---

## 3. Fluxo principal (happy path)

```
1. Utilizador abre página de produto numa loja
2. Clica no ícone da extensão  →  popup abre em "product-ready"
3. Clica "Analisar esta peça"
4. popup envia { action:'scanPage' } ao content.js  →  popup fecha (~80ms)
5. content.js mostra o LOADING card na página
6. (delay 50ms para o browser pintar o loading)
7. tryScan() lê a composição + retries progressivos (400/1000/2000ms para SPAs)
8. Sucesso  →  loading é substituído pelo card de RESULTADO
   Falha    →  loading é substituído pelo card "não encontrado"
```

### Reabrir o ícone com card já visível

```
checkContext() vê fqa-last-result com url === tab atual
  →  popup fecha imediatamente (card já está na página, não duplica)
```

### Fechar o card

```
removeCard() remove o card E limpa fqa-last-result do storage
  →  próximo clique no ícone volta a mostrar "Analisar esta peça"
```

---

## 4. Estado partilhado (`chrome.storage.local`)

| Chave | Conteúdo | Escrito por | Lido por |
|-------|----------|-------------|----------|
| `fqa-last-result` | `{ url, fibers, scores, buyScore, verdictLabel, verdictColor }` | content.js (ao injetar card) | popup.js (`checkContext`) |
| `fqa-history` | Array (máx. 20) de `{ fibers, score, grade, date }` | content.js + popup.js | popup.js (`renderHistory`) |

`fqa-last-result` é a **fonte de verdade** sobre "existe um card na página para esta URL?".
Limpo no `removeCard()` para que fechar o card reabra o popup normal.

---

## 5. Sistema de scores

- **`scores.overall`** (0–100): score geral não-ponderado das dimensões.
- **`buyScore`** (0–100): score principal mostrado, ponderado pelo tipo de peça (`garmentType`). É este que o card e o popup usam — evita a discrepância 67-vs-73 que existia quando as duas superfícies usavam métricas diferentes.

Dimensões (cada 0–10 no display): Qualidade, Durabilidade, Conforto, Versatilidade, Manutenção, Custo-benefício.
Extra: **Travel Score** (destacado se ≥72), **Calor** (só em peças de inverno, calor ≥45).

---

## 6. Identidade de marca

| Asset | Uso |
|-------|-----|
| `logo/logo-lookpilot.svg` | Wordmark completo "**Look**Pilot" (Look preto + Pilot #EF23A1). Usado no header do popup e nos cards do content.js. |
| `logo/lookpilot-mini.svg` | Ícone "lp" — quadrado rosa #FF009D + letterform branca. Fonte dos ícones da toolbar. |
| `icon16/48/128.png` | Ícones da extensão na toolbar, gerados a partir do mini SVG. |

Nota: o wordmark `logo-lookpilot.svg` inclui um `<rect fill="white">` de fundo que é **removido** ao embutir inline nos cards/popup (senão tapa o fundo bege).

---

## 7. Paleta de cores

### Marca
| Cor | Hex | Uso |
|-----|-----|-----|
| 🟣 Rosa primário | `#FF009D` | **Token único de marca.** CTAs, "Pilot" no wordmark, score, links, bordas de destaque, fundo do ícone da toolbar |
| 🟣 Rosa hover | `#D6007F` | Estado hover do botão primário (tom mais escuro do primário) |
| ⚫ Tinta | `#1E1A16` | "Look" no wordmark, texto principal |

### Superfície (tons quentes neutros)
| Cor | Hex | Uso |
|-----|-----|-----|
| Fundo | `#FAFAF8` | Fundo de cards e popup |
| Borda | `#E0DBD4` | Bordas de cards, divisórias |
| Borda clara | `#F0EDE8` | Divisória no header do popup |
| Texto secundário | `#5A5450` (7.1:1) · `#6B6460` (5.6:1) | Descrições, labels, conclusão — **mín. para texto** |
| Texto terciário | `#8A8078` (3.7:1) | Apenas unidades decorativas (`/100`) — não usar em texto essencial |
| Decorativo | `#CCC` | Só ícones com hover (ex: × remover) |

> Contraste AA (4.5:1) foi auditado. Cinzas claros `#9B9390`/`#888`/`#BBB` foram removidos de texto significativo (passavam a `#6B6460`).

### Veredito (semáforo) — **dois papéis, dois tons**
O semáforo tem uma versão **viva** (barras/badges/fundos) e uma **escura acessível** (texto), porque os vivos não atingem 4.5:1 como texto sobre fundo claro.

| Faixa | Texto (AA ✓) | Barra/fill (vivo) |
|-------|--------------|-------------------|
| Bom | 🟢 `#166534` (6.8:1) | `#16A34A` |
| Médio | 🟠 `#B45309` (4.8:1) | `#D97706` |
| Fraco | 🔴 `#C0392B` (5.2:1) | `#DC2626` |

`buyVerdict`/`verdict` (texto) usam os tons escuros. `scoreColor`/`scoreBar` (barras) usam os vivos.

### Acentos por bloco (fundos suaves + texto a condizer)
| Bloco | Fundo | Texto |
|-------|-------|-------|
| ✈️ Travel Score | `#F8F4FF` | `#6B21A8` / `#7E22CE` |
| A mistura | `#F5F3FA` | `#6B5B95` |
| ⭐ Modificador qualidade | `#FDF6E3` | `#7A5C00` |
| ✓ Certificação | `#E1F5EE` | `#0F6E56` |
| 🔥 Calor | `#FFF4ED` | `#9A3412` / `#B45309` (barra `#F59E0B`→`#DC2626`) |

### Barra de progresso (composição manual, popup)
Usa o **mesmo conjunto semáforo** do veredito (unificado):
| Estado | Cor |
|--------|-----|
| Completo (=100%) | 🟢 `#16A34A` |
| Incompleto (<100%) | 🟠 `#D97706` |
| Excesso (>100%) | 🔴 `#DC2626` |

O semáforo `#16A34A` / `#D97706` / `#DC2626` é o **token único** para verde/âmbar/vermelho em toda a UI (veredito, histórico, barra de progresso, erros de input). A única exceção é o gradiente de **Calor** (`#F59E0B`→`#DC2626`), deliberadamente quente.

---

## 8. URL de destino (landing futura)

`buildAnaliseURL()` (content.js) e `buildAnaliseURLFromStorage()` (popup.js) constroem:

```
https://lookmap.ai/analise?score=...&verdict=...&qualidade=...&durabilidade=...
  &conforto=...&versatilidade=...&manutencao=...&custo=...&viagem=...
  &fibras=Poliéster:93,Elastano:7&origem=<url-produto>
```

Página ainda **não existe** — os params já vão preparados para quando a landing for criada (sem backend, tudo via query string). O botão "Ver análise completa →" no card aponta para aqui.

---

## 9. Robustez / guards

- content.js **não corre** em `file://` nem `chrome-extension://` (evita injeção em SVGs locais e páginas internas).
- `MutationObserver` usa `document.body || document.documentElement` como fallback (páginas sem `<body>`); só reage a mudança de **path** (não hash/query) e nunca durante um scan ativo.
- Retries progressivos no scan (7 tentativas até 3.5s) para SPAs (ASOS, Zara, Reserved) que carregam a composição tarde via JS.
- O loading card é sempre removido antes de mostrar resultado/erro (guard via `.__fqa-spin`), nunca fica infinito.
- **Composição atrás de modal/acordeão** (Reserved, Mango): `autoExpandAccordions` clica o gatilho de composição — match por texto que contém `composi*` OU frase exacta `material e cuidados`; nunca clica `<a>`/links (evita navegação); prioriza `<button>` sobre `<div>`; visibilidade via `getClientRects()` (não `offsetParent`, que é `null` em `position:fixed`); re-tenta até 4× até o modal abrir; `closeCompositionModal` fecha o modal depois de ler (controlos de fecho específicos, `<button>` genérico só se não houver outro).
- `hasComposition` (fallback para `body.innerText`) exige `%` + fibra na **mesma linha** e exclui palavras de desconto (`desconto`, `off`, `selecione`…) — evita falsos positivos de "50% de desconto".
- `detectCategory` usa limites de palavra (não `includes`) — "baggy" não vira "bag".

---

## 10. Ficheiros principais

| Ficheiro | Responsabilidade |
|----------|------------------|
| `content.js` | Scan da página, parsing de composição, injeção dos 3 estados do card, share card (canvas) |
| `popup.html` / `popup.js` | Camada de disparo, onboarding, fallback manual, histórico |
| `shared.js` | `calcScores`, `buyScore`, `buyVerdict`, `verdict`, `warmthScore`, textos |
| `categories.js` | Deteção de categoria, sinais por tipo de peça |
| `strings.js` | i18n (PT/EN) via `t(key)` |
| `*.json` | Bases de dados: fibras, blends, modificadores |
| `tests/run.js` | 112 testes (parsing, scoring, comportamentos congelados, formatos de loja) |

---

## 11. Pendências conhecidas

- [ ] Guardar nome do produto nas entradas de histórico
- [ ] Criar a landing `lookmap.ai/analise` que consome os URL params
