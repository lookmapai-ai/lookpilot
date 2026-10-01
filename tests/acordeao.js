#!/usr/bin/env node
/* A etiqueta que está a UM CLIQUE de distância.
 *
 * O defeito que mais se repete nas lojas não é de leitura: é a página que
 * publica a composição dentro de um painel fechado. A pessoa vê "Não
 * consegui ler a composição" numa página que a tem.
 *
 * Já aconteceu três vezes, com causas diferentes:
 *   Decathlon — painel "Especificações", <button> sem aria-expanded;
 *   Reserved  — modal "Material e cuidados";
 *   C&A UE    — <button> escrito só "Material", sem aria-expanded, e a
 *               palavra "Composition" só aparece DEPOIS de abrir.
 *
 * Este teste cobre a classe: dado um rótulo de painel de ficha, a extensão
 * clica — e não clica no que é navegação (links), que mudaria de página.
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

/* ---------- DOM de mentira, só o que a função toca ---------------- */
function elemento({ tag = 'BUTTON', texto = '', dentroDeLink = false, aria = null, filhos = 0 }) {
  const el = {
    tagName: tag, textContent: texto, cliques: 0,
    children: { length: filhos },
    getAttribute: (n) => (n === 'aria-expanded' ? aria : null),
    getClientRects: () => [{ width: 100, height: 20 }],
    closest: (sel) => {
      if (/a\[href\]/.test(sel)) return dentroDeLink ? { tagName: 'A' } : null;
      if (/button/.test(sel) && tag === 'BUTTON') return el;
      return null;
    },
    click() { el.cliques++; },
    dispatchEvent() { el.cliques++; return true; },
    focus() {},
  };
  return el;
}

function corre(elementos) {
  const ctx = {
    console, setTimeout, URL, MutationObserver: class { observe() {} },
    location: { protocol: 'https:', href: 'https://loja.com/p/1', origin: 'https://loja.com', pathname: '/p/1' },
    chrome: { runtime: { onMessage: { addListener() {} } }, storage: { local: { set() {}, remove() {} } } },
  };
  ctx.window = { open() {} };
  ctx.document = {
    body: { appendChild() {}, innerText: '' },
    documentElement: {},
    getElementById: () => null,
    querySelector: () => null,
    // Só a consulta dos candidatos devolve elementos. As outras (painéis já
    // abertos, modais) têm de vir vazias, senão o próprio botão passaria por
    // "a composição já está aberta" e a função desistia de clicar.
    querySelectorAll: (sel) => (/button|role="button"/.test(sel) && !/dialog/.test(sel) ? elementos : []),
    title: '',
    addEventListener() {},
    dispatchEvent() {},
    createElement: () => ({ style: {}, setAttribute() {}, appendChild() {} }),
  };
  vm.createContext(ctx);
  for (const f of ['strings.js', 'shared.js', 'categories.js']) {
    vm.runInContext(fs.readFileSync(path.join(raiz, f), 'utf8'), ctx, { filename: f });
  }
  const src = fs.readFileSync(path.join(raiz, 'content.js'), 'utf8')
    .replace('(function() {', 'var _api = (function() {')
    .replace(/\}\)\(\);\s*$/, '  return { autoExpandAccordions };\n})();');
  vm.runInContext(src, ctx, { filename: 'content.js' });
  ctx._api.autoExpandAccordions();
  return elementos;
}

console.log('\nAcordeão — a etiqueta a um clique de distância\n');

/* ---------- os rótulos que têm de abrir --------------------------- */
const ROTULOS = [
  ['Material', 'C&A UE: o painel da etiqueta é um botão escrito só "Material"'],
  ['Materiais', 'a mesma loja em português'],
  ['Composição', 'o caso óbvio, que já funcionava'],
  ['Material e cuidados', 'Reserved'],
  ['Especificações', 'Decathlon'],
  ['Ficha técnica', 'ficha técnica de loja desportiva'],
];

for (const [rotulo, porque] of ROTULOS) {
  teste(`abre o painel "${rotulo}" (${porque})`, () => {
    const botao = elemento({ texto: rotulo });
    corre([botao]);
    return botao.cliques > 0 || 'ninguém clicou — a página fica a dizer que não tem composição';
  });
}

/* ---------- e o que NÃO pode ser clicado -------------------------- */
teste('não clica em "Material" que é link de navegação', () => {
  const link = elemento({ tag: 'A', texto: 'Material' });
  corre([link]);
  return link.cliques === 0 || 'clicou num link — a loja muda de página e a análise morre';
});

teste('não clica em texto dentro de um link', () => {
  const span = elemento({ tag: 'SPAN', texto: 'Materiais', dentroDeLink: true });
  corre([span]);
  return span.cliques === 0 || 'clicou dentro de um link';
});

teste('não clica em secção de navegação com rótulo comprido', () => {
  const nav = elemento({ texto: 'Materiais sustentáveis: conheça o nosso compromisso com o algodão biológico' });
  corre([nav]);
  return nav.cliques === 0 || 'clicou num bloco que não é painel de ficha';
});

console.log(`\n${ok} ok · ${falhas} falha(s)\n`);
process.exit(falhas ? 1 : 0);
