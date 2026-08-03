#!/usr/bin/env node
/* ACERVO — o motor contra páginas reais das lojas.
 *
 *   node tests/acervo.js            corre e denuncia o que está estranho
 *   node tests/acervo.js --lista    mostra a leitura de cada peça
 *
 * Porque existe: todo teste deste repositório foi escrito DEPOIS de alguém
 * encontrar o defeito numa peça real. Isso impede a volta do defeito, mas
 * não encontra o próximo — quem encontra continua a ser a pessoa, print a
 * print. E os defeitos que mais custaram não eram de lógica: eram de
 * LEITURA de página real (um dois-pontos, um acordeão fechado, um rótulo
 * de zona em espanhol). Esse tipo não se descobre a pensar.
 *
 * Como funciona: tests/lojas/*.txt guarda o texto REAL de páginas de
 * produto, tal como a extensão o lê. Este ficheiro passa cada uma pelo
 * caminho completo e aplica SUSPEITAS — regras que apontam resultado
 * absurdo sem que ninguém saiba de antemão qual é o defeito.
 *
 * A diferença para os outros testes: os outros verificam o que já
 * sabemos. Este procura o que ainda não sabemos.
 *
 * Para acrescentar uma peça: guarde um .txt novo em tests/lojas/ com o
 * cabeçalho abaixo. Não é preciso mexer em código nenhum.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.join(__dirname, '..');
const PASTA = path.join(__dirname, 'lojas');

// ─── motor + extensão, como o tests/run.js faz ───────────────────────
['shared.js', 'categories.js'].forEach((f) => {
  vm.runInThisContext(fs.readFileSync(path.join(raiz, f), 'utf8'), { filename: f });
});
global.window = {};
global.location = { href: 'https://loja.com/produto-p1.html' };
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
  .replace(/\}\)\(\);\s*$/, '  return { parseComposition, splitIntoSections, findPrimarySection, cortaRecomendados };\n})();');
vm.runInThisContext('global._api = ' + src, { filename: 'content.js' });
const API = global._api;

// ─── lê as peças guardadas ───────────────────────────────────────────
// Formato: linhas "chave: valor" até uma linha "---", depois o texto da
// página. Simples de propósito — guardar peça nova não pode dar trabalho.
function carregar() {
  if (!fs.existsSync(PASTA)) return [];
  return fs.readdirSync(PASTA).filter((f) => f.endsWith('.txt')).sort().map((f) => {
    const bruto = fs.readFileSync(path.join(PASTA, f), 'utf8');
    const corte = bruto.indexOf('\n---\n');
    const cab = corte < 0 ? '' : bruto.slice(0, corte);
    const texto = corte < 0 ? bruto : bruto.slice(corte + 5);
    const meta = { ficheiro: f };
    cab.split('\n').forEach((l) => {
      const m = /^([a-z_]+):\s*(.*)$/.exec(l.trim());
      if (m) meta[m[1]] = m[2];
    });
    return { meta, texto };
  });
}

// ─── passa a peça pelo motor, tal como o navegador faz ───────────────
function analisar(peca) {
  // A extensão corta a página no primeiro carrossel de recomendados antes de
  // ler seja o que for; o acervo tem de fazer o mesmo, senão mede um motor
  // que não existe. Não é detalhe: a t-shirt de algodão da Decathlon aparecia
  // com Coolmax, que é de OUTRO produto listado ali abaixo.
  const texto = API.cortaRecomendados ? API.cortaRecomendados(peca.texto) : peca.texto;
  const titulo = peca.meta.titulo || '';
  const categoria = peca.meta.categoria || 'clothing';

  const seccoes = API.splitIntoSections(texto);
  const primaria = API.findPrimarySection(seccoes, categoria);
  const fibras = (primaria && primaria.fibers && primaria.fibers.length)
    ? primaria.fibers
    : API.parseComposition(texto, categoria);

  const s = calcScores(fibras, texto, '', titulo);
  const tipo = detectGarmentType(s, null, categoria);
  const nota = fibras.length ? Math.round(buyScore(s, tipo)) : null;
  const cardTexto = fibras.length ? conclusionText(s, s.fibers || fibras, tipo) : '';

  return { fibras, s, tipo, nota, cardTexto, seccoes };
}

// ─── SUSPEITAS ───────────────────────────────────────────────────────
// Cada uma aponta um resultado que não se sustenta, sem precisar de saber
// qual é o defeito por trás. É isto que apanha o que ainda não sabemos.
const SUSPEITAS = [
  {
    id: 'composicao-nao-lida',
    porque: 'a página tem percentagens mas o motor não leu fibra nenhuma',
    ve: (r, p) => /\d\s?%/.test(p.texto) && r.fibras.length === 0
  },
  {
    id: 'soma-nao-fecha',
    porque: 'uma etiqueta só pode somar 100% — acima disso houve zonas juntas',
    ve: (r) => {
      const soma = r.fibras.reduce((a, f) => a + (f.pct || 0), 0);
      return r.fibras.length > 0 && soma > 105;
    }
  },
  {
    id: 'peca-resumida-por-fibra-minoritaria',
    porque: 'a fibra dominante lida tem percentagem pequena — sinal de que o motor ficou com a zona errada (forro, punho, pele sintética)',
    ve: (r) => {
      if (!r.fibras.length) return false;
      const maior = Math.max(...r.fibras.map((f) => f.pct || 0));
      const soma = r.fibras.reduce((a, f) => a + (f.pct || 0), 0);
      return maior <= 30 && soma <= 60;
    }
  },
  {
    id: 'muitas-zonas-uma-lida',
    porque: 'a página declara várias zonas com percentagem e só uma sobreviveu — pode ser corte certo, pode ser separador a apagar as outras',
    ve: (r, p) => {
      const zonas = (p.texto.match(/\b\d{1,3}(?:[.,]\d)?\s?%/g) || []).length;
      return zonas >= 6 && r.fibras.length === 1;
    },
    aviso: true              // suspeita fraca: avisa, não reprova
  },
  {
    id: 'nota-contradiz-avaliacao',
    porque: 'peça muito bem avaliada por quem comprou a tirar nota de "não vale a pena" — uma das duas leituras está errada',
    ve: (r, p) => {
      const nota = parseFloat(p.meta.avaliacao);
      const n = parseInt(p.meta.avaliacoes, 10);
      return r.nota != null && r.nota < 40 && nota >= 4.5 && n >= 50;
    }
  },
  {
    id: 'tecnica-com-nota-baixa',
    porque: 'peça com ficha técnica a sério a tirar nota baixa — a nota está a olhar para a fibra do casco em vez da engenharia',
    ve: (r) => r.nota != null && r.nota < 45 && (r.s.hasTechSpec || r.s.fichaTecnica)
  },
  {
    id: 'nome-de-fibra-com-lixo',
    porque: 'o nome capturado arrasta texto da página — o corte do nome falhou',
    ve: (r) => r.fibras.some((f) => (f.name || '').split(/\s+/).length > 3)
  },
  {
    id: 'texto-do-card-vazio',
    porque: 'card sem texto é pior que card com texto ruim',
    ve: (r) => r.fibras.length > 0 && (!r.cardTexto || r.cardTexto.trim().length < 40)
  },
  {
    id: 'ficha-tecnica-ignorada',
    porque: 'a página publica coluna de água ou poder de expansão e o motor não os leu',
    ve: (r, p) => /\d\s?000\s?mm|\d{1,2}k\s?mm|\d{3}\s?cuin/i.test(p.texto) && !r.s.fichaTecnica,
    aviso: true
  },
  {
    id: 'agasalho-nao-reconhecido',
    porque: 'o título diz que é casaco/jaqueta e o motor classificou como peça genérica — troca a família de frases inteira',
    ve: (r, p) => /casaco|jaqueta|parka|anorak|chaqueta|abrigo|jacket|coat/i.test(p.meta.titulo || '')
                  && r.tipo !== 'casaco'
  }
];

// ─── execução ────────────────────────────────────────────────────────
const pecas = carregar();
const listar = process.argv.includes('--lista');

console.log('\n── Acervo: o motor contra páginas reais ────────────────\n');

if (!pecas.length) {
  console.log('  (nenhuma peça em tests/lojas/ ainda)\n');
  process.exit(0);
}

let reprovas = 0, avisos = 0;
const porLoja = {};

pecas.forEach((p) => {
  const r = analisar(p);
  const loja = p.meta.loja || '?';
  porLoja[loja] = (porLoja[loja] || 0) + 1;

  const achados = SUSPEITAS.filter((s) => {
    try { return s.ve(r, p); } catch (e) { return false; }
  });

  const comp = r.fibras.map((f) => f.pct + '% ' + f.name).join(', ') || '—';
  const marca = achados.length ? (achados.every((a) => a.aviso) ? '!' : '✗') : '✓';
  console.log(`  ${marca} [${loja}] ${p.meta.titulo || p.meta.ficheiro}`);
  if (listar || achados.length) {
    console.log(`      nota ${r.nota == null ? '—' : r.nota}/100 · tipo ${r.tipo} · ${comp}`);
    if (r.s.fichaTecnica) console.log(`      ficha: ${JSON.stringify(r.s.fichaTecnica)}`);
    if (r.s.brandTech) console.log(`      tecnologia: ${r.s.brandTech}`);
  }
  achados.forEach((a) => {
    console.log(`      ${a.aviso ? '!' : '✗'} ${a.id} — ${a.porque}`);
    if (a.aviso) avisos++; else reprovas++;
  });
  if (listar) console.log(`      "${(r.cardTexto || '').slice(0, 150)}"`);
});

console.log('\n──────────────────────────────────────');
console.log(`${pecas.length} peças · ${Object.entries(porLoja).map(([l, n]) => l + ' ' + n).join(' · ')}`);
console.log(`${reprovas} suspeita(s) forte(s) · ${avisos} aviso(s)`);
if (reprovas) console.log('\nSuspeita forte = um resultado que não se sustenta. Vale investigar cada uma.');
console.log('');
process.exit(reprovas > 0 ? 1 : 0);
