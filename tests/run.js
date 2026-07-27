#!/usr/bin/env node
// Rede de testes de regressão do LookPilot
// Corre com: node tests/run.js
// Congela o comportamento do motor para que mudanças em fibers.json ou shared.js
// não partam casos já validados sem aviso.

const fs   = require('fs');
const path = require('path');
const vm   = require('vm');

// ─── Carrega os ficheiros do motor no contexto global ────────────────
const root = path.join(__dirname, '..');
function load(file) {
  const src = fs.readFileSync(path.join(root, file), 'utf8');
  vm.runInThisContext(src, { filename: file });
}
load('shared.js');
load('categories.js');

// ─── Stubs de browser para carregar content.js fora do Chrome ────────
global.window   = {};
global.location = { href: 'https://zara.com/pt/produto-test-p12345678.html' };
global.MutationObserver = class { constructor(cb) {} observe() {} };
global.document = {
  querySelectorAll: () => [],
  querySelector: () => null,
  getElementById: () => null,
  title: '',
  body: {
    innerText: '',
    appendChild: () => {},
    contains: () => false,
  },
  createElement: () => ({
    style: { cssText: '' }, id: '', innerHTML: '',
    appendChild: () => {},
    querySelector:  () => ({ addEventListener: () => {} }),
    remove: () => {},
    getAttribute: () => null,
    textContent: '',
  }),
};
global.chrome = {
  runtime: { sendMessage: () => {}, onMessage: { addListener: () => {} } },
};

// Transforma o IIFE em função que devolve as utilidades de parse
{
  const src = fs.readFileSync(path.join(root, 'content.js'), 'utf8');
  const testable = src
    .replace('(function() {', 'var _contentAPI = (function() {')
    .replace(/\}\)\(\);\s*$/, '  return { parseComposition, splitIntoSections, findPrimarySection };\n})();');
  vm.runInThisContext(testable, { filename: 'content.js' });
}
// vm.runInThisContext com var → global._contentAPI
const parseComposition   = global._contentAPI.parseComposition;
const splitIntoSections  = global._contentAPI.splitIntoSections;
const findPrimarySection = global._contentAPI.findPrimarySection;

// ─── Utilidades de teste ─────────────────────────────────────────────
let passed = 0, failed = 0, total = 0;
const failures = [];

function test(name, fn) {
  total++;
  try {
    const result = fn();
    if (result === true) {
      passed++;
      process.stdout.write('.');
    } else {
      failed++;
      const detail = (result && result.reason) ? result.reason : String(result);
      failures.push({ name, detail });
      process.stdout.write('F');
    }
  } catch (e) {
    failed++;
    failures.push({ name, detail: e.message });
    process.stdout.write('E');
  }
}

// helpers para construir fibers no formato esperado por calcScores
function fiber(name, pct) {
  const data = getFiber(name);
  return { name, pct, data };
}

function fail(reason) { return { reason }; }

function inRange(val, min, max, label) {
  if (val >= min && val <= max) return true;
  return fail(`${label || 'valor'} = ${val}, esperado entre ${min} e ${max}`);
}

function equals(val, expected, label) {
  if (val === expected) return true;
  return fail(`${label || 'valor'} = ${JSON.stringify(val)}, esperado ${JSON.stringify(expected)}`);
}

function includes(val, substr, label) {
  if (typeof val === 'string' && val.includes(substr)) return true;
  return fail(`${label || 'texto'} = "${val}", esperado conter "${substr}"`);
}

function notIncludes(val, substr, label) {
  if (typeof val === 'string' && !val.includes(substr)) return true;
  return fail(`${label || 'texto'} = "${val}", NÃO deveria conter "${substr}"`);
}

// ════════════════════════════════════════════════════════════════════════
// 1. getFiber — lookup e variantes sustentáveis
// ════════════════════════════════════════════════════════════════════════
console.log('\n── getFiber ──────────────────────────────────────────────');

test('algodão retorna dados da fibra', () => {
  const f = getFiber('algodão');
  if (!f) return fail('getFiber("algodão") retornou null');
  return inRange(f.quality, 60, 75, 'quality algodão');
});

test('cotton mapeado para mesmos dados de algodão', () => {
  const a = getFiber('algodão'), b = getFiber('cotton');
  return equals(a?.quality, b?.quality, 'quality cotton vs algodão');
});

test('algodão orgânico tem quality superior ao algodão simples', () => {
  const base = getFiber('algodão');
  const org  = getFiber('algodão orgânico');
  if (!org) return fail('algodão orgânico não encontrado');
  if (org.quality <= base.quality) return fail(`orgânico (${org.quality}) deve ser > base (${base.quality})`);
  return true;
});

test('texto longo com "algodão" retorna fibra base', () => {
  const f = getFiber('algodão de cultivo convencional');
  if (!f) return fail('getFiber com texto longo retornou null');
  return equals(f.label, 'Algodão', 'label');
});

test('poliéster reciclado detectado pelo nome', () => {
  const f = getFiber('poliéster reciclado');
  if (!f) return fail('poliéster reciclado não encontrado');
  return inRange(f.quality, 68, 75, 'quality rPET');
});

test('merino encontrado com alias "merino wool"', () => {
  const f = getFiber('merino wool');
  if (!f) return fail('merino wool não encontrado');
  return inRange(f.travel, 85, 100, 'travel merino');
});

test('fibra desconhecida retorna null', () => {
  const f = getFiber('fibra-inexistente-xyz');
  return equals(f, null, 'fibra inexistente');
});

// ════════════════════════════════════════════════════════════════════════
// 2. certificationBonus
// ════════════════════════════════════════════════════════════════════════
console.log('\n── certificationBonus ────────────────────────────────────');

test('GOTS detectado (maiúsculas)', () => {
  const c = certificationBonus('Certificado GOTS. Made in Portugal.');
  return equals(c.includes('GOTS'), true, 'GOTS');
});

test('oeko-tex detectado com hífen', () => {
  const c = certificationBonus('OEKO-TEX Standard 100');
  return equals(c.includes('OEKO-TEX'), true, 'OEKO-TEX');
});

test('oekotex detectado sem hífen', () => {
  const c = certificationBonus('certificado oekoTex');
  return equals(c.includes('OEKO-TEX'), true, 'OEKO-TEX sem hífen');
});

