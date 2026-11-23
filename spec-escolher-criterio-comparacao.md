# Spec — Escolher o critério que valoriza (na comparação)

**Status:** proposta · **Data:** 2026-11-23 · **Área:** página de resultado → "Comparar"
**Arquivos tocados (previsão):** `landing/runtime.js`, `landing/v15-source.dc.html` (→ build `analise.html`)

---

## 1. Problema

A comparação hoje assume **uma ordem de importância universal**: as barras saem da maior diferença para a menor, e num agasalho o calor é promovido ao topo. É uma boa heurística — mas pode estar errada para a pessoa à frente. Quem viaja muito valoriza "viagem" e "manutenção" acima do que o produto supõe. O veredito "qual levo" **é subjetivo**, e hoje o produto decide por um critério fixo.

## 2. Princípios (inegociáveis)

- **A resposta vem primeiro.** Nada de tela de configuração antes de responder. O padrão continua respondendo sozinho.
- **Muda a história dentro, não o arco.** A escolha reenquadra a mesma comparação; não cria uma peça nova nem uma etapa nova.
- **O score /100 não muda.** Ele é a leitura objetiva da etiqueta. A escolha mexe só na **narrativa, na ordem das barras e no veredito** "qual levo".
- **Voz pt-BR, nada inventado.** Reusar as frases/dimensões que já existem.

## 3. Interação (versão grátis — MVP)

1. A comparação abre como hoje: cabeçalhos das duas peças → **A RESPOSTA** → barras.
2. Logo abaixo da resposta, um convite opcional:
   > **O que mais importa nesta peça pra você?**
   > `[Calor] [Qualidade] [Durabilidade] [Conforto] [Custo-benefício] [Versatilidade] [Manutenção] [Viagem]`
   (chips tocáveis; só aparecem os critérios que **foram medidos nas duas peças**.)
3. Ao tocar **1** chip (máx. 2):
   - A **resposta se reescreve liderando por aquele critério**: *"Se o que importa é viagem: a Peça 1 ganha — seca rápido e não amassa."*
   - As **barras reordenam** com o critério escolhido no topo.
   - O **veredito "qual levo" pode virar**, e isso é honesto (depende do que você valoriza).
   - O chip fica marcado; **tocar de novo desmarca** e volta ao padrão.
4. Sem escolha = **comportamento atual** (nada quebra, nada fica vazio/frio).

**Acessibilidade:** os chips são botões com `aria-pressed`; ao escolher, a resposta reescrita é anunciada (`aria-live="polite"`). Alvo de toque ≥ 44px. Contraste AA (atenção ao mesmo ponto do relatório de 2026-11-23: usar tokens ≥ 4,5:1).

## 4. Grátis vs. Premium

| | Grátis (pra sempre) | Premium |
|---|---|---|
| Escolher **1 critério** e reenquadrar *esta* comparação | ✅ | ✅ |
| **Perfil de prioridades** lembrado ("você sempre valoriza viagem") | — | ✅ |
| Comparar **3+ peças** | — | ✅ |
| **Armário sincronizado** entre aparelhos (hoje é só neste navegador) | — | ✅ |

**Por quê essa linha:** evita o trap "dar grátis e depois cobrar o mesmo" (gera churn). O gesto único fica grátis pra sempre e puxa engajamento; o que vira pago é **persistência e profundidade**.

**"Grátis num primeiro momento":** se quiser soltar a persistência grátis por um período de validação, **anunciar desde já** que vira premium — nunca tirar em silêncio.

## 5. Instrumentação (dia 1 — condição de lançamento)

Medir é o que decide se o recurso merece paywall *e* já é dado de preferência real:

- `comparou_pecas` (já existe)
- `escolheu_criterio` { criterio, virou_veredito: bool }
- `desmarcou_criterio`
- **Métricas-chave:** % das comparações em que alguém escolhe critério · distribuição dos critérios escolhidos · % em que a escolha **muda a peça vencedora**.

## 6. Implementação (onde mexer)

A lógica já está quase toda lá — isto **generaliza** uma exceção existente:

- `comparar(a, b)` em `runtime.js` já tem o caso `ehAgasalho` que **promove `calor` ao topo**. Generalizar para um `criterioEscolhido` opcional que vai pro topo da ordenação.
- `respostaDaComparacao(a, b, r, …)` passa a **liderar a primeira frase pela dimensão escolhida** (reusando as frases por dimensão que já existem).
- Novo estado em memória `criterioSelecionado` (espelho do `selecao` atual), com `render()` ao mudar.
- Template (`v15-source.dc.html`): bloco de chips depois de "A RESPOSTA", via `<sc-for>` sobre as dimensões medidas.
- **Fora do MVP:** persistência (localStorage/premium), 3+ peças, sync.

## 7. Fora de escopo (MVP)

- Pesar/ordenar os 8 ao mesmo tempo, sliders, grade de config antes da resposta.
- Mudar o score /100.
- Perfil persistente (é a camada premium da Fase 2).

## 8. Riscos

- **Bait-and-switch** → mitigado: a linha premium é persistência, não o gesto.
- **Escolha vazia / tela fria** → mitigado: o padrão já responde sem escolha.
- **Escolha muda o vencedor e confunde** → a frase deixa explícito o "se o que importa é X", então a virada fica justificada, não arbitrária.

## 9. Faseamento

- **Fase 1 (grátis):** pick de 1 critério + reescrita + reordenação + instrumentação.
- **Fase 2 (premium):** perfil de prioridades persistente · comparar 3+ · armário sincronizado.

---

*Relacionados: storytelling (muda a história, não o arco), escala de veredito, comparação (arquivos/pipeline) — ver memória do projeto.*
