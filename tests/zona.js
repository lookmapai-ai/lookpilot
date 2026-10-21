#!/usr/bin/env node
/* A ZONA DA ETIQUETA — e a moldura do site, que não é a peça.
 *
 * Corre com: node tests/zona.js
 *
 * Antes de ler a etiqueta, a extensão procura a ZONA: o bloco de texto à
 * volta de um rótulo de composição ("Composição", "Materiais", "Tecido").
 * É um atalho bom — a etiqueta costuma estar ali ao lado — e corre ANTES
 * do filtro de ruído. Essa pressa é o perigo: o que a zona devolve é usado
 * tal e qual, e o resto da página deixa de ser lido.
 *
 * O defeito real que deu origem a este ficheiro: a Zara pôs "TECIDOS
 * PREMIUM" no menu de categorias. O rótulo "tecido" apanhou-o, a zona
 * passou a ser o MENU inteiro, e o menu foi aceite como etiqueta porque
 * trazia a palavra "PELE" — outra categoria. Resultado: todas as peças da
 * Zara deixaram de ser lidas, sem uma linha de código ter mudado deste
 * lado. A etiqueta estava visível na página o tempo todo.
 *
 * A classe que este teste fecha, e que é maior do que a Zara: a etiqueta
 * de uma peça NUNCA vive no menu, no cabeçalho ou no rodapé do site —
 * esses blocos são iguais em todas as páginas da loja. E uma zona que não
 * traz percentagem nenhuma não é etiqueta: é lista de categorias.
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

/* ---------- DOM de mentira, mas com ÁRVORE ------------------------
 * O teste do acordeão basta-lhe uma lista de elementos soltos. Aqui não:
 * a zona é escolhida subindo e descendo a árvore (closest/querySelectorAll),
 * por isso o pai e os filhos têm de existir a sério.
 */
function no(tag, conteudo, attrs = {}) {
  const filhos = Array.isArray(conteudo) ? conteudo : [];
  const texto  = Array.isArray(conteudo) ? '' : String(conteudo);
  const el = {
    tagName: tag.toUpperCase(), attrs,
    children: filhos, parentElement: null,
    get textContent() {
      return filhos.length ? filhos.map(f => f.textContent).join('\n') : texto;
    },
    get innerText() { return el.textContent; },
    contains(outro) {
      if (outro === el) return true;
      return filhos.some(f => f.contains(outro));
    },
    closest(sel) {
      let n = el;
      while (n) { if (bate(n, sel)) return n; n = n.parentElement; }
      return null;
    },
    querySelectorAll(sel) {
      const fora = [];
      (function desce(n) {
        for (const f of n.children) { if (bate(f, sel)) fora.push(f); desce(f); }
      })(el);
      return fora;
    },
    querySelector(sel) { return el.querySelectorAll(sel)[0] || null; },
    getClientRects: () => [{ width: 10, height: 10 }],
    getAttribute: (n) => (n in attrs ? attrs[n] : null),
    click() {}, dispatchEvent() { return true; }, focus() {},
  };
  for (const f of filhos) f.parentElement = el;
  return el;
}

