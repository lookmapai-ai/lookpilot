#!/usr/bin/env node
/* COMPARAR DUAS PEÇAS — a pergunta que vem depois da nota.
 *
 * Corre com: node tests/comparar.js
 *
 * Porque existe: a nota de uma peça responde "isto é bom?". Quem está a
 * decidir uma compra tem outra pergunta na cabeça — "qual das duas?" — e
 * essa não se responde pondo dois números ao lado um do outro. Dois
 * sobretudos de lã vermelhos do Vinted, um 60% lana e outro 80% laine,
 * dão 65 e 70. Com isso ninguém decide nada: a diferença de 5 pontos
 * esconde que um aquece 12 pontos mais e o outro se trata muito melhor.
 *
 * Por isso a comparação não é um placar. É uma resposta em prosa, e
 * depois as linhas ONDE A ESCOLHA SE DECIDE — por ordem do tamanho da
 * diferença, com as que empatam fora da lista.
 *
 * As CLASSES que este ficheiro fecha, todas maneiras de a comparação
 * mentir sem parecer avariada:
 *
 *   1. ORDEM. Uma lista alfabética (ou pela ordem em que o motor calcula)
 *      põe "Calor" em quarto lugar num agasalho e empurra a linha que
 *      decide para baixo da dobra. A ordem tem de ser a do tamanho da
 *      diferença.
 *
 *   2. EMPATE. 3 pontos em 100 não é diferença que se sinta a vestir.
 *      Mostrada como diferença, enche o ecrã de ruído e dá a quem lê a
 *      sensação de precisão que os números não têm.
 *
 *   3. MEDIDA QUE NÃO EXISTE. Uma peça guardada por uma versão anterior
 *      não traz o calor. Tratar isso como 0 é a mesma classe de defeito
 *      que o sobretudo de lã a dizer "não aquece": uma resposta confiante
 *      e falsa, em vez de um silêncio honesto.
 *
 *   4. A TROCA. Uma comparação que só diz quem ganha esconde o que se
 *      perde ao escolher. A frase tem de dizer as duas coisas.
 *
 *   5. SAÍDA. Um modo de escolha sem saída visível é uma armadilha; um
 *      ecrã de comparação sem par escolhido é uma página em branco. Nem
 *      um nem outro pode acontecer.
 *
 * O que este ficheiro NÃO faz: inventar números. As duas peças vêm do
 * acervo (tests/lojas/*.txt), passam pelo motor a sério e chegam à
 * comparação pelo mesmo link que a extensão escreve. Se o motor mudar de
 * opinião sobre elas, este teste muda com ele.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.join(__dirname, '..');
const { montar } = require('./dom-analise.js');

let ok = 0, falhas = 0;
function teste(nome, fn) {
  let r;
  try { r = fn(); } catch (e) { r = e.message + (e.stack ? '\n      ' + e.stack.split('\n')[1].trim() : ''); }
  if (r === true) { ok++; console.log('  ✓ ' + nome); }
  else { falhas++; console.log('  ✗ ' + nome + '\n      ' + r); }
}

/* ─── o motor, como o tests/acervo.js o carrega ─────────────────────── */
['shared.js', 'categories.js'].forEach((f) => {
  vm.runInThisContext(fs.readFileSync(path.join(raiz, f), 'utf8'), { filename: f });
});
global.window = {};
global.location = {
  href: 'https://www.vinted.pt/items/10732248062-cappotto',
  hostname: 'www.vinted.pt', pathname: '/items/10732248062-cappotto'
};
global.MutationObserver = class { constructor() {} observe() {} };
global.document = {
  querySelectorAll: () => [], querySelector: () => null, getElementById: () => null,
  title: '', addEventListener() {},
  body: { innerText: '', appendChild() {}, contains: () => false,
          querySelector: () => null, querySelectorAll: () => [] },
  createElement: () => ({ style: {}, appendChild() {}, remove() {}, textContent: '',
    querySelector: () => ({ addEventListener() {} }), getAttribute: () => null })
};
global.chrome = { runtime: { onMessage: { addListener() {} }, getURL: () => '',
                             getManifest: () => ({ version: '0.0' }) },
                  storage: { local: { get() {}, set() {} } } };
const src = fs.readFileSync(path.join(raiz, 'content.js'), 'utf8')
  .replace(/\}\)\(\);\s*$/, '  return { parseComposition, cortaRecomendados, buildAnaliseURL };\n})();');
vm.runInThisContext('global._api = ' + src, { filename: 'content.js' });
const API = global._api;

/* ─── as duas peças reais, do acervo até ao link da análise ──────────
   Este caminho é o ponto todo do ficheiro: os números comparados são os
   que o motor tira do texto REAL da página, não números escolhidos para
   o teste passar. Os metadados da loja (nome, preço) é que são postos à
   mão — na extensão vêm do DOM da página, que aqui não existe. */
function linkDaPeca(ficheiro, meta) {
  const bruto = fs.readFileSync(path.join(__dirname, 'lojas', ficheiro), 'utf8');
  const texto = API.cortaRecomendados(bruto.slice(bruto.indexOf('\n---\n') + 5));
  const fibras = API.parseComposition(texto, 'clothing');
  if (!fibras.length) throw new Error(ficheiro + ': o motor não leu composição nenhuma');
  const s = calcScores(fibras, texto, '', meta.nome);
  const tipo = detectGarmentType(s, null, 'clothing');
  const nota = Math.round(buyScore(s, tipo));
  // historia com o tipo: na extensão real vai sempre, e o tipo decide a
  // ordem das linhas (num agasalho o calor lidera)
  const url = API.buildAnaliseURL(s, fibras, nota, conclusionText(s, s.fibers || fibras, tipo),
                                  meta.origem, 80, { tipo: tipo });
  const q = new URLSearchParams(url.split('?')[1] || '');
  Object.keys(meta).forEach((k) => { if (k !== 'origem') q.set(k, meta[k]); });
  return { busca: '?' + q.toString(), nota: nota, nome: meta.nome, dims: q };
}

const A = linkDaPeca('vinted-benetton-cappotto-60-lana.txt', {
  nome: 'Cappotto rosso Benetton - 60% lana', loja: 'Vinted', preco: '10,00', moeda: '€',
  origem: 'https://www.vinted.pt/items/10732248062-cappotto-rosso-benetton-60-lana'
});
// A segunda peça era o "Manteau court 80% laine" do Vinted. Desde 24/11/2026
// uma etiqueta incompleta não dá nota (sem certeza, sem nota), e uma peça sem
// nota não entra numa comparação. Fica outro sobretudo de lã com a etiqueta
// INTEIRA — o 100% lã da Massimo Dutti — que mantém o que torna o par útil:
// notas parecidas, calor bem diferente.
const B = linkDaPeca('massimodutti-sobretudo-100-la.txt', {
  nome: 'Sobretudo comprido 100% de lã Massimo Dutti cor castanho mesclado',
  loja: 'Massimo Dutti', preco: '199,00', moeda: '€',
  origem: 'https://www.massimodutti.com/pt/sobretudo-comprido-100-de-la-l06451764'
});

// uma peça guardada, no formato que a página grava no navegador
function guardada(p) {
  return { id: p.dims.get('origem'), tipo: p.nome, nota: p.nota, loja: 'Vinted',
           thumb: '', verdict: p.dims.get('verdict') || '', quando: Date.now(),
           aptidoes: [], url: p.busca };
}

// Abre a página já no modo de escolha, escolhe duas peças da lista e
// carrega em comparar — o caminho exato de quem usa a funcionalidade.
function compararGuardadas(lista, quais) {
  const r = montar('', { guardadas: lista, hash: '#comparar' });
  (quais || [0, 1]).forEach((i) => r.clicarItem('guardadas', i, 'h.abrir'));
  r.clicar('onCompararAgora');
  return r;
}
const num = (s) => parseInt(String(s).replace(/[^\d]/g, ''), 10);

// A mesma peça com outro preço, para exercitar as faixas da frase do preço.
function precoDe(p, preco) {
  const q = new URLSearchParams(p.busca);
  q.set('preco', preco);
  return Object.assign(guardada(p), { id: 'preco-' + preco, url: '?' + q.toString() });
}

