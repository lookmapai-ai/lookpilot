#!/usr/bin/env python3
"""
build.py — Regenera os scores da extensão a partir da base técnica fibers.json

COMO USAR:
  1. Edite as propriedades técnicas (0-10) em fibers.json
  2. Rode:  python3 build.py
  3. Reinstale a extensão no Chrome

O QUE FAZ:
  - Lê fibers.json (fonte única de verdade)
  - Converte as 13 propriedades técnicas nos 6 scores do card
  - Reescreve o FIBER_DB dentro de shared.js
  - Reescreve o MATERIALS (calçados/bolsas) dentro de categories.js
  - Valida a sintaxe dos ficheiros
  - Incrementa a versão no manifest.json

NÃO edite FIBER_DB nem MATERIALS à mão — eles são gerados. Edite fibers.json.
"""
import json, re, sys, subprocess, os

HERE = os.path.dirname(os.path.abspath(__file__))
KB = os.path.join(HERE, 'fibers.json')
SHARED = os.path.join(HERE, 'shared.js')
CATEGORIES = os.path.join(HERE, 'categories.js')
MANIFEST = os.path.join(HERE, 'manifest.json')

# ─── Mapa de sinónimos: como cada fibra aparece nas etiquetas (PT/EN/FR) ───
LABEL_KEYS = {
    'algodao': ['algodão','algodao','cotton','coton'],
    'algodao_organico': ['algodão orgânico','algodao organico','organic cotton'],
    'poliester': ['poliéster','poliester','polyester'],
    'poliester_reciclado': ['poliéster reciclado','poliester reciclado','recycled polyester','rpet'],
    'la': ['lã','la ','lã ','wool','laine'],
    'merino': ['merino','lã merino','merino wool'],
    'lyocell': ['lyocell','liocel','tencel'],
    'viscose': ['viscose','rayon','raiom'],
    'linho': ['linho','linen','lin '],
    'seda': ['seda','silk','soie'],
    'caxemira': ['caxemira','cashmere','cachemire'],
    'modal': ['modal'],
    'poliamida': ['poliamida','polyamide','nylon','nailon'],
    'poliamida_reciclada': ['poliamida reciclada','econyl','recycled nylon'],
    'elastano': ['elastano','elastane','spandex','lycra','elastam'],
    'acrilico': ['acrílico','acrilico','acrylic','acryl'],
    'canhamo': ['cânhamo','canhamo','hemp','chanvre'],
    'rami': ['rami','ramie'],
}

MATERIAL_KEYS = {
    'couro': ['couro','couro genuíno','couro legítimo','couro natural','pele','pele bovina',
              'pele ovina','pele suína','pele natural','pele genuína','leather','cuir','full grain','top grain'],
    'couro_sintetico': ['couro sintético','couro sintetico','sintético','sintetico','pu',
                         'synthetic leather','faux leather','vegan leather','poliuretano'],
    'camurca': ['camurça','camurca','suede','nubuck','nobuck'],
    'lona_canvas': ['lona','canvas','têxtil','textil','tecido'],
    'nylon_balistico': ['nylon balístico','ballistic','cordura'],
    'borracha': ['borracha','rubber','caoutchouc','sbs','sbr'],
    'eva': ['eva','etileno'],
    'couro_vegetal': ['couro vegetal','cactus','piñatex','pinatex','mylo','desserto','maçã','apple leather'],
}

CAT_MAP = {'natural':'natural','semi-sintetico':'semi','sintetico':'synthetic',
           'natural_animal':'natural','natural_vegetal':'natural','biobased':'semi',
           'natural_ou_sintetico':'synthetic'}


def clamp(v):
    return max(0, min(100, int(round(v))))


def derive_fiber_scores(p, viagem):
    """Converte as 13 propriedades técnicas de FIBRA nos 5 scores-base do card."""
    quality = (p['conforto']*0.25 + p['durabilidade']*0.30 +
               p['resistencia']*0.25 + p['sustentabilidade']*0.20) * 10
    comfort = (p['conforto']*0.6 + p['respirabilidade']*0.4) * 10
    durability = (p['durabilidade']*0.5 + p['resistencia']*0.3 + p['bolinhas']*0.2) * 10
    maintenance = p['facilidade_manutencao'] * 10  # facilidade pura (secagem é fator de viagem)
    travel = viagem['travel_score'] * 10
    return dict(quality=clamp(quality), comfort=clamp(comfort),
                durability=clamp(durability), maintenance=clamp(maintenance), travel=clamp(travel))


