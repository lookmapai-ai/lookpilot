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

O ato 04 (versatilidade) ainda é só por faixa de nota — repete entre peças. E a
prosa não desce ao nível da propriedade medida: não sabe que o acrílico forma
bolinhas mais depressa que o poliéster. As 13 propriedades por fibra existem em
`fibers.json`, mas o `build.py` da extensão achata-as em 5 scores + `tip`, e só
o `tip` chega aqui.
