# Página de análise (lookmap.ai/analise)

Destino do botão "Ver análise completa →" do card da extensão.

## Arquivos

| Arquivo | O que é |
|---|---|
| `v15-source.dc.html` | **Fonte do design**, puxado do projeto claude.ai/design ("Prompt landing LookMap" → `LookPilot Experiencia v15 Apple White.dc.html`). Não editar à mão: é a cópia do design. |
| `build.py` | Traduz o fonte para HTML normal. **Não redesenha nada** — copia marcação e estilos verbatim e só converte `sc-if`/`sc-for`/`{{ }}`/`style-hover` para HTML+atributos de binding. |
| `runtime.js` | Dá vida à página: lê os parâmetros da URL que a extensão envia, preenche os bindings e reproduz as animações (reveal, parallax, contagem, scan da etiqueta). |
| `analise.html` | **Gerado** por `build.py`. É o arquivo a publicar. |
| `images/` | Wordmarks. As fotos do produto vêm da URL (a extensão raspa a galeria da loja). |

## Baixar extensão

O botão entrega `lookpilot-extensao.zip`, gerado por `./empacotar.sh` a partir
dos arquivos que a extensão carrega em runtime (ficam de fora os `.json`, que
são insumos do `build.py`, os testes e a própria landing). O `servir.sh` chama
o empacotador sozinho, então em desenvolvimento o zip nunca fica velho.

⚠️ **Antes de publicar, rode `./empacotar.sh`** — senão o site serve uma versão
antiga da extensão. O zip é artefato de build e não vai para o git.

Baixar sozinho não basta enquanto a extensão não está na loja do Chrome: a
pessoa precisa dos 3 passos para carregar a pasta. Por isso o botão faz as duas
coisas — entrega o arquivo **e** abre o modal com as instruções. O botão da
página de análise leva para `/?baixar=1`, que já chega baixando.

## Ver funcionando com a extensão

```sh
cd landing && ./servir.sh
```

Depois: recarregar a extensão em `chrome://extensions`, abrir a página de uma
peça numa loja, analisar, e clicar em "Ver análise completa →" no card.

O destino do botão é controlado por `LOOKMAP_DEV` no `content.js` **e** no
`popup.js` (mantenha os dois iguais):

| `LOOKMAP_DEV` | Abre |
|---|---|
| `true` (padrão hoje) | `http://localhost:8777/analise.html` |
| `false` | `https://lookmap.ai/analise` — só depois de publicar a página lá |

## Links que saem da página

O design aponta três links para "LookMap Landing Extensao" — a página de
marketing. Esse arquivo só existe dentro da ferramenta de design, mas o destino
continua sendo o mesmo, e o `build.py` reescreve-os relativos à raiz
(`MKT_URL = "/"`), para funcionarem em qualquer domínio:

| Elemento | Vai para |
|---|---|
| Logo do cabeçalho | `/` — home do marketing |
| "Como funciona" (rodapé) | `/#como` |
| "Voltar" (Minhas peças) | página anterior, via histórico (`href="/"` fica como reserva se o JS falhar) |

`index.html` é a **home de marketing**, gerada do design
`LookMap Landing Extensao` do projeto no Claude — o mesmo processo da página de
análise. As duas páginas saem do mesmo `build.py`.

## Medir se as pessoas voltam

`metrica.js` grava no navegador de quem usa: análises vistas, peças salvas,
sessões (30 min sem atividade = nova) e dias desde a primeira vez. **Só
contagens** — nada sobre qual peça, loja, preço ou score, para não haver dado
pessoal.