test('european flax detectado', () => {
  const c = certificationBonus('European Flax certified linen');
  return equals(c.includes('European Flax'), true, 'European Flax');
});

test('mulesing-free detectado', () => {
  const c = certificationBonus('lã australiana mulesing-free');
  return equals(c.includes('Mulesing-free'), true, 'Mulesing-free');
});

test('texto sem certificações retorna array vazio', () => {
  const c = certificationBonus('Composição: 100% algodão');
  return equals(c.length, 0, 'sem certs');
});

test('texto vazio retorna array vazio', () => {
  const c = certificationBonus('');
  return equals(c.length, 0, 'texto vazio');
});

test('múltiplas certificações acumulam', () => {
  const c = certificationBonus('GOTS certified. Also OEKO-TEX and BCI.');
  if (c.length < 3) return fail(`esperado ≥3 certs, recebeu ${c.length}: ${c.join(', ')}`);
  return true;
});

// ════════════════════════════════════════════════════════════════════════
// 3. detectColorPattern — sem falsos positivos (bug histórico)
// ════════════════════════════════════════════════════════════════════════
console.log('\n── detectColorPattern ────────────────────────────────────');

test('cor neutra (preto) sobe versatilidade', () => {
  const r = detectColorPattern('Camiseta cor: preto. Composição: 100% algodão.');
  if (r.colorClass !== 'neutral') return fail(`colorClass = ${r.colorClass}`);
  if (r.mod <= 0) return fail(`mod = ${r.mod}, esperado > 0`);
  return true;
});

test('cor marcante (vermelho) é detetada mas não penaliza versatilidade', () => {
  const r = detectColorPattern('Blusa cor: vermelho. 100% viscose.');
  if (r.colorClass !== 'bold') return fail(`colorClass = ${r.colorClass}`);
  if (r.mod !== 0) return fail(`mod = ${r.mod}, esperado 0 (cor marcante não penaliza — depende do estilo)`);
  return true;
});

test('estampado floral detectado com isPrint=true', () => {
  const r = detectColorPattern('Vestido estampado floral. Composição: 65% algodão 35% viscose.');
  return equals(r.isPrint, true, 'isPrint floral');
});

test('"checkout" NÃO detecta estampado (bug histórico)', () => {
  const r = detectColorPattern('Adicione ao carrinho. Checkout seguro. 100% algodão.');
  return equals(r.isPrint, false, 'isPrint checkout');
});

test('"print" em "footprint" NÃO é estampado', () => {
  const r = detectColorPattern('Nossa pegada de carbono (carbon footprint) é reduzida. 100% algodão.');
  return equals(r.isPrint, false, 'isPrint footprint');
});

test('"check" em "checked luggage" É estampado xadrez', () => {
  const r = detectColorPattern('Camisa checked, padrão xadrez clássico. 100% algodão.');
  return equals(r.isPrint, true, 'isPrint checked camisa');
});

test('texto neutro sem cor → mod = 0', () => {
  const r = detectColorPattern('Composição: 100% linho.');
  return equals(r.mod, 0, 'mod sem cor');
});

test('"estampados" em boilerplate H&M NÃO é estampado (bug histórico)', () => {
  // H&M inclui "ornamentos e estampados" no aviso de cálculo de peso — não é um padrão visual
  const boilerplate = 'Calções em ganga com orlas sem acabamento - Azul denim claro - SENHORA | H&M PT';
  const r = detectColorPattern(boilerplate);
  return equals(r.isPrint, false, 'isPrint H&M boilerplate');
});

test('calcScores: "estampados" no pageText da composição NÃO contamina quando titleText está limpo', () => {
  const compositionPageText = 'MateriaisComposiçãoAlgodão 100%Excluímos o peso de componentes menores, por exemplo, fios, botões, fechos éclair, ornamentos e estampados.';
  const cleanTitle = 'Calções em ganga com orlas sem acabamento Azul denim claro';
  const s = calcScores([fiber('algodão', 100)], compositionPageText, '', cleanTitle);
  if (!s) return fail('calcScores retornou null');
  return equals(s.colorInfo?.isPrint, false, 'isPrint deve ser false com titleText limpo');
});

// ════════════════════════════════════════════════════════════════════════
// 4. warmthScore
// ════════════════════════════════════════════════════════════════════════
console.log('\n── warmthScore ───────────────────────────────────────────');

test('merino 100% → warmth muito alto (≥80)', () => {
  const fibers = [fiber('merino', 100)];
  const w = warmthScore(fibers);
  return inRange(w, 80, 100, 'warmth merino');
});

test('linho 100% → warmth muito baixo (≤25)', () => {
  const fibers = [fiber('linho', 100)];
  const w = warmthScore(fibers);
  return inRange(w, 0, 25, 'warmth linho');
});

test('caxemira 100% → warmth ≥85', () => {
  const fibers = [fiber('caxemira', 100)];
  const w = warmthScore(fibers);
  return inRange(w, 85, 100, 'warmth caxemira');
});

test('mistura 50% merino + 50% linho → warmth médio', () => {
  const fibers = [fiber('merino', 50), fiber('linho', 50)];
  const w = warmthScore(fibers);
  return inRange(w, 40, 60, 'warmth merino+linho');
});

test('fibra desconhecida dominante → retorna null', () => {
  const fibers = [{ name: 'fibra-xyz', pct: 80, data: null }, fiber('algodão', 20)];
  const w = warmthScore(fibers);
  return equals(w, null, 'warmth com fibra desconhecida dominante');
});

// ════════════════════════════════════════════════════════════════════════
// 5. packabilityScore
// ════════════════════════════════════════════════════════════════════════
console.log('\n── packabilityScore ──────────────────────────────────────');

test('seda 100% → packability muito alta (≥90)', () => {
  const fibers = [fiber('seda', 100)];
  const p = packabilityScore(fibers, false, false);
  return inRange(p, 90, 100, 'pack seda');
});

test('lã 100% → packability baixa (≤55)', () => {
  const fibers = [fiber('lã', 100)];
  const p = packabilityScore(fibers, false, false);
  return inRange(p, 0, 55, 'pack lã');
});

test('isKnit reduz packability (malha é mais volumosa)', () => {
  const fibers = [fiber('algodão', 100)];
  const pFlat = packabilityScore(fibers, false, false);
  const pKnit = packabilityScore(fibers, true, false);
  if (pKnit >= pFlat) return fail(`knit (${pKnit}) deve ser < flat (${pFlat})`);
  return true;
});

