#!/usr/bin/env node
/* A CORREÇÃO CHEGA MESMO À PÁGINA?
 *
 * Corre com: node tests/recarregar.js
 *
 * Porque existe: um defeito foi encontrado, corrigido, testado e commitado —
 * e continuou a aparecer. Horas à procura no código, e o código estava certo.
 * O que corria no navegador é que não era aquele.
 *
 * São três maneiras de a correcção não chegar, e do lado de quem usa todas
 * se parecem com "continua avariado":
 *
 *   1. a extensão não foi recarregada;
 *   2. foi, mas a aba já estava aberta — o script antigo fica injectado na
 *      página até ela própria ser recarregada, e responde como se nada fosse;
 *   3. havia uma segunda cópia instalada de uma pasta velha.
 *
 * A 1 e a 3 são da pessoa. A 2 é do software, e é esta que aqui se tranca:
 * ao clicar no ícone, o fundo pergunta à página que versão tem lá dentro e,
 * se for velha, põe lá o código novo por cima — sem ninguém carregar em F5.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.join(__dirname, '..');
// Dá para apontar a um background.js de outra versão sem mexer no ficheiro
// que o Chrome carrega — trocar o ficheiro ao vivo para comparar versões já
// custou caro uma vez (recarregar durante a troca instala o código errado).
const BG = process.env.LP_BG || path.join(raiz, 'background.js');
const VERSAO = JSON.parse(fs.readFileSync(path.join(raiz, 'manifest.json'), 'utf8')).version;

let ok = 0, falhas = 0;
function teste(nome, fn) {
  let r;
  try { r = fn(); } catch (e) { r = e.message; }
  if (r === true) { ok++; console.log('  ✓ ' + nome); }
  else { falhas++; console.log('  ✗ ' + nome + '\n      ' + r); }
}

/* ---------- o Chrome de mentira ----------------------------------- */
// `respostaPing` imita o que o script da página devolve: undefined = não há
// ninguém lá (o Chrome põe lastError), ou { alive, v }.
function clicaNoIcone(respostaPing, { semNinguem = false } = {}) {
  const feito = { injectou: null, scans: 0 };
  let aoClicar = null;
  const chrome = {
    runtime: {
      lastError: undefined,
      getManifest: () => ({ version: VERSAO }),
      onInstalled: { addListener() {} },
      onStartup:   { addListener() {} },
      onMessage:   { addListener() {} },
    },
    action: {
      onClicked: { addListener: (fn) => { aoClicar = fn; } },
      setTitle() {}, setBadgeText() {}, setBadgeBackgroundColor() {},
    },
    tabs: {
      onUpdated:   { addListener() {} },
      onActivated: { addListener() {} },
      query: (_q, cb) => cb([]),
      get: (_id, cb) => cb({ url: 'https://www.zara.com/pt/pt/x-p01.html' }),
      create() {},
      sendMessage: (_id, msg, cb) => {
        if (msg.action === 'scanPage') { feito.scans++; if (cb) cb(); return; }
        if (msg.action === 'ping') {
          if (semNinguem) { chrome.runtime.lastError = { message: 'Receiving end does not exist.' };
                            cb(undefined); return; }
          cb(respostaPing);
        }
      },
    },
    scripting: {
      executeScript: (opcoes, cb) => {
        feito.injectou = opcoes.files;
        // No Chrome, o lastError pertence à chamada que o produziu: já não
        // está lá quando o callback SEGUINTE corre. Sem isto, o erro do ping
        // ficava preso e o "injecta e analisa" parecia não analisar.
        chrome.runtime.lastError = undefined;
        if (cb) cb();
      },
    },
    windows: { create() {} },
  };
  const ctx = { chrome, console, setTimeout, URL };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(BG, 'utf8'), ctx, { filename: 'background.js' });
  if (!aoClicar) throw new Error('o background não registou o clique no ícone');
  aoClicar({ id: 7, url: 'https://www.zara.com/pt/pt/x-p01.html' });
  return feito;
}

console.log('\nA correção chega à página?\n');

teste('página já com o código actual: analisa, sem injectar nada', () => {
  const f = clicaNoIcone({ alive: true, v: VERSAO });
  if (f.injectou) return 'injectou por cima de um script que já era o actual: ' + f.injectou.join(', ');
  return f.scans === 1 || 'não mandou analisar (scans=' + f.scans + ')';
});

teste('aba aberta antes da actualização: põe o código novo por cima', () => {
  // O caso real: a extensão foi recarregada, a aba não. O script antigo
  // continua lá e responde ao ping — sem a versão, era aceite como bom.
  const f = clicaNoIcone({ alive: true, v: '9.1' });
  if (!f.injectou) return 'aceitou o script velho da página e analisou com ele — a correcção não chega';
  if (!f.injectou.includes('content.js')) return 'injectou sem o content.js: ' + f.injectou.join(', ');
  return f.scans === 1 || 'injectou mas não mandou analisar';
});

teste('script velho que nem diz a versão: também é substituído', () => {
  // Antes desta mudança o ping respondia só { alive: true }. Uma página com
  // esse script é, por definição, anterior à correcção.
  const f = clicaNoIcone({ alive: true });
  return !!f.injectou || 'aceitou um script que não sabe dizer que versão é';
});

teste('página sem script nenhum: injecta, como já fazia', () => {
  const f = clicaNoIcone(undefined, { semNinguem: true });
  if (!f.injectou) return 'não injectou numa página sem content script — o clique não faria nada';
  return f.scans === 1 || 'injectou mas não mandou analisar';
});

teste('injecta os quatro ficheiros, na ordem do manifest', () => {
  const f = clicaNoIcone({ alive: true, v: '9.1' });
  const esperado = ['strings.js', 'shared.js', 'categories.js', 'content.js'];
  return JSON.stringify(f.injectou) === JSON.stringify(esperado)
    || 'ordem errada (shared.js depende do strings.js): ' + JSON.stringify(f.injectou);
});

console.log('\n──────────────────────────────────────');
console.log(`${ok} ok · ${falhas} falha(s)\n`);
process.exit(falhas ? 1 : 0);
