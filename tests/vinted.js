#!/usr/bin/env node
/* O VINTED — ONDE NÃO HÁ LOJA, HÁ UMA PESSOA A DESCREVER O QUE TEM EM CASA.
 *
 * Corre com: node tests/vinted.js
 *
 * Duas peças reais abriram este ficheiro, as duas sobretudos de lã vermelhos,
 * as duas lidas errado por motivos diferentes:
 *
 *   · "Cappotto rosso Benetton - 60% lana" (10 EUR, estado Muito bom)
 *     Não era lida. A composição vive no título e na descrição, escrita à mão
 *     por quem vende, em italiano, e PARCIAL — "60% lana" e nada mais. O
 *     guarda que deita fora leituras abaixo de 70% (criado para não confundir
 *     um selo de marketing da Mango Outlet com uma etiqueta) apagava-a, e a
 *     extensão dizia "não consegui ler a composição" numa página que publica
 *     60% de lã duas vezes.
 *
 *   · "Manteau court 80% laine" (30 EUR, estado Muito bom)
 *     Era lida, e o resultado era pior do que não ler. A fibra entrava bem,
 *     mas o nome guardado é a palavra tal como está na página — "laine" — e a
 *     tabela de calor só tem chaves em português. Consequência em cadeia: sem
 *     calor no card, a regra do "agasalho sem prova de calor" acusava a peça,
 *     a nota caía de 70 para 51, e o texto afirmava "não aquece: sem
 *     enchimento, sem malha e sem membrana, a etiqueta descreve um tecido de
 *     meia-estação" — sobre 80% de lã. Não parece falha. Parece análise.
 *
 * As CLASSES que este ficheiro fecha, as duas maiores do que o Vinted:
 *
 *   1. O calor de uma fibra não depende da língua da etiqueta. "laine",
 *      "lana", "wool", "cashmere", "wolle" são a mesma fibra que "lã" —
 *      e o problema aparece em qualquer loja que etiquete noutra língua
 *      (Uniqlo em inglês, Massimo Dutti em espanhol), não só aqui.
 *
 *   2. Numa página de segunda mão a etiqueta é copiada à mão e é parcial por
 *      natureza. Deitá-la fora é perder a única informação que existe; mas
 *      aceitar qualquer número solto seria inventar. O que decide é a prova
 *      que a própria página dá: o campo "Material" do Vinted, que lista as
 *      fibras sem percentagens. E o estado da peça ("Muito bom",
 *      "Satisfatório") pesa tanto como a fibra — num casaco de lã é onde
 *      aparece a bolinha.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.join(__dirname, '..');

let ok = 0, falhas = 0;
function teste(nome, fn) {
  let r;
  try { r = fn(); } catch (e) { r = e.message; }
  if (r === true) { ok++; console.log('  ✓ ' + nome); }
  else { falhas++; console.log('  ✗ ' + nome + '\n      ' + r); }
}

// ─── motor + extensão, como o tests/acervo.js faz ────────────────────
['shared.js', 'categories.js'].forEach((f) => {
  vm.runInThisContext(fs.readFileSync(path.join(raiz, f), 'utf8'), { filename: f });
});
global.window = {};
global.location = { href: 'https://www.vinted.pt/items/10732248062-cappotto-rosso' };
global.MutationObserver = class { constructor() {} observe() {} };
global.document = {
  querySelectorAll: () => [], querySelector: () => null, getElementById: () => null,
  title: '', addEventListener() {},
  body: { innerText: '', appendChild() {}, contains: () => false },
  createElement: () => ({ style: {}, appendChild() {}, remove() {}, textContent: '',
    querySelector: () => ({ addEventListener() {} }), getAttribute: () => null })
};
global.chrome = { runtime: { onMessage: { addListener() {} }, getURL: () => '' },
                  storage: { local: { get() {}, set() {} } } };
const src = fs.readFileSync(path.join(raiz, 'content.js'), 'utf8')
  .replace(/\}\)\(\);\s*$/, '  return { parseComposition, cortaRecomendados };\n})();');
vm.runInThisContext('global._api = ' + src, { filename: 'content.js' });
const API = global._api;

// ─── as duas peças reais, do acervo ──────────────────────────────────
function pecaDoAcervo(ficheiro) {
  const bruto = fs.readFileSync(path.join(__dirname, 'lojas', ficheiro), 'utf8');
  const corte = bruto.indexOf('\n---\n');
  const meta = {};
  bruto.slice(0, corte).split('\n').forEach((l) => {
    const m = /^([a-z_]+):\s*(.*)$/.exec(l.trim());
    if (m) meta[m[1]] = m[2];
  });
  return { meta, texto: bruto.slice(corte + 5) };
}
const BENETTON = pecaDoAcervo('vinted-benetton-cappotto-60-lana.txt');
const COMPTOIR = pecaDoAcervo('vinted-comptoir-manteau-80-laine.txt');

const achatar = (t) => t.replace(/\s*\n+\s*/g, ' ');
const rotulos = (fibras) => fibras
  .map((f) => `${f.pct}% ${((f.data && f.data.label) || f.name).toLowerCase()}`)
  .join(', ');