test('isBulky (casaco) penaliza muito a packability', () => {
  const fibers = [fiber('lã', 100)];
  const pNorm  = packabilityScore(fibers, false, false);
  const pBulky = packabilityScore(fibers, false, true);
  if (pBulky >= pNorm * 0.7) return fail(`bulky (${pBulky}) deve ser muito menor que normal (${pNorm})`);
  return true;
});

// ════════════════════════════════════════════════════════════════════════
// 6. calcScores — motor principal
// ════════════════════════════════════════════════════════════════════════
console.log('\n── calcScores ────────────────────────────────────────────');

test('retorna null para input vazio', () => {
  return equals(calcScores([]), null, 'calcScores vazio');
});

test('retorna null para null', () => {
  return equals(calcScores(null), null, 'calcScores null');
});

test('merino 100%: quality e comfort altos', () => {
  const s = calcScores([fiber('merino', 100)], '');
  if (!s) return fail('calcScores retornou null');
  if (s.quality < 70) return fail(`quality = ${s.quality}`);
  if (s.comfort < 85) return fail(`comfort = ${s.comfort}`);
  return true;
});

test('poliéster 100%: maintenance alto, comfort baixo', () => {
  const s = calcScores([fiber('poliéster', 100)], '');
  if (!s) return fail('calcScores retornou null');
  if (s.maintenance < 80) return fail(`maintenance = ${s.maintenance}`);
  if (s.comfort >= 60)    return fail(`comfort = ${s.comfort}, esperado < 60`);
  return true;
});

test('viscose 100%: durability baixa', () => {
  const s = calcScores([fiber('viscose', 100)], '');
  if (!s) return fail('calcScores retornou null');
  if (s.durability >= 50) return fail(`durability = ${s.durability}, esperado < 50`);
  return true;
});

test('caxemira 100%: quality alta, durability baixa', () => {
  const s = calcScores([fiber('caxemira', 100)], '');
  if (!s) return fail('calcScores retornou null');
  if (s.quality < 75)     return fail(`quality = ${s.quality}`);
  if (s.durability >= 60) return fail(`durability = ${s.durability}, esperado < 60`);
  return true;
});

test('algodão com GOTS no texto: certBonus aplicado, certs contém GOTS', () => {
  const base = calcScores([fiber('algodão', 100)], '');
  const cert = calcScores([fiber('algodão', 100)], 'Algodão certificado GOTS. Sustentável.');
  if (!cert.certs.includes('GOTS')) return fail(`certs = ${cert.certs}`);
  if (cert.quality <= base.quality) return fail(`quality com cert (${cert.quality}) deve ser > sem cert (${base.quality})`);
  return true;
});

test('texto "organic" promove algodão à variante orgânica', () => {
  const base = calcScores([fiber('algodão', 100)], '');
  const org  = calcScores([fiber('algodão', 100)], 'organic cotton certified');
  if (org.quality <= base.quality) return fail(`orgânico (${org.quality}) deve ser > base (${base.quality})`);
  return true;
});

test('algodão Supima: qualidade sobe vs algodão comum', () => {
  const base = calcScores([fiber('algodão', 100)], '');
  const sup  = calcScores([fiber('algodão', 100)], 'Composição: 100% Supima cotton');
  if (!sup.qualityModifier) return fail('qualityModifier não detectado');
  if (sup.quality <= base.quality) return fail(`supima (${sup.quality}) deve ser > base (${base.quality})`);
  return true;
});

test('mistura 95% algodão + 5% elastano: elastano como parceiro leve', () => {
  const s = calcScores([fiber('algodão', 95), fiber('elastano', 5)], '');
  if (!s) return fail('calcScores retornou null');
  // elastano em <5% dá bónus de travel pequeno; quality deve ser próxima do algodão
  return inRange(s.quality, 60, 75, 'quality algodão+elastano');
});

test('mistura 70% viscose + 30% poliéster: travel melhor que viscose pura', () => {
  const viscPuro = calcScores([fiber('viscose', 100)], '');
  const mistura  = calcScores([fiber('viscose', 70), fiber('poliéster', 30)], '');
  if (mistura.travel <= viscPuro.travel) return fail(`mistura travel (${mistura.travel}) deve ser > viscose pura (${viscPuro.travel})`);
  return true;
});

test('isKnit detectado via pageText', () => {
  const s = calcScores([fiber('lã', 100)], 'camisola de malha grossa 100% lã');
  if (!s.isKnit) return fail('isKnit não detectado');
  return true;
});

test('peça quente (warmth≥60): fórmula de travel usa calor', () => {
  // Merino tem warmth=84 e packability boa → travel deve ser alto
  const s = calcScores([fiber('merino', 100)], '');
  if (!s) return fail('calcScores null');
  if (s.warmth == null || s.warmth < 60) return fail(`warmth = ${s.warmth}`);
  return inRange(s.travel, 70, 100, 'travel merino');
});

test('peça de verão (linho): travel score positivo mas não máximo', () => {
  const s = calcScores([fiber('linho', 100)], '');
  if (!s) return fail('calcScores null');
  return inRange(s.travel, 55, 85, 'travel linho');
});

test('certBonus limitado a 8 mesmo com muitas certs', () => {
  // 4 certs dão 16 pontos brutos, mas o cap é 8
  const s = calcScores([fiber('algodão', 100)], 'GOTS certified. OEKO-TEX. BCI. bluesign approved. European Flax.');
  if (!s) return fail('calcScores null');
  // quality base algodão=66, certBonus max=8 → quality ≤ 74 + tolerância de modifier
  if (s.quality > 82) return fail(`quality = ${s.quality}, certBonus não foi limitado`);
  return true;
});

// ════════════════════════════════════════════════════════════════════════
// 7. buyScore e buyVerdict
// ════════════════════════════════════════════════════════════════════════
console.log('\n── buyScore / buyVerdict ─────────────────────────────────');

test('buyScore retorna null para scores null', () => {
  return equals(buyScore(null, 'clothing'), null, 'buyScore null');
});

test('merino 100%: buyScore alto com tipo clothing', () => {
  const s = calcScores([fiber('merino', 100)], '');
  const b = buyScore(s, 'clothing');
  return inRange(b, 70, 100, 'buyScore merino');
});

