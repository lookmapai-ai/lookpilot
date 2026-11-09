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
// Os bindings de CLIQUE. Sem eles o simulador via a tela mas não conseguia
// tocar nela — e uma funcionalidade que vive de dois toques (escolher duas
// peças) não tinha teste possível. Agora tem.
const CLICK = bindings('data-on-click');
// Atributos interpolados (data-tpl-aria-label, data-tpl-style…). É onde
// vive o que o leitor de ecrã ouve e a largura das barras — ou seja, tudo
// o que não é texto visível mas decide se a tela se entende.
/* QUE ECRÃ É QUE CONTÉM CADA TEXTO.
   A página tem três ecrãs no mesmo ficheiro (relatório, minhas peças,
   comparação) e o runtime escreve TODOS os bindings a cada desenho — até os
   dos ecrãs escondidos. O simulador anotava tudo como se estivesse à vista,
   e isso fez um teste acusar de "assinatura de template" uma frase que vive
   no ecrã das peças salvas e nunca aparece ao lado da análise. Qualquer
   frase fixa que saia do HTML para o runtime cai na mesma armadilha.
   Guardar o ecrã de cada binding resolve a classe: o que está escondido não
   conta como texto que a pessoa leu. */
const DONO = (() => {
  const mapa = {};
  const pilha = [];
  const tags = /<(\/?)([a-zA-Z][\w-]*)([^>]*?)(\/?)>/g;
  const VAZIAS = new Set(['img', 'br', 'hr', 'input', 'meta', 'link', 'source', 'use', 'path', 'circle', 'rect', 'stop']);
  let t;
  while ((t = tags.exec(html))) {
    const fecha = t[1] === '/', nome = t[2].toLowerCase(), attrs = t[3], auto = t[4] === '/';
    if (fecha) { for (let i = pilha.length - 1; i >= 0; i--) { if (pilha[i].nome === nome) { pilha.length = i; break; } } continue; }
    const seIf = (/data-if="([^"]*)"/.exec(attrs) || [, ''])[1];
    const txt = (/data-txt="([^"]*)"/.exec(attrs) || [, ''])[1];
    if (txt) mapa[txt] = pilha.filter((x) => x.seIf).map((x) => x.seIf).concat(seIf ? [seIf] : []);
    if (!auto && !VAZIAS.has(nome)) pilha.push({ nome, seIf });
  }
  return mapa;
})();

const ATTR = (() => {
  const fora = [];
  const re = /data-tpl-([a-z-]+)="([^"]*)"/g;
  let m;
  while ((m = re.exec(html))) {
    if (!fora.some((a) => a.attr === m[1] && a.valor === m[2])) {
      fora.push({ attr: m[1], valor: m[2] });
    }
  }
  return fora;
})();