// ─────────────────────────────────────────────────────────────────────
console.log('\n── 1. O calor não depende da língua da etiqueta ─────────\n');

const PT_E_RESTO = [
  ['lã',       ['laine', 'lana', 'wool']],
  ['caxemira', ['cashmere', 'cachemire', 'cachemir']],
  ['linho',    ['linen', 'lino']],
  ['seda',     ['silk', 'soie']],
  ['algodão',  ['cotton', 'coton', 'algodón']],
  ['poliéster',['polyester']],
];
PT_E_RESTO.forEach(([pt, outras]) => {
  outras.forEach((nome) => {
    teste(`"${nome}" aquece o mesmo que "${pt}"`, () => {
      const a = warmthScore([{ pct: 100, name: pt, data: getFiber(pt) }]);
      const b = warmthScore([{ pct: 100, name: nome, data: getFiber(nome) }]);
      if (a == null) return `a tabela não tem "${pt}" — o teste está errado, não o motor`;
      return a === b || `"${pt}" dá ${a} e "${nome}" dá ${b}`;
    });
  });
});

teste('o nome comercial entre parênteses não esconde o calor (Lyocell (TENCEL™))', () => {
  const w = warmthScore([{ pct: 100, name: 'tencel', data: getFiber('tencel') }]);
  return w === WARMTH['lyocell'] || `deu ${w}, esperava ${WARMTH['lyocell']}`;
});

teste('80% laine num casaco não é acusado de não aquecer', () => {
  const fibras = [{ pct: 80, name: 'laine', data: getFiber('laine') }];
  const s = calcScores(fibras, 'manteau court 80% laine', '', 'Manteau court 80% laine rouge');
  if (s.semProvaDeCalor) return 'semProvaDeCalor ligado num casaco de 80% de lã';
  const texto = conclusionText(s, s.fibers || fibras, 'casaco');
  return !/não aquece/i.test(texto) || 'o texto continua a dizer "não aquece"';
});

teste('o calor continua a ser null quando a fibra dominante é desconhecida', () => {
  // A guarda dos 40% tem de sobreviver: inventar calor é tão mau como perdê-lo.
  const w = warmthScore([{ pct: 100, name: 'fibra-que-nao-existe', data: {} }]);
  return w === null || `deu ${w} para uma fibra que a tabela não conhece`;
});

// ─────────────────────────────────────────────────────────────────────
console.log('\n── 2. A ficha do anúncio (estado, material, marca) ──────\n');

[['com quebras de linha', (t) => t], ['achatada numa linha só', achatar]].forEach(([como, molde]) => {
  teste(`lê estado, material e marca do Benetton (${como})`, () => {
    const f = lerFichaVinted(molde(BENETTON.texto));
    if (!f) return 'não reconheceu a página como anúncio do Vinted';
    if (f.estadoChave !== 'muito_bom') return 'estado lido: ' + f.estadoChave;
    const mats = f.materiais.map((m) => m.rotulo).join(', ');
    if (mats !== 'poliéster, lã') return 'materiais lidos: ' + mats;
    return f.marca === 'United Colors of Benetton' || 'marca lida: ' + JSON.stringify(f.marca);
  });
});

teste('"Muito bom" não é lido como "Bom" (senão a peça leva um aviso que o anúncio não dá)', () => {
  const f = lerFichaVinted(COMPTOIR.texto);
  return f.estadoChave === 'muito_bom' || 'estado lido: ' + f.estadoChave;
});

teste('"Satisfatório" é reconhecido como peça usada', () => {
  const t = BENETTON.texto.replace('Estado\nMuito bom', 'Estado\nSatisfatório');
  const f = lerFichaVinted(t);
  return (f.estadoChave === 'satisfatorio' && f.usada === true) || 'leu ' + JSON.stringify(f.estadoChave);
});

teste('"Novo com etiquetas" não é peça usada', () => {
  const t = BENETTON.texto.replace('Estado\nMuito bom', 'Estado\nNovo com etiquetas');
  const f = lerFichaVinted(t);
  return (f.estadoChave === 'novo_etiqueta' && f.usada === false) || 'leu ' + JSON.stringify(f.estadoChave);
});

teste('o valor de "Material" para no campo seguinte, não arrasta a página', () => {
  // No texto achatado vem "Poliéster, Lã Cor Vermelho Carregado há 6 horas".
  const f = lerFichaVinted(achatar(BENETTON.texto));
  return f.materiais.every((m) => m.nome.split(/\s+/).length <= 2)
    || 'materiais com lixo colado: ' + JSON.stringify(f.materiais.map((m) => m.nome));
});

