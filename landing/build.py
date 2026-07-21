#!/usr/bin/env python3
"""
build.py — gera landing/analise.html a partir do arquivo de design.

NÃO redesenha nada: copia a marcação e os estilos do design verbatim,
traduzindo apenas as construções da ferramenta de design para HTML normal:

  <sc-if value="{{ c }}">      -> <div data-if="c" style="display:contents">
  <sc-for list="{{ l }}" as=c> -> <template data-for="l" data-as="c">
  onClick="{{ h }}"            -> data-on-click="h"
  style-hover="X"              -> classe + regra CSS :hover
  attr="...{{ x }}..."         -> data-tpl-attr (interpolado no runtime)
  {{ x }} em texto             -> <span data-txt="x"></span>
  {{ xMediaEl }}               -> <div data-media="x" style="display:contents">

Fonte:  v15-source.dc.html   (puxado do projeto claude_design)
Saída:  analise.html         (+ runtime.js dá vida a ele)
"""
import re, sys, pathlib

HERE = pathlib.Path(__file__).parent
SRC = HERE / "v15-source.dc.html"
OUT = HERE / "analise.html"

src = SRC.read_text(encoding="utf-8")

# ---- 1. helmet (estilos/scripts do design) -> head ----------------
helmet = re.search(r"<helmet>(.*?)</helmet>", src, re.S)
head_extra = helmet.group(1) if helmet else ""
# o runtime da ferramenta de design não existe fora dela
head_extra = re.sub(r'<script src="\./(support|image-slot)\.js"></script>\s*', "", head_extra)

# ---- 2. corpo: entre <x-dc> e o <script type="text/x-dc"> ---------
body = src.split("<x-dc>", 1)[1]
body = body.split('<script type="text/x-dc"', 1)[0]
if "</helmet>" in body:
    body = body.split("</helmet>", 1)[1]
body = body.replace("</x-dc>", "")

# ---- 3. style-hover -> classes CSS reais --------------------------
hover_rules = []
def _hover(m):
    decls = m.group(1)
    cls = "h%d" % len(hover_rules)
    hover_rules.append((cls, decls))
    return 'data-hovercls="%s"' % cls
body = re.sub(r'style-hover="([^"]*)"', _hover, body)

# ---- 4. sc-if / sc-for -------------------------------------------
body = re.sub(
    r'<sc-if\s+value="\{\{\s*([\w.]+)\s*\}\}"[^>]*>',
    lambda m: '<div data-if="%s" style="display:contents">' % m.group(1), body)
body = body.replace("</sc-if>", "</div>")

body = re.sub(
    r'<sc-for\s+list="\{\{\s*([\w.]+)\s*\}\}"\s+as="(\w+)"[^>]*>',
    lambda m: '<template data-for="%s" data-as="%s">' % (m.group(1), m.group(2)), body)
body = body.replace("</sc-for>", "</template>")

# ---- 5. handlers --------------------------------------------------
body = re.sub(r'onClick="\{\{\s*([\w.]+)\s*\}\}"',
              lambda m: 'data-on-click="%s"' % m.group(1), body)
body = re.sub(r'onKeyDown="\{\{\s*([\w.]+)\s*\}\}"',
              lambda m: 'data-on-keydown="%s"' % m.group(1), body)

# ---- 6. atributos que contêm {{ }} -> data-tpl-* -------------------
def _attrs(m):
    tag = m.group(0)
    def repl(am):
        name, val = am.group(1), am.group(2)
        if "{{" not in val or name.startswith("data-tpl-"):
            return am.group(0)
        return 'data-tpl-%s="%s"' % (name, val)
    return re.sub(r'([\w:-]+)="([^"]*)"', repl, tag)
body = re.sub(r"<[a-zA-Z][^>]*>", _attrs, body)

# ---- 7. {{ x }} restantes (SÓ em texto, nunca dentro de tags) ------
def _txt(m):
    p = m.group(1)
    if p.endswith("MediaEl") or p.endswith(".mediaEl"):
        return '<div data-media="%s" style="display:contents"></div>' % p
    return '<span data-txt="%s"></span>' % p

# separa tags de texto: os {{ }} que sobraram dentro de tags já viraram
# data-tpl-* no passo 6 e não podem ser tocados aqui.
parts = re.split(r"(<[^>]*>)", body)
body = "".join(
    p if p.startswith("<") else re.sub(r"\{\{\s*([\w.]+)\s*\}\}", _txt, p)
    for p in parts)

# ---- 7.5 conteúdo preso à peça de demonstração --------------------
# O design tem a loja ("ZARA") e a fibra ("Lã") escritas à mão, porque foi
# desenhado sobre o suéter da Zara. Numa página que serve qualquer peça isso
# fica errado (dizia "Etiqueta · ZARA" numa peça da UNIQLO). Aqui só se troca
# o texto fixo por um binding — o design, os estilos e a frase se mantêm.
_fixos = [
    # pill do hero: "… ZARA ↗ …"
    ('>ZARA <span aria-hidden', '><span data-txt="loja"></span> <span aria-hidden'),
    # cartão da etiqueta
    ('>Etiqueta · ZARA<', '>Etiqueta · <span data-txt="loja"></span><'),
    # abertura do selo de viagem (a variante de cautela já diz "Essa fibra")
    ('Lã é a fibra que mais viaja: <strong style="font-weight:700;color:#1D1D1F">não amarrota</strong>, '
     'aquece e respira no mesmo casaco, e disfarça o uso. Você leva menos peças — e lava menos ainda.',
     '<span data-txt="seloLeadEl"></span>'),
]
for _de, _para in _fixos:
    if _de not in body:
        print("  AVISO: texto fixo não encontrado (design mudou?): " + _de[:45])
    body = body.replace(_de, _para)

# ---- 8. limpezas de HTML -----------------------------------------
body = body.replace("</img>", "")          # <img></img> é inválido
body = re.sub(r"<!--.*?-->", "", body, flags=re.S)

# ---- 9. montagem --------------------------------------------------
hover_css = "\n".join(
    '[data-hovercls="%s"]:hover{%s}' % (c, d.replace("&quot;", '"'))
    for c, d in hover_rules)

html = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>Análise da peça — LookPilot</title>
{head_extra}
<style>
/* hovers declarados no design via style-hover */
{hover_css}
</style>
</head>
<body>
{body}
<script src="runtime.js"></script>
</body>
</html>
"""

OUT.write_text(html, encoding="utf-8")
print(f"gerado: {OUT.name}  ({len(html)} bytes)")
print(f"  hovers convertidos : {len(hover_rules)}")
print(f"  sc-if              : {body.count('data-if=')}")
print(f"  sc-for             : {body.count('data-for=')}")
print(f"  bindings de texto  : {body.count('data-txt=')}")
print(f"  slots de media     : {body.count('data-media=')}")
print(f"  atributos template : {body.count('data-tpl-')}")