test('acrílico 100%: buyScore baixo (<70)', () => {
  const s = calcScores([fiber('acrílico', 100)], '');
  const b = buyScore(s, 'clothing');
  return inRange(b, 0, 69, 'buyScore acrílico');
});

test('pesos malha vs clothing diferem', () => {
  const s = calcScores([fiber('lã', 100)], '');
  const bCloth = buyScore(s, 'clothing');
  const bMalha = buyScore(s, 'malha');
  // malha pesa menos manutenção (lã lava-se pouco) → scores diferentes
  if (bCloth === bMalha) return fail(`buyScore clothing=${bCloth} e malha=${bMalha} são iguais — pesos não diferem`);
  return true;
});

test('buyVerdict: score 80 → verde "Pode comprar tranquila"', () => {
  const v = buyVerdict(80);
  return equals(v.emoji, '🟢', 'emoji score 80');
});

test('buyVerdict: score 70 → verde "Vale a pena"', () => {
  const v = buyVerdict(70);
  return equals(v.emoji, '🟢', 'emoji score 70');
});

test('buyVerdict: score 55 → amarelo "Dá pra considerar"', () => {
  const v = buyVerdict(55);
  return equals(v.emoji, '🟡', 'emoji score 55');
});

test('buyVerdict: score 45 → amarelo "Pense bem"', () => {
  const v = buyVerdict(45);
  return equals(v.emoji, '🟡', 'emoji score 45');
});

test('buyVerdict: score 40 → vermelho "Não vale a pena"', () => {
  const v = buyVerdict(40);
  return equals(v.emoji, '🔴', 'emoji score 40');
});

// ════════════════════════════════════════════════════════════════════════
// 8. conclusionText — honestidade por fibra
// ════════════════════════════════════════════════════════════════════════
console.log('\n── conclusionText ────────────────────────────────────────');

test('poliéster virgem: menciona sustentabilidade ou respirabilidade', () => {
  const fibers = [fiber('poliéster', 100)];
  const s = calcScores(fibers, '');
  const txt = conclusionText(s, fibers);
  const ok = txt.toLowerCase().includes('sustent') || txt.toLowerCase().includes('respir');
  if (!ok) return fail(`texto não menciona trade-off: "${txt}"`);
  return true;
});

test('viscose 50%+ como secundária: menciona fragilidade', () => {
  const fibers = [fiber('algodão', 50), fiber('viscose', 50)];
  const s = calcScores(fibers, '');
  const txt = conclusionText(s, fibers);
  const ok = txt.toLowerCase().includes('viscose') || txt.toLowerCase().includes('delicat') || txt.toLowerCase().includes('frágil') || txt.toLowerCase().includes('cuidado');
  if (!ok) return fail(`texto não menciona viscose: "${txt}"`);
  return true;
});

test('merino 100%: texto menciona merino ou lã', () => {
  const fibers = [fiber('merino', 100)];
  const s = calcScores(fibers, '');
  const txt = conclusionText(s, fibers);
  const ok = txt.toLowerCase().includes('merino') || txt.toLowerCase().includes('lã');
  if (!ok) return fail(`texto não menciona merino/lã: "${txt}"`);
  return true;
});

test('algodão Supima: conclusão menciona Supima', () => {
  const fibers = [fiber('algodão', 100)];
  const s = calcScores(fibers, 'camiseta Supima cotton');
  const txt = conclusionText(s, fibers);
  if (!txt.toLowerCase().includes('supima')) return fail(`texto não menciona Supima: "${txt}"`);
  return true;
});

test('cor marcante: conclusão NÃO menciona limitação de combinações (viés de estilo removido)', () => {
  const fibers = [fiber('algodão', 100)];
  const s = calcScores(fibers, 'blusa cor: vermelho');
  const txt = conclusionText(s, fibers).toLowerCase();
  const hasBias = txt.includes('limita') || txt.includes('restringe') || txt.includes('atenção: cor');
  if (hasBias) return fail(`conclusão ainda menciona limitação de cor: "${txt}"`);
  return true;
});

test('conclusão não retorna string vazia', () => {
  const fibers = [fiber('algodão', 100)];
  const s = calcScores(fibers, '');
  const txt = conclusionText(s, fibers);
  if (!txt || txt.length < 10) return fail(`texto muito curto: "${txt}"`);
  return true;
});

// ════════════════════════════════════════════════════════════════════════
// 9. travelText — textos de viagem
// ════════════════════════════════════════════════════════════════════════
console.log('\n── travelText ────────────────────────────────────────────');

test('merino 100%: começa com "Para mala é perfeita" (travel≥82)', () => {
  const fibers = [fiber('merino', 100)];
  const s = calcScores(fibers, '');
  const txt = travelText(s, fibers);
  if (!txt.startsWith('Para mala é perfeita')) return fail(`texto = "${txt}"`);
  return true;
});

test('algodão 100%: menciona amassar ou secar devagar', () => {
  const fibers = [fiber('algodão', 100)];
  const s = calcScores(fibers, '');
  const txt = travelText(s, fibers);
  const ok = txt.toLowerCase().includes('amass') || txt.toLowerCase().includes('sec');
  if (!ok) return fail(`texto não menciona limitação de viagem: "${txt}"`);
  return true;
});

test('linho 100%: texto menciona amassar', () => {
  const fibers = [fiber('linho', 100)];
  const s = calcScores(fibers, '');
  const txt = travelText(s, fibers);
  if (!txt.toLowerCase().includes('amass')) return fail(`texto = "${txt}"`);
  return true;
});

test('viscose 100%: travel score baixo (<70)', () => {
  const fibers = [fiber('viscose', 100)];
  const s = calcScores(fibers, '');
  return inRange(s.travel, 0, 69, 'travel viscose');
});

test('poliéster 100%: travel muito alto (≥80)', () => {
  const fibers = [fiber('poliéster', 100)];
  const s = calcScores(fibers, '');
  return inRange(s.travel, 80, 100, 'travel poliéster');
});

test('70% linho + 30% poliéster: travel melhor que linho puro (poliéster atenua amassar)', () => {
  const linhoPuro = calcScores([fiber('linho', 100)], '');
  const mistura   = calcScores([fiber('linho', 70), fiber('poliéster', 30)], '');
  if (mistura.travel <= linhoPuro.travel) return fail(`mistura travel (${mistura.travel}) deve ser > linho puro (${linhoPuro.travel})`);
  return true;
});

