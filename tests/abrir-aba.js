#!/usr/bin/env node
/* O card é mesmo clicável, e os botões dele abrem mesmo?
 *
 * "Ver análise completa →" era um <a target="_blank"> dentro da página da
 * loja. Na Zara o clique não fazia nada — sem erro, sem aviso — porque a loja
 * vigia os scripts de terceiros e engole o clique. Todos os testes passavam:
 * nenhum olhava para QUEM abre a aba.
 *
 * A regra agora: quem abre é o Chrome (background → chrome.tabs.create),
 * nunca a página. Este teste cobre a classe toda, não só aquele botão:
 *   1. nenhum link ou window.open no content.js escapa desse caminho;
 *   2. o clique pede a aba ao background, e só uma aba abre;
 *   3. o background abre os destinos da extensão e recusa o resto;
 *   4. o card entra na camada de topo — senão a gaveta da loja come o clique.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.join(__dirname, '..');
const CONTENT = fs.readFileSync(path.join(raiz, 'content.js'), 'utf8');
const BACKGROUND = fs.readFileSync(path.join(raiz, 'background.js'), 'utf8');

let ok = 0, falhas = 0;
function teste(nome, fn) {
  let r;
  try { r = fn(); } catch (e) { r = e.message; }
  if (r === true) { ok++; console.log('  ✓ ' + nome); }
  else { falhas++; console.log('  ✗ ' + nome + '\n      ' + r); }
}

console.log('\nAbrir aba — o card não depende da página da loja\n');

/* ---------- 1. nada escapa do caminho ---------------------------- */
teste('todo link target="_blank" do card passa pelo Chrome (data-lp-abrir)', () => {
  const links = CONTENT.match(/<a\b[^>]*target="_blank"[^>]*>/g) || [];
  const soltos = links.filter((a) => !a.includes('data-lp-abrir'));
  if (!links.length) return 'nenhum link encontrado — o teste deixou de olhar para o card';
  return soltos.length === 0 || `link sem data-lp-abrir: ${soltos[0].slice(0, 80)}…`;
});

teste('window.open só existe como plano B dentro de abrirAba', () => {
  const corpo = (CONTENT.match(/function abrirAba\(url\) \{[\s\S]*?\n  \}\n/) || [''])[0];
  const total = (CONTENT.match(/window\.open\(/g) || []).length;
  const dentro = (corpo.match(/window\.open\(/g) || []).length;
  return total === dentro || `${total - dentro} window.open fora de abrirAba`;
});

teste('o card de resultado liga os links a abrirAba', () =>
  /mostraCard\(card\);[\s\S]{0,300}ligaAbrirAba\(card\)/.test(CONTENT) ||
  'ligaAbrirAba(card) não é chamado depois de o card entrar na página');

/* ---------- 2. o clique, simulado -------------------------------- */
function carregaContent(chromeStub, abertas) {
  const src = CONTENT
    .replace('(function() {', 'var _api = (function() {')
    .replace(/\}\)\(\);\s*$/, '  return { abrirAba, ligaAbrirAba, mostraCard, mantemVivo };\n})();');
  const ctx = {
    chrome: chromeStub,
    location: { protocol: 'https:', href: 'https://www.zara.com/pt/pt/x-p01.html', origin: 'https://www.zara.com', pathname: '/pt/pt/x-p01.html' },
    MutationObserver: class { observe() {} },
    URL, console, setTimeout,
  };
  ctx.window = { open: (u) => abertas.push(['pagina', u]) };
  ctx.MutationObserver = class { constructor(cb) { this._cb = cb; } observe(alvo) { if (alvo) alvo.observado = this._cb; } };
  ctx.entraram = [];
  ctx.document = { body: { appendChild: (n) => ctx.entraram.push(n) }, documentElement: {},
                   getElementById: () => null, querySelectorAll: () => [] };
  vm.createContext(ctx);
  for (const f of ['strings.js', 'shared.js', 'categories.js']) {
    vm.runInContext(fs.readFileSync(path.join(raiz, f), 'utf8'), ctx, { filename: f });
  }
  vm.runInContext(src, ctx);
  return { ...ctx._api, entraram: ctx.entraram };
}

function linkFalso(href) {
  const ouvintes = [];
  return {
    href,
    addEventListener: (tipo, fn) => ouvintes.push({ tipo, fn }),
    clica() {
      const ev = { prevenido: false, parado: false,
        preventDefault() { this.prevenido = true; }, stopPropagation() { this.parado = true; } };
      ouvintes.filter((o) => o.tipo === 'click').forEach((o) => o.fn(ev));
      return ev;
    },
  };
}

function cardFalso() {
  return { attrs: {}, inert: true, observado: null,
    setAttribute(n, v) { this.attrs[n] = v; },
    removeAttribute(n) { delete this.attrs[n]; },
    hasAttribute(n) { return n in this.attrs; },
    showPopover() {} };
}

const URL_ANALISE = 'https://www.lookpilotapp.com/analise.html?score=85';

