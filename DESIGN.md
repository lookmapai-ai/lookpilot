# LookPilot — Documento de Design

> Copiloto de compras de moda. Antes de comprar, responde: **esta peça vale o preço? Vai durar? É boa para viajar?**

Última atualização: 2026-07-17 · **Em transição para o sistema visual "Apple White"** (ver §7)

---

## 1. Princípio central: **uma só superfície de resultado**

A regra que governa toda a arquitetura de UI:

> **As duas interfaces (popup e floating card) nunca coexistem mostrando resultado. Só uma de cada vez.**

O **floating card** (injetado na página da loja) é a superfície primária de resultado.
Numa **página de produto** o popup nem chega a abrir: o `background.js` troca o popup por `action.onClicked` (clique-direto), o card aparece na hora e há **uma caixa só**. O popup só abre quando tem o que dizer — onboarding, página errada, ou fallback manual.\n\nO **popup** é apenas uma **camada de disparo** — nunca mostra o resultado da análise.

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

Identidade visual do card de resultado (migrado para Apple White — §7):
- Tipografia: **`-apple-system`/SF Pro** no veredito e score (sem Google Fonts → elimina o problema de CSP da Reserved).
- Fundo `#FFFFFF`, borda `#E8E8ED`, CTA "Ver análise completa →" em tinta `#1D1D1F` (branco 16.83:1 ✓). Magenta `#FF009D` só no wordmark.
- Veredito colorido pelo semáforo (`buyVerdict`), mantido por legibilidade.

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
2. Clica no ícone da extensão  →  o background já tirou o popup desta aba
   (só em domínio de moda + URL de produto + onboarding feito), então o clique
   dispara action.onClicked em vez de abrir o popup
3. background envia { action:'scanPage' } ao content.js  →  SEM popup
4. content.js mostra o LOADING card na página
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

> **Sistema "Apple White" (2026-07-17).** Landing e extensão partilham agora a mesma paleta (§7): branco, tinta `#1D1D1F`, `-apple-system`, com o magenta `#FF009D` reduzido a acento de marca (wordmark, ícone, foco). A migração da extensão foi aplicada nesta data — ver §7.2.