test('malha de algodão: knitNote se amassa mas é malha', () => {
  const fibers = [fiber('algodão', 100)];
  const s = calcScores(fibers, 'malha jersey');
  s.isKnit = true; // garantir
  const txt = travelText(s, fibers);
  // texto deve mencionar "malha" ou amassa menos
  const ok = txt.toLowerCase().includes('malha') || txt.toLowerCase().includes('amassa menos');
  if (!ok) return fail(`knitNote ausente: "${txt}"`);
  return true;
});

// ════════════════════════════════════════════════════════════════════════
// 10. detectCategory (categories.js)
// ════════════════════════════════════════════════════════════════════════
console.log('\n── detectCategory ────────────────────────────────────────');

test('calçado por gáspea no texto → "shoes"', () => {
  const cat = detectCategory('Gáspea: couro. Sola: borracha.', 'https://zara.com/produto/123', 'Sapato Oxford');
  return equals(cat, 'shoes', 'categoria');
});

test('calçado por Upper+Sole em inglês → "shoes"', () => {
  const cat = detectCategory('Upper: leather. Outsole: rubber.', 'https://mango.com/en/shoe/001', 'Leather Shoe');
  return equals(cat, 'shoes', 'categoria');
});

test('bolsa por keyword na URL → "bags"', () => {
  const cat = detectCategory('Composição: 100% couro.', 'https://zara.com/bolsa/tote-123', 'Tote Bag');
  return equals(cat, 'bags', 'categoria');
});

test('roupa sem sinais específicos → "clothing"', () => {
  const cat = detectCategory('Composição: 100% algodão.', 'https://zara.com/camiseta-123', 'Camiseta Básica');
  return equals(cat, 'clothing', 'categoria');
});

test('"baggy" no URL não é confundido com "bag" → "clothing"', () => {
  const cat = detectCategory('Calças baggy de cintura média, bolsos laterais, 100% algodão.', 'https://lefties.com/pt/calcas-baggy-bombachas-cordao-123', 'Calças baggy estilo bombachas com cordão');
  return equals(cat, 'clothing', 'categoria');
});

test('"tote" só casa palavra inteira (bolsa real continua bags)', () => {
  const cat = detectCategory('Composição: 100% couro.', 'https://mango.com/pt/tote-grande-123', 'Tote');
  return equals(cat, 'bags', 'categoria');
});

// ════════════════════════════════════════════════════════════════════════
// 11. Comportamentos de produto congelados (não reverter)
// ════════════════════════════════════════════════════════════════════════
console.log('\n── Comportamentos congelados ─────────────────────────────');

test('hierarquia de inverno: merino > alpaca > caxemira em travel', () => {
  const merino  = calcScores([fiber('merino', 100)], '').travel;
  const alpaca  = calcScores([fiber('alpaca', 100)], '').travel;
  const cashm   = calcScores([fiber('caxemira', 100)], '').travel;
  // merino é explicitamente o melhor para viagem (travel=90 na DB)
  if (merino < alpaca) return fail(`merino travel (${merino}) deve ser ≥ alpaca (${alpaca})`);
  if (merino < cashm)  return fail(`merino travel (${merino}) deve ser ≥ caxemira (${cashm})`);
  return true;
});

test('caxemira: quality > durability (nobre mas faz bolinhas)', () => {
  const f = getFiber('caxemira');
  if (f.quality <= f.durability) return fail(`quality (${f.quality}) deve ser > durability (${f.durability})`);
  return true;
});

test('poliéster virgem nunca atinge overall≥80 sem certificação', () => {
  const s = calcScores([fiber('poliéster', 100)], '');
  if (s.overall >= 80) return fail(`overall = ${s.overall}, não deveria ser ≥80 sem certs`);
  return true;
});

test('linho: comfort e durability ambos altos (fibra de verão de qualidade)', () => {
  const f = getFiber('linho');
  if (f.comfort < 75)    return fail(`comfort = ${f.comfort}`);
  if (f.durability < 75) return fail(`durability = ${f.durability}`);
  return true;
});

test('pickTrait é determinístico: mesma composição → mesma frase', () => {
  const fibers = [fiber('algodão', 80), fiber('elastano', 20)];
  const traits = FIBER_TRAITS['algodão'];
  const seed = 'camiseta';
  const a = pickTrait(traits.strong, fibers, seed);
  const b = pickTrait(traits.strong, fibers, seed);
  return equals(a, b, 'pickTrait determinismo');
});

// ════════════════════════════════════════════════════════════════════════
// 12. parseComposition — formatos por loja
// ════════════════════════════════════════════════════════════════════════
// Helper: extrai fibers do bloco de texto tal como a extensão faz
function parse(text, category) {
  category = category || 'clothing';
  return parseComposition(text, category);
}

// Helper: pipeline completo (splitIntoSections → findPrimarySection)
// Replica o que tryScan() faz com o texto extraído da página
function pipeline(text, category) {
  category = category || 'clothing';
  const sections = splitIntoSections(text);
  const primary  = findPrimarySection(sections, category);
  return primary ? primary.fibers : parse(text, category);
}

// Verifica que um array de fibers tem pelo menos N fibras reconhecidas
function hasMinFibers(fibers, n, label) {
  const known = fibers.filter(f => f.data);
  if (known.length >= n) return true;
  return fail(`${label}: ${known.length} fibra(s) reconhecida(s), esperado ≥${n}. fibers=${JSON.stringify(fibers.map(f=>f.name))}`);
}

// Verifica que uma fibra específica está presente com pct próximo do esperado
function hasFiber(fibers, name, pct, tol) {
  tol = tol || 5;
  const f = fibers.find(f => (f.name || '').toLowerCase().includes(name.toLowerCase()));
  if (!f) return fail(`fibra "${name}" não encontrada. fibers=${JSON.stringify(fibers.map(f=>f.name))}`);
  if (pct != null && Math.abs(f.pct - pct) > tol) return fail(`"${name}" pct=${f.pct}, esperado ~${pct} (±${tol})`);
  return true;
}

console.log('\n── Lojas: formatos de composição ─────────────────────────');

