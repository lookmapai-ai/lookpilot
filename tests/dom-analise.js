#!/usr/bin/env node
/* Simulador da PÁGINA DE ANÁLISE, partilhado pelos testes.
 *
 * Monta um esboço mínimo de DOM, corre o landing/runtime.js real dentro
 * dele e devolve o que ficou escrito na tela.
 *
 * Vive à parte porque dois testes precisam do mesmo simulador e por
 * razões diferentes:
 *   tests/pagina.js    — a tela monta sem explodir?
 *   tests/coerencia.js — o texto que ficou na tela bate com a peça?
 * Duplicar o simulador era garantir que um dos dois ficasse para trás.
 *
 * Os bindings testados são lidos do analise.html GERADO, para o esboço
 * não divergir da página real.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.join(__dirname, '..');
const RUNTIME = path.join(raiz, 'landing', 'runtime.js');
const PAGINA = path.join(raiz, 'landing', 'analise.html');

/* ---------- bindings reais da página gerada ---------------------- */
const html = fs.readFileSync(PAGINA, 'utf8');
const bindings = (attr) => {
  const re = new RegExp(`${attr}="([^"]+)"`, 'g');
  const out = new Set(); let m;
  while ((m = re.exec(html)) !== null) out.add(m[1]);
  return [...out];
};
const TXT = bindings('data-txt');
const IF = bindings('data-if');

/* ---------- esboço mínimo de DOM --------------------------------- */
function criarDom() {
  // `txt` guarda por binding; `todos` guarda TUDO que foi escrito na tela,
  // venha de onde vier. Os capítulos (01 · A matéria, 02 · O corpo...) são
  // gerados por template repetido e nunca chegam a `txt` — e é exatamente
  // onde apareceu "Abafa: o calor do corpo não sai" num casaco. Sem este
  // apanhado, o teste de coerência olhava para a metade errada da página.
  const registo = { txt: {}, display: {}, todos: [] };

  const anota = (s) => {
    if (typeof s === 'string' && s.trim()) registo.todos.push(s);
  };

  const texto = (s) => {
    anota(String(s));
    return {
      nodeType: 3, textContent: String(s), parentNode: null,
      cloneNode() { return texto(this.textContent); }
    };
  };

  function elemento(attrs, marca) {
    const el = {
      nodeType: 1, _attrs: attrs || {}, _marca: marca || null,
      style: {}, children: [], parentNode: null, textContent: '',
      getAttribute(n) { return n in this._attrs ? this._attrs[n] : null; },
      setAttribute(n, v) { this._attrs[n] = v; },
      get attributes() {
        return Object.keys(this._attrs).map((name) => ({ name, value: this._attrs[name] }));
      },
      closest() { return null; },
      querySelectorAll() { return []; },
      querySelector() { return null; },
      addEventListener() {}, removeEventListener() {}, remove() {},
      cloneNode() { return elemento(Object.assign({}, this._attrs), this._marca); },
      appendChild(n) {
        this.children.push(n);
        if (n && n.textContent) this.textContent += n.textContent;
        if (this._marca) registo.txt[this._marca] = this.textContent;
        return n;
      },
      insertBefore(n) { return this.appendChild(n); }
    };
    // textContent escrito diretamente (setNode faz isso para valores simples)
    return new Proxy(el, {
      set(alvo, prop, valor) {
        alvo[prop] = valor;
        if (prop === 'textContent') anota(valor);
        if (prop === 'textContent' && alvo._marca) registo.txt[alvo._marca] = valor;
        if (prop === 'style' && alvo._marca) registo.display[alvo._marca] = valor.display;
        return true;
      }
    });
  }

  // um elemento por binding encontrado na página real
  const porTxt = TXT.map((k) => elemento({ 'data-txt': k }, k));
  const porIf = IF.map((k) => {
    const el = elemento({ 'data-if': k }, null);
    el._ifKey = k;
    return el;
  });

  const document = {
    title: '',
    readyState: 'complete',
    documentElement: { style: {} },
    addEventListener() {},
    createElement: () => elemento({}),
    createTextNode: texto,
    createDocumentFragment: () => elemento({}),
    querySelector(q) { return this.querySelectorAll(q)[0] || null; },
    querySelectorAll(q) {
      if (q === '[data-txt]') return porTxt;
      if (q === '[data-if]') return porIf;
      if (q === '*') return porTxt.concat(porIf);
      return [];
    }
  };
  document.body = elemento({});
  document.body.querySelectorAll = document.querySelectorAll.bind(document);

  // display dos data-if é escrito em el.style.display (não substitui o objeto)
  porIf.forEach((el) => {
    Object.defineProperty(el.style, 'display', {
      set(v) { registo.display[el._ifKey] = v; },
      get() { return registo.display[el._ifKey]; },
      configurable: true
    });
  });

  return { document, registo };
}

function montar(query) {
  const { document, registo } = criarDom();
  const ctx = {
    document,
    location: { search: query, pathname: '/analise.html', hash: '', href: 'https://x/analise.html' + query, assign() {} },
    URLSearchParams,
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    history: { length: 1, pushState() {}, back() {} },
    performance: { now: () => 0 },
    requestAnimationFrame() {},
    setTimeout() {},
    addEventListener() {},
    removeEventListener() {},
    scrollTo() {},
    matchMedia: () => ({ matches: true }),  // reduced motion: não corre animação
    console
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(RUNTIME, 'utf8'), ctx, { filename: 'runtime.js' });
  return registo;
}

// Atalho: constrói a query a partir de um objeto simples.
const query = (o) => '?' + new URLSearchParams(o).toString();

module.exports = { montar, query, TXT, IF };