// Só o que as funções do content.js usam de verdade: nomes de tag, '*',
// [class*="x"], [id*="x"], [role="x"], [aria-x] e #id.
function bate(el, sel) {
  return String(sel).split(',').some((p) => {
    p = p.trim();
    if (!p) return false;
    if (p === '*') return true;
    let m;
    if ((m = /^\[class\*=["']?([^"'\]]+)["']?\s*i?\]$/.exec(p)))
      return new RegExp(m[1], 'i').test(el.attrs.class || '');
    if ((m = /^\[id\*=["']?([^"'\]]+)["']?\s*i?\]$/.exec(p)))
      return new RegExp(m[1], 'i').test(el.attrs.id || '');
    if ((m = /^\[role=["']?([^"'\]]+)["']?\]$/.exec(p)))
      return (el.attrs.role || '') === m[1];
    if ((m = /^\[([a-z-]+)\]$/.exec(p))) return m[1] in el.attrs;
    if ((m = /^#(.+)$/.exec(p))) return (el.attrs.id || '') === m[1];
    if (/^[a-z0-9]+$/i.test(p)) return el.tagName === p.toUpperCase();
    return false;
  });
}

/* ---------- carrega o motor contra essa árvore -------------------- */
function lerPagina(raizDom, { titulo = '', url = 'https://loja.com/peca-p1.html', categoria = null } = {}) {
  const ctx = {
    console, setTimeout, clearTimeout, URL, Set, Map,
    MutationObserver: class { observe() {} disconnect() {} },
    location: { protocol: 'https:', href: url, origin: 'https://loja.com', pathname: '/peca-p1.html' },
    chrome: { runtime: { onMessage: { addListener() {} }, getURL: () => '' },
              storage: { local: { get() {}, set() {}, remove() {} } } },
  };
  ctx.window = { open() {} };
  ctx.document = {
    body: raizDom,
    documentElement: raizDom,
    title: titulo,
    getElementById: (id) => raizDom.querySelectorAll('#' + id)[0] || null,
    querySelector: (s) => raizDom.querySelector(s),
    querySelectorAll: (s) => raizDom.querySelectorAll(s),
    addEventListener() {}, dispatchEvent() {},
    createElement: () => ({ style: {}, setAttribute() {}, appendChild() {},
      querySelector: () => ({ addEventListener() {} }), remove() {}, getAttribute: () => null }),
  };
  vm.createContext(ctx);
  for (const f of ['strings.js', 'shared.js', 'categories.js']) {
    vm.runInContext(fs.readFileSync(path.join(raiz, f), 'utf8'), ctx, { filename: f });
  }
  const src = fs.readFileSync(path.join(raiz, 'content.js'), 'utf8')
    .replace('(function() {', 'var _api = (function() {')
    .replace(/\}\)\(\);\s*$/, '  return { extractAllText, parseComposition, findCompositionZone };\n})();');
  vm.runInContext(src, ctx, { filename: 'content.js' });
  // Como o tryScan faz: a categoria SAI do texto lido. É um passo decisivo —
  // se a zona estiver errada, a categoria sai errada com ela, e uma camisa
  // julgada "calçado" abre a porta ao Pass 2 (materiais sem percentagem).
  const texto = ctx._api.extractAllText();
  const cat = categoria || ctx.detectCategory(texto.slice(0, 3000), url, titulo);
  return { texto, categoria: cat, fibras: ctx._api.parseComposition(texto, cat) };
}

/* ---------- o menu da loja, igual em todas as páginas ------------- */
// Categorias verdadeiras do menu da Zara em Outubro de 2026. Duas delas são
// armadilha: "TECIDOS PREMIUM" bate no rótulo "tecido", e "PELE" é palavra
// de material — juntas faziam o menu passar por etiqueta.
const CATEGORIAS = ['VER TUDO', 'BEST SELLERS', 'CAMISOLAS | CARDIGANS', 'CALÇAS DE GANGA',
                    'PELE', 'T-SHIRTS', 'CAMISAS', 'TECIDOS PREMIUM', 'BLAZERS', 'PERFUMES'];

function menu(tag = 'nav') {
  return no(tag, [no('ul', CATEGORIAS.map(c => no('li', [no('span', c)])))]);
}

// A peça: a etiqueta visível na página, como a Zara a publica hoje.
function peca() {
  return no('div', [
    no('h1', 'CASACO DE MALHA BOTÃO FORRADO'),
    no('p', 'Casaco de gola alta e manga comprida.'),
    no('div', [
      no('button', 'COMPOSIÇÃO, CUIDADOS E ORIGEM'),
      no('div', [no('span', 'Composição: 53% viscose, 47% poliamida')]),
    ]),
  ]);
}

const nomes = (f) => f.map((x) => x.name || x.fiber || x.label || '').join(' ').toLowerCase();

console.log('\nA zona da etiqueta — e a moldura do site\n');