def derive_material_scores(p, viagem):
    """Converte propriedades de MATERIAL (calçado/bolsa) nos scores do card."""
    quality = (p.get('conforto',5)*0.25 + p['durabilidade']*0.35 +
               p['resistencia']*0.25 + p['sustentabilidade']*0.15) * 10
    comfort = (p.get('conforto',5)*0.6 + p.get('respirabilidade',5)*0.4) * 10
    durability = (p['durabilidade']*0.6 + p['resistencia']*0.4) * 10
    maintenance = p['facilidade_manutencao'] * 10
    travel = viagem['travel_score'] * 10
    return dict(quality=clamp(quality), comfort=clamp(comfort),
                durability=clamp(durability), maintenance=clamp(maintenance), travel=clamp(travel))


def js_str(s):
    return json.dumps(s, ensure_ascii=False)


def build_fiber_db(kb):
    lines = ["const FIBER_DB = {"]
    for fid, fdata in kb['fibras'].items():
        s = derive_fiber_scores(fdata['propriedades'], fdata['viagem'])
        ftype = CAT_MAP.get(fdata['categoria'], 'semi')
        tip = fdata['viagem']['nota']
        # Propriedades narrativas: os 5 scores são a média que decide a nota,
        # mas quem conta história é a propriedade crua ("forma bolinhas",
        # "amarrota"). A landing usa-as para os capítulos não se repetirem.
        # Escala 0-10, onde 10 é sempre o melhor desempenho NAQUELA propriedade
        # (bolinhas:10 = NÃO forma bolinhas; amassa:10 = NÃO amarrota).
        pr = fdata['propriedades']
        p_narr = (
            f"bol:{pr['bolinhas']}, ama:{pr['amassa']}, sec:{pr['secagem']}, "
            f"cal:{pr['isolamento_termico']}, res:{pr['respirabilidade']}, "
            f"pes:{pr['peso']}, sus:{pr['sustentabilidade']}"
        )
        # Selos de aptidão: os blocos `climas` e `viagem` do fibers.json já
        # vêm curados por fibra e estavam a ser descartados aqui (só o
        # travel_score passava). São a base dos selos que a peça leva para o
        # LookMap — Clima quente, Clima frio, Cabine.
        cl = fdata.get('climas', {})
        vg = fdata.get('viagem', {})
        cabine = 1 if (vg.get('ocupa_pouco_espaco') and vg.get('funciona_mala_capsula')) else 0
        s_selos = (
            f"verao:{cl.get('verao', 5)}, inverno:{cl.get('inverno', 5)}, "
            f"cabine:{cabine}"
        )
        for label in LABEL_KEYS.get(fid, [fid]):
            lines.append(
                f"  {js_str(label)}: {{ quality:{s['quality']}, comfort:{s['comfort']}, "
                f"durability:{s['durability']}, maintenance:{s['maintenance']}, travel:{s['travel']}, "
                f"type:'{ftype}', label:{js_str(fdata['nome'])}, tip:{js_str(tip)}, "
                f"p:{{ {p_narr} }}, s:{{ {s_selos} }} }},"
            )
    lines.append("};")
    return '\n'.join(lines)


def build_materials(kb):
    mats = kb.get('materiais_calcados_bolsas', {})
    entries = []
    seen = set()
    for mid, mdata in mats.items():
        if mid.startswith('_'):
            continue
        s = derive_material_scores(mdata['propriedades'], mdata['viagem'])
        tip = mdata['viagem']['nota']
        for label in MATERIAL_KEYS.get(mid, [mid]):
            if label in seen:
                continue
            seen.add(label)
            entries.append(
                f"    {js_str(label)}: {{ quality:{s['quality']}, durability:{s['durability']}, "
                f"comfort:{s['comfort']}, maintenance:{s['maintenance']}, travel:{s['travel']}, "
                f"label:{js_str(mdata['nome'])}, tip:{js_str(tip)} }},"
            )
    block = '\n'.join(entries)
    return (
        "const MATERIALS = {\n"
        "  clothing: {},  // usa FIBER_DB do shared.js\n"
        "  shoes: {\n" + block + "\n  },\n"
        "  bags: {\n" + block + "\n  },\n"
        "};"
    )