// A MESMA peça declarada como outro tipo. Serve para separar duas regras
// que de outro modo se confundem: a ordem geral (pelo tamanho da
// diferença) e a excepção do agasalho (o calor lidera).
function comoTipo(p, tipoKey, id) {
  const q = new URLSearchParams(p.busca);
  q.set('tipo', tipoKey);
  return Object.assign(guardada(p), { id: id || tipoKey, url: '?' + q.toString() });
}

// A mesma peça com OUTRO nome (e, se quiser, outro preço). Serve para forçar
// o caso em que duas peças chegam com o mesmo nome — dois sobretudos de lã da
// mesma loja — e o nome deixa de dizer qual é qual.
function comNome(p, nome, id, preco) {
  const q = new URLSearchParams(p.busca);
  q.set('nome', nome);
  if (preco) q.set('preco', preco);
  return Object.assign(guardada(p), { id: id, tipo: nome, url: '?' + q.toString() });
}

/* ═══════════════════════════════════════════════════════════════════ */
console.log('\n── 1. Dois sobretudos de lã, do texto da página à resposta ──\n');

teste('as duas peças chegam medidas (calor incluído) e com notas próximas', () => {
  const cA = num(A.dims.get('calor')), cB = num(B.dims.get('calor'));
  if (!cA || !cB) return 'calor em falta: A=' + A.dims.get('calor') + ' B=' + B.dims.get('calor');
  if (Math.abs(A.nota - B.nota) > 12) return 'notas demasiado afastadas: ' + A.nota + ' e ' + B.nota;
  // é isto que torna o par interessante: a nota quase não distingue, o calor sim
  return cB - cA >= 8 || 'o calor das duas quase não difere (' + cA + ' e ' + cB + ')';
});

teste('a comparação abre e responde em prosa antes de qualquer barra', () => {
  const r = compararGuardadas([guardada(A), guardada(B)]);
  if (r.display.isComparar !== 'contents') return 'o ecrã de comparação não ficou visível';
  const resp = r.txt.cmpResposta || '';
  if (resp.length < 40) return 'resposta curta ou vazia: "' + resp + '"';
  return /ganha em/.test(resp) || 'a resposta não diz quem ganha em quê: "' + resp + '"';
});

teste('a frase do calor dá os dois números e nomeia a peça pra frio de verdade', () => {
  const r = compararGuardadas([guardada(A), guardada(B)]);
  const resp = r.txt.cmpResposta;
  const cA = num(A.dims.get('calor')), cB = num(B.dims.get('calor'));
  if (resp.indexOf(Math.max(cA, cB) + ' contra ' + Math.min(cA, cB)) < 0) {
    return 'sem os dois números do calor: "' + resp + '"';
  }
  return /pra frio de verdade, é (ela|a outra)\./.test(resp)
    || 'sem a frase do frio: "' + resp + '"';
});

/* A frase do frio deixou de repetir o nome inteiro (quatro vezes num
   parágrafo — ninguém fala assim) e passou a apontar com "ela" / "a outra".
   Só que um pronome que aponte para a peça errada é pior do que o nome
   repetido: inverte a resposta sem parecer avariado. */
teste('o pronome aponta para a peça certa quando quem aquece não é quem lidera', () => {
  const maisQuente = (p) => {
    const q = new URLSearchParams(p.busca);
    q.set('calor', '95');
    return Object.assign(guardada(p), { id: 'quente', url: '?' + q.toString() });
  };
  const r = compararGuardadas([maisQuente(A), guardada(B)]);
  const resp = r.txt.cmpResposta;
  // quem lidera é nomeada na primeira frase; o calor agora é da outra
  const lidera = (/^A ([^.]+?) ganha em/.exec(resp) || [, ''])[1];
  const quenteEhLider = /pra frio de verdade, é ela\./.test(resp);
  if (!lidera) return 'a resposta não nomeia quem ganha: "' + resp + '"';
  // a peça com calor 95 é a A (Benetton); se ela não é a líder, tem de ser "a outra"
  const lideraEhBenetton = /Benetton/.test(lidera);
  if (quenteEhLider !== lideraEhBenetton) {
    return 'o pronome aponta ao contrário: lidera "' + lidera + '" e diz '
      + (quenteEhLider ? '"é ela"' : '"é a outra"');
  }
  return true;
});

teste('nenhum nome cortado fica com reticências e ponto final colados', () => {
  const r = compararGuardadas([guardada(A), guardada(B)]);
  const textos = [r.txt.cmpResposta, r.txt.cmpEmpate, r.txt.cmpSemMedida]
    .concat(r.itens('cmpLinhas').map((l) => l['l.melhor']));
  const maus = textos.filter((t) => /…\./.test(String(t || '')));
  return !maus.length || 'pontuação a dobrar: "' + maus[0] + '"';
});

teste('a resposta diz O QUE SE PERDE, não só quem ganha', () => {
  const r = compararGuardadas([guardada(A), guardada(B)]);
  return /Em troca, a /.test(r.txt.cmpResposta)
    || 'as duas ganham em coisas diferentes e a frase só contou um lado: "' + r.txt.cmpResposta + '"';
});

teste('o preço entra na resposta quando a diferença é grande (10 € contra 30 €)', () => {
  const r = compararGuardadas([guardada(A), guardada(B)]);
  return /(custa|sai por).*(menos|metade|terço)/.test(r.txt.cmpResposta)
    || 'o triplo do preço não apareceu: "' + r.txt.cmpResposta + '"';
});

/* ═══════════════════════════════════════════════════════════════════ */
console.log('\n── 2. A ordem das linhas ───────────────────────────\n');

/* A ordem das barras: o DECISOR da categoria lidera (ainda que não seja a
   maior diferença), e o resto segue a diferença. Numa camiseta o decisor é o
   conforto. (Fixtures sintéticos: controlam as dimensões, ao contrário das
   duas peças reais, cujos números vêm do motor.) */
const BASE_TEE = { calor:60, qualidade:70, durabilidade:50, conforto:60, custo:70, versatilidade:70, manutencao:70, viagem:70, score:70 };

teste('numa categoria, o decisor lidera as barras, ainda que não seja a maior diferença', () => {
  const a = pecaSintetica('Tee A', 'ord-a', '30', BASE_TEE, 'camiseta');
  // conforto difere 12 (o decisor); durabilidade difere 35 (bem mais)
  const b = pecaSintetica('Tee B', 'ord-b', '30', Object.assign({}, BASE_TEE, { conforto:72, durabilidade:85 }), 'camiseta');
  const r = compararGuardadas([a, b]);
  const rotulos = r.itens('cmpLinhas').map((l) => l['l.rotulo']);
  if (!rotulos.length) return 'nenhuma linha desenhada';
  if (rotulos[0] !== 'Conforto') return 'o decisor (Conforto) não liderou: ' + rotulos.join(', ');
  const resto = r.itens('cmpLinhas').slice(1).map((l) => num(l['l.diferenca']));
  for (let i = 1; i < resto.length; i++) {
    if (resto[i] > resto[i - 1]) return 'o resto deixou de estar ordenado: ' + resto.join(', ');
  }
  return true;
});

teste('tipo desconhecido (clothing) mantém a ordem pela diferença', () => {
  // o nome diz a família (top); o tipo 'clothing' não diz o decisor
  const a = pecaSintetica('Camisa X', 'ord-x', '30', BASE_TEE, 'clothing');
  const b = pecaSintetica('Camisa Y', 'ord-y', '30', Object.assign({}, BASE_TEE, { conforto:72, durabilidade:85 }), 'clothing');
  const difs = compararGuardadas([a, b]).itens('cmpLinhas').map((l) => num(l['l.diferenca']));
  if (!difs.length) return 'nenhuma linha desenhada';
  for (let i = 1; i < difs.length; i++) {
    if (difs[i] > difs[i - 1]) return 'ordem quebrada p/ tipo genérico: ' + difs.join(', ');
  }
  return true;
});

/* A linha que abriu esta secção: nestes dois sobretudos a manutenção difere
   17 pontos e o calor 12, e a ordem pelo tamanho da diferença punha "como se
   lava" acima de "se aquece" — com o calor em 4.º de 6, abaixo da dobra num
   telefone. A prosa já dava ao calor uma frase própria; as barras diziam
   outra coisa. Num agasalho o calor não é uma troca, é a condição. */