// ── PULL&BEAR ─────────────────────────────────────────────────────────
// Composição inline na descrição, com descontos à volta ("-46%", "-40%")
// que NÃO podem ser interpretados como fibras.
test('[Pull&Bear] "confecionadas em 100% algodão" na descrição → algodão', () => {
  const text = 'Calças baggy estilo bombachas de cintura média, com cintura elástica com cordão, bolsos laterais e confecionadas em 100% algodão.';
  const f = parse(text);
  return hasFiber(f, 'algodão', 100);
});

test('[Pull&Bear] descontos não viram fibras', () => {
  const text = 'SALDOS ATÉ -40% VER TUDO 29,99 € -46% 15,99 € confecionadas em 100% algodão.';
  const f = parse(text).filter(x => x.data);
  if (f.length !== 1) return fail(`esperava só 1 fibra (algodão), veio ${JSON.stringify(f.map(x=>x.name))}`);
  return hasFiber(f, 'algodão', 100);
});

// ── RESERVED ──────────────────────────────────────────────────────────
// Formato real: "1.º TECIDO: 55% LINHO, 45% VISCOSE" (prefixo numerado + maiúsculas)
test('[Reserved] "1.º TECIDO: 55% LINHO, 45% VISCOSE" → linho + viscose', () => {
  const text = '1.º TECIDO: 55% LINHO, 45% VISCOSE\nO linho é uma fibra vegetal natural valorizada pela durabilidade.';
  const f = parse(text);
  const r = hasFiber(f, 'linho', 55); if (r !== true) return r;
  return hasFiber(f, 'viscose', 45);
});

test('[Reserved] modal spans separados "1.º TECIDO:" + "100% ALGODÃO"', () => {
  // Como vêm do DOM: <span>1.º TECIDO:</span> <span>100% ALGODÃO</span> (texto unido)
  const text = '1.º TECIDO:\n100% ALGODÃO';
  return hasFiber(parse(text), 'algodão', 100);
});

test('[Reserved] tecido principal vs forro: "1.º TECIDO 87% modal" domina', () => {
  // Modal da Reserved com tecido + forro — o principal deve ganhar ao forro
  const text = '1.º TECIDO: 87% MODAL, 13% POLIÉSTER\n2.º FORRO: 100% POLIÉSTER';
  const f = pipeline(text);
  return hasFiber(f, 'modal', 87);
});

// ── MANGO ─────────────────────────────────────────────────────────────
// Composição num modal aberto pelo botão "Pormenores, composição e cuidados a ter".
// Formato: "Composição: 87% algodão, 13% poliamida"
test('[Mango] "Composição: 87% algodão, 13% poliamida"', () => {
  const f = parse('Composição: 87% algodão, 13% poliamida');
  const r = hasFiber(f, 'algodão', 87); if (r !== true) return r;
  return hasFiber(f, 'poliamida', 13);
});

// ── ZARA ──────────────────────────────────────────────────────────────
// Formato real: "80% Algodão\n20% Poliéster" (PT, % antes)
test('[Zara] 80% Algodão + 20% Poliéster (PT, simples)', () => {
  const f = parse('80% Algodão\n20% Poliéster');
  const r = hasFiber(f, 'algodão', 80); if (r !== true) return r;
  return hasFiber(f, 'poliéster', 20);
});

test('[Zara] com forro viscose: exterior algodão deve dominar', () => {
  const text = `EXTERIOR\n65% Algodão\n35% Poliéster\nFORRO\n100% Viscose`;
  const f = pipeline(text);
  const main = f[0];
  if (!main) return fail('nenhuma fibra encontrada');
  if ((main.name || '').toLowerCase().includes('viscose')) return fail('viscose do forro está a dominar');
  return hasFiber(f, 'algodão', 65);
});

test('[Zara] TECIDO PRINCIPAL algodão + TECIDO SECUNDÁRIO poliéster: poliéster não deve aparecer', () => {
  const text = `EXTERIOR\nTECIDO PRINCIPAL\n100% Algodão\nTECIDO SECUNDÁRIO\n100% Poliéster`;
  const f = pipeline(text);
  if (!f.length) return fail('nenhuma fibra encontrada');
  if (f.some(x => (x.name||'').toLowerCase().includes('poliéster'))) return fail('poliéster do tecido secundário entrou na análise');
  return hasFiber(f, 'algodão', 100);
});

test('[Zara] TECIDO PRINCIPAL algodão orgânico OCS + TECIDO SECUNDÁRIO poliéster reciclado: só algodão', () => {
  const text = `EXTERIOR\nTECIDO PRINCIPAL\n100% algodão de cultivo orgânico certificado OCS\nTECIDO SECUNDÁRIO\n100% poliéster recuperado certificado ao abrigo da RCS`;
  const f = pipeline(text);
  if (!f.length) return fail('nenhuma fibra encontrada');
  if (f.some(x => (x.name||'').toLowerCase().includes('poliéster'))) return fail('poliéster do tecido secundário entrou na análise');
  const hasAlgodao = f.some(x => (x.name||'').toLowerCase().includes('algodão'));
  if (!hasAlgodao) return fail(`algodão não encontrado. fibers=${JSON.stringify(f.map(x=>x.name))}`);
  return true;
});

test('[Zara] composição com vírgula e espaços (formato comum)', () => {
  const f = parse('50% Algodão, 47% Poliéster, 3% Elastano');
  const r = hasFiber(f, 'algodão', 50); if (r !== true) return r;
  return hasFiber(f, 'elastano', 3);
});

test('[Zara] calçado com gáspea PT: secção gáspea domina sobre sola', () => {
  const text = 'Gáspea: Pele.\nSola: Borracha.';
  const sections = splitIntoSections(text);
  const primary  = findPrimarySection(sections, 'shoes');
  if (!primary) return fail('nenhuma secção encontrada');
  const isGaspea = (primary.label || '').toLowerCase().includes('gáspea') ||
                   (primary.label || '').toLowerCase().includes('cabedal');
  if (!isGaspea) return fail(`secção principal = "${primary.label}", esperado gáspea`);
  const hasPele = primary.fibers.some(f => (f.name||'').toLowerCase().includes('pele') || (f.name||'').toLowerCase().includes('couro'));
  if (!hasPele) return fail(`pele não encontrada na secção gáspea. fibers=${JSON.stringify(primary.fibers.map(f=>f.name))}`);
  return true;
});

