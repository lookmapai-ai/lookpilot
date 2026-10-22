#!/usr/bin/env bash
# Empacota a extensão nos DOIS zips que ela precisa — a mesma lista de
# arquivos, arrumada de duas maneiras diferentes:
#
#   landing/lookpilot-extensao.zip   o botão "Baixar extensão" da landing.
#                                    Abre numa pasta única, porque quem
#                                    instala à mão escolhe uma PASTA em
#                                    "Carregar sem compactação".
#
#   dist/lookpilot-loja.zip          o arquivo que sobe para a Chrome Web
#                                    Store. O manifest.json fica na RAIZ do
#                                    zip: o Google recusa o pacote se ele
#                                    estiver dentro de uma pasta
#                                    ("Make sure you place the manifest file
#                                    in the root directory, not in a folder").
#
#   cd landing && ./empacotar.sh
#
# O servir.sh chama isto sozinho, para o zip nunca ficar velho em
# desenvolvimento. Antes de publicar a landing, rode também — senão o site
# serve uma versão antiga da extensão.

set -e
cd "$(dirname "$0")/.."          # raiz do repositório

ZIP="landing/lookpilot-extensao.zip"
ZIP_LOJA="dist/lookpilot-loja.zip"
PASTA="lookpilot"                # a pasta que a pessoa vê ao descompactar

# só o que a extensão carrega em tempo de execução. Ficam de fora: os .json
# (são insumos do build.py, viram FIBER_DB dentro do shared.js), os testes,
# a landing, a documentação e os fontes de design.
ARQUIVOS=(
  manifest.json
  background.js
  strings.js
  shared.js
  categories.js
  content.js
  popup.html
  popup.js
  icon16.png
  icon48.png
  icon128.png
)

for f in "${ARQUIVOS[@]}"; do
  [ -f "$f" ] || { echo "ERRO: falta $f"; exit 1; }
done

TMP="$(mktemp -d)"
mkdir -p "$TMP/$PASTA"
cp "${ARQUIVOS[@]}" "$TMP/$PASTA/"

rm -f "$ZIP"
( cd "$TMP" && zip -q -r - "$PASTA" ) > "$ZIP"

# o mesmo conteúdo, sem a pasta por cima
mkdir -p dist
rm -f "$ZIP_LOJA"
( cd "$TMP/$PASTA" && zip -q -r -X - . -x '.*' ) > "$ZIP_LOJA"

rm -rf "$TMP"

# dist/ é a pasta do envio: o que o formulário da loja pede em ficheiro fica
# todo aqui, para não haver que o ir buscar a três sítios no meio do envio.
cp landing/loja-captura-1280x800.png landing/loja-mosaico-440x280.png icon128.png dist/

# O Chrome não carrega este repositório: carrega uma CÓPIA, escolhida um dia
# em "Carregar sem compactação". Sem este passo, empacotar deixava a cópia
# instalada para trás — e a correcção recém-feita não chegava ao navegador,
# por mais vezes que se recarregasse a extensão.
./sincronizar-extensao.sh "${ARQUIVOS[@]}"

VER=$(python3 -c "import json;print(json.load(open('manifest.json'))['version'])")
echo "$ZIP       ·  versão $VER  ·  $(du -h "$ZIP" | cut -f1)  ·  ${#ARQUIVOS[@]} arquivos  ·  pasta $PASTA/"
echo "$ZIP_LOJA  ·  versão $VER  ·  $(du -h "$ZIP_LOJA" | cut -f1)  ·  ${#ARQUIVOS[@]} arquivos  ·  manifest na raiz"