teste('num agasalho, o calor é a PRIMEIRA linha, ainda que não seja a maior diferença', () => {
  const r = compararGuardadas([guardada(A), guardada(B)]);
  const rotulos = r.itens('cmpLinhas').map((l) => l['l.rotulo']);
  if (!rotulos.length) return 'nenhuma linha desenhada';
  if (rotulos[0] !== 'Calor') return 'ordem: ' + rotulos.join(', ');
  // e a excepção é mesmo uma excepção: só o calor sobe
  const resto = r.itens('cmpLinhas').slice(1).map((l) => num(l['l.diferenca']));
  for (let i = 1; i < resto.length; i++) {
    if (resto[i] > resto[i - 1]) return 'o resto deixou de estar ordenado: ' + resto.join(', ');
  }
  return true;
});

teste('entre dois agasalhos de tipos diferentes (casaco e malha), o calor lidera', () => {
  // calor difere 25 (o decisor do agasalho); durabilidade difere 35 (mais)
  const casaco = pecaSintetica('Casaco', 'ag-a', '120', Object.assign({}, BASE_TEE, { calor:85, durabilidade:85 }), 'casaco');
  const malha = pecaSintetica('Malha', 'ag-b', '80', BASE_TEE, 'malha');
  const rotulos = compararGuardadas([casaco, malha]).itens('cmpLinhas').map((l) => l['l.rotulo']);
  return rotulos[0] === 'Calor' || 'o calor não liderou entre dois agasalhos: ' + rotulos.join(', ');
});

teste('cada linha mostra a diferença em pontos, no singular e no plural certos', () => {
  const r = compararGuardadas([guardada(A), guardada(B)]);
  const erradas = r.itens('cmpLinhas').filter((l) => {
    const n = num(l['l.diferenca']);
    return l['l.diferenca'] !== n + (n === 1 ? ' ponto' : ' pontos');
  });
  return !erradas.length || 'mal escrito: ' + erradas.map((l) => l['l.diferenca']).join(' / ');
});

console.log('\n── 3. O que empata sai da lista ─────────────────────────────\n');

teste('nenhuma linha visível tem menos de 5 pontos de diferença', () => {
  const r = compararGuardadas([guardada(A), guardada(B)]);
  const pequenas = r.itens('cmpLinhas').filter((l) => num(l['l.diferenca']) < 5);
  return !pequenas.length
    || 'ruído na lista: ' + pequenas.map((l) => l['l.rotulo'] + ' (' + l['l.diferenca'] + ')').join(', ');
});

teste('o que empata é dito numa linha só, e não desaparece', () => {
  const r = compararGuardadas([guardada(A), guardada(B)]);
  const visiveis = r.itens('cmpLinhas').map((l) => l['l.rotulo'].toLowerCase());
  const empate = (r.txt.cmpEmpate || '').toLowerCase();
  if (!empate) return 'estas duas peças empatam em qualidade e custo-benefício e nada o diz';
  const mencionadas = visiveis.filter((v) => empate.indexOf(v) >= 0);
  if (mencionadas.length) return 'dimensão a aparecer nos dois sítios: ' + mencionadas.join(', ');
  return /menos de 5 pontos/.test(empate) || 'o empate não explica o critério: "' + empate + '"';
});

teste('duas peças iguais não produzem lista nenhuma, e a resposta assume-o', () => {
  const r = compararGuardadas([guardada(A), Object.assign(guardada(A), { id: 'outra', tipo: 'Outra igual' })]);
  if (r.itens('cmpLinhas').length) return 'inventou diferenças entre duas peças idênticas';
  return /medem igual/.test(r.txt.cmpResposta)
    || 'resposta errada para um empate total: "' + r.txt.cmpResposta + '"';
});

/* ═══════════════════════════════════════════════════════════════════ */
console.log('\n── 4. Medida que não existe não é zero ──────────────────────\n');

// A classe inteira: uma peça guardada por uma versão anterior da extensão
// não traz o calor. Dizer que ela aquece 0 é o mesmo defeito que o
// sobretudo de lã a dizer "não aquece" — confiante e falso.
function semCalor(p) {
  const q = new URLSearchParams(p.busca);
  q.delete('calor');
  return Object.assign(guardada(p), { id: 'antiga', url: '?' + q.toString() });
}

teste('peça antiga sem calor: a linha não entra em vez de entrar a 0', () => {
  const r = compararGuardadas([semCalor(A), guardada(B)]);
  const calor = r.itens('cmpLinhas').filter((l) => l['l.rotulo'] === 'Calor');
  if (calor.length) return 'comparou calor com uma peça que não o tem: ' + JSON.stringify(calor[0]);
  return true;
});

teste('e diz-se porquê, em vez de a dimensão desaparecer em silêncio', () => {
  const r = compararGuardadas([semCalor(A), guardada(B)]);
  const aviso = (r.txt.cmpSemMedida || '').toLowerCase();
  if (!aviso) return 'o calor sumiu sem explicação';
  return aviso.indexOf('calor') >= 0 && /vers[ãa]o antiga/.test(aviso)
    || 'aviso não explica: "' + aviso + '"';
});

teste('sem calor, a resposta não inventa a frase do frio', () => {
  const r = compararGuardadas([semCalor(A), guardada(B)]);
  return !/pra frio de verdade/.test(r.txt.cmpResposta)
    || 'afirmou qual aquece mais sem ter medido as duas: "' + r.txt.cmpResposta + '"';
});

teste('um zero MEDIDO continua a ser comparado (zero não é ausência)', () => {
  const zero = (p) => {
    const q = new URLSearchParams(p.busca);
    q.set('calor', '0');
    return Object.assign(guardada(p), { id: 'zero', url: '?' + q.toString() });
  };
  const r = compararGuardadas([zero(A), guardada(B)]);
  const calor = r.itens('cmpLinhas').filter((l) => l['l.rotulo'] === 'Calor')[0];
  if (!calor) return 'tratou um 0 medido como medida em falta';
  return num(calor['l.diferenca']) === num(B.dims.get('calor'))
    || 'diferença errada: ' + calor['l.diferenca'];
});

/* ═══════════════════════════════════════════════════════════════════ */
console.log('\n── 5. A peça aberta entra sem ser guardada ──────────────────\n');

teste('com uma peça guardada e outra aberta, já há duas para comparar', () => {
  const r = montar(A.busca, { guardadas: [guardada(B)] });
  return r.display.podeComparar === 'contents'
    || 'o botão de comparar não foi oferecido (display: ' + r.display.podeComparar + ')';
});

teste('uma peça sozinha não oferece comparação (não há com quê)', () => {
  const r = montar(A.busca, { guardadas: [] });
  return r.display.podeComparar === 'none'
    || 'ofereceu comparar com uma peça só (display: ' + r.display.podeComparar + ')';
});

teste('comparar a partir do relatório já traz a peça aberta escolhida', () => {
  const r = montar(A.busca, { guardadas: [guardada(B)] });
  r.clicar('onComparar');
  return r.txt.selecaoLabel === 'Falta escolher a segunda'
    || 'não pré-escolheu a peça aberta: "' + r.txt.selecaoLabel + '"';
});

teste('a peça aberta e a guardada comparam-se sem passar por "guardar"', () => {
  const r = montar(A.busca, { guardadas: [guardada(B)] });
  r.clicar('onComparar');
  const cartoes = r.itens('guardadas').map((h) => h['h.nome'] || h['h.tipo'] || '');
  if (r.nItens('guardadas') < 2) return 'a lista de escolha só tem ' + r.nItens('guardadas') + ' peça(s)';
  r.clicarItem('guardadas', 1, 'h.abrir');
  r.clicar('onCompararAgora');
  if (r.display.isComparar !== 'contents') return 'não chegou ao ecrã de comparação';
  const nomes = [r.txt.cmpANome, r.txt.cmpBNome].join(' | ');
  return /Cappotto|Benetton/.test(nomes) && /Sobretudo|Massimo/.test(nomes)
    || 'comparou as peças erradas: ' + nomes + ' (cartões: ' + cartoes.join(', ') + ')';
});

/* ═══════════════════════════════════════════════════════════════════ */
console.log('\n── 6. Nunca um ecrã em branco, nunca um modo sem saída ──────\n');

teste('#comparar sem par escolhido cai na lista, não numa página vazia', () => {
  const r = montar('', { guardadas: [guardada(A), guardada(B)], hash: '#comparar' });
  if (r.display.isComparar === 'contents') return 'desenhou a comparação sem duas peças';
  return r.display.isHistorico === 'contents'
    || 'nem comparação nem lista: a página ficou em branco';
});