// ── MANGO ─────────────────────────────────────────────────────────────
// Formato: inglês ou PT, % antes, por vírgula ou newline
test('[Mango] 65% Polyester + 35% Viscose (EN, vírgula)', () => {
  const f = parse('65% Polyester, 35% Viscose');
  const r = hasFiber(f, 'polyester', 65); if (r !== true) return r;
  return hasFiber(f, 'viscose', 35);
});

test('[Mango] Outer + Lining em inglês: outer deve dominar', () => {
  const text = `Outer: 65% Polyester, 35% Viscose\nLining: 100% Polyester`;
  const f = pipeline(text);
  // Não deve ter só poliéster (que seria o lining)
  const visc = f.find(x => (x.name||'').toLowerCase().includes('viscose'));
  if (!visc) return fail('viscose do outer não encontrada — lining pode ter dominado');
  return hasFiber(f, 'polyester', 65);
});

test('[Mango] 100% Linen (EN, fibra única)', () => {
  const f = parse('100% Linen');
  return hasFiber(f, 'linen', 100);
});

// ── MANGO OUTLET ──────────────────────────────────────────────────────
// Mesmo motor que Mango; a diferença é a URL. Testa robustez com formato misto.
test('[Mango Outlet] mistura PT/EN: 60% Cotton, 40% Linho', () => {
  const f = parse('60% Cotton, 40% Linho');
  const r = hasFiber(f, 'cotton', 60); if (r !== true) return r;
  return hasFiber(f, 'linho', 40);
});

// ── MASSIMO DUTTI ─────────────────────────────────────────────────────
// Formato: "Algodão 70%\nPoliamida 30%" (% DEPOIS do nome — formato invertido)
test('[Massimo Dutti] Algodão 70% + Poliamida 30% (% depois, ambos formatos)', () => {
  // Vírgula: Pass 1b ativado normalmente
  const fVirgula = parse('Algodão 70%, Poliamida 30%');
  const r1 = hasFiber(fVirgula, 'algodão', 70); if (r1 !== true) return r1;
  const r2 = hasFiber(fVirgula, 'poliamida', 30); if (r2 !== true) return r2;
  // Newline: Pass 1a já não captura cross-line (newlines → ; na normalização)
  const fNewline = parse('Algodão 70%\nPoliamida 30%');
  const r3 = hasFiber(fNewline, 'algodão', 70); if (r3 !== true) return r3;
  return hasFiber(fNewline, 'poliamida', 30);
});

test('[Massimo Dutti] Linho 100% (% depois, fibra única)', () => {
  const f = parse('Linho 100%');
  return hasFiber(f, 'linho', 100);
});

test('[Massimo Dutti] calçado EN: secção upper domina sobre outsole', () => {
  const text = 'Upper: leather\nOutsole: rubber';
  const sections = splitIntoSections(text);
  const primary  = findPrimarySection(sections, 'shoes');
  if (!primary) return fail('nenhuma secção');
  const isUpper = (primary.label || '').toLowerCase().includes('upper');
  if (!isUpper) return fail(`secção principal = "${primary.label}", esperado upper`);
  const hasLeather = primary.fibers.some(f => (f.name||'').toLowerCase().includes('leather') || (f.name||'').toLowerCase().includes('couro') || (f.name||'').toLowerCase().includes('pele'));
  if (!hasLeather) return fail(`leather não encontrado. fibers=${JSON.stringify(primary.fibers.map(f=>f.name))}`);
  return true;
});

// ── MO (Modalfa / Mo Fashion) ──────────────────────────────────────────
// Marca portuguesa; composição em PT, formato "Composição:\n100% Algodão"
test('[MO] Composição 100% Algodão (bloco com cabeçalho PT)', () => {
  const text = 'Composição\n100% Algodão';
  const f = pipeline(text);
  return hasFiber(f, 'algodão', 100);
});

test('[MO] 95% Algodão + 5% Elastano (PT, newline)', () => {
  const f = parse('95% Algodão\n5% Elastano');
  const r = hasFiber(f, 'algodão', 95); if (r !== true) return r;
  return hasFiber(f, 'elastano', 5);
});

// ── COS ───────────────────────────────────────────────────────────────
// Formato: secções Shell/Lining em inglês, composição em linha
test('[COS] Shell 100% Linen + Lining 100% Polyester: shell domina', () => {
  const text = `Shell: 100% Linen\nLining: 100% Polyester`;
  const f = pipeline(text);
  const linen = f.find(x => (x.name||'').toLowerCase().includes('linen') || (x.name||'').toLowerCase().includes('linho'));
  if (!linen) return fail('linho do shell não encontrado — lining pode ter dominado');
  return true;
});

test('[COS] 80% Wool + 20% Polyamide (EN, newline)', () => {
  const f = parse('80% Wool\n20% Polyamide');
  const r = hasFiber(f, 'wool', 80); if (r !== true) return r;
  return hasFiber(f, 'polyamide', 20);
});

// ── BERSHKA ───────────────────────────────────────────────────────────
// Formato: Exterior PT + Forro, forro de poliéster não deve dominar
test('[Bershka] Exterior cotton+elastano, Forro polyester: exterior domina', () => {
  const text = `EXTERIOR\n95% Cotton\n5% Elastane\nFORRO\n100% Polyester`;
  const f = pipeline(text);
  const main = f[0];
  if (!main) return fail('nenhuma fibra');
  // fibra principal deve ser do exterior (cotton), não do forro (polyester sozinho)
  const isCotton = (main.name || '').toLowerCase().includes('cotton') ||
                   (main.name || '').toLowerCase().includes('algodão');
  if (!isCotton) return fail(`fibra principal = "${main.name}", esperado cotton`);
  return true;
});

test('[Bershka] 70% Viscose + 30% Nylon (PT, vírgula)', () => {
  const f = parse('70% Viscose, 30% Nylon');
  const r = hasFiber(f, 'viscose', 70); if (r !== true) return r;
  return hasFiber(f, 'nylon', 30);
});

// ── PULL AND BEAR ─────────────────────────────────────────────────────
// Formato: inglês, vírgula, % antes
test('[Pull and Bear] 60% Cotton + 40% Linen (EN, vírgula)', () => {
  const f = parse('60% Cotton, 40% Linen');
  const r = hasFiber(f, 'cotton', 60); if (r !== true) return r;
  return hasFiber(f, 'linen', 40);
});