/* ---------- esboço mínimo de DOM --------------------------------- */
function criarDom() {
  // `txt` guarda por binding; `todos` guarda TUDO que foi escrito na tela,
  // venha de onde vier. Os capítulos (01 · A matéria, 02 · O corpo...) são
  // gerados por template repetido e nunca chegam a `txt` — e é exatamente
  // onde apareceu "Abafa: o calor do corpo não sai" num casaco. Sem este
  // apanhado, o teste de coerência olhava para a metade errada da página.
  const registo = { txt: {}, display: {}, todos: [] };

  // `marca` é o nome do binding, quando se sabe: serve para não anotar
  // texto de um ecrã que está escondido (ver DONO, acima).
  const aVista = (marca) => !marca || (DONO[marca] || [])
    .every((k) => registo.display[k] !== 'none');
  const anota = (s, marca) => {
    if (typeof s === 'string' && s.trim() && aVista(marca)) registo.todos.push(s);
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
      // Procura a sério nos descendentes. Era `return []`, e por isso os
      // blocos repetidos (data-for) nunca chegavam a ser preenchidos: os
      // traços do selo de viagem ficavam INVISÍVEIS para os testes. Foi por
      // aí que "Prende o suor por dentro" escapou num casaco impermeável.
      querySelectorAll(q) {
        const achados = [];
        const anda = (n) => (n.children || []).forEach((c) => {
          if (!c || c.nodeType !== 1) return;
          const tem = q === '*' ? true
            : q === '[data-txt]' ? c.getAttribute('data-txt') != null
            : q === '[data-if]' ? c.getAttribute('data-if') != null
            : q === 'template[data-for]' ? c.getAttribute('data-for') != null
            : q.indexOf('data-on-click') >= 0 || q.indexOf('data-on-keydown') >= 0
              ? (c.getAttribute('data-on-click') != null || c.getAttribute('data-on-keydown') != null)
            : q === '[data-media]' ? c.getAttribute('data-media') != null
            : false;
          if (tem) achados.push(c);
          anda(c);
        });
        anda(this);
        return achados;
      },
      querySelector(q) { return this.querySelectorAll(q)[0] || null; },
      _ouvintes: {},
      addEventListener(tipo, fn) { (this._ouvintes[tipo] = this._ouvintes[tipo] || []).push(fn); },
      // dispara o que o motor de bindings ligou a este elemento
      disparar(tipo, ev) {
        (this._ouvintes[tipo] || []).forEach((fn) => fn(ev || { preventDefault() {}, key: 'Enter' }));
        return (this._ouvintes[tipo] || []).length;
      },
      removeEventListener() {}, remove() {},
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
        if (prop === 'textContent') anota(valor, alvo._marca);
        if (prop === 'textContent' && alvo._marca) registo.txt[alvo._marca] = valor;
        if (prop === 'style' && alvo._marca) registo.display[alvo._marca] = valor.display;
        return true;
      }
    });
  }

  // Blocos repetidos (capítulos, traços do selo, peças guardadas): a página
  // real usa <template data-for="lista" data-as="item">. Sem os reproduzir,
  // tudo o que vive dentro deles nunca é escrito e nenhum teste o vê.
  const FOR = bindings('data-for');
  const AS = bindings('data-as');
  const modelos = FOR.map((lista, i) => {
    const alias = AS[i] || 'item';
    const campos = TXT.filter((k) => k.indexOf(alias + '.') === 0);
    const cliques = CLICK.filter((k) => k.indexOf(alias + '.') === 0);
    const tpl = elemento({ 'data-for': lista, 'data-as': alias });
    tpl.__itens = [];
    // O motor limpa `__rendered` no início de cada desenho da lista. É o
    // sinal de "lista nova": sem isto os alvos de clique de todos os
    // desenhos iam acumulando e o item 0 seria o de um ecrã já ido.
    let desenhados = [];
    Object.defineProperty(tpl, '__rendered', {
      get: () => desenhados,
      set(v) { desenhados = v; if (!v.length) tpl.__itens = []; }
    });
    tpl.content = {
      cloneNode() {
        const frag = elemento({});
        // Guardar o elemento de cada campo POR ITEM. O registo global só
        // conserva a última escrita, e numa lista de linhas comparadas a
        // ordem das linhas é metade do que há para testar.
        const textos = {};
        campos.forEach((k) => {
          const el = elemento({ 'data-txt': k }, k);
          textos[k] = el;
          frag.appendChild(el);
        });
        // um alvo de clique por item da lista: é assim que o teste escolhe
        // a primeira e a segunda peça do modo de comparação
        const alvos = {};
        cliques.forEach((k) => {
          const el = elemento({ 'data-on-click': k });
          alvos[k] = el;
          frag.appendChild(el);
        });
        const attrs = {};
        ATTR.filter((a) => a.valor.indexOf(alias + '.') >= 0).forEach((a) => {
          const el = elemento({ ['data-tpl-' + a.attr]: a.valor });
          attrs[a.attr + '|' + a.valor] = el;
          frag.appendChild(el);
        });
        tpl.__itens.push({ campos: textos, cliques: alvos, attrs: attrs });
        return frag;
      }
    };
    return tpl;
  });

  // um elemento por binding encontrado na página real
  const porTxt = TXT.map((k) => elemento({ 'data-txt': k }, k));
  const porClick = CLICK.filter((k) => k.indexOf('.') < 0).map((k) => elemento({ 'data-on-click': k }));
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
      if (q === 'template[data-for]') return modelos;
      if (q.indexOf('data-on-click') >= 0 || q.indexOf('data-on-keydown') >= 0) return porClick;
      if (q === '*') return porTxt.concat(porIf).concat(modelos).concat(porClick);
      return [];
    }
  };
  document.body = elemento({});
  document.body.querySelectorAll = document.querySelectorAll.bind(document);
  // os modelos precisam de um pai para o insertBefore do motor de bindings
  modelos.forEach((t) => { t.parentNode = document.body; });

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