teste('o modo de escolha tem saída visível', () => {
  const r = montar('', { guardadas: [guardada(A), guardada(B)], hash: '#comparar' });
  if (r.display.modoSelecao !== 'contents') return 'o modo de escolha não está activo';
  r.clicar('onSairSelecao');
  return r.display.modoSelecao === 'none' || 'não saiu do modo de escolha';
});

teste('a terceira escolha empurra a primeira para fora (o toque nunca é ignorado)', () => {
  const r = montar('', { guardadas: [guardada(A), guardada(B), Object.assign(guardada(A), { id: 'terceira', tipo: 'Terceira peça' })], hash: '#comparar' });
  [0, 1, 2].forEach((i) => r.clicarItem('guardadas', i, 'h.abrir'));
  if (r.txt.selecaoLabel !== 'Prontas — é só comparar') {
    return 'ficou com outro número de peças: "' + r.txt.selecaoLabel + '"';
  }
  r.clicar('onCompararAgora');
  return r.display.isComparar === 'contents' || 'três toques e nenhuma comparação';
});

teste('voltar da comparação devolve a lista com a escolha intacta', () => {
  const r = compararGuardadas([guardada(A), guardada(B)]);
  r.clicar('onTrocarPecas');
  if (r.display.isComparar === 'contents') return 'continuou no ecrã de comparação';
  return r.txt.selecaoLabel === 'Prontas — é só comparar'
    || 'perdeu a escolha ao voltar: "' + r.txt.selecaoLabel + '"';
});

/* ═══════════════════════════════════════════════════════════════════ */
console.log('\n── 7. A cor não é o único sinal ─────────────────────────────\n');

teste('cada linha diz por escrito qual é a melhor, não só pela cor da barra', () => {
  const r = compararGuardadas([guardada(A), guardada(B)]);
  const semRotulo = r.itens('cmpLinhas').filter((l) => !String(l['l.melhor'] || '').trim());
  return !semRotulo.length
    || semRotulo.length + ' linha(s) só distinguem o vencedor pela cor';
});

teste('o nome da peça vencedora na linha é um dos dois nomes comparados', () => {
  const r = compararGuardadas([guardada(A), guardada(B)]);
  const curtos = [r.txt.cmpANome, r.txt.cmpBNome];
  const fora = r.itens('cmpLinhas').filter((l) => curtos.indexOf(l['l.melhor']) < 0);
  return !fora.length
    || 'rótulo que não corresponde a nenhuma peça: ' + fora.map((l) => l['l.melhor']).join(', ');
});

teste('o leitor de ecrã ouve a linha inteira: os dois números e o vencedor', () => {
  const r = compararGuardadas([guardada(A), guardada(B)]);
  const linhas = r.itens('cmpLinhas');
  const mudas = linhas.filter((l) => {
    const a = l['@aria-label'] || '';
    return a.indexOf(l['l.aNum'] + ' de 100') < 0
        || a.indexOf(l['l.bNum'] + ' de 100') < 0
        || a.indexOf('Melhor: ' + l['l.melhor']) < 0;
  });
  if (!linhas.length) return 'nenhuma linha para ouvir';
  return !mudas.length || mudas.length + ' linha(s) ilegíveis sem ver as barras: "'
    + (mudas[0]['@aria-label'] || '(vazio)') + '"';
});

teste('a largura da barra é o número, não um valor decorativo', () => {
  const r = compararGuardadas([guardada(A), guardada(B)]);
  const erradas = r.itens('cmpLinhas').filter((l) => {
    const est = l['@style'] || '';
    return est.indexOf('width:' + l['l.aNum'] + '%') < 0
        || est.indexOf('width:' + l['l.bNum'] + '%') < 0;
  });
  return !erradas.length || 'barra a desenhar outro número que não o da linha';
});

/* ═══════════════════════════════════════════════════════════════════ */
console.log('\n── 8. A etiqueta e o estado, que é o que se compara no usado ─\n');

teste('a composição de cada peça aparece escrita, não só a nota', () => {
  const r = compararGuardadas([guardada(A), guardada(B)]);
  const a = r.txt.cmpAComposicao || '', b = r.txt.cmpBComposicao || '';
  if (!/60% lana|60% lã/.test(a + b)) return 'a composição do Benetton não aparece: "' + a + '" / "' + b + '"';
  return /100% lã/.test(a + b)
    || 'a composição da Massimo Dutti não aparece: "' + a + '" / "' + b + '"';
});

teste('o estado da peça usada é comparado lado a lado', () => {
  const r = compararGuardadas([guardada(A), guardada(B)]);
  if (r.display.cmpTemEstado !== 'contents') return 'as duas são usadas e o estado não aparece';
  return /bom|satisfat|novo/i.test((r.txt.cmpAEstado || '') + (r.txt.cmpBEstado || ''))
    || 'estado vazio: "' + r.txt.cmpAEstado + '" / "' + r.txt.cmpBEstado + '"';
});

teste('nomes compridos são cortados sem partir palavras ao meio', () => {
  const r = compararGuardadas([guardada(A), guardada(B)]);
  [r.txt.cmpANome, r.txt.cmpBNome].forEach((n) => {
    if (!n) throw new Error('nome vazio');
    if (n.length > 36) throw new Error('nome comprido demais para a coluna: "' + n + '"');
  });
  // o original tem 57 caracteres: tem de ter sido cortado, e com reticências
  return /…$/.test(r.txt.cmpBNome)
    || 'cortou sem avisar que cortou: "' + r.txt.cmpBNome + '"';
});

/* ════════════════════════════════════════════════════════════════════ */
console.log('\n── 9. O ecrã não pode dizer uma coisa e mostrar outra ───\n');

/* Apanhado num link real: uma análise do Mango aberta em #comparar, sem
   nada guardado. O ecrã dizia "MINHAS PEÇAS · 0 PEÇAS" com um cartão à
   frente, debaixo de "As peças que você marcou para manter à vista —
   salvas neste navegador" (a peça não estava salva) e de um "Escolha duas
   peças" onde só existia uma.

   A CLASSE: a prosa desta lista foi escrita quando ela só mostrava peças
   guardadas. Desde que a peça aberta passou a entrar — que é o que poupa o
   passo de guardar antes de comparar — contador, frase e modo deixaram de
   bater com o que está no ecrã. Não é uma linha errada: são três, pelo mesmo
   motivo. */
teste('o contador diz o número de cartões que estão mesmo desenhados', () => {
  const casos = [
    ['lista normal, 2 guardadas', montar('', { guardadas: [guardada(A), guardada(B)] , hash: '#minhas-pecas' })],
    ['lista vazia', montar('', { guardadas: [], hash: '#minhas-pecas' })],
    ['modo de escolha', montar('', { guardadas: [guardada(A), guardada(B)], hash: '#comparar' })],
    ['peça aberta na escolha', (() => {
      const r = montar(A.busca, { guardadas: [guardada(B)] });
      r.clicar('onComparar');
      return r;
    })()]
  ];
  for (const [nome, r] of casos) {
    const desenhados = r.nItens('guardadas');
    const dito = num(r.txt.listaTitulo);
    if (desenhados === 0) continue;            // aí o título nem aparece
    if (dito !== desenhados) {
      return nome + ': o título diz "' + r.txt.listaTitulo + '" e há ' + desenhados + ' cartão(ões)';
    }
  }
  return true;
});

teste('nunca "1 peças"', () => {
  const r = montar(A.busca, { guardadas: [guardada(B)] });
  r.clicar('onComparar');
  const mau = [r.txt.listaTitulo, r.txt.nGuardadasLabel]
    .filter((t) => /\b1 peças\b/.test(String(t)));
  return !mau.length || 'plural errado: ' + mau.join(' / ');
});

teste('#comparar com uma peça só não abre um modo de escolha sem saída', () => {
  const r = montar(A.busca, { guardadas: [], hash: '#comparar' });
  if (r.display.modoSelecao === 'contents') {
    return 'pediu "' + r.txt.selecaoLabel + '" com uma peça só no ecrã';
  }
  // e o ecrã diz o que falta, em vez de ficar mudo
  return r.display.semGuardadas === 'contents' || r.display.temGuardadas === 'contents'
    || 'a lista ficou sem dizer nada';
});

