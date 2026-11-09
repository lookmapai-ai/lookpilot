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
const B = linkDaPeca('vinted-comptoir-manteau-80-laine.txt', {
  nome: 'Manteau court 80% laine rouge Comptoir des Cotonniers T34',
  loja: 'Vinted', preco: '30,00', moeda: '€',
  origem: 'https://www.vinted.pt/items/10682151564-manteau-court-80-laine-rouge'
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

teste('fora de um agasalho, as linhas saem da maior diferença para a menor', () => {
  const r = compararGuardadas([comoTipo(A, 'camiseta', 'a-camiseta'), comoTipo(B, 'camiseta', 'b-camiseta')]);
  const difs = r.itens('cmpLinhas').map((l) => num(l['l.diferenca']));
  if (!difs.length) return 'nenhuma linha desenhada';
  for (let i = 1; i < difs.length; i++) {
    if (difs[i] > difs[i - 1]) return 'ordem quebrada: ' + difs.join(', ');
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

teste('a mesma peça declarada camiseta não dá privilégio ao calor', () => {
  const r = compararGuardadas([comoTipo(A, 'camiseta', 'a-camiseta'), comoTipo(B, 'camiseta', 'b-camiseta')]);
  const rotulos = r.itens('cmpLinhas').map((l) => l['l.rotulo']);
  return rotulos[0] !== 'Calor' || 'pôs o calor à frente numa peça que não é agasalho: ' + rotulos.join(', ');
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
  return /Cappotto|Benetton/.test(nomes) && /Manteau|Comptoir/.test(nomes)
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
  return /80% laine|80% lã/.test(a + b)
    || 'a composição do Comptoir não aparece: "' + a + '" / "' + b + '"';
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
  const r = compararGuardadas([guardada(A), guardada(B)]);
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

console.log(`\n${ok} ok · ${falhas} falha(s)\n`);
process.exit(falhas ? 1 : 0);
