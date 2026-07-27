#!/usr/bin/env python3
"""
gerar-icones.py — compõe a marca "lp" para o ícone da barra do navegador.

  python3 logo/gerar-icones.py     # grava logo/lookpilot-mini.svg e logo/tamanhos/*.svg

As LETRAS não são desenhadas aqui: são as autênticas do logo, em **Bellota
Text**, vetorizadas. O script só as compõe — o defeito nunca esteve nas letras,
esteve no enquadramento:

  · a perna do "p" descia até y=232 num quadrado de 200, ou seja ficava FORA
    do quadrado, flutuando em transparência (invisível em barra clara, solta
    em barra escura);
  · e não havia ajuste por tamanho: o mesmo enquadramento que respira a 128
    deixa o traço fino demais a 16.

Agora a caixa real das letras (147,9 × 217,1) é medida e encaixada no tile com
uma folga por tamanho — quanto menor o ícone, mais apertado, para o traço
engordar proporcionalmente.

Rasterizar: abra logo/rasterizar.html no navegador (ele desenha os SVG num
canvas e oferece os PNG). PIL não desenha curvas de Bézier, por isso a
rasterização é feita no navegador, que é também quem vai exibir o ícone.
"""
import pathlib

AQUI = pathlib.Path(__file__).parent

# Caixa real das letras, medida com getBBox() no navegador.
CAIXA = dict(x=30.16, y=15.06, w=147.912, h=217.14)

# "lp" em Bellota Text, vetorizado — as letras do logo, sem redesenho.
LP = (
    "M30.16 15.06H47.76V175.22H30.16V15.06ZM129.672 61.92C139.939 61.92 148.666 64.4867 "
    "155.852 69.62C163.186 74.7533 168.686 81.6467 172.352 90.3C176.166 98.8067 178.072 "
    "108.193 178.072 118.46C178.072 129.753 175.872 139.873 171.472 148.82C167.219 157.62 "
    "160.912 164.587 152.552 169.72C144.339 174.707 134.659 177.2 123.512 177.2C119.112 "
    "177.2 111.632 176.54 101.072 175.22V232.2H83.6922V98C83.6922 86.56 80.6122 78.2 "
    "74.4522 72.92L86.5522 61.7C88.7522 63.02 90.9522 65 93.1522 67.64C95.3522 70.1333 "
    "97.1855 73.0667 98.6522 76.44C102.172 72.04 106.792 68.52 112.512 65.88C118.232 "
    "63.24 123.952 61.92 129.672 61.92ZM122.412 160.92C134.732 160.92 144.046 157.18 "
    "150.352 149.7C156.806 142.22 160.032 132.247 160.032 119.78C160.032 108.047 157.319 "
    "98.22 151.892 90.3C146.466 82.2333 139.206 78.2 130.112 78.2C122.926 78.2 116.399 "
    "80.5467 110.532 85.24C104.812 89.7867 101.659 95.6533 101.072 102.84V159.6C109.872 "
    "160.48 116.986 160.92 122.412 160.92Z"
)

MAGENTA = "#FF009D"   # o mesmo acento do design v15 (15 ocorrências lá; o
                      # #EF23A1 do arquivo antigo do wordmark é resíduo)

# folga por tamanho: quanto menor, mais apertado (traço proporcionalmente maior)
FOLGAS = {128: 0.18, 48: 0.15, 16: 0.12}


def compor(S, folga):
    b = CAIXA
    alvo = S * (1 - 2 * folga)
    k = min(alvo / b["w"], alvo / b["h"])
    tx = (S - b["w"] * k) / 2 - b["x"] * k
    ty = (S - b["h"] * k) / 2 - b["y"] * k
    r = round(S * 0.23)
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{S}" height="{S}" '
        f'viewBox="0 0 {S} {S}">\n'
        f'  <rect width="{S}" height="{S}" rx="{r}" fill="{MAGENTA}"/>\n'
        f'  <g transform="translate({tx:.2f},{ty:.2f}) scale({k:.4f})">\n'
        f'    <path d="{LP}" fill="#FFFFFF"/>\n'
        f'  </g>\n'
        f'</svg>\n'
    )


if __name__ == "__main__":
    (AQUI / "lookpilot-mini.svg").write_text(compor(512, FOLGAS[128]))
    pasta = AQUI / "tamanhos"
    pasta.mkdir(exist_ok=True)
    for tam, folga in FOLGAS.items():
        (pasta / f"icone-{tam}.svg").write_text(compor(512, folga))
    print("logo/lookpilot-mini.svg + logo/tamanhos/*.svg")
    print("para os PNG: abra logo/rasterizar.html no navegador")