teste('clicar pede a aba ao Chrome e abre UMA aba', () => {
  const abertas = [];
  const chromeStub = { runtime: {
    lastError: undefined,
    onMessage: { addListener() {} },
    sendMessage: (msg, cb) => { abertas.push(['chrome', msg.url]); cb({ ok: true }); },
  } };
  const api = carregaContent(chromeStub, abertas);
  const a = linkFalso(URL_ANALISE);
  api.ligaAbrirAba({ querySelectorAll: () => [a] });
  const ev = a.clica();
  if (!ev.prevenido) return 'o clique não foi travado — o link da página também abriria';
  if (abertas.length !== 1) return `${abertas.length} abas abertas: ${JSON.stringify(abertas)}`;
  return abertas[0][0] === 'chrome' && abertas[0][1] === URL_ANALISE || JSON.stringify(abertas);
});

teste('extensão recarregada (aba órfã): cai no plano B, uma aba só', () => {
  const abertas = [];
  const chromeStub = { runtime: {
    onMessage: { addListener() {} },
    sendMessage: () => { throw new Error('Extension context invalidated.'); },
  } };
  const api = carregaContent(chromeStub, abertas);
  api.abrirAba(URL_ANALISE);
  return abertas.length === 1 && abertas[0][0] === 'pagina' || JSON.stringify(abertas);
});

/* ---------- 3. o background -------------------------------------- */
function carregaBackground() {
  const criadas = [];
  let ouvinte = null;
  const noop = { addListener() {} };
  const chromeStub = {
    runtime: { onMessage: { addListener: (f) => { ouvinte = f; } }, onInstalled: noop, onStartup: noop, lastError: undefined },
    tabs: { create: (o) => criadas.push(o.url), query: (_q, cb) => cb && cb([]), onUpdated: noop, onActivated: noop, get: () => {}, sendMessage: () => {} },
    action: noop, windows: { create() {} }, scripting: {},
  };
  chromeStub.action = new Proxy({}, { get: (_t, k) => (k === 'onClicked' ? noop : () => {}) });
  const ctx = vm.createContext({ chrome: chromeStub, console, URL, setTimeout });
  vm.runInContext(BACKGROUND, ctx);
  return { criadas, envia: (msg) => { let r; ouvinte(msg, {}, (x) => { r = x; }); return r; } };
}

teste('background abre a análise e responde (sem resposta abriria duas)', () => {
  const bg = carregaBackground();
  const r = bg.envia({ action: 'abrirAba', url: URL_ANALISE });
  if (bg.criadas.length !== 1) return `${bg.criadas.length} abas criadas`;
  return (r && r.ok) || 'não respondeu ao card';
});

teste('background recusa destino que não é da extensão', () => {
  const bg = carregaBackground();
  bg.envia({ action: 'abrirAba', url: 'https://site-qualquer.com/' });
  return bg.criadas.length === 0 || 'abriu endereço de fora';
});

/* ---------- 4. o card por cima de tudo --------------------------- */
teste('nenhum card entra na página sem passar por mostraCard', () => {
  const soltos = (CONTENT.match(/document\.body\.appendChild\(card\)/g) || []).length;
  const viaHelper = (CONTENT.match(/mostraCard\(card\)/g) || []).length;
  if (viaHelper < 3) return `só ${viaHelper} cards usam mostraCard (loading, resultado e não-encontrado são 3)`;
  // o único appendChild permitido é o que vive DENTRO de mostraCard
  return soltos === 1 || `${soltos - 1} card(s) entram na página por fora de mostraCard`;
});

teste('mostraCard põe o card na camada de topo (popover)', () => {
  const api = carregaContent({ runtime: { onMessage: { addListener() {} } } }, []);
  let mostrado = false;
  const card = cardFalso();
  card.showPopover = () => { mostrado = true; };
  api.mostraCard(card);
  if (api.entraram.length !== 1) return 'o card não chegou a entrar na página';
  if (!mostrado) return 'showPopover não foi chamado — a gaveta da loja volta a comer o clique';
  return card.attrs.popover === 'manual' || 'o card não foi marcado como popover';
});

teste('navegador sem camada de topo: o card continua a aparecer', () => {
  const api = carregaContent({ runtime: { onMessage: { addListener() {} } } }, []);
  const card = cardFalso();
  card.showPopover = () => { throw new Error('showPopover is not a function'); };
  api.mostraCard(card);
  if (api.entraram.length !== 1) return 'o card não chegou a entrar na página';
  return card.attrs.popover === undefined || 'ficou marcado como popover mesmo sem suporte';
});

teste('a loja marca o card como inert: o card tira a marca', () => {
  const api = carregaContent({ runtime: { onMessage: { addListener() {} } } }, []);
  const card = cardFalso();
  card.attrs.inert = '';          // a loja marcou, como a Zara faz ao abrir a gaveta
  api.mantemVivo(card);
  return (card.attrs.inert === undefined && card.inert === false) ||
    'o card ficou inert — desenhado na tela, mas surdo ao clique';
});

teste('o card vigia a marca: se a loja puser inert outra vez, sai de novo', () => {
  const api = carregaContent({ runtime: { onMessage: { addListener() {} } } }, []);
  const card = cardFalso();
  api.mantemVivo(card);
  if (!card.observado) return 'ninguém vigia o atributo — a gaveta mata o card na segunda vez';
  card.attrs.inert = '';
  card.observado();               // a loja voltou a marcar
  return card.attrs.inert === undefined || 'a marca ficou na segunda vez';
});

console.log(`\n${ok} ok · ${falhas} falha(s)\n`);
process.exit(falhas ? 1 : 0);