def comparar_calibracao(shared_atual, db_novo):
    """Entradas cujos 5 scores no shared.js diferem do que este script deriva.

    Existem porque alguém afinou os números à mão no shared.js sem levar a
    mudança de volta ao fibers.json. Enquanto isso não for reconciliado, o
    build não pode sobrescrever sem avisar."""
    campos = r'quality:\d+, comfort:\d+, durability:\d+, maintenance:\d+, travel:\d+'
    def ler(t):
        return {m.group(1): m.group(2)
                for m in re.finditer(r'^  "([^"]+)": \{ (' + campos + r')', t, re.M)}
    a, b = ler(shared_atual), ler(db_novo)
    return [k for k in a if k in b and a[k] != b[k]]


def replace_block(text, pattern, replacement, name):
    new, n = re.subn(pattern, lambda m: replacement, text, count=1, flags=re.DOTALL)
    if n == 0:
        print(f"  ⚠ AVISO: não encontrei o bloco {name} para substituir")
        return text
    return new


def main():
    if not os.path.exists(KB):
        print("ERRO: fibers.json não encontrado na pasta da extensão.")
        sys.exit(1)

    kb = json.load(open(KB, encoding='utf-8'))
    print(f"Base lida: {len(kb['fibras'])} fibras, "
          f"{len([k for k in kb.get('materiais_calcados_bolsas',{}) if not k.startswith('_')])} materiais")

    # shared.js — FIBER_DB
    shared = open(SHARED, encoding='utf-8').read()
    novo_db = build_fiber_db(kb)

    # GUARDA: o shared.js do repositório tem entradas calibradas À MÃO que já
    # não batem com o que este script deriva do fibers.json (27 de 65 na
    # última verificação: algodão, lã, linho, caxemira...). Sem este aviso,
    # rodar o build reverte essa calibração em silêncio — e só um teste
    # congelado apanha. Enquanto as duas fontes não forem reconciliadas,
    # o build pergunta antes de sobrescrever.
    divergentes = comparar_calibracao(shared, novo_db)
    if divergentes:
        print(f"\n  ⚠ ATENÇÃO: {len(divergentes)} entradas do shared.js têm números")
        print("    calibrados à mão que NÃO batem com o derivado do fibers.json:")
        for k in divergentes[:8]:
            print(f"      · {k}")
        if len(divergentes) > 8:
            print(f"      · (+{len(divergentes) - 8} outras)")
        print("\n    Continuar SOBRESCREVE essa calibração (os testes congelados vão falhar).")
        if input("    Sobrescrever mesmo assim? [s/N] ").strip().lower() not in ('s', 'sim'):
            print("    FIBER_DB preservado — nada foi alterado no shared.js.")
            novo_db = None

    if novo_db is not None:
        shared = replace_block(shared, r'const FIBER_DB = \{.*?\n\};', novo_db, 'FIBER_DB')
        open(SHARED, 'w', encoding='utf-8').write(shared)
        print("  ✓ shared.js — FIBER_DB regenerado")

    # categories.js — MATERIALS
    cats = open(CATEGORIES, encoding='utf-8').read()
    cats = replace_block(cats, r'const MATERIALS = \{.*?\n\};', build_materials(kb), 'MATERIALS')
    open(CATEGORIES, 'w', encoding='utf-8').write(cats)
    print("  ✓ categories.js — MATERIALS regenerado")

    # Validação de sintaxe (escopos combinados, como o browser carrega)
    print("\nValidando sintaxe...")
    ok = True
    for name, files in [('content', [SHARED, CATEGORIES, os.path.join(HERE,'content.js')]),
                        ('popup',   [SHARED, CATEGORIES, os.path.join(HERE,'popup.js')])]:
        combined = '\n'.join(open(f, encoding='utf-8').read() for f in files)
        tmp = f'/tmp/_check_{name}.js'
        open(tmp, 'w', encoding='utf-8').write(combined)
        r = subprocess.run(['node', '--check', tmp], capture_output=True, text=True)
        if r.returncode == 0:
            print(f"  ✓ escopo {name}: OK")
        else:
            print(f"  ✗ escopo {name}: ERRO\n{r.stderr}")
            ok = False

    if not ok:
        print("\nFALHOU na validação — não incrementei a versão. Corrija e rode de novo.")
        sys.exit(1)

    # Incrementa versão patch
    m = json.load(open(MANIFEST, encoding='utf-8'))
    parts = m['version'].split('.')
    parts[-1] = str(int(parts[-1]) + 1)
    m['version'] = '.'.join(parts)
    json.dump(m, open(MANIFEST, 'w', encoding='utf-8'), indent=2, ensure_ascii=False)
    print(f"\n✓ Tudo certo. Versão atualizada para {m['version']}")
    print("Agora: recarregue a extensão no Chrome (chrome://extensions)")


if __name__ == '__main__':
    main()
