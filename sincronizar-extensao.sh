#!/usr/bin/env bash
# Põe o código deste repositório dentro da pasta que o Chrome carrega.
#
# Porque existe: o Chrome não carrega esta pasta. Carrega uma CÓPIA — a que
# saiu do zip, escolhida um dia em "Carregar sem compactação". O caminho dela
# fica guardado no perfil do Chrome, e ninguém volta a olhar para ele.
#
# Isso custou uma tarde inteira. Um defeito foi corrigido, testado e
# commitado, e continuou a aparecer; a extensão era recarregada e nada
# mudava. O manifest da cópia anunciava o MESMO nome e a MESMA versão, por
# isso nem o número no cartão do Chrome denunciava a diferença.
#
# Este script não adivinha caminho nenhum: pergunta ao próprio Chrome. O
# empacotar.sh chama-o no fim, para a cópia instalada nunca ficar para trás
# do que se acabou de empacotar.
#
#   ./sincronizar-extensao.sh <ficheiro> [ficheiro...]
#
# A lista de ficheiros vem de quem chama (o empacotar.sh), de propósito: a
# lista do que a extensão precisa vive num sítio só.

set -e
cd "$(dirname "$0")"
RAIZ="$(pwd -P)"

if [ "$#" -eq 0 ]; then
  echo "uso: ./sincronizar-extensao.sh <ficheiros da extensão>"
  echo "     (normalmente não se chama à mão — o landing/empacotar.sh chama)"
  exit 2
fi

# As pastas que o Chrome tem carregadas sem compactação, segundo o perfil
# dele. Uma linha por pasta. Silencioso se não houver Chrome nenhum.
PASTAS="$(python3 - <<'PY'
import json, os
base = os.path.join(os.environ.get('HOME', ''), 'Library', 'Application Support', 'Google', 'Chrome')
vistas = []
for perfil in ['Default', 'Profile 1', 'Profile 2', 'Profile 3']:
    for nome in ['Secure Preferences', 'Preferences']:
        caminho = os.path.join(base, perfil, nome)
        if not os.path.exists(caminho):
            continue
        try:
            dados = json.load(open(caminho, encoding='utf-8'))
        except Exception:
            continue
        for ext in ((dados.get('extensions') or {}).get('settings') or {}).values():
            p = str(ext.get('path', ''))
            if 'lookpilot' in p.lower() and os.path.isdir(p) and p not in vistas:
                vistas.append(p)
for p in vistas:
    print(p)
PY
)"

if [ -z "$PASTAS" ]; then
  echo "  (o Chrome não tem nenhuma cópia do LookPilot carregada — nada a sincronizar)"
  exit 0
fi

while IFS= read -r pasta; do
  [ -n "$pasta" ] || continue
  # A própria pasta do projeto não se copia para cima de si mesma.
  if [ "$(cd "$pasta" && pwd -P)" = "$RAIZ" ]; then
    echo "  ✓ o Chrome carrega esta mesma pasta — nada a copiar"
    continue
  fi
  cp "$@" "$pasta/"
  echo "  ✓ código copiado para a pasta que o Chrome carrega:"
  echo "    $pasta"
  echo "    (é preciso recarregar a extensão para o Chrome reler os ficheiros)"
done <<< "$PASTAS"