teste('no modo de escolha a frase não afirma que a peça aberta está salva', () => {
  const r = montar(A.busca, { guardadas: [guardada(B)] });
  r.clicar('onComparar');
  const sub = r.txt.historicoSub || '';
  if (/só neste navegador/.test(sub)) {
    return 'a peça aberta não está salva e a frase diz que sim: "' + sub + '"';
  }
  return /mesmo sem salvar/.test(sub) || 'a frase não explica a peça aberta: "' + sub + '"';
});

teste('fora do modo de escolha, a frase continua a ser a das peças salvas', () => {
  const r = montar('', { guardadas: [guardada(A), guardada(B)], hash: '#minhas-pecas' });
  return /só neste navegador/.test(r.txt.historicoSub || '')
    || 'frase trocada na lista normal: "' + r.txt.historicoSub + '"';
});

/* ════════════════════════════════════════════════════════════════════ */
console.log('\n── 10. O nome da peça e o jeito de falar ────────────\n');

/* "Não resuma tanto o nome da peça." Cortar às 22 letras dava "Manteau
   court 80%…": ficava com a parte que não identifica nada e perdia a marca,
   que é justamente como a pessoa chama a peça — "o Comptoir", "o Benetton". */
teste('a marca sobrevive ao corte', () => {
  const r = compararGuardadas([guardada(A),
    comNome(B, 'Manteau court 80% laine rouge Comptoir des Cotonniers T34', 'dir', '30,00')]);
  const nomes = [r.txt.cmpANome, r.txt.cmpBNome].join(' | ');
  if (!/Benetton/.test(nomes)) return 'perdeu "Benetton": ' + nomes;
  return /Comptoir/.test(nomes) || 'perdeu "Comptoir": ' + nomes;
});

teste('o nome não acaba pendurado numa palavra de ligação', () => {
  const r = compararGuardadas([guardada(A), guardada(B)]);
  const presos = [r.txt.cmpANome, r.txt.cmpBNome]
    .filter((n) => /\b(de|da|do|com|e|em|para|pra|des|du|la|le|les|del|di|y|the|of|and)…$/i.test(String(n)));
  return !presos.length || 'nome a terminar em ligação: ' + presos.join(', ');
});

teste('o nome não repete a composição, que tem linha própria', () => {
  const r = compararGuardadas([guardada(A), guardada(B)]);
  const comPct = [r.txt.cmpANome, r.txt.cmpBNome].filter((n) => /\d{1,3}\s*%/.test(String(n)));
  return !comPct.length || 'percentagem no nome: ' + comPct.join(', ');
});

/* Saía daqui "custa o dobro ou mais menos": duas maneiras de dizer a mesma
   coisa coladas uma na outra, porque uma expressão já inteira ("o dobro ou
   mais") ia receber um "menos" no fim. */
teste('nenhuma frase junta duas maneiras de dizer a mesma coisa', () => {
  const casos = [
    compararGuardadas([guardada(A), guardada(B)]),                         // 10 € contra 30 €
    compararGuardadas([guardada(A), precoDe(B, '18,00')]),                 // menos de o dobro
    compararGuardadas([guardada(A), precoDe(B, '25,00')])                  // o dobro e meio
  ];
  for (const r of casos) {
    const t = r.txt.cmpResposta || '';
    if (/(dobro|terço|vezes) ou mais menos|ou mais menos|menos menos/.test(t)) {
      return 'frase impossivel: "' + t + '"';
    }
    if (/custa .*\bmenos\b.*\bmenos\b/.test(t)) return 'dois "menos" na mesma frase: "' + t + '"';
  }
  return true;
});

/* O produto fala português do Brasil ("você", "salvar", "pra"). Os textos
   novos saíram em português de Portugal e por isso soavam a outro produto:
   "guardada", "ecrã", "pesa tanto como". Isto varre as três telas. */
teste('a interface fala uma língua só', () => {
  const PORTUGAL = /\becr[ãa]s?\b|\bguardad[ao]s?\b|\btelem[oó]vel\b|tanto como\b|\bdeitar fora\b|\bap[oó]s o\b/i;
  const telas = [];
  const r1 = montar(A.busca, { guardadas: [guardada(B)] });
  telas.push(['relatório', r1.todos.join(' · ')]);
  r1.clicar('onHistorico');
  telas.push(['minhas peças', r1.todos.join(' · ')]);
  const r2 = compararGuardadas([guardada(A), guardada(B)]);
  telas.push(['comparação', r2.todos.join(' · ')]);
  const r3 = compararGuardadas([semCalor(A), guardada(B)]);
  telas.push(['comparação sem medida', r3.todos.join(' · ')]);
  for (const [nome, texto] of telas) {
    const m = PORTUGAL.exec(texto);
    if (m) {
      const i = Math.max(0, m.index - 40);
      return nome + ': "' + texto.slice(i, m.index + 50).trim() + '"';
    }
  }
  return true;
});

/* ═══════════════════════════════════════════════════════════════════
   DOIS NOMES IGUAIS NÃO PODEM VIRAR A MESMA PEÇA. Dois sobretudos de lã
   da mesma loja chegam com o mesmo nome curto ("Sobretudo de lã Manteco…").
   Com o nome a identificar as duas, a resposta ("A Sobretudo… ganha em
   calor"), o selo do vencedor e a etiqueta à esquerda de cada barra ficam
   todos iguais — não dá para saber de QUAL peça a frase fala. Nesse caso a
   referência passa a ser a posição: Peça 1 à esquerda, Peça 2 à direita. */
console.log('\n── 11. Dois nomes iguais não viram a mesma peça ─────\n');

const NOME_IGUAL = 'Sobretudo de lã Manteco com capuz destacável';
function parAmbiguo() {
  return compararGuardadas([
    comNome(A, NOME_IGUAL, 'esq', '179,99'),
    comNome(B, NOME_IGUAL, 'dir', '149,99')
  ]);
}

teste('com o nome igual, a resposta nomeia por posição, não repete o nome', () => {
  const resp = parAmbiguo().txt.cmpResposta || '';
  if (!/\bPeça [12]\b/.test(resp)) return 'a resposta não usa a posição: "' + resp + '"';
  // e não arrasta o nome repetido para dentro da frase
  return resp.indexOf(NOME_IGUAL) < 0
    || 'o nome repetido ainda entra na resposta: "' + resp + '"';
});

/* Nomes DIFERENTES que começam igual ("Sobretudo de lã com cinto" e
   "Sobretudo de lã Manteco…") cortam-se ao mesmo "Sobretudo de l…" na
   coluna estreita à esquerda das barras. Visto num print real (nov 2026). */
teste('a etiqueta à esquerda das barras é sempre Peça 1 / Peça 2', () => {
  const r = compararGuardadas([
    comNome(A, 'Sobretudo de lã com cinto', 'esq', '149,99'),
    comNome(B, 'Sobretudo de lã Manteco cruzado', 'dir', '149,99')
  ]);
  return (r.txt.cmpARotulo === 'Peça 1' && r.txt.cmpBRotulo === 'Peça 2')
    || 'barras rotuladas "' + r.txt.cmpARotulo + '" / "' + r.txt.cmpBRotulo + '"';
});

teste('com o nome igual, o selo do vencedor de cada barra é Peça 1 ou Peça 2', () => {
  const melhores = parAmbiguo().itens('cmpLinhas').map((l) => l['l.melhor']);
  if (!melhores.length) return 'nenhuma linha desenhada';
  const fora = melhores.filter((m) => !/^Peça [12]$/.test(String(m)));
  return !fora.length || 'barra com rótulo que não distingue: ' + fora.join(', ');
});

teste('cada coluna tem o índice Peça 1 / Peça 2 e a loja·preço que diz qual é qual', () => {
  const r = parAmbiguo();
  if (r.txt.cmpAPos !== 'Peça 1' || r.txt.cmpBPos !== 'Peça 2') {
    return 'faltou o índice de coluna: "' + r.txt.cmpAPos + '" / "' + r.txt.cmpBPos + '"';
  }
  // a loja·preço (diferente) continua no cabeçalho — é onde se lê qual peça é
  if (String(r.txt.cmpAMeta || '').indexOf('179,99') < 0
   || String(r.txt.cmpBMeta || '').indexOf('149,99') < 0) {
    return 'a loja·preço não distingue as colunas: "' + r.txt.cmpAMeta + '" / "' + r.txt.cmpBMeta + '"';
  }
  // e o nome completo de cada peça continua lá (a "descrição")
  return (r.txt.cmpANome || '').length > 0
    || 'o cabeçalho perdeu o nome da peça: "' + r.txt.cmpANome + '"';
});