A pergunta que ele responde é uma só: **as pessoas voltam e salvam a segunda
peça?** É ela que decide se a tese do histórico ("comparar antes da próxima
compra") se sustenta — e, portanto, se vale construir conta e backend.

Como ler, hoje: `diagnostico.html`. A pessoa abre e diz o que vê (serve os
primeiros utilizadores). **Os números não chegam sozinhos** — não há servidor.
Quando publicar, descomentar `enviar()` em `metrica.js` e apontar para um
endpoint; o payload já é anônimo.

## Minhas peças

O botão "Minhas peças" no cabeçalho troca para a vista de peças salvas. Salvar
é o botão no fim do relatório; as peças ficam no `localStorage` do navegador
(chave `lookpilot-guardadas`, máx. 24), como o próprio design promete —
"salvas neste navegador". Clicar num cartão reabre aquela análise, porque se
guarda a query string inteira junto.

Não há backend: limpar os dados do navegador apaga as peças salvas.

## Regenerar

```sh
cd landing && python3 build.py
```

Se o design mudar no claude.ai/design, voltar a puxar `v15-source.dc.html` e rodar o build.

## Parâmetros consumidos

`score` · `verdict` (usado tal como o card o enviou — não se recalcula, senão as
duas superfícies se contradizem) · `nome` · `loja` · `preco` · `moeda` ·
`origem` · `imagem` · `galeria` (fotos separadas por `|`, distribuídas pelos 4
capítulos) · `fibras` (vira a composição da etiqueta) · `viagem` (0–100, define
o selo de viagem) · `confianca`.

**A história da peça** — conhecimento que só a extensão tem, e sem o qual os
capítulos caem sempre nas mesmas frases:

| Parâmetro | O que carrega | Onde entra |
|---|---|---|
| `mistura` | o efeito da fibra secundária naquela dose (`blends.json`) | ato 01 |
| `modnome` / `modexplica` | modificador detectado na página (ex.: Supima) | ato 01 |
| `fibra` | nome da fibra principal | atos 02, 03 e selo de viagem |
| `fibratip` | prosa calibrada por fibra (`FIBER_DB.tip`) | ato 02 |
| `props` | propriedades cruas da fibra, 0–10 (`bol`=não bola, `ama`=não amarrota, `sec`=seca rápido, `cal`=isola, `res`=respira, `pes`, `sus`) | ato 03 e selo de viagem |
| `cornota` / `estampado` | cor e padrão (`detectColorPattern`) | ato 04 |
| `tipo` | tipo de peça (`garmentType`: camiseta, camisa, blazer, calca, vestido, casaco, malha, shoes, bags) | atos 02, 03 e 04 |

> **Escala das `props`:** 10 é sempre o melhor desempenho *naquela* propriedade —
> `bol:10` significa que **não** forma bolinhas; `ama:10` que **não** amarrota.

Sem parâmetros, a página mostra o conteúdo de demonstração do design.

## Prosa adaptada à peça

As quatro perguntas do design mapeiam nas dimensões que a extensão já envia, por
isso a resposta é escrita a partir da análise em vez de ficar presa ao texto do
suéter de demonstração:

| Capítulo | Fonte |
|---|---|
| 01 · A matéria | `fibras` (natural / sintética / mistura) + `qualidade` |
| 02 · O corpo | `conforto` |
| 03 · O tempo | `durabilidade` + `manutencao` |
| 04 · No dia a dia | `versatilidade` |

Cada um tem três faixas (alto / médio / baixo). Os traços do selo de viagem
seguem `viagem` **e** a composição (o texto muda para peça sintética). A frase
de "salvar a peça" também muda por faixa — o design tinha uma versão por nota
(86 celebra, 58 pondera), por isso trocar só o número produziria frases sem
sentido como "Um 42 não aparece todo dia".

Sem parâmetros, o texto se mantém original do design.

### O que continua por fazer

Os quatro capítulos variam por fibra, propriedade, cor e tipo de peça. O que
falta é publicar a página — enquanto `lookmap.ai/analise` não existir, o botão
só funciona apontado para o servidor local.

⚠️ **Não rodar o `build.py` da raiz do repositório** (o da extensão) sem
intenção: ele regenera o `FIBER_DB` a partir do `fibers.json` e os dois estão
dessincronizados — regenerar altera os scores de 32 fibras e quebra um teste.
As propriedades foram injetadas preservando os scores existentes.
