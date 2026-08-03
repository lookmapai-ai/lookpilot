#!/usr/bin/env node
/* Teste de fumaça da PÁGINA DE ANÁLISE (landing/runtime.js).
 *
 *   node tests/pagina.js
 *
 * Responde uma pergunta só: a página monta sem explodir?
 *
 * Existe porque um erro de JavaScript aqui não degrada nada — mata a página
 * inteira, em silêncio. Aconteceu: uma variável referenciada numa função onde
 * não existia (`ver is not defined`) derrubou tudo, e os 120 testes do motor
 * passaram limpos, porque nenhum deles toca em runtime.js. O defeito só
 * apareceu num print: dois selos sobrepostos e a nota em branco.
 *
 * O que ele NÃO faz: julgar se o texto está bom ou se a lógica do selo está
 * certa. Isso continua sendo leitura humana. Ele cobre a classe de erro que
 * passa por todas as outras redes.
 *
 * Sem dependência nova: mesmo truque do tests/run.js com o content.js —
 * esboço mínimo de DOM, e os bindings a testar são lidos do analise.html
 * gerado, para o esboço não divergir da página real.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.join(__dirname, '..');

let falhas = 0, ok = 0;

function checa(nome, fn) {
  try { fn(); console.log(`  ✓ ${nome}`); ok++; }
  catch (e) { console.log(`  ✗ ${nome}\n      ${e.message}`); falhas++; }
}

/* ---------- simulador partilhado com tests/coerencia.js ---------- */
// Estava aqui dentro; saiu para tests/dom-analise.js quando o teste de
// coerência passou a precisar da mesma tela. Cópia dupla = uma delas
// envelhece sem ninguém reparar.
const { montar, TXT } = require('./dom-analise.js');

/* ---------- casos: peças reais, cobrindo os ramos ----------------- */
const P = (o) => '?' + new URLSearchParams(o).toString();
const CASOS = [
  ['camiseta de malha de algodão', P({
    score: 71, verdict: 'Vale a pena.', fibra: 'Algodão', fibras: 'Algodão:100',
    props: 'bol:7,ama:3,sec:3,cal:4,res:9,pes:5,sus:5', selos: 'verao:9,inverno:3,cabine:1',
    tipo: 'camiseta', malha: '1', qualidade: 66, durabilidade: 62, conforto: 90,
    versatilidade: 65, manutencao: 80, custo: 60, viagem: 72, nome: 'Camiseta', loja: 'H&M'
  })],
  ['casaco de poliéster (Renner)', P({
    score: 66, verdict: 'Vale considerar.', fibra: 'Poliéster', fibras: 'Poliéster:81,Elastano:19',
    props: 'bol:4,ama:8,sec:9,cal:5,res:3,pes:7,sus:3', selos: 'verao:3,inverno:6,cabine:0',
    tipo: 'casaco', sintetico: '1', qualidade: 55, durabilidade: 70, conforto: 50,
    versatilidade: 55, manutencao: 75, custo: 50, viagem: 60, nome: 'Trench', loja: 'Renner'
  })],
  ['vestido estampado', P({
    score: 71, verdict: 'Vale a pena.', fibra: 'Algodão', fibras: 'Algodão:100',
    props: 'bol:7,ama:3,sec:3,cal:4,res:9,pes:5,sus:5', tipo: 'vestido', estampado: '1',
    cornota: 'estampado pede combinações pensadas', viagem: 60, versatilidade: 40, nome: 'Vestido'
  })],
  ['linho (corte duro de amassa)', P({
    score: 70, verdict: 'Vale a pena.', fibra: 'Linho', fibras: 'Linho:100',
    props: 'bol:8,ama:1,sec:7,cal:3,res:10,pes:4,sus:8', tipo: 'camisa', viagem: 75, nome: 'Camisa'
  })],
  ['merino (selo aprovado)', P({
    score: 88, verdict: 'Vale a pena.', fibra: 'Lã Merino', fibras: 'Lã Merino:100',
    props: 'bol:6,ama:8,sec:4,cal:9,res:9,pes:4,sus:6', selos: 'verao:5,inverno:9,cabine:1',
    tipo: 'malha', viagem: 90, versatilidade: 75, nome: 'Suéter'
  })],
  ['peça sem propriedades (extensão antiga)', P({
    score: 55, verdict: 'Compra ponderada.', fibras: 'Algodão:60,Poliéster:40', nome: 'Peça'
  })],
  ['sem score nenhum (demonstração)', ''],
  ['certificação + sintético', P({
    score: 64, verdict: 'Compra ponderada.', fibra: 'Poliéster', fibras: 'Poliéster:100',
    props: 'bol:4,ama:8,sec:9,cal:5,res:3,pes:7,sus:3', sintetico: '1', certs: 'GRS,OEKO-TEX',
    tipo: 'camiseta', viagem: 60, nome: 'Camiseta'
  })]
];

console.log('\n── Página de análise: monta sem explodir? ──────────────\n');
console.log(`  (${TXT.length} bindings de texto lidos do analise.html gerado)\n`);

const registos = {};
for (const [nome, query] of CASOS) {
  checa(nome, () => { registos[nome] = montar(query); });
}

/* ---------- o que apareceu na tela ------------------------------- */
console.log('');

checa('a nota aparece preenchida (não fica em branco)', () => {
  const r = registos['camiseta de malha de algodão'];
  if (!r) throw new Error('caso não montou');
  const nota = r.txt['scoreTo'];
  if (nota === undefined || nota === '') throw new Error('binding scoreTo ficou vazio');
  if (!/^\d+$/.test(String(nota))) throw new Error(`scoreTo não é número: ${JSON.stringify(nota)}`);
});

checa('exatamente um selo de viagem fica visível', () => {
  for (const [nome, r] of Object.entries(registos)) {
    if (!r) continue;
    const ap = r.display['seloAprovado'], ca = r.display['seloCautela'];
    if (ap === undefined || ca === undefined) continue;  // binding ausente na página
    const visiveis = [ap, ca].filter((d) => d !== 'none').length;
    if (visiveis !== 1) {
      throw new Error(`"${nome}": ${visiveis} selos visíveis (aprovado=${ap}, cautela=${ca})`);
    }
  }
});

checa('o veredito nunca fica vazio', () => {
  for (const [nome, r] of Object.entries(registos)) {
    if (!r) continue;
    const v = r.txt['verdict'];
    if (v !== undefined && String(v).trim() === '') throw new Error(`"${nome}": veredito vazio`);
  }
});

console.log('\n────────────────────────────────────────────────────────');
console.log(`${ok} ok · ${falhas} falha(s)`);
if (falhas) console.log('\nA página quebra. Isto derruba a tela inteira, não só um pedaço.');
console.log('');
process.exit(falhas > 0 ? 1 : 0);
