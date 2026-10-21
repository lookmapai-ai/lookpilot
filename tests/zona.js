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
function lerPagina(raizDom, { titulo = '', url = 'https://loja.com/peca-p1.html' } = {}) {
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
  const texto = ctx._api.extractAllText();
  return { texto, fibras: ctx._api.parseComposition(texto, 'clothing') };
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

console.log('\n──────────────────────────────────────');
console.log(`${ok} ok · ${falhas} falha(s)\n`);
process.exit(falhas ? 1 : 0);
