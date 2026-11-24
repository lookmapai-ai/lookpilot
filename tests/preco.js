#!/usr/bin/env node
/* O PREÇO QUE A PESSOA PAGA — não o riscado.
 *
 * Corre com: node tests/preco.js
 *
 * O defeito real (Black Friday, nov 2026): o sobretudo de lã com cinto da
 * Mango estava a 119,99 € (−20%) e a análise dizia 149,99 €. A Mango marca
 * DOIS preços para máquinas — o riscado e o atual — e a extensão pegava o
 * primeiro que encontrava, que era o riscado.
 *
 * A classe que este ficheiro fecha: em promoção, a análise e a comparação
 * NUNCA podem mostrar o preço antigo. Duas peças com o mesmo preço riscado
 * e descontos diferentes pareciam custar o mesmo.
 *
 * Usa o precoDoDom() real do content.js contra uma árvore mínima.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

let ok = 0, falhas = 0;
function teste(nome, fn) {
  let r; try { r = fn(); } catch (e) { r = 'explodiu: ' + e.message; }
  if (r === true) { ok++; console.log('  ✓ ' + nome); }
  else { falhas++; console.log('  ✗ ' + nome + '\n      → ' + r); }
}

/* árvore mínima: só o que precoDoDom usa */
function no(tag, attrs = {}, filhos = [], texto = '') {
  const el = {
    tagName: tag.toUpperCase(), attrs, children: filhos, parentElement: null,
    get textContent() { return filhos.length ? filhos.map((f) => f.textContent).join('') : texto; },
    getAttribute: (n) => (n in attrs ? attrs[n] : null),
    querySelectorAll(sel) {
      const out = [];
      (function desce(n) { for (const f of n.children) { if (bate(f, sel)) out.push(f); desce(f); } })(el);
      return out;
    },
    querySelector(sel) { return el.querySelectorAll(sel)[0] || null; },
    closest(sel) { let n = el; while (n) { if (bate(n, sel)) return n; n = n.parentElement; } return null; },
  };
  for (const f of filhos) f.parentElement = el;
  return el;
}
function bate(el, sel) {
  return String(sel).split(',').some((p) => {
    p = p.trim(); let m;
    if (p === '*') return true;
    if (p === '[itemscope]') return 'itemscope' in el.attrs;
    if ((m = /^\[itemprop="([^"]+)"\]$/.exec(p))) return el.attrs.itemprop === m[1];
    if (/^[a-z]+$/i.test(p)) return el.tagName === p.toUpperCase();
    return false;   // os seletores de "zona do produto" caem no body
  });
}

const src = fs.readFileSync(path.join(__dirname, '..', 'content.js'), 'utf8');
const ini = src.indexOf('  const RISCADO_CLASSE');
const fim = src.indexOf('  // Extrai metadados do produto');
if (ini < 0 || fim < 0) { console.log('✗ não encontrei o precoDoDom no content.js'); process.exit(1); }
function lerPreco(corpo) {
  const ctx = { document: { body: corpo, querySelector: () => null }, getComputedStyle: () => ({ textDecorationLine: 'none' }) };
  vm.createContext(ctx);
  return vm.runInContext(src.slice(ini, fim) + '\nprecoDoDom()', ctx);
}
const oferta = (preco, ...marcas) => no('span', { itemprop: 'offers', itemscope: '' },
  [no('meta', { itemprop: 'price', content: preco }), ...marcas]);

console.log('\n── Preço em promoção ───────────────────────────────\n');

teste('Mango: riscado primeiro (classe "crossed"), atual depois → atual', () => {
  const r = lerPreco(no('body', {}, [
    oferta('149.99', no('span', { class: 'y_asRG_crossed' }, [], '149,99 €')),
    oferta('119.99', no('span', { class: 'y_asRG_finalPrice' }, [], '119,99 €')),
  ]));
  return r === '119,99' || 'leu ' + r;
});

teste('preço antigo dentro de <del> → ignora', () => {
  const r = lerPreco(no('body', {}, [oferta('89.90', no('del', {}, [], '89,90')), oferta('59.90')]));
  return r === '59,90' || 'leu ' + r;
});

teste('preço antigo em <s> e classe "price--old" → ignora', () => {
  const r = lerPreco(no('body', {}, [
    oferta('40.00', no('s')), oferta('35.00', no('span', { class: 'price--old' })), oferta('25.00')]));
  return r === '25,00' || 'leu ' + r;
});

teste('Shopify "compare-at-price" → ignora', () => {
  const r = lerPreco(no('body', {}, [oferta('120', no('span', { class: 'compare-at-price' })), oferta('84')]));
  return r === '84,00' || 'leu ' + r;
});

teste('sem promoção: um preço só continua igual', () => {
  const r = lerPreco(no('body', {}, [oferta('49.99')]));
  return r === '49,99' || 'leu ' + r;
});

teste('se todos parecem riscados, fica o mais baixo (nunca o mais alto)', () => {
  const r = lerPreco(no('body', {}, [oferta('100', no('del')), oferta('70', no('del'))]));
  return r === '70,00' || 'leu ' + r;
});

teste('preço no texto com milhar europeu ("1.299,00 €")', () => {
  const r = lerPreco(no('body', {}, [no('span', { itemprop: 'price' }, [], '1.299,00 €')]));
  return r === '1299,00' || 'leu ' + r;
});

console.log('\n── A moeda que a pessoa vê ─────────────────────────\n');
function moeda(preco, m, visivel) {
  const ctx = { document: { body: null, querySelector: () => null } };
  vm.createContext(ctx);
  return vm.runInContext(src.slice(ini, fim) + '\nmoedaVisivel(' + JSON.stringify(preco) + ',' + JSON.stringify(m) + ',' + JSON.stringify(visivel) + ')', ctx);
}
teste('Shein: meta diz USD, a página mostra 37,12€ → EUR', () => {
  const r = moeda('37.12', 'USD', 'PRICE AND AVAILABILITY\n37,12€\nsem taxas');
  return r === 'EUR' || 'ficou ' + r;
});
teste('loja em dólares a sério continua em USD', () => {
  const r = moeda('37.12', 'USD', 'Price $37.12');
  return r === 'USD' || 'ficou ' + r;
});

console.log(`\n${ok} ok · ${falhas} falha(s)\n`);
process.exit(falhas ? 1 : 0);