/* ---------- a classe: a moldura do site não é a peça -------------- */
for (const [tag, onde] of [['nav', 'o menu de categorias'],
                           ['header', 'o cabeçalho'],
                           ['footer', 'o rodapé']]) {
  teste(`lê a etiqueta com "TECIDOS PREMIUM" em ${onde}`, () => {
    const { fibras } = lerPagina(no('body', [menu(tag), peca()]),
                                 { titulo: 'CASACO DE MALHA BOTÃO FORRADO | ZARA' });
    const lidas = nomes(fibras);
    if (!fibras.length) return 'não leu composição nenhuma — a página tem "53% viscose, 47% poliamida" à vista';
    if (!/viscose/.test(lidas)) return 'leu "' + lidas.trim() + '" em vez da etiqueta da peça';
    return true;
  });
}

teste('a camisa oxford não é lida como pele (a peça do retorno)', () => {
  // A cadeia inteira, reproduzida a partir da página real:
  //   1. "TECIDOS PREMIUM" no menu bate no rótulo "tecido";
  //   2. a zona passa a ser o menu;
  //   3. o motor lê esse texto e decide que a peça é CALÇADO (detectCategory
  //      devolve "shoes" para uma lista de categorias de loja);
  //   4. não sendo roupa, entra o Pass 2 — materiais sem percentagem — e
  //      tira do menu "tecido" a 100% e "PELE" a 15%.
  // Resultado: uma camisa de 56% algodão analisada como pele. Pior do que
  // não ler: ler com confiança o que não está lá.
  const { fibras } = lerPagina(no('body', [
    menu(),
    no('div', [no('h1', 'CAMISA BÁSICA OXFORD'),
               no('p', 'Camisa com colarinho de lapela e manga comprida.'),
               no('span', 'Composição: 56% algodão, 44% poliéster')]),
  ]), { titulo: 'CAMISA BÁSICA OXFORD - Azul-celeste | ZARA Portugal',
        url: 'https://www.zara.com/pt/pt/camisa-basica-oxford-p08741239.html' });
  const lidas = nomes(fibras);
  if (/pele|couro|leather/.test(lidas)) return 'leu "' + lidas.trim() + '" numa camisa de algodão';
  return /algod/.test(lidas) || 'não leu o algodão da etiqueta: ' + (lidas.trim() || 'nada lido');
});

teste('o menu por [role="navigation"], sem tag <nav>', () => {
  const m = no('div', [no('ul', CATEGORIAS.map(c => no('li', [no('span', c)])))], { role: 'navigation' });
  const { fibras } = lerPagina(no('body', [m, peca()]));
  return /viscose/.test(nomes(fibras)) || 'o menu entrou na leitura: ' + (nomes(fibras).trim() || 'nada lido');
});

teste('uma zona sem percentagem nenhuma não é etiqueta', () => {
  // Lista de categorias isolada, sem a peça por baixo: não pode virar
  // composição só porque diz "PELE" e "TECIDOS".
  const { fibras } = lerPagina(no('body', [no('div', [no('span', 'TECIDOS PREMIUM'), no('span', 'PELE')])]));
  return fibras.length === 0 || 'inventou composição a partir de nomes de categoria: ' + nomes(fibras).trim();
});

/* ---------- e o que tem de continuar a funcionar ------------------ */
teste('a zona verdadeira continua a ganhar à página toda', () => {
  const { fibras } = lerPagina(no('body', [
    menu(),
    no('div', [no('h2', 'Composição'), no('span', '100% algodão')]),
    no('div', [no('p', 'Outras peças: 100% poliéster')]),
  ]));
  const lidas = nomes(fibras);
  return (/algod/.test(lidas) && !/poli[ée]ster/.test(lidas))
    || 'devia ler só o algodão da zona, leu: ' + lidas.trim();
});