teste('uma página de loja normal não tem ficha de Vinted', () => {
  const zara = fs.readFileSync(path.join(__dirname, 'lojas', 'zara-casaco-malha-botao-forrado.txt'), 'utf8');
  return lerFichaVinted(zara) === null || 'leu ficha de Vinted numa página da Zara';
});

teste('uma página que só MENCIONA o Vinted não passa por anúncio', () => {
  const t = 'Blogue: as melhores compras no Vinted este inverno. 20% de desconto na loja.';
  return lerFichaVinted(t) === null || 'tratou um texto sobre o Vinted como anúncio do Vinted';
});

// ─────────────────────────────────────────────────────────────────────
console.log('\n── 3. A etiqueta parcial, e o que a confirma ────────────\n');

teste('Benetton: 60% lana no título + Material "Poliéster, Lã" → 60% lã, 40% poliéster', () => {
  const f = API.parseComposition(API.cortaRecomendados(BENETTON.texto), 'clothing');
  const lido = rotulos([...f].sort((a, b) => b.pct - a.pct));
  return lido === '60% lã, 40% poliéster' || 'leu: ' + (lido || '(nada)');
});

teste('Comptoir: 80% laine + Material "Lã" → fica nos 80%, sem inventar o resto', () => {
  const f = API.parseComposition(API.cortaRecomendados(COMPTOIR.texto), 'clothing');
  const lido = rotulos(f);
  return lido === '80% lã' || 'leu: ' + (lido || '(nada)');
});

teste('o mesmo texto achatado numa linha lê a mesma coisa', () => {
  const f = API.parseComposition(achatar(API.cortaRecomendados(BENETTON.texto)), 'clothing');
  const lido = rotulos([...f].sort((a, b) => b.pct - a.pct));
  return lido === '60% lã, 40% poliéster' || 'leu: ' + (lido || '(nada)');
});

teste('com DUAS fibras em falta, o resto não é dividido (seria invenção)', () => {
  const t = BENETTON.texto.replace('Poliéster, Lã', 'Poliéster, Lã, Elastano');
  const f = API.parseComposition(API.cortaRecomendados(t), 'clothing');
  return rotulos(f) === '60% lã' || 'leu: ' + rotulos(f);
});

teste('a percentagem solta só passa se a fibra for uma das que o Vinted lista', () => {
  // "60% lana" com um campo Material que fala de outra fibra: não há
  // confirmação, e a leitura parcial volta a ser deitada fora.
  const t = BENETTON.texto.replace('Poliéster, Lã', 'Algodão');
  const f = API.parseComposition(API.cortaRecomendados(t), 'clothing');
  return f.length === 0 || 'leu ' + rotulos(f) + ' sem a ficha confirmar a fibra';
});

teste('o guarda da Mango Outlet continua vivo fora do Vinted', () => {
  // "No mínimo 20%" debaixo de um painel de composição, numa loja normal:
  // continua a não ser etiqueta. É o defeito que criou o guarda dos 70%.
  const t = 'COMPOSIÇÃO E CUIDADOS A TER\nQUALIDADES DO ARTIGO\nLINHO\nNo mínimo 20%';
  const f = API.parseComposition(t, 'clothing');
  return f.length === 0 || 'leu ' + rotulos(f) + ' num selo de marketing';
});

// ─────────────────────────────────────────────────────────────────────
console.log('\n── 4. As peças dos outros não entram na análise ─────────\n');

teste('o corte acontece em "Artigos do membro"', () => {
  const t = API.cortaRecomendados(BENETTON.texto);
  if (/Artigos do membro/i.test(t)) return 'a vitrine do vendedor ficou dentro do texto';
  return /60% lana/.test(t) || 'o corte levou a etiqueta da peça com ele';
});

teste('o corte acontece em "Artigos semelhantes"', () => {
  const t = API.cortaRecomendados('Material\nLã\nCasaco 70% lã\nArtigos semelhantes\nOutra peça 100% acrílico');
  return !/acr[íi]lico/i.test(t) || 'a peça do lado ficou dentro do texto';
});

teste('a etiqueta de outra peça do vendedor não chega à análise', () => {
  const t = BENETTON.texto.replace(
    'Artigos do membro',
    'Artigos do membro\nCasaco 100% acrílico\n');
  const f = API.parseComposition(API.cortaRecomendados(t), 'clothing');
  const lido = rotulos([...f].sort((a, b) => b.pct - a.pct));
  return lido === '60% lã, 40% poliéster' || 'leu: ' + (lido || '(nada)');
});

// ─────────────────────────────────────────────────────────────────────
console.log('\n── 5. O endereço: anúncio é peça, vitrine não é ─────────\n');