teste('o leitor de ecrã ouve a posição, não dois nomes iguais, em cada linha', () => {
  const arias = parAmbiguo().itens('cmpLinhas').map((l) => String(l['@aria-label'] || ''));
  if (!arias.length) return 'nenhuma linha desenhada';
  // cada linha lida tem de referir Peça 1 e Peça 2 (os dois lados da barra)
  const incompletas = arias.filter((a) => a.indexOf('Peça 1') < 0 || a.indexOf('Peça 2') < 0);
  return !incompletas.length
    || 'linha que o leitor de ecrã ouve sem distinguir as duas: "' + incompletas[0] + '"';
});

teste('nomes que DE FACTO distinguem continuam pelo nome, não por posição', () => {
  const melhores = compararGuardadas([guardada(A), guardada(B)])
    .itens('cmpLinhas').map((l) => l['l.melhor']);
  return !melhores.some((m) => /^Peça [12]$/.test(String(m)))
    || 'passou a nomear por posição mesmo com Benetton ≠ Massimo Dutti: ' + melhores.join(', ');
});

/* ═══════════════════════════════════════════════════════════════════
   O QUE MAIS IMPORTA PRA VOCÊ (escolher critério, Fase 1 grátis). A
   comparação decide por uma ordem fixa; quando a pessoa diz o que mais
   importa nela, a resposta abre por isso e a barra daquele critério sobe
   ao topo. Nunca mexe no score /100 — só na história e na ordem. */
console.log('\n── 12. O que mais importa pra você (escolher critério) ─\n');

function pecaSintetica(nome, id, preco, dims, tipo) {
  tipo = tipo || 'casaco';
  const q = new URLSearchParams();
  q.set('nome', nome); q.set('loja', 'MANGO'); q.set('preco', preco);
  q.set('moeda', '€'); q.set('tipo', tipo);
  Object.keys(dims).forEach((k) => q.set(k, dims[k]));
  return { id, tipo: nome, nota: dims.score, loja: 'MANGO', thumb: '',
           verdict: '', quando: Date.now(), aptidoes: [], url: '?' + q.toString() };
}
// A valoriza manutenção/viagem; B valoriza calor — a troca fica visível.
const PA = pecaSintetica('Casaco A', 'cka', '120',
  { calor:70, qualidade:72, durabilidade:74, conforto:70, custo:70, versatilidade:72, manutencao:85, viagem:80, score:72 });
const PB = pecaSintetica('Casaco B', 'ckb', '150',
  { calor:88, qualidade:71, durabilidade:70, conforto:72, custo:60, versatilidade:68, manutencao:63, viagem:62, score:70 });
// índices em DIMENSOES (todas medidas): calor0 qual1 dur2 conf3 custo4 versa5 manut6 viagem7
const I_MANUT = 6, I_QUAL = 1, I_CUSTO = 4;

teste('os chips oferecem só as dimensões medidas nas duas peças', () => {
  const chips = compararGuardadas([PA, PB]).itens('cmpCriterios').map((c) => c['cr.rotulo']);
  return chips.length === 8 || 'esperava 8 critérios, veio ' + chips.length + ': ' + chips.join(', ');
});

teste('escolher um critério faz a resposta LIDERAR por ele', () => {
  const r = compararGuardadas([PA, PB]);
  r.clicarItem('cmpCriterios', I_MANUT, 'cr.escolher');
  return /^Pra manutenção, a /.test(r.txt.cmpResposta)
    || 'a resposta não lidera por manutenção: "' + r.txt.cmpResposta + '"';
});

teste('escolher um critério põe a BARRA dele no topo', () => {
  const r = compararGuardadas([PA, PB]);
  r.clicarItem('cmpCriterios', I_MANUT, 'cr.escolher');
  const primeira = r.itens('cmpLinhas')[0];
  return (primeira && primeira['l.rotulo'] === 'Manutenção')
    || 'a primeira barra não é Manutenção: ' + (primeira && primeira['l.rotulo']);
});

teste('critério empatado: a resposta diz que empatam NELE', () => {
  const r = compararGuardadas([PA, PB]);
  r.clicarItem('cmpCriterios', I_QUAL, 'cr.escolher'); // 72 vs 71 = empate
  return /^Em qualidade, as duas empatam/.test(r.txt.cmpResposta)
    || 'não reconheceu o empate em qualidade: "' + r.txt.cmpResposta + '"';
});

teste('marcar de novo DESMARCA e volta à resposta padrão', () => {
  const r = compararGuardadas([PA, PB]);
  const padrao = r.txt.cmpResposta;
  r.clicarItem('cmpCriterios', I_MANUT, 'cr.escolher');
  r.clicarItem('cmpCriterios', I_MANUT, 'cr.escolher');
  return r.txt.cmpResposta === padrao
    || 'não voltou ao padrão ao desmarcar: "' + r.txt.cmpResposta + '"';
});

teste('o score /100 de cada peça NÃO muda com o critério', () => {
  const r = compararGuardadas([PA, PB]);
  const a0 = r.txt.cmpANota, b0 = r.txt.cmpBNota;
  r.clicarItem('cmpCriterios', I_CUSTO, 'cr.escolher');
  return (r.txt.cmpANota === a0 && r.txt.cmpBNota === b0)
    || 'o score mudou com o critério: A ' + a0 + '→' + r.txt.cmpANota + ', B ' + b0 + '→' + r.txt.cmpBNota;
});

/* ═══════════════════════════════════════════════════════════════════
   A ESCOLHA, MARCADA NO ECRÃ. A comparação recomenda uma peça; isso vivia
   só na prosa. Agora a recomendada leva um selo "A escolha" e um anel na
   foto — e o selo SALTA de coluna quando o critério marcado troca o
   vencedor. Num empate de verdade, ninguém é marcado. */
console.log('\n── 13. A escolha, marcada no ecrã ──────────────────\n');

const marcada = (r) => {
  const a = r.display.cmpAEscolhida === 'contents';
  const b = r.display.cmpBEscolhida === 'contents';
  return a && b ? 'as duas' : a ? 'A' : b ? 'B' : 'ninguém';
};

teste('a recomendada leva o selo "A escolha" — uma, e só uma', () => {
  const m = marcada(compararGuardadas([PA, PB]));
  return (m === 'A' || m === 'B') || 'esperava exatamente uma marcada, veio: ' + m;
});

teste('o selo SALTA de coluna quando o critério troca o vencedor', () => {
  const r = compararGuardadas([PA, PB]);
  const antes = marcada(r);                               // default: A lidera
  r.clicarItem('cmpCriterios', 0, 'cr.escolher');         // Calor: B ganha (88 vs 70)
  const depois = marcada(r);
  return (antes === 'A' && depois === 'B')
    || 'o selo não saltou pra B ao escolher calor: antes ' + antes + ', depois ' + depois;
});

teste('critério empatado mantém o selo na recomendação geral', () => {
  const r = compararGuardadas([PA, PB]);
  r.clicarItem('cmpCriterios', I_QUAL, 'cr.escolher');    // Qualidade: 72 vs 71 = empate
  return marcada(r) === 'A' || 'o empate no critério tirou/moveu o selo: ' + marcada(r);
});

teste('num empate total, NINGUÉM é marcado (selo falso mentiria)', () => {
  const d = { calor:70, qualidade:70, durabilidade:70, conforto:70, custo:70, versatilidade:70, manutencao:70, viagem:70, score:70 };
  const r = compararGuardadas([pecaSintetica('Igual 1','ig1','100',d), pecaSintetica('Igual 2','ig2','100',d)]);
  return marcada(r) === 'ninguém' || 'marcou alguém num empate total: ' + marcada(r);
});

/* ═══════════════════════════════════════════════════════════════════
   TIPOS DIFERENTES — aviso honesto, não bloqueio. Comparar um sobretudo
   com uma camiseta dá "calor 90 contra 20": verdade e ruído. Quando as duas
   são de famílias diferentes, a comparação segue, mas uma linha avisa. Mesma
   família (dois agasalhos) ou tipo desconhecido não avisam. */
