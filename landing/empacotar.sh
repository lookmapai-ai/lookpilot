#!/usr/bin/env bash
# Empacota a extensão no zip que o botão "Baixar extensão" entrega.
#
#   cd landing && ./empacotar.sh
#
# O servir.sh chama isto sozinho, para o zip nunca ficar velho em
# desenvolvimento. Antes de publicar a landing, rode também — senão o site
# serve uma versão antiga da extensão.

set -e
cd "$(dirname "$0")/.."          # raiz do repositório

ZIP="landing/lookpilot-extensao.zip"
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
rm -rf "$TMP"

VER=$(python3 -c "import json;print(json.load(open('manifest.json'))['version'])")
echo "$ZIP  ·  versão $VER  ·  $(du -h "$ZIP" | cut -f1)  ·  ${#ARQUIVOS[@]} arquivos"