function montar(query, opcoes) {
  const op = opcoes || {};
  const { document, registo } = criarDom();
  // localStorage a sério (em memória): a comparação lê as peças guardadas
  // de lá, e com um getItem que devolve sempre null nunca haveria duas
  // peças para comparar.
  const guardado = { 'lookpilot-guardadas': JSON.stringify(op.guardadas || []) };
  const ctx = {
    document,
    location: { search: query, pathname: '/analise.html', hash: op.hash || '', href: 'https://x/analise.html' + query, assign(u) { registo.navegou = u; } },
    URLSearchParams,
    localStorage: {
      getItem: (k) => (k in guardado ? guardado[k] : null),
      setItem(k, v) { guardado[k] = v; },
      removeItem(k) { delete guardado[k]; }
    },
    history: { length: 1, pushState(st, t, u) { registo.hist = u; }, back() {} },
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

  // Atalhos para o teste TOCAR na tela. O handler é resolvido no momento do
  // clique (o motor de bindings relê o escopo), por isso isto exercita o
  // caminho real: clique → handler → novo render → nova tela.
  registo.clicar = (nome) => {
    const el = document.querySelectorAll('[data-on-click]')
      .filter((e) => e.getAttribute('data-on-click') === nome)[0];
    if (!el) throw new Error('nada na página ligado a "' + nome + '"');
    if (!el.disparar('click')) throw new Error('"' + nome + '" existe mas não tem handler ligado');
    return registo;
  };
  registo.clicarItem = (lista, indice, nome) => {
    const tpl = document.querySelectorAll('template[data-for]')
      .filter((t) => t.getAttribute('data-for') === lista)[0];
    if (!tpl) throw new Error('lista "' + lista + '" não existe na página');
    const it = (tpl.__itens || [])[indice];
    if (!it || !it.cliques[nome]) throw new Error('item ' + indice + ' de "' + lista + '" sem "' + nome + '"');
    it.cliques[nome].disparar('click');
    return registo;
  };
  // As linhas de uma lista como a página as desenhou, na ordem em que
  // ficaram no ecrã: [{ 'l.rotulo': 'Calor', 'l.aNum': '85', … }, …]
  registo.itens = (lista) => {
    const tpl = document.querySelectorAll('template[data-for]')
      .filter((t) => t.getAttribute('data-for') === lista)[0];
    if (!tpl) throw new Error('lista "' + lista + '" não existe na página');
    return (tpl.__itens || []).map((it) => {
      const linha = {};
      Object.keys(it.campos).forEach((k) => { linha[k] = it.campos[k].textContent; });
      // atributos interpolados, debaixo de '@nome' (o último que tiver
      // valor — há vários style na mesma linha, só um por elemento)
      Object.keys(it.attrs || {}).forEach((k) => {
        const nome = k.split('|')[0];
        const v = it.attrs[k].getAttribute(nome);
        if (v != null) linha['@' + nome] = (linha['@' + nome] ? linha['@' + nome] + ' · ' : '') + v;
      });
      return linha;
    });
  };
  registo.nItens = (lista) => {
    const tpl = document.querySelectorAll('template[data-for]')
      .filter((t) => t.getAttribute('data-for') === lista)[0];
    return tpl ? (tpl.__itens || []).length : 0;
  };
  return registo;
}

// Atalho: constrói a query a partir de um objeto simples.
const query = (o) => '?' + new URLSearchParams(o).toString();

module.exports = { montar, query, TXT, IF };