const URLS = [
  ['https://www.vinted.pt/items/10732248062-cappotto-rosso-benetton-60-lana', 'produto'],
  ['https://www.vinted.fr/items/10682151564-manteau-court-80-laine',          'produto'],
  ['https://www.vinted.it/items/123456-cappotto',                             'produto'],
  ['https://www.vinted.pt/member/12345678',                                   'listagem'],
  ['https://www.vinted.pt/catalog?search_text=casaco+la',                      'listagem'],
];
URLS.forEach(([url, esperado]) => {
  teste(`${esperado}: ${url.replace('https://www.', '')}`, () => {
    const c = classifyUrl(url);
    if (!c.isFashion) return 'não reconhecido como loja de roupa';
    const foi = c.isProduct ? 'produto' : c.isListing ? 'listagem' : 'nenhum dos dois';
    return foi === esperado || 'classificado como ' + foi;
  });
});

// ─────────────────────────────────────────────────────────────────────
console.log('\n── 6. O estado da peça entra na resposta ────────────────\n');

function conclusaoDe(texto, titulo) {
  const fibras = API.parseComposition(API.cortaRecomendados(texto), 'clothing');
  const s = calcScores(fibras, API.cortaRecomendados(texto), '', titulo);
  return conclusionText(s, s.fibers || fibras, detectGarmentType(s, null, 'clothing'));
}

teste('"Muito bom" diz onde a lã bola e manda conferir a etiqueta na foto', () => {
  const t = conclusaoDe(BENETTON.texto, BENETTON.meta.titulo);
  if (!/Muito bom/.test(t)) return 'o estado não aparece na conclusão';
  if (!/bolinha/i.test(t)) return 'não avisa da bolinha numa peça de lã';
  return /foto da etiqueta/i.test(t) || 'não manda conferir a etiqueta nas fotos';
});

teste('"Satisfatório" avisa que a peça tem desgaste assumido', () => {
  const t = conclusaoDe(BENETTON.texto.replace('Estado\nMuito bom', 'Estado\nSatisfatório'),
                        BENETTON.meta.titulo);
  return /desgaste assumido/i.test(t) || 'não avisa do desgaste: ' + t.slice(-160);
});

teste('"Novo com etiquetas" não desconta desgaste nenhum', () => {
  const t = conclusaoDe(BENETTON.texto.replace('Estado\nMuito bom', 'Estado\nNovo com etiquetas'),
                        BENETTON.meta.titulo);
  if (/desgaste a descontar/.test(t) && /não há desgaste a descontar/.test(t)) return true;
  return 'não diz que não há desgaste a descontar: ' + t.slice(-160);
});

teste('numa peça de loja normal nada disto aparece', () => {
  const zara = fs.readFileSync(path.join(__dirname, 'lojas', 'zara-casaco-malha-botao-forrado.txt'), 'utf8');
  const corte = zara.indexOf('\n---\n');
  const t = conclusaoDe(zara.slice(corte + 5), 'CASACO DE MALHA BOTÃO FORRADO');
  return !/quem vende|Estado declarado/i.test(t) || 'frase de segunda mão numa peça da Zara';
});

teste('a confiança desconta a etiqueta que não é da marca', () => {
  const comMarca = confidenceScore({ hasComposition: true, hasGarmentType: true, hasBrand: true });
  const copiada  = confidenceScore({ hasComposition: true, hasGarmentType: true, hasBrand: true,
                                     etiquetaDeTerceiro: true });
  if (copiada.score >= comMarca.score) return `${copiada.score} não é menos que ${comMarca.score}`;
  return copiada.missing.indexOf('etiqueta da marca') >= 0 || 'não diz o que falta';
});

// ─────────────────────────────────────────────────────────────────────
console.log('\n── 7. As duas peças, de ponta a ponta ───────────────────\n');

[[BENETTON, 'casaco', 60], [COMPTOIR, 'casaco', 55]].forEach(([peca, tipo, notaMinima]) => {
  teste(`${peca.meta.titulo.split('|')[0].trim()} → ${tipo}, com calor e nota ≥ ${notaMinima}`, () => {
    const texto = API.cortaRecomendados(peca.texto);
    const fibras = API.parseComposition(texto, 'clothing');
    if (!fibras.length) return 'não leu composição nenhuma';
    const s = calcScores(fibras, texto, '', peca.meta.titulo);
    const t = detectGarmentType(s, null, 'clothing');
    if (t !== tipo) return 'tipo detetado: ' + t;
    const w = warmthScore(s.fibers || fibras);
    if (w == null || w < 60) return 'calor lido: ' + w;
    const nota = Math.round(buyScore(s, t));
    return nota >= notaMinima || 'nota: ' + nota;
  });
});

console.log(`\n${ok} ok · ${falhas} falha(s)\n`);
process.exit(falhas ? 1 : 0);
