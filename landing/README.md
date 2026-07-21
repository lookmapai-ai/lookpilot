# Página de análise (lookmap.ai/analise)

Destino do botão "Ver análise completa →" do card da extensão.

## Ficheiros

| Ficheiro | O que é |
|---|---|
| `v15-source.dc.html` | **Fonte do design**, puxado do projeto claude.ai/design ("Prompt landing LookMap" → `LookPilot Experiencia v15 Apple White.dc.html`). Não editar à mão: é a cópia do design. |
| `build.py` | Traduz o fonte para HTML normal. **Não redesenha nada** — copia marcação e estilos verbatim e só converte `sc-if`/`sc-for`/`{{ }}`/`style-hover` para HTML+atributos de binding. |
| `runtime.js` | Dá vida à página: lê os parâmetros da URL que a extensão envia, preenche os bindings e reproduz as animações (reveal, parallax, contagem, scan da etiqueta). |
| `analise.html` | **Gerado** por `build.py`. É o ficheiro a publicar. |
| `images/` | Wordmarks. As fotos do produto vêm da URL (a extensão raspa a galeria da loja). |

## Regenerar

```sh
cd landing && python3 build.py
```

Se o design mudar no claude.ai/design, voltar a puxar `v15-source.dc.html` e correr o build.

## Parâmetros consumidos

`score` · `verdict` (usado tal como o card o enviou — não se recalcula, senão as
duas superfícies contradizem-se) · `nome` · `loja` · `preco` · `moeda` ·
`origem` · `imagem` · `galeria` (fotos separadas por `|`, distribuídas pelos 4
capítulos) · `fibras` (vira a composição da etiqueta) · `viagem` (0–100, define
o selo de viagem) · `confianca`.

Sem parâmetros, a página mostra o conteúdo de demonstração do design.

## Lacuna conhecida

A prosa das quatro perguntas e dos traços de viagem é **redação editorial** do
design (escrita para o suéter de lã). A extensão não envia esse texto, por isso
mantém-se como padrão e não se adapta à peça analisada. Resolver isto implica ou
a extensão enviar texto gerado, ou a página gerá-lo a partir dos scores.