/* ---------- a zona fraca, que não pode sequestrar a página -------
 * A correcção da moldura do site tirou à zona fraca o poder de ganhar a uma
 * zona forte, mas deixou-lhe outro: quando não havia zona forte NENHUMA, a
 * fraca continuava a ser devolvida — e deitava fora a página inteira. Basta
 * uma peça com a etiqueta solta no texto, sem rótulo "Composição" por perto,
 * numa loja cujo menu não usa <nav>.
 *
 * Os dois testes de mala abaixo não chegaram a falhar: são guardas da
 * fronteira do Pass 2 (malas e sapatos aceitam material sem percentagem),
 * que é por onde uma leitura errada de material sairia se a zona voltasse
 * a sequestrar a página.
 */
function menuSemNav() {
  return no('div', [no('ul', CATEGORIAS.map(c => no('li', [no('span', c)])))]);
}

teste('uma mala com etiqueta a sério não vira pele por causa do menu', () => {
  const { fibras } = lerPagina(no('body', [
    menuSemNav(),
    no('div', [no('h1', 'MALA COMBINADA COM POMPÕES'),
               no('span', 'Composição: 92% algodão, 8% ráfia')]),
  ]), { titulo: 'MALA COMBINADA COM POMPÕES | ZARA', categoria: 'bags' });
  const lidas = nomes(fibras);
  if (/pele|couro|leather/.test(lidas)) return 'leu "' + lidas.trim() + '" — a palavra veio do menu, não da peça';
  return /algod/.test(lidas) || 'não leu o algodão da etiqueta: ' + (lidas.trim() || 'nada lido');
});

teste('a peça com etiqueta solta não se perde no menu sem <nav>', () => {
  const { fibras } = lerPagina(no('body', [
    menuSemNav(),
    no('div', [no('h1', 'BLUSÃO ACOLCHOADO'), no('span', '100% poliéster')]),
  ]), { titulo: 'BLUSÃO ACOLCHOADO | ZARA' });
  return /poli[ée]ster/.test(nomes(fibras)) || 'perdeu a etiqueta: ' + (nomes(fibras).trim() || 'nada lido');
});

teste('uma mala de poliéster não vira pele (couro) pela palavra "sintética"', () => {
  // Guarda, não reprodução. Veio de um retorno — "leu poliéster como pele" —
  // que não se conseguiu reproduzir: em Portugal diz-se pele ao couro, e o
  // motor não conhece "pele", conhece "couro". A cadeia plausível é esta: se
  // o menu sequestrar a zona, o Pass 1 fica sem nada e o Pass 2 cai no
  // apanha-tudo dos sintéticos ("sint[eé]tico|faux|vegan leather|pu |pvc"),
  // que a descrição da peça tem — 100% couro sintético numa mala cuja
  // etiqueta diz 100% poliéster. Fica a trancar essa porta.
  const { fibras } = lerPagina(no('body', [
    menuSemNav(),
    no('div', [no('h1', 'MALA EFEITO PELE'),
               no('p', 'Mala de ombro em pele sintética com fecho magnético.'),
               no('span', 'Composição: 100% poliéster')]),
  ]), { titulo: 'MALA EFEITO PELE | ZARA', categoria: 'bags' });
  const lidas = nomes(fibras);
  if (/couro|leather/.test(lidas)) return 'leu "' + lidas.trim() + '" numa mala que publica 100% poliéster';
  return /poli[ée]ster/.test(lidas) || 'não leu o poliéster da etiqueta: ' + (lidas.trim() || 'nada lido');
});

teste('a mala sem percentagem nenhuma continua a ser lida pelo material', () => {
  // O Pass 2 existe para isto e tem de continuar a funcionar: malas e sapatos
  // declaram "Pele" sem percentagem nenhuma.
  const { fibras } = lerPagina(no('body', [
    no('div', [no('h1', 'MALA DE OMBRO EM PELE'),
               no('span', 'Composição'), no('span', 'Pele')]),
  ]), { titulo: 'MALA DE OMBRO EM PELE | ZARA', categoria: 'bags' });
  return /pele|couro|leather/.test(nomes(fibras)) || 'deixou de ler a mala de pele verdadeira: ' + (nomes(fibras).trim() || 'nada lido');
});

console.log('\n──────────────────────────────────────');
console.log(`${ok} ok · ${falhas} falha(s)\n`);
process.exit(falhas ? 1 : 0);
