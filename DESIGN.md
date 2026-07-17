# LookPilot — Documento de Design

> Copiloto de compras de moda. Antes de comprar, responde: **esta peça vale o preço? Vai durar? É boa para viajar?**

Última atualização: 2026-07-17 · **Em transição para o sistema visual "Apple White"** (ver §7)

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

> ⚠️ **Em transição (2026-07-17).** A landing de resultados foi redesenhada para o sistema **"Apple White"** (v15, ver §7). A extensão ainda usa o sistema quente/magenta antigo. A decisão é migrar a extensão para a Apple White; esta seção e a §7 descrevem o **alvo**, com o sistema antigo preservado como "atual (a migrar)". Enquanto a migração não acontece, o código da extensão é a fonte de verdade do que está no ar.

| Asset | Uso | Estado |
|-------|-----|--------|
| `logo/logo-lookpilot.svg` | Wordmark "**Look**Pilot" (Look tinta + Pilot #EF23A1) | Magenta — **decisão em aberto** (ver §7) |
| `logo/lookpilot-mini.svg` | Ícone "lp" — quadrado #FF009D + letterform branca. Fonte dos ícones da toolbar | Magenta — **decisão em aberto** |
| `icon16/48/128.png` | Ícones da extensão na toolbar | **Gerados à mão**, não pelo `build.py` (que só recalcula scores). Trocar a cor de marca implica redesenhá-los fora do código |

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

**🔶 Decisões em aberto (dependem de ver a v15 renderizada):**
- **Magenta `#FF009D`** — a Apple White não o tem. Sai de vez, ou fica como único acento de marca (CTAs, wordmark, ícone)? Tirar exige redesenhar wordmark + ícone da toolbar à mão.
- **Semáforo do veredito** — a v15 não tem semáforo (veredito é tinta preta). Manter a cor dá legibilidade (elogiada no relatório de julho); tirar dá pureza. Decidir.
- **Acentos por bloco** (Travel violeta, certificação verde, calor laranja) — a Apple White tem só `#F5F5F7`. Achatar custa a taxonomia visual do card.

### 7.2 Sistema atual da extensão (a migrar)

Ainda no código (`content.js`, `popup.html/js`, `shared.js`). São **54 cores hex distintas** — metade não documentada. Dívida a limpar na migração: `#333`, `#555`, `#666`, `#777`, `#999`, `#1a1a1a`, `#f5f5f5`, `#fafafa` e um `#ff1493` (deep pink) solto que **não** é o token de marca `#FF009D`.

**Marca:** rosa primário `#FF009D` · hover `#D6007F` · tinta `#1E1A16`.
**Superfície quente:** fundo `#FAFAF8` · borda `#E0DBD4` · divisória `#F0EDE8` · texto `#5A5450` (7.1:1) / `#6B6460` (5.6:1) · terciário `#8A8078` (3.7:1).

**Semáforo (dois tons):** texto `#166534` / `#B45309` / `#C0392B` (escuros, AA ✓) · barras `#16a34a` / `#d97706` / `#dc2626` (vivos). `buyVerdict`/`verdict` usam texto; `scoreColor`/`scoreBar` usam barras.

**Acentos por bloco:** Travel `#F8F4FF`+`#6B21A8`/`#7E22CE` · mistura `#F5F3FA`+`#6B5B95` · qualidade `#FDF6E3`+`#7A5C00` · certificação `#E1F5EE`+`#0F6E56` · calor `#FFF4ED`+`#9A3412` (gradiente `#F59E0B`→`#DC2626`).

---

## 8. URL de destino (landing futura)

`buildAnaliseURL()` (content.js) e `buildAnaliseURLFromStorage()` (popup.js) constroem:

```
https://lookmap.ai/analise?score=...&verdict=...&qualidade=...&durabilidade=...
  &conforto=...&versatilidade=...&manutencao=...&custo=...&viagem=...
  &fibras=Poliéster:93,Elastano:7&origem=<url-produto>
```

A landing agora existe (`landing/analise-v15.html`, sistema Apple White — §7), mas ainda **não consome estes params**: o template recalcula o próprio veredito a partir do `score` em vez de ler `verdict=`, o que faz card e landing discordarem no mesmo score. Reconciliar isto é a decisão de vereditos ainda em aberto. O botão "Ver análise completa →" no card aponta para aqui; sem backend, tudo via query string.

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