console.log('\n── 14. Tipos diferentes não se comparam ─────────────\n');

const DIMS_OK = { calor:60, qualidade:70, durabilidade:70, conforto:70, custo:70, versatilidade:70, manutencao:70, viagem:70, score:70 };

/* DESDE 24/11/2026 TIPOS DIFERENTES NÃO SE COMPARAM. O aviso dizia "são
   peças de tipos diferentes" e comparava na mesma — e coroava "A escolha"
   umas calças de bombazina contra um sobretudo de lã (print da Nathalia).
   Agora, escolhida a primeira peça, as de outra família ficam apagadas e
   não entram. */
function escolher(lista, quais) {
  const r = montar('', { guardadas: lista, hash: '#comparar' });
  quais.forEach((i) => r.clicarItem('guardadas', i, 'h.abrir'));
  return r;
}

teste('sobretudo + camiseta: depois do sobretudo, a camiseta fica apagada e não entra', () => {
  const casaco = pecaSintetica('Casaco', 't1', '120', Object.assign({}, DIMS_OK, { calor:90 }), 'casaco');
  const tee = pecaSintetica('Camiseta', 't2', '30', Object.assign({}, DIMS_OK, { calor:20 }), 'camiseta');
  const r = escolher([casaco, tee], [0]);
  const vis = r.itens('guardadas').map((l) => l['?h.bloqueada']);
  if (vis[1] !== 'contents') return 'a camiseta não ficou marcada como outro tipo: ' + vis.join(', ');
  r.clicarItem('guardadas', 1, 'h.abrir');
  if (r.display.selecaoCompleta === 'contents') return 'deixou escolher a camiseta e acender "Comparar"';
  return /mesmo tipo/.test(r.txt.historicoSub || '') || 'a frase não explica: "' + r.txt.historicoSub + '"';
});

teste('o caso do print: "CALÇAS DE BOMBAZINA" guardada sem tipo não compara com um sobretudo', () => {
  // peças antigas não traziam o tipo; o bloqueio tem de ler o nome
  const sobretudo = pecaSintetica('Sobretudo de lã Manteco com cinto', 'p1', '179,99', DIMS_OK, 'casaco');
  const calcas = pecaSintetica('CALÇAS DE BOMBAZINA BARREL', 'p2', '29,95', DIMS_OK, 'clothing');
  const r = escolher([sobretudo, calcas], [0, 1]);
  if (r.display.selecaoCompleta === 'contents') return 'as calças entraram na comparação com o sobretudo';
  return r.itens('guardadas')[1]['?h.bloqueada'] === 'contents' || 'as calças não aparecem apagadas';
});

teste('com duas escolhidas, a terceira de outro tipo não empurra nenhuma para fora', () => {
  const c1 = pecaSintetica('Casaco A', 'e1', '120', DIMS_OK, 'casaco');
  const c2 = pecaSintetica('Malha B', 'e2', '80', DIMS_OK, 'malha');
  const calca = pecaSintetica('Calça C', 'e3', '40', DIMS_OK, 'calca');
  const r = escolher([c1, c2, calca], [0, 1, 2]);
  const nums = r.itens('guardadas').map((l) => l['h.selNum']);
  return (nums[0] === '1' && nums[1] === '2' && !nums[2]) || 'escolhidas ficaram: ' + nums.join(', ');
});

teste('dois agasalhos (casaco e malha): NÃO avisa — mesma família', () => {
  const casaco = pecaSintetica('Casaco', 't3', '120', DIMS_OK, 'casaco');
  const malha = pecaSintetica('Malha', 't4', '80', DIMS_OK, 'malha');
  return compararGuardadas([casaco, malha]).display.cmpTiposDiferentes !== 'contents'
    || 'avisou entre peças da mesma família (agasalho)';
});

teste('o caso do print 2: a jardineira que a extensão chamou de "casaco" não compara com um casaco', () => {
  // bombazina/ganga é tecido pesado e a extensão deduziu "casaco" — o nome manda
  const jardineira = pecaSintetica('JARDINEIRA DE BOMBAZINA', 'j1', '39,95', DIMS_OK, 'casaco');
  const casaco = pecaSintetica('Casaco de lã', 'j2', '120', DIMS_OK, 'casaco');
  const r = escolher([casaco, jardineira], [0, 1]);
  if (r.display.selecaoCompleta === 'contents') return 'a jardineira entrou na comparação com o casaco';
  return r.itens('guardadas')[1]['?h.bloqueada'] === 'contents' || 'a jardineira não aparece apagada';
});

// SEM CERTEZA DO TIPO, NÃO COMPARA. Era assim que a jardineira passava.
teste('peça sem tipo nem nome reconhecível fica apagada desde o início e não entra', () => {
  const a = pecaSintetica('Peça X', 'u1', '50', DIMS_OK, 'clothing');
  const b = pecaSintetica('Peça Y', 'u2', '60', DIMS_OK, 'clothing');
  const r = escolher([a, b], [0, 1]);
  if (r.display.selecaoCompleta === 'contents') return 'duas peças sem tipo entraram na comparação';
  const it = r.itens('guardadas');
  if (it[0]['?h.bloqueada'] !== 'contents') return 'a peça sem tipo não aparece apagada';
  return /não reconhecido/.test(it[0]['h.bloqueioTxt'] || '') || 'etiqueta: "' + it[0]['h.bloqueioTxt'] + '"';
});

/* ═══════════════════════════════════════════════════════════════════
   REENQUADRAR POR CATEGORIA. As barras seguem a diferença; o reenquadramento
   vive nos chips — a dimensão que decide neste tipo sobe à frente e ganha uma
   dica ("Num casaco, costuma decidir o calor"). Só quando as duas peças são do
   MESMO tipo conhecido; se divergem, fala o aviso de tipos diferentes. */
console.log('\n── 15. Reenquadrar as dimensões por categoria ──────\n');

const chipRotulos = (r) => r.itens('cmpCriterios').map((c) => c['cr.rotulo']);

teste('num casaco, a dica aponta o calor', () => {
  const r = compararGuardadas([
    pecaSintetica('Casaco A', 'c1', '120', DIMS_OK, 'casaco'),
    pecaSintetica('Casaco B', 'c2', '150', Object.assign({}, DIMS_OK, { calor:85 }), 'casaco')
  ]);
  if (r.display.cmpTemDicaCategoria !== 'contents') return 'não mostrou a dica da categoria';
  return /calor/.test(r.txt.cmpDicaCategoria || '')
    || 'a dica não aponta o calor: "' + r.txt.cmpDicaCategoria + '"';
});

teste('numa calça, o decisor (durabilidade) sobe para o 1º chip e a dica o nomeia', () => {
  const r = compararGuardadas([
    pecaSintetica('Calça A', 'c3', '80', DIMS_OK, 'calca'),
    pecaSintetica('Calça B', 'c4', '90', Object.assign({}, DIMS_OK, { durabilidade:85 }), 'calca')
  ]);
  const primeiro = chipRotulos(r)[0];
  if (primeiro !== 'Durabilidade') return 'o 1º chip não é Durabilidade: ' + primeiro;
  return /durabilidade/.test(r.txt.cmpDicaCategoria || '')
    || 'a dica não nomeia a durabilidade: "' + r.txt.cmpDicaCategoria + '"';
});

teste('dois agasalhos de tipos diferentes (casaco e malha) NÃO ganham dica de um tipo só', () => {
  const r = compararGuardadas([
    pecaSintetica('Casaco', 'c5', '120', DIMS_OK, 'casaco'),
    pecaSintetica('Malha', 'c6', '80', DIMS_OK, 'malha')
  ]);
  if (r.display.isComparar !== 'contents') return 'casaco e malha deixaram de comparar';
  return !/Num casaco|Numa malha/.test(r.txt.cmpDicaCategoria || '') || r.display.cmpTemDicaCategoria !== 'contents'
    || 'deu a dica de um tipo só: "' + r.txt.cmpDicaCategoria + '"';
});

teste('tipo desconhecido NÃO ganha dica', () => {
  const r = compararGuardadas([
    pecaSintetica('Camisa X', 'c7', '50', DIMS_OK, 'clothing'),
    pecaSintetica('Camisa Y', 'c8', '60', DIMS_OK, 'clothing')
  ]);
  if (r.display.isComparar !== 'contents') return 'duas camisas deixaram de comparar';
  return r.display.cmpTemDicaCategoria !== 'contents' || 'sugeriu categoria p/ tipo desconhecido';
});