| Asset | Uso | Estado |
|-------|-----|--------|
| `logo/logo-lookpilot.svg` | Wordmark "**Look**Pilot" (Look tinta + Pilot #EF23A1) | Mantido — magenta é o acento de marca |
| `logo/lookpilot-mini.svg` | Ícone "lp" — tile #FF009D + monograma branco | **Gerado** por `logo/gerar-icones.py` |
| `icon16/48/128.png` | Ícones da extensão na toolbar | **Gerados** por `python3 logo/gerar-icones.py`. Não editar à mão |

### Ícone da toolbar

Redesenhado a 2026-07-24. O anterior tinha dois defeitos de desenho: a perna do
"p" descia até y=232 num quadrado de 200 — ficava **fora** do quadrado,
flutuando em transparência (invisível em barra clara, solta em barra escura) —
e a haste do "l" tinha 8,5% da largura, que a 16px vira 1,4px e evapora.

O desenho agora é geométrico e cada tamanho tem o seu peso, porque um traço
elegante a 128 desaparece a 16. O vazio do "p" tem um piso fixo (não acompanha
o peso), senão fecha e a letra vira um borrão — foi o que a comparação a 16px
mostrou.

O tile continua **magenta**: na barra do navegador o ícone é ativo de marca e
disputa atenção com uma dúzia de outros, e a cor é o que o distingue. Dentro do
produto vale o sistema Apple White (tinta preenche, magenta acentua).

Nota: o wordmark `logo-lookpilot.svg` inclui um `<rect fill="white">` de fundo que é **removido** ao embutir inline nos cards/popup.

---

## 7. Paleta de cores

### 7.1 Sistema-alvo: **Apple White** (da landing v15)

Extraído de `landing/analise-v15.html`. **9 cores, uma superfície.** Contrastes medidos (script em scratchpad, 2026-07-17):

| Papel | Hex | Sobre branco | Sobre superfície | Uso |
|-------|-----|--------------|------------------|-----|
| Tinta | `#1D1D1F` | 16.83:1 ✓ | 15.46:1 ✓ | Texto principal, veredito, score, botão primário (fundo) |
| Texto secundário | `#6E6E73` | 5.07:1 ✓ | 4.66:1 ✓ | Descrições, subtítulos — **mín. para texto corrido** |
| Texto terciário | `#86868B` | 3.62:1 ✗ | 3.33:1 ✗ | ⚠️ **Falha AA para texto normal.** Só micro-labels 12–13px uppercase (eyebrows, meta). Não usar em texto essencial |
| Link | `#0066CC` | 5.57:1 ✓ | — | Links |
| Link hover | `#004499` | 9.18:1 ✓ | — | Hover de link |
| Erro | `#D70015` | 5.38:1 ✓ | — | Mensagens de erro (ex: email inválido) |
| Branco | `#FFFFFF` | — | — | Fundo base, texto sobre botão primário (16.83:1 ✓) |
| Superfície | `#F5F5F7` | — | — | Cards, blocos, campos de input |
| Divisória | `#E8E8ED` | — | — | Bordas sutis |

**Raios:** `999px` (pílulas/CTAs), `28px` (cards grandes), `18/16/14px` (miniaturas, inputs).
**Tipografia:** `-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Helvetica, Arial, sans-serif`. **Sem Google Fonts** → elimina o problema de CSP do DM Serif (§2.1) e o fallback para Georgia.

> **⚠️ Alerta de contraste herdado da v15:** `#86868B` a 12px é o padrão dos eyebrows na landing e **reprova AA para texto normal** (3.62:1). Aceitável só por serem labels decorativos curtos; ao migrar a extensão, não replicar essa cor em texto informativo.

**Decisões (resolvidas 2026-07-17, ao aplicar a Apple White à extensão):**
- **Magenta `#FF009D`** → **fica como acento único de marca**, não como cor de fundo. Vive só no **wordmark** (letras "pilot"), no **ícone da toolbar**, no **badge de scan** (`setBadge('…','#FF009D')`) e nas **bordas de foco** de input. Não se redesenhou nenhum asset. Os **CTAs deixaram de ser magenta e passaram a tinta** `#1D1D1F` com texto branco (16.83:1 ✓) — o botão primário da v15. Motivo: branco sobre magenta é só 3.66:1 (reprova AA), tinta resolve e alinha com a v15.
- **Semáforo do veredito** → **mantido.** Todos os tons passam AA sobre o branco novo (medido: verde 7.13 · âmbar 5.02 · vermelho 5.44). A pureza da v15 não valia perder a legibilidade que o relatório de julho elogiou.
- **Acentos por bloco** (Travel violeta, cert verde, calor laranja) → **mantidos.** Passam AA sobre `#F5F5F7` (6.4–8.0:1) e preservam a taxonomia visual do card.

### 7.2 Estado da migração

**Aplicada à extensão a 2026-07-17** (`content.js`, `popup.html/js`, `shared.js`). Paleta reduzida de **54 → ~35 cores**. A rampa quente antiga foi mapeada para a Apple White: `#FAFAF8`→`#FFFFFF` · `#E0DBD4`→`#E8E8ED` · `#F0EDE8`→`#F5F5F7` · `#1E1A16`→`#1D1D1F` · `#5A5450`/`#6B6460`→`#6E6E73` · `#8A8078`→`#86868B`. Dívida limpa: cinzas soltos (`#333`/`#555`/`#666`/`#777`/`#999`/`#1a1a1a`) colapsados na rampa; `#ff1493` (deep pink solto) unificado em `#FF009D`. Tipografia: DM Serif Display → `-apple-system` (elimina o `@import` do Google Fonts e o problema de CSP em lojas como a Reserved).

**Verificado:** 120 testes passam; popup renderizado (onboarding + product-ready) com fundo `rgb(255,255,255)`, tinta `rgb(29,29,31)`, botões tinta, wordmark com "pilot" magenta. O **card injetado** (`content.js`) não foi renderizado standalone — só validado por sintaxe e inspeção do código.

---

## 8. URL de destino (landing futura)

`buildAnaliseURL()` (content.js) e `buildAnaliseURLFromStorage()` (popup.js) constroem:

```
https://lookmap.ai/analise?score=...&verdict=...&qualidade=...&durabilidade=...
  &conforto=...&versatilidade=...&manutencao=...&custo=...&viagem=...
  &fibras=Poliéster:93,Elastano:7&nome=...&imagem=...&galeria=<url1>|<url2>|<url3>
  &preco=...&moeda=...&loja=...&confianca=...&origem=<url-produto>
```

**A página de resultado consome estes params** (repo `lookmap`, `landing/index.html`, portada de `LookMap.html` do Claude design). Ligações:
- `score`→nota (countup) · `verdict`→título (lê o param; só recalcula se ausente — card e página deixaram de discordar) · `nome`/`loja`/`preco`/`moeda`/`imagem`→hero e miniatura.
- `fibras` + 7 dimensões → as 4 respostas, geradas por `landing/cards.js` a partir de `fibers.json`+`blends.json`. Sem params, cai no exemplo (suéter de lã).
- `galeria` (2–3 fotos por `|`, via `getGallery` em content.js) → imagens dos 4 cartões.
- Guardar → histórico em `localStorage`. Sem backend, tudo via query string.

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
