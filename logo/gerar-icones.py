#!/usr/bin/env python3
"""
gerar-icones.py — desenha o ícone da barra do navegador (e o SVG da marca).

  python3 logo/gerar-icones.py           # grava icon16/48/128.png + lookpilot-mini.svg
  python3 logo/gerar-icones.py --provas  # grava ampliações em logo/provas/ para conferir

Por que existe: os ícones eram exportados à mão do lookpilot-mini.svg, que
tinha dois defeitos de desenho —

  1. a perna do "p" descia até y=232 num quadrado de 200, ou seja FICAVA FORA
     do quadrado, flutuando em transparência (invisível em barra clara, solta
     em barra escura);
  2. a haste do "l" tinha 8,5% da largura: a 16px virava 1,4px e evaporava.

Aqui o desenho é geométrico, renderizado a 512 e reamostrado. Cada tamanho tem
o seu peso, porque um traço elegante a 128 desaparece a 16 — e o vazio do "p"
tem um piso, senão fecha e a letra vira um borrão.

Marca: o magenta #FF009D é a assinatura na barra (é o que distingue o ícone
entre uma dúzia de outros), com o monograma "lp" em branco. Dentro do produto
o sistema é Apple White — tinta preenche, magenta acentua — mas o ícone é
ativo de marca, e a regra documentada no DESIGN.md §6 é justamente que o
magenta sobrevive no wordmark e no ícone.
"""
import sys, pathlib
from PIL import Image, ImageDraw

RAIZ = pathlib.Path(__file__).parent.parent
S = 512                       # canvas de trabalho
MAGENTA = (255, 0, 157, 255)  # #FF009D
BRANCO = (255, 255, 255, 255)

# Geometria do monograma, em unidades de 512.
# O vazio do "p" (r_in) NÃO acompanha o peso: se acompanhasse, fecharia a 16px.
GEOMETRIA = {
    128: dict(haste=56, r_in=30, gap=16),   # mais fino: há espaço para elegância
    48:  dict(haste=60, r_in=30, gap=15),
    16:  dict(haste=64, r_in=30, gap=14),   # mais gordo: sobrevive à redução
}


def desenha(haste, r_in, gap, tile=MAGENTA, tinta=BRANCO):
    im = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)

    # tile com cantos generosos, no espírito dos cartões do design
    d.rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * 0.23), fill=tile)

    r = haste // 2
    lx = 150
    # "l" — ascendente
    d.rounded_rectangle([lx, 112, lx + haste, 336], radius=r, fill=tinta)

    # "p" — haste com a perna abaixo da linha de base, agora DENTRO do tile
    px = lx + haste + gap
    d.rounded_rectangle([px, 184, px + haste, 408], radius=r, fill=tinta)

    # bolha do "p": anel de espessura igual à haste, com o vazio começando
    # exatamente na borda direita da haste
    r_out = r_in + haste
    cx, cy = px + haste + r_in, 260
    d.ellipse([cx - r_out, cy - r_out, cx + r_out, cy + r_out], fill=tinta)
    d.ellipse([cx - r_in, cy - r_in, cx + r_in, cy + r_in], fill=tile)
    return im


def svg(haste, r_in, gap):
    """Fonte vetorial equivalente, para quem precisar do desenho em SVG."""
    r = haste / 2
    lx = 150
    px = lx + haste + gap
    r_out = r_in + haste
    cx, cy = px + haste + r_in, 260
    anel = (r_in + r_out) / 2
    return f'''<svg width="{S}" height="{S}" viewBox="0 0 {S} {S}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="{S}" height="{S}" rx="{int(S*0.23)}" fill="#FF009D"/>
  <rect x="{lx}" y="112" width="{haste}" height="224" rx="{r}" fill="#FFFFFF"/>
  <rect x="{px}" y="184" width="{haste}" height="224" rx="{r}" fill="#FFFFFF"/>
  <circle cx="{cx}" cy="{cy}" r="{anel}" stroke="#FFFFFF" stroke-width="{haste}" fill="none"/>
</svg>
'''


if __name__ == "__main__":
    if "--provas" in sys.argv:
        pasta = RAIZ / "logo" / "provas"
        pasta.mkdir(exist_ok=True)
        Z = 13
        largura = len(GEOMETRIA) * (16 * Z + 24) + 20
        folha = Image.new("RGBA", (largura, 16 * Z + 80), (255, 255, 255, 255))
        dd = ImageDraw.Draw(folha)
        x = 14
        for tam, g in GEOMETRIA.items():
            im = desenha(**g).resize((tam, tam), Image.LANCZOS)
            im.save(pasta / f"icone-{tam}.png")
            dd.text((x, 10), f"{tam}px", fill=(0, 0, 0))
            base = Image.new("RGBA", (16 * Z, 16 * Z), (248, 248, 250, 255))
            base.alpha_composite(im.resize((16 * Z, 16 * Z), Image.NEAREST))
            folha.alpha_composite(base, (x, 30))
            x += 16 * Z + 24
        folha.save(pasta / "conferir.png")
        print("provas em logo/provas/conferir.png")
    else:
        for tam, g in GEOMETRIA.items():
            desenha(**g).resize((tam, tam), Image.LANCZOS).save(RAIZ / f"icon{tam}.png")
        (RAIZ / "logo" / "lookpilot-mini.svg").write_text(svg(**GEOMETRIA[128]))
        print("icon16.png, icon48.png, icon128.png e logo/lookpilot-mini.svg gravados")
