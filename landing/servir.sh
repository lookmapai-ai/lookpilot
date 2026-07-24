#!/usr/bin/env bash
# Sobe a página de análise em http://localhost:8777 para testar a extensão
# ligada à página de verdade, antes de publicar no lookmap.ai.
#
#   cd landing && ./servir.sh
#
# Deixe rodando enquanto testa. Ctrl+C encerra.

set -e
cd "$(dirname "$0")"

PORTA=8777

# zip sempre fresco: o botão "Baixar extensão" entrega este arquivo
./empacotar.sh

# derruba uma instância anterior, se houver
pkill -f "http.server $PORTA" 2>/dev/null || true
sleep 0.3

echo "Página de análise em http://localhost:$PORTA/analise.html"
echo
echo "Para testar de ponta a ponta:"
echo "  1. chrome://extensions -> recarregar a LookPilot (⟳)"
echo "  2. abrir a página de uma peça numa loja (Zara, Uniqlo, H&M...)"
echo "  3. clicar no ícone -> 'Analisar esta peça'"
echo "  4. no card, clicar 'Ver análise completa →'"
echo
echo "Ctrl+C para encerrar."
echo

python3 -m http.server "$PORTA"