/* ═══════════════════════════════════════════════════════════════════
   REMOVER UMA PEÇA. A lista só crescia: uma peça analisada por engano, ou
   guardada por uma versão com o preço riscado e a etiqueta mal lida (o
   sobretudo da Mango, nov 2026), ficava para sempre e entrava em todas as
   comparações. Pedido da Nathalia: "é preciso um botão para remover as peças". */
console.log('\n── 16. Remover uma peça salva ───────────────────────\n');

function minhasPecas(lista) {
  return montar('', { guardadas: lista, hash: '#minhas-pecas' });
}
const tres = () => [guardada(A), guardada(B), comNome(A, 'Casaco de teste', 'terceira', '9,99')];

teste('cada peça salva tem o botão de remover', () => {
  const r = minhasPecas(tres());
  if (r.nItens('guardadas') !== 3) return 'a lista mostra ' + r.nItens('guardadas') + ' peças, esperava 3';
  for (let i = 0; i < 3; i++) {
    try { r.clicarItem('guardadas', 0, 'h.remover'); } catch (e) { return 'peça ' + (i + 1) + ': ' + e.message; }
  }
  return r.gravadas().length === 0 || 'ficaram ' + r.gravadas().length + ' gravadas';
});

teste('remover tira a peça do ecrã E do navegador, e só essa', () => {
  const r = minhasPecas(tres());
  r.clicarItem('guardadas', 1, 'h.remover');
  const ids = r.gravadas().map((h) => h.id);
  if (ids.length !== 2) return 'gravadas: ' + ids.length;
  if (ids.indexOf(guardada(B).id) >= 0) return 'a peça removida continua gravada';
  return r.nItens('guardadas') === 2 || 'o ecrã ainda mostra ' + r.nItens('guardadas');
});

teste('remover não abre a análise da peça (o toque não atravessa para o cartão)', () => {
  const r = minhasPecas(tres());
  r.clicarItem('guardadas', 0, 'h.remover');
  return !r.navegou || 'abriu ' + r.navegou;
});

teste('"Desfazer" devolve a peça ao mesmo lugar', () => {
  const r = minhasPecas(tres());
  const antes = r.gravadas().map((h) => h.id).join('|');
  r.clicarItem('guardadas', 1, 'h.remover');
  if (r.display.temRemovida !== 'contents') return 'não apareceu o aviso com "Desfazer"';
  if (!/saiu das suas peças/.test(r.txt.removidaTexto || '')) return 'aviso sem texto: "' + r.txt.removidaTexto + '"';
  r.clicar('onDesfazer');
  const depois = r.gravadas().map((h) => h.id).join('|');
  if (depois !== antes) return 'voltou noutra ordem: ' + depois;
  return r.display.temRemovida !== 'contents' || 'o aviso ficou depois de desfazer';
});

teste('o botão de remover aparece nas peças salvas', () => {
  const vis = minhasPecas(tres()).itens('guardadas').map((l) => l['?h.mostraRemover']);
  if (!vis.length || vis[0] === undefined) return 'o simulador não vê o data-if do botão';
  return vis.every((v) => v === 'contents') || 'visibilidade: ' + vis.join(', ');
});

teste('no modo de escolher pra comparar o botão de remover some', () => {
  const r = montar('', { guardadas: tres(), hash: '#comparar' });
  const vis = r.itens('guardadas').map((l) => l['?h.mostraRemover']);
  if (!vis.length) return 'lista vazia no modo de escolha';
  return vis.every((v) => v === 'none') || 'visibilidade: ' + vis.join(', ');
});

/* ═══════════════════════════════════════════════════════════════════
   O TIPO DE CADA PEÇA, PELO NOME. A comparação só abre entre peças da mesma
   família, e o nome manda mais do que o tipo que a extensão deduziu pelo
   tecido (a jardineira de bombazina saía "casaco"). Se o nome de uma peça
   real não for reconhecido, ela fica fora de qualquer comparação — por isso
   cada título real de loja tem de cair na família certa, em todas as línguas
   das lojas que a extensão lê. */
console.log('\n── 17. O tipo de cada peça, pelo nome ──────────────\n');

const RT = fs.readFileSync(path.join(raiz, 'landing', 'runtime.js'), 'utf8');
const familia = (() => {
  const ini = RT.indexOf('  var FAMILIA_TIPO = {');
  const fimTipo = RT.indexOf('};', ini) + 2;
  const iniNome = RT.indexOf('  var FAMILIA_NOME = [');
  const fimNome = RT.indexOf('  function comparaveis(');
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(RT.slice(ini, fimTipo) + '\n' + RT.slice(iniNome, fimNome) + '\nthis.f = familiaDe;', ctx);
  return (nome, tipo) => ctx.f({ nome: nome, tipo: tipo || '' });
})();

const NOMES = [
  // as peças guardadas como página real (tests/lojas)
  ...fs.readdirSync(path.join(__dirname, 'lojas')).filter((f) => f.endsWith('.txt')).map((f) => {
    const t = fs.readFileSync(path.join(__dirname, 'lojas', f), 'utf8');
    const tit = (/^titulo:\s*(.*)$/m.exec(t) || [, ''])[1].split('|')[0].trim();
    const fam = /cal[çc][õo]es/i.test(tit) ? 'baixo'
      : /camisa|t-shirt|shirt|blouse/i.test(tit) ? 'top' : 'agasalho';
    return [tit, fam];
  }),
  // nomes reais vistos nas lojas em 24/11/2026
  ['JARDINEIRA DE BOMBAZINA', 'inteira'], ['Jardineira jeans', 'inteira'], ['Macacão de malha', 'inteira'],
  ['Salopete de ganga', 'inteira'], ['Mono largo de lino', 'inteira'], ['Denim dungarees', 'inteira'],
  ['CALÇAS DE BOMBAZINA BARREL', 'baixo'], ['Pantalón volumen pana', 'baixo'], ['Vaquero ancho tiro alto', 'baixo'],
  ['Straight Regular Waist Jeans', 'baixo'], ['Joggers com pernas arqueadas', 'baixo'], ['Saia midi plissada', 'baixo'],
  ['Calças cargo em sarja acetinada', 'baixo'], ['Calções de linho com cordão', 'baixo'],
  ['Vestido mini 100% lana', 'vestido'], ['Vestido punto cuello polo', 'vestido'], ['Vestido camisa', 'vestido'],
  ['Jersey trenzado cuello redondo', 'agasalho'], ['Cárdigan corto lana cuello pico', 'agasalho'],
  ['PUFFERTECH Chaqueta', 'agasalho'], ['Teddy Jacket', 'agasalho'], ['Casaco em malha bouclé', 'agasalho'],
  ['Camisola com meia gola', 'agasalho'], ['Americana punto', 'agasalho'], ['Casaco desportivo fecho correr', 'agasalho'],
  ['Bomber painéis s/ gola, pêlo sint.', 'agasalho'], ['Casaco curto com gola funil', 'agasalho'],
  ['Camisas The Edit com colarinho em cetim', 'top'], ['Top justo manga comprida gola subida', 'top'],
  ['Camiseta básica', 'top'],
  ['Botas de plataforma plana com forro quente', 'calcado'], ['Ténis', 'calcado'], ['Sapatilhas de corrida', 'calcado'],
  ['Mala de ombro retangular', 'bolsa'], ['Mochila urbana', 'bolsa'],
  // armadilhas: a palavra parecida que não é a peça
  ['Casaco com bolsos e botões', 'agasalho'], ['Calças com bolsos', 'baixo'], ['Blusa de cetim', 'top'],
  ['Blusão cruzado soft', 'agasalho']
];

teste('cada nome real cai na família certa', () => {
  const erradas = NOMES.filter(([n, f]) => familia(n) !== f).map(([n, f]) => `"${n}" → ${familia(n) || '(nenhuma)'} (esperava ${f})`);
  return !erradas.length || erradas.join('\n      ');
});

teste('o nome manda mais do que o tipo deduzido pelo tecido', () => {
  return familia('Jardineira de bombazina', 'casaco') === 'inteira' || 'a jardineira ficou ' + familia('Jardineira de bombazina', 'casaco');
});

console.log(`\n${ok} ok · ${falhas} falha(s)\n`);
process.exit(falhas ? 1 : 0);
