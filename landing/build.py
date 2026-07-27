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

# duas páginas, o mesmo tradutor:
#   análise  = relatório de uma peça (lê os params da extensão)
#   marketing = home do produto, para onde o logo aponta
PAGINAS = [
    dict(src="v15-source.dc.html", out="analise.html", runtime="runtime.js",
         titulo="Análise da peça — LookPilot"),
    dict(src="mkt-source.dc.html", out="index.html", runtime="marketing.js",
         titulo="LookPilot — a etiqueta, lida por você"),
]

def build(cfg):
  SRC = HERE / cfg["src"]
  OUT = HERE / cfg["out"]
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
      # o design escreve "€" fixo, mas a loja pode ser de outra moeda (a extensão
      # envia o código em `moeda`). Preço e símbolo passam a vir juntos.
      ('· <span data-txt="heroPreco"></span>&nbsp;€',
       '· <span data-txt="heroPrecoEl"></span>'),
      # contador: o design escreve "peças" fixo e sai "1 peças"
      ('Minhas peças · <span data-txt="nGuardadas"></span> peças',
       'Minhas peças · <span data-txt="nGuardadasLabel"></span>'),
      # pill do hero: "… ZARA ↗ …"
      ('>ZARA <span aria-hidden', '><span data-txt="loja"></span> <span aria-hidden'),
      # cartão da etiqueta
      ('>Etiqueta · ZARA<', '>Etiqueta · <span data-txt="loja"></span><'),
      # abertura do selo de viagem (a variante de cautela já diz "Essa fibra")
      ('Lã é a fibra que mais viaja: <strong style="font-weight:700;color:#1D1D1F">não amarrota</strong>, '
       'aquece e respira no mesmo casaco, e disfarça o uso. Você leva menos peças — e lava menos ainda.',
       '<span data-txt="seloLeadEl"></span>'),
      # variante de cautela: afirmava "amarrota fácil e retém calor e cheiro"
      # para qualquer fibra — falso para algodão, que respira muito bem
      ('Essa fibra <strong style="font-weight:700;color:#1D1D1F">amarrota fácil</strong> e retém calor e cheiro. '
       'Dá pra levar, mas prepare-se pra passar a ferro e lavar mais vezes na volta.',
       '<span data-txt="seloLeadCautelaEl"></span>'),
  ]
  # No design, três links apontam para "LookMap Landing Extensao" — a página de
  # marketing do produto. Esse arquivo só existe dentro da ferramenta de design,
  # mas o DESTINO continua a ser o mesmo: a home do site. Fica relativo à raiz
  # para funcionar em qualquer domínio (em produção, lookmap.ai/).
  MKT_URL = "/"
  # links para a página de análise (a home aponta para "Minhas peças" lá)
  body = re.sub(r'href="LookPilot%20Experiencia%20v15%20Apple%20White\.dc\.html(#[\w-]*)?"',
                lambda m: 'href="analise.html%s"' % ('#minhas-pecas' if m.group(1) else ''), body)

  #   1. logo do cabeçalho (title="Início") -> home do marketing
  body = body.replace(
      'href="LookMap%20Landing%20Extensao.dc.html" title="Início"',
      'href="%s" title="Início"' % MKT_URL)
  #   2. "Voltar" da vista Minhas peças -> página ANTERIOR de verdade (o
  #      relatório, ou de onde a pessoa veio), via histórico do navegador
  body = body.replace(
      'href="LookMap%20Landing%20Extensao.dc.html" style="align-self:flex-start;',
      'href="%s" data-on-click="onVoltar" style="align-self:flex-start;' % MKT_URL)
  #   3. restantes (ex.: "Como funciona" no rodapé) -> marketing, com a âncora
  body, _n_links = re.subn(
      r'href="LookMap%20Landing%20Extensao\.dc\.html(#[\w-]*)?"',
      lambda m: 'href="%s%s"' % (MKT_URL, m.group(1) or ''), body)

  # Header igual nas duas páginas. O design da análise não trazia o
  # "Baixar extensão" (assume que quem chega já tem a extensão), mas a análise
  # é uma página partilhável: quem recebe o link ficava sem caminho nenhum
  # para instalar. Reaproveita o botão da home — mesmos estilos, verbatim —
  # como link para a home, onde vive o modal de instalação.
  if cfg["out"] == "analise.html":
      _btn_baixar = (
        '<a href="/?baixar=1" style="display:inline-flex;align-items:center;gap:8px;'
        'min-height:44px;padding:9px 22px;border-radius:999px;background:#1D1D1F;'
        'border:none;color:#FFFFFF;font-family:inherit;font-size:14px;font-weight:500;'
        'letter-spacing:-.01em;text-decoration:none;cursor:pointer;white-space:nowrap;'
        'touch-action:manipulation;transition:opacity .25s ease,transform .25s ease" '
        'data-hovercls="hbaixar">'
        '<span aria-hidden="true" style="display:inline-block;width:8px;height:8px;'
        'border-radius:999px;background:#FF009D"></span>Baixar extensão</a>')
      hover_rules.append(("hbaixar", "opacity:.88;transform:translateY(-1px)"))
      # o header da análise vinha com 10px de padding e o da home com 12px:
      # ao navegar entre as páginas o cabeçalho saltava 4px
      body = body.replace("padding:10px clamp(20px,5vw,64px);background:rgba(255,255,255,.8)",
                          "padding:12px clamp(20px,5vw,64px);background:rgba(255,255,255,.8)", 1)
      _marca = '<button data-on-click="onHistorico"'
      _i = body.find(_marca)
      if _i == -1:
          print("  AVISO: não achei o botão Minhas peças no header")
      else:
          _fim = body.index("</button>", _i) + len("</button>")
          body = body[:_fim] + _btn_baixar + body[_fim:]

  # os ajustes abaixo são do relatório de peça; a home não os tem
  if cfg["out"] == "analise.html":
      for _de, _para in _fixos:
          if _de not in body:
              print("  AVISO: texto fixo não encontrado (design mudou?): " + _de[:45])
          body = body.replace(_de, _para)

  # ---- 8. limpezas de HTML -----------------------------------------
  body = body.replace("</img>", "")          # <img></img> é inválido
  body = re.sub(r"<!--.*?-->", "", body, flags=re.S)

  # ---- 9. montagem --------------------------------------------------
  # versão do runtime.js: evita o navegador servir uma cópia em cache depois de
  # um build (custou um bom bocado de depuração a descobrir)
  _rt = HERE / cfg["runtime"]
  _rt_ver = int(_rt.stat().st_mtime) if _rt.exists() else 0

  hover_css = "\n".join(
      '[data-hovercls="%s"]:hover{%s}' % (c, d.replace("&quot;", '"'))
      for c, d in hover_rules)

  html = f"""<!DOCTYPE html>
  <html lang="pt-BR">
  <head>
  <meta charset="utf-8">
  <title>{cfg["titulo"]}</title>
  {head_extra}
  <style>
  /* hovers declarados no design via style-hover */
  {hover_css}
  </style>
  </head>
  <body>
  {body}
  <script src="metrica.js"></script>
<script src="{cfg["runtime"]}?v={_rt_ver}"></script>
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


for _cfg in PAGINAS:
    build(_cfg)

# O zip que o botão "Baixar extensão" entrega tem de acompanhar o código da
# extensão. Deixá-lo por conta de servir.sh não bastava: qualquer outra forma
# de servir (ou de publicar) passava ao lado, e o site chegou a oferecer uma
# versão de 2 dias antes — com popup, badge e o bug da composição. Reempacotar
# aqui acopla o download à regeneração do site, que é o gesto natural.
import subprocess
try:
    subprocess.run(["./empacotar.sh"], cwd=str(HERE), check=True,
                   stdout=subprocess.DEVNULL)
    print("extensão reempacotada")
except Exception as e:
    print("AVISO: não empacotou a extensão (%s) — rode ./empacotar.sh" % e)