test('[Pull and Bear] 100% Polyester (fibra única, EN)', () => {
  const f = parse('100% Polyester');
  return hasFiber(f, 'polyester', 100);
});

// ── STRADIVARIUS ─────────────────────────────────────────────────────
// Formato: Exterior PT + Forro (bug histórico — viscose do forro não deve dominar)
test('[Stradivarius] Exterior viscose+polyester, Forro polyester: viscose do exterior domina', () => {
  const text = `Exterior\n70% Viscose\n30% Poliéster\nForro\n100% Poliéster`;
  const f = pipeline(text);
  const visc = f.find(x => (x.name||'').toLowerCase().includes('viscose'));
  if (!visc) return fail('viscose do exterior não encontrada — forro pode ter dominado');
  return hasFiber(f, 'viscose', 70);
});

test('[Stradivarius] 100% Lyocell (PT, fibra única)', () => {
  const f = parse('100% Lyocell');
  return hasFiber(f, 'lyocell', 100);
});

// ── UNIQLO ────────────────────────────────────────────────────────────
// Formato: inglês, pode ter "Main:" como prefixo ou linha simples
test('[Uniqlo] 100% Merino Wool (EN, linha simples)', () => {
  const f = parse('100% Merino Wool');
  // "Merino Wool" deve mapear para merino
  const merin = f.find(x => (x.name||'').toLowerCase().includes('merino') || (x.name||'').toLowerCase().includes('wool'));
  if (!merin) return fail(`merino não encontrado. fibers=${JSON.stringify(f.map(x=>x.name))}`);
  return true;
});

test('[Uniqlo] Main: 95% Wool, 5% Cashmere (EN, prefixo Main)', () => {
  const text = 'Main: 95% Wool, 5% Cashmere';
  const f = pipeline(text);
  const wool = f.find(x => (x.name||'').toLowerCase().includes('wool') || (x.name||'').toLowerCase().includes('lã'));
  if (!wool) return fail(`lã não encontrada. fibers=${JSON.stringify(f.map(x=>x.name))}`);
  return hasFiber(f, 'cashmere', 5);
});

test('[Uniqlo] 56% Cotton, 44% Nylon (EN, vírgula)', () => {
  const f = parse('56% Cotton, 44% Nylon');
  const r = hasFiber(f, 'cotton', 56); if (r !== true) return r;
  return hasFiber(f, 'nylon', 44);
});

// ── RESERVED ─────────────────────────────────────────────────────────
// Formato: PT minúsculas, vírgula
test('[Reserved] 65% poliéster, 35% viscose (PT minúsculas)', () => {
  const f = parse('65% poliéster, 35% viscose');
  const r = hasFiber(f, 'poliéster', 65); if (r !== true) return r;
  return hasFiber(f, 'viscose', 35);
});

test('[Reserved] 100% algodão orgânico (PT, promoção orgânico via texto)', () => {
  // O texto da página menciona organic → algodão deve ser promovido
  const fibers = [fiber('algodão', 100)];
  const s = calcScores(fibers, '100% algodão orgânico certificado');
  if (s.quality <= getFiber('algodão').quality) return fail('orgânico não foi promovido nos scores');
  return true;
});

// ── Testes de robustez cross-loja ─────────────────────────────────────
test('[Cross-loja] composição com ponto decimal (ex: 97.5% Cotton)', () => {
  const f = parse('97.5% Cotton, 2.5% Elastane');
  const cot = f.find(x => (x.name||'').toLowerCase().includes('cotton'));
  if (!cot) return fail('cotton não encontrado');
  if (Math.abs(cot.pct - 97.5) > 1) return fail(`pct cotton = ${cot.pct}, esperado 97.5`);
  return true;
});

test('[Cross-loja] composição com vírgula decimal (97,5%)', () => {
  const f = parse('97,5% Algodão\n2,5% Elastano');
  const alg = f.find(x => (x.name||'').toLowerCase().includes('algodão'));
  if (!alg) return fail('algodão não encontrado');
  if (Math.abs(alg.pct - 97.5) > 1) return fail(`pct = ${alg.pct}, esperado 97.5`);
  return true;
});

test('[Cross-loja] fibra com "de" no meio (ex: "Algodão de cultivo...")', () => {
  // "XX% de fibra" — o "de" não deve interromper o parse
  const f = parse('100% de Algodão');
  return hasFiber(f, 'algodão', 100);
});

test('[Cross-loja] linha "COMPOSIÇÃO" em maiúsculas não é fibra', () => {
  const text = 'COMPOSIÇÃO\n80% Algodão\n20% Poliéster';
  const f = pipeline(text);
  // "composição" não deve aparecer como fibra
  const bad = f.find(x => (x.name||'').toLowerCase() === 'composição');
  if (bad) return fail('"composição" apareceu como fibra');
  return hasFiber(f, 'algodão', 80);
});

test('[Cross-loja] calçado sintético sem % detectado (PU catch-all)', () => {
  const text = 'Material: Couro Sintético';
  const f = parse(text, 'shoes');
  if (!f.length) return fail('nenhum material detectado para couro sintético');
  const synth = f.find(x => (x.name||'').toLowerCase().includes('sint') || (x.name||'').toLowerCase().includes('pu'));
  if (!synth) return fail(`material sintético não encontrado. fibers=${JSON.stringify(f.map(x=>x.name))}`);
  return true;
});

// ════════════════════════════════════════════════════════════════════════
// Relatório final
// ════════════════════════════════════════════════════════════════════════
console.log('\n\n══════════════════════════════════════════════════════════');
console.log(`Resultados: ${passed} passou / ${failed} falhou / ${total} total`);

if (failures.length > 0) {
  console.log('\nFalhas:');
  failures.forEach((f, i) => {
    console.log(`  ${i + 1}. ${f.name}`);
    console.log(`     → ${f.detail}`);
  });
}

console.log('══════════════════════════════════════════════════════════\n');
// A entrega da extensão (o zip que o botão baixa) tem o seu próprio teste,
// porque já quebrou duas vezes sem que nada aqui percebesse.
try {
  require('child_process').execSync('node ' + require('path').join(__dirname, 'entrega.js'),
    { stdio: 'inherit' });
} catch (e) {
  process.exit(1);
}

process.exit(failed > 0 ? 1 : 0);
