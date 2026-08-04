#!/usr/bin/env node
/* Teste de COERÊNCIA do texto com a peça.
 *
 *   node tests/coerencia.js
 *
 * Responde a pergunta que nenhuma outra rede responde: o texto que a pessoa
 * lê faz sentido PARA ESTA PEÇA?
 *
 * Os 120 testes do motor conferem números (a nota do poliéster mudou?). O
 * tests/pagina.js confere que a tela não explode. Nenhum dos dois percebe um
 * casaco de pena certificado até -20°C recebendo "Boa para uso prático, não
 * para os dias quentes" — número certo, tela viva, frase absurda. Isso só
 * aparecia num print, uma peça de cada vez, e é o que destrói a confiança:
 * uma frase obviamente errada faz a pessoa duvidar da nota também.
 *
 * Como funciona: peças REAIS (título e descrição copiados das lojas) passam
 * pelo caminho completo — calcScores → detectGarmentType → conclusionText —
 * e um conjunto de REGRAS diz que frase não pode sair em que contexto.
 *
 * Para cobrir uma peça nova: acrescente uma entrada em PECAS. Para proibir
 * uma frase nova: acrescente uma entrada em REGRAS. Nenhuma das duas listas
 * exige mexer no motor.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.join(__dirname, '..');
['shared.js', 'categories.js'].forEach((f) => {
  vm.runInThisContext(fs.readFileSync(path.join(raiz, f), 'utf8'), { filename: f });
});

// A página de análise tem motor próprio (landing/runtime.js) e é a outra
// metade do que a pessoa lê. Mesmo simulador do tests/pagina.js.
const { montar, query } = require('./dom-analise.js');

// A extensão entrega a fibra com a ficha do fibers.json já anexada. Sem
// isto o motor devolve nota ~10 e nunca chega aos ramos de texto que
// interessam — o teste passaria verde sem testar nada.
function fibra(nome, pct) { return { name: nome, pct: pct, data: getFiber(nome) }; }

// ─── Peças reais das lojas ───────────────────────────────────────────
// `texto` é a descrição/etiqueta como aparece na página; `titulo` é o nome
// do produto. Os dois juntos são exatamente o que a extensão lê.
const PECAS = [
  {
    nome: 'Simond MT900 — casaco de penas -20°C (Decathlon)',
    titulo: 'Casaco acolchoado penas com capuz mulher - MT900 Bordeaux -20°C',
    texto: 'Composição: 100% Poliéster. Forro: 100% Poliéster. Enchimento: 90% Penas de pato, 10% Plumas. '
         + 'Pronto para o trekking? Desfruta de uma proteção térmica ideal nos teus acampamentos com este '
         + 'casaco acolchoado de penas que resiste a temperaturas até -20°C em atividade e -5°C em estático. '
         + 'Impermeável e corta-vento.',
    fibras: [fibra('Poliéster', 100)],
    esperaTipo: 'casaco',
    agasalho: true
  },
  {
    nome: 'Columbia Puffect II — casaco acolchoado (Decathlon)',
    titulo: 'Columbia Puffect II Hooded Jacket Black',
    texto: 'Composição: 100% Poliéster. Jaqueta acolchoada repelente de água com isolamento quente. '
         + 'À prova de vento e tempestades: À prova de vento. Impermeabilidade: Não impermeável.',
    fibras: [fibra('Poliéster', 100)],
    esperaTipo: 'casaco',
    agasalho: true,
    // Casco de poliéster é o que tem nota de bolinha baixa na tabela de
    // fibras — por isso é esta peça, e não a de poliamida, que exercita o
    // ramo "vai criar bolinhas". Sem ela marcada, a regra passava a seco.
    acolchoado: true
  },
  {
    nome: 'Camiseta de malha de algodão (Zara)',
    titulo: 'T-shirt básica de algodão',
    texto: 'Composição: 100% Algodão. T-shirt de malha, gola redonda, manga curta.',
    fibras: [fibra('Algodão', 100)],
    esperaTipo: 'malha',
    agasalho: false
  },
  {
    nome: 'Top de poliamida (Oysho)',
    titulo: 'Top de alças poliamida reciclada',
    texto: 'Composição: 92% Poliamida reciclada, 8% Elastano. Top de alças finas, tecido leve.',
    fibras: [fibra('Poliamida', 92), fibra('Elastano', 8)],
    esperaTipo: 'clothing',
    agasalho: false
  },
  {
    nome: 'Calça de sarja (Uniqlo)',
    titulo: 'Calças de sarja de algodão corte reto',
    texto: 'Composição: 98% Algodão, 2% Elastano. Calças de sarja, tecido encorpado, corte reto.',
    fibras: [fibra('Algodão', 98), fibra('Elastano', 2)],
    esperaTipo: 'clothing',
    agasalho: false,
    parteDeBaixo: true
  },
  {
    nome: 'Camisola HEATTECH (Uniqlo)',
    titulo: 'HEATTECH camisola de gola redonda manga comprida',
    texto: 'Composição: 45% Acrílico, 33% Poliéster, 17% Raiom, 5% Elastano. '
         + 'A tecnologia HEATTECH transforma a humidade do corpo em calor. Malha fina.',
    fibras: [fibra('Acrílico', 45), fibra('Poliéster', 33),
             fibra('Viscose', 17), fibra('Elastano', 5)],
    esperaTipo: 'malha',
    agasalho: false
  },
  {
    // A peça do print: 100% poliamida é SÓ o casco. O que aquece é a pena,
    // que a etiqueta de composição não menciona.
    nome: 'Simond — casaco de penas de alpinismo (Decathlon)',
    titulo: 'Casaco de Penas Alpinismo Homem Ocre - Cinzento',
    texto: 'Composição: 100% Poliamida. O corte ergonómico liberta os teus movimentos e permite '
         + 'transportar o capacete debaixo do capuz. O fecho de correr duplo facilita o acesso ao '
         + 'arnês. Dobra-se para dentro do bolso de arrumação.',
    fibras: [fibra('Poliamida', 100)],
    esperaTipo: 'casaco',
    agasalho: true,
    acolchoado: true
  },
  {
    nome: 'Casaco impermeável de trekking (Decathlon)',
    titulo: 'Casaco impermeável de caminhada na natureza mulher MH500',
    texto: 'Composição: 78% Poliamida, 22% Elastano. Casaco impermeável e corta-vento, '
         + 'membrana com 10 000 mm de coluna de água. Costuras seladas.',
    fibras: [fibra('Poliamida', 78), fibra('Elastano', 22)],
    esperaTipo: 'casaco',
    agasalho: true,
    tecnico: true
  },
  {
    // Casaco de ski SNB 500. A ficha técnica vem em milímetros de coluna de
    // água, não com a palavra "impermeável" — e a peça tem 8 zonas.
    nome: 'Dreamscape SNB 500 — casaco de ski (Decathlon)',
    titulo: 'Casaco de Ski e Snowboard Quente e Resistente SNB 500 Mulher Cinzento Escuro',
    texto: 'Composição: Tecido principal: 100.0% Poliamida. O trio vencedor? Impermeabilidade (15 000 mm), '
         + 'respirabilidade e liberdade de movimento. Encadeia as sessões sem problemas! O corte comprido dá-te conforto.',
    fibras: [fibra('Poliamida', 100)],
    esperaTipo: 'casaco',
    agasalho: true,
    tecnico: true
  },
  {
    // Caso real, com as propriedades exatas que a extensão mandou para a
    // página (4,74★ em 1735 avaliações). Dizia "Prende o suor por dentro"
    // num impermeável cuja membrana existe precisamente para o contrário.
    nome: 'MH500 — casaco impermeável de montanha (Decathlon)',
    titulo: 'Casaco Impermeável de Caminhada na Montanha Mulher MH500 Framboesa',
    texto: 'Composição: 78% Poliamida, 22% Poliéster. Casaco impermeável e corta-vento para '
         + 'caminhada na montanha. Membrana respirável, costuras seladas, 10 000 mm.',
    fibras: [fibra('Poliamida', 78), fibra('Poliéster', 22)],
    props: 'bol:6,ama:8,sec:8,cal:5,res:4,pes:6,sus:3',
    esperaTipo: 'casaco',
    agasalho: true,
    tecnico: true
  },
  {
    nome: 'Parka corta-vento (Zara)',
    titulo: 'Parka técnica com capuz',
    texto: 'Composição: 100% Poliéster. Parka corta-vento com capuz, acabamento repelente de água.',
    fibras: [fibra('Poliéster', 100)],
    esperaTipo: 'casaco',
    agasalho: true
  }
];

// ─── Regras: que frase não pode sair em que contexto ─────────────────
// `quando` recebe o contexto da peça e devolve true se a regra se aplica.
// `frase` é o que NÃO pode aparecer no texto quando ela se aplica.
const REGRAS = [
  {
    id: 'agasalho-nao-e-pro-verao',
    frase: /dias quentes|para o ver[ãa]o|pro ver[ãa]o/i,
    quando: (c) => c.agasalho,
    porque: 'ninguém compra casaco de pena para dia quente — a ressalva não faz sentido e queima a confiança na nota'
  },
  {
    id: 'agasalho-nao-e-leve-demais',
    frase: /tecido leve e fresco|refresca/i,
    quando: (c) => c.agasalho,
    porque: 'descreve peça de verão, não agasalho'
  },
  {
    // A manchete é a primeira frase — é o que a pessoa lê antes de decidir
    // se continua lendo. Num agasalho ela tem de responder "isto aquece e
    // aguenta?", não "isto respira?". A ressalva de respirabilidade pode
    // existir, mas no fim: quem compra casaco já sabe que vai tirar dentro
    // de casa. Aberta, ela faz uma peça boa parecer má escolha.
    id: 'agasalho-nao-abre-com-respirabilidade',
    frase: /^[^.]*(n[aã]o respira bem|dois por[ée]ns|menos sustent[aá]vel)/i,
    quando: (c) => c.agasalho,
    porque: 'num casaco, respirar não é o critério de compra — aquecer e aguentar é'
  },
  {
    // Casaco é camada de fora: abre-se e tira-se. Frases que pressupõem a
    // peça colada ao corpo o dia inteiro ("abafa num dia inteiro fora",
    // "não deixa a pele respirar") descrevem uma camiseta, não um casaco —
    // e fazem parecer defeito o que é a função da peça.
    id: 'agasalho-nao-e-julgado-como-peca-colada-ao-corpo',
    frase: /abafa|n[aã]o deixa a pele respirar|o calor do corpo n[aã]o sai/i,
    quando: (c) => c.agasalho,
    porque: 'casaco se abre e se tira — julgar como se fosse vestido colado ao corpo o dia todo inverte o que é qualidade'
  },
  {
    // O casco de um acolchoado é nylon fino esticado, não malha: não
    // encaroça. E "cintura, axila, alça da bolsa" são pontos de atrito de
    // roupa vestida junto ao corpo — não da camada de fora. A nota de
    // bolinha vem da fibra da etiqueta, que aqui descreve a parte errada.
    // Mira a AFIRMAÇÃO, não a palavra: o texto certo pode (e deve) dizer
    // "não é bolinha, é o recheio murchar" — negar é justamente o objetivo.
    id: 'acolchoado-nao-faz-bolinha-na-axila',
    frase: /(?:vai criar|forma|cria|enche de|faz)\s+bolinhas|encaroç|axila/i,
    quando: (c) => c.acolchoado,
    porque: 'o que gasta um acolchoado é o recheio murchar, não bolinha no casco'
  },
  {
    // Peça acolchoada: a composição da etiqueta é só o casco. Se o texto
    // não disser isso, a pessoa julga um edredão pela fronha.
    id: 'acolchoado-avisa-que-a-etiqueta-e-so-o-casco',
    exige: /s[oó] o tecido de fora|apenas o tecido de fora|recheio/i,
    quando: (c) => c.acolchoado,
    porque: 'sem o aviso, "100% Poliamida" parece descrever a peça inteira — e é só o casco'
  },
  {
    // Numa peça técnica a etiqueta de composição é a parte MENOS informativa.
    // Quem procura casaco de montanha não pergunta se dura no uso diário —
    // não é peça de uso diário. Pergunta quanta chuva aguenta, que pena tem
    // dentro, quanto pesa. A loja publica isso com número; ignorar era
    // analisar a peça pelo critério de uma camiseta.
    id: 'ficha-tecnica-publicada-chega-ao-texto',
    exige: /coluna de água|cuin|penugem|\bg\b\s*—|ficha da loja/i,
    quando: (c) => c.temFicha,
    porque: 'o número que a loja publica é o que decide a compra neste tipo de peça'
  },
  {
    // Número cru não informa quem não é do meio: "10 000 mm" não quer dizer
    // nada sozinho. O valor está na leitura.
    id: 'ficha-tecnica-vem-com-leitura-nao-so-numero',
    exige: /aguenta|resist|segura|qualidade|ultraleve|calor por grama|n[íi]vel/i,
    quando: (c) => c.temFicha,
    porque: 'sem tradução, o número é ruído — a pessoa não sabe se 10 000 mm é muito ou pouco'
  },
  {
    // A respirabilidade de um impermeável vem da MEMBRANA, que é o que a
    // loja mede e publica (RET). O 'res' das propriedades é o da fibra crua.
    // Acusar de "prende o suor" um casaco impermeável-respirável é julgar a
    // camada errada — o mesmo erro de julgar um acolchoado pelo casco.
    id: 'tecnico-nao-e-acusado-de-prender-o-suor',
    frase: /prende o suor|vira estufa|abafa/i,
    quando: (c) => c.tecnico,
    porque: 'a membrana existe justamente para deixar o vapor sair enquanto segura a água'
  },
  {
    id: 'tecnico-nao-trata-sintetico-como-defeito',
    frase: /menos sustent[aá]vel|dois por[ée]ns|n[aã]o respira bem/i,
    quando: (c) => c.tecnico,
    porque: 'num casaco técnico o sintético é o material certo — nenhuma fibra natural faz impermeável-respirável. Cobrar isso é como cobrar leveza de uma bota de montanha'
  },
  {
    id: 'parte-de-baixo-sem-camada-por-cima',
    frase: /camada por cima|casaco por cima|blaz[eê]r por cima/i,
    quando: (c) => c.parteDeBaixo,
    porque: 'não se resolve uma calça pondo camada por cima'
  },
  {
    id: 'texto-nunca-vazio',
    frase: null,
    quando: () => true,
    porque: 'card sem texto é pior que card com texto ruim'
  },
  {
    id: 'sem-marcador-de-template',
    frase: /undefined|null|NaN|\{\{|\[object/i,
    quando: () => true,
    porque: 'vazamento de código para o texto que a pessoa lê'
  },
  {
    id: 'temperatura-certificada-aparece',
    frase: null,
    quando: () => false,
    porque: 'checada à parte'
  }
];

// ─── Execução ────────────────────────────────────────────────────────
let ok = 0, falhas = 0;
const detalhes = [];

function checa(nome, condicao, detalhe) {
  if (condicao) { ok++; console.log('  ✓ ' + nome); }
  else { falhas++; console.log('  ✗ ' + nome); console.log('      ' + detalhe); detalhes.push(nome); }
}

function aplicaRegras(onde, texto, ctx) {
  REGRAS.forEach((r) => {
    if (!r.quando(ctx)) return;
    if (r.frase) {
      const achou = r.frase.exec(texto);
      checa('    [' + onde + '] não diz: ' + r.id,
        !achou,
        'achou "' + (achou ? achou[0] : '') + '" — ' + r.porque + '\n      texto: ' + texto);
    }
    if (r.exige) {
      checa('    [' + onde + '] diz: ' + r.id,
        r.exige.test(texto),
        'faltou o aviso — ' + r.porque + '\n      texto: ' + texto);
    }
  });
}

// Traduz a peça para os parâmetros de URL que a extensão manda à página —
// mesmo formato que content.js monta em buildAnaliseURL().
function paramsDaPeca(p, s, tipo) {
  const q = {
    score: Math.round(buyScore(s, tipo) || s.overall || 0),
    verdict: (verdict(s) || {}).label || 'Vale a pena.',
    nome: p.nome, loja: 'Decathlon', tipo: tipo,
    fibra: (s.fibers && s.fibers[0] && (s.fibers[0].data && s.fibers[0].data.label || s.fibers[0].name)) || '',
    fibras: (s.fibers || []).map((f) => (f.data && f.data.label || f.name) + ':' + f.pct).join(','),
    qualidade: Math.round(s.quality), durabilidade: Math.round(s.durability),
    conforto: Math.round(s.comfort), versatilidade: Math.round(s.versatility),
    manutencao: Math.round(s.maintenance), custo: Math.round(s.costBenefit),
    viagem: Math.round(s.travel)
  };
  // props: a mistura ponderada, como content.js calcula
  const chaves = ['bol','ama','sec','cal','res','pes','sus'];
  const soma = {}; let peso = 0;
  chaves.forEach((k) => { soma[k] = 0; });
  (s.fibers || []).forEach((f) => {
    const pr = f.data && f.data.p; if (!pr || !f.pct) return;
    peso += f.pct;
    chaves.forEach((k) => { if (pr[k] !== undefined) soma[k] += pr[k] * f.pct; });
  });
  if (peso) q.props = chaves.map((k) => k + ':' + Math.round(soma[k] / peso)).join(',');
  // Uma peça pode fixar as propriedades REAIS que a extensão mandou, em vez
  // das calculadas a partir das fibras. Serve para prender um caso vindo de
  // uma URL de análise verdadeira: foi assim que "Prende o suor por dentro"
  // escapou uma vez — a mistura calculada dava outro valor de respirabilidade
  // e a regra passava a seco sobre a peça que tinha o defeito.
  if (p.props) q.props = p.props;
  if (s.isKnit) q.malha = '1';
  if (s.isHeavyWoven) q.encorpado = '1';
  if (s.isPadded) q.acolchoado = '1';
  if (s.hasTechSpec) q.tecnico = '1';
  const ficha = typeof fichaTecnicaTexto === 'function' ? fichaTecnicaTexto(s) : '';
  if (ficha) q.ficha = ficha;
  if (s.brandTech) q.tecnome = s.brandTech;
  if (s.brandTechInfo && s.brandTechInfo.o_que) q.tecoque = s.brandTechInfo.o_que;
  if (s.fibers && s.fibers[0] && s.fibers[0].data && s.fibers[0].data.type === 'synthetic') q.sintetico = '1';
  return q;
}

const textosPorPeca = [];

console.log('\n── Coerência: o texto faz sentido para a peça? ──────\n');

PECAS.forEach((p) => {
  console.log('  ' + p.nome);

  const s = calcScores(p.fibras, p.texto, '', p.titulo);
  const tipo = detectGarmentType(s, null, 'clothing');
  const texto = conclusionText(s, s.fibers || p.fibras, tipo);
  const ctx = { agasalho: p.agasalho, parteDeBaixo: p.parteDeBaixo, tecnico: p.tecnico,
                acolchoado: p.acolchoado, temFicha: !!s.fichaTecnica,
                tipo: tipo, scores: s };

  // 1. o tipo detectado é o esperado — errar aqui troca a família de frases
  //    inteira, que é a raiz de quase todo texto absurdo
  checa('    tipo detectado = ' + p.esperaTipo,
    tipo === p.esperaTipo,
    'detectou "' + tipo + '" (isPadded=' + s.isPadded + ', isBulky=' + s.isBulkyGarment + ', isKnit=' + s.isKnit + ')');

  // 2. as regras: `frase` é o que NÃO pode aparecer, `exige` é o que TEM de
  //    aparecer. Frase proibida sozinha não basta — há erros que são a
  //    ausência de um aviso, não a presença de uma frase errada.
  aplicaRegras('card', texto, ctx);

  // 2b. As MESMAS regras na página de análise. A pessoa lê duas superfícies
  //     — o card na loja e a página completa — e elas têm motores de texto
  //     diferentes (shared.js e landing/runtime.js). Testar só o card deixava
  //     metade do produto fora: um casaco corrigido no card ainda dizia
  //     "Abafa: o calor do corpo não sai" no capítulo 02 da página.
  const tela = montar(query(paramsDaPeca(p, s, tipo)));
  const textoPagina = tela.todos.join(' · ');
  aplicaRegras('página', textoPagina, ctx);

  // 3. texto nunca vazio
  checa('    texto não vazio', !!(texto && texto.trim().length > 20),
    'texto = "' + texto + '"');

  // 4. quando a loja certifica uma temperatura, ela tem que chegar ao texto —
  //    é o dado mais concreto que existe numa peça de inverno
  if (/-\s?\d{1,2}\s?°\s?C/.test(p.texto)) {
    checa('    a temperatura certificada aparece no texto',
      /-\d{1,2}°C/.test(texto),
      'a página diz uma temperatura mínima, o texto não repassa.\n      texto: ' + texto);
  }

  textosPorPeca.push({ nome: p.nome, card: texto, pagina: textoPagina });

  console.log('');
});

// ─── Repetição: a mesma frase em peça atrás de peça ──────────────────
// Um texto correto ainda pode destruir confiança. Quem mapeia cinco peças e
// lê a mesma frase nas cinco percebe o template por trás — e a partir daí
// desconta tudo o que o produto diz, inclusive a nota. Este bloco não sabe
// quais frases são repetitivas: descobre sozinho, comparando as peças.
//
// O limite é proporção, não contagem: uma frase de casaco pode e deve
// repetir-se entre casacos. O que não pode é uma frase aparecer na maioria
// das peças do acervo, sejam elas quais forem.
console.log('  Repetição entre peças');
(function () {
  const LIMITE = 0.34;                      // acima de 1 em 3 já se nota ao mapear o armário
  // ...mas também um piso absoluto. Com poucas peças no acervo a proporção
  // é ruidosa: 4 em 11 dispara o limite sem que a frase seja de facto a
  // assinatura de nada. Exigir os dois evita perseguir ruído agora e aperta
  // sozinho à medida que o acervo cresce.
  const PISO = 5;
  const MIN_CHARS = 45;                     // frases curtas repetem sem incomodar
  const contagem = new Map();

  textosPorPeca.forEach((t) => {
    const frases = new Set(
      (t.card + ' ' + t.pagina)
        .split(/(?<=[.!?])\s+|\s·\s/)
        .map((f) => f.trim().replace(/\s+/g, ' '))
        .filter((f) => f.length >= MIN_CHARS)
    );
    frases.forEach((f) => contagem.set(f, (contagem.get(f) || 0) + 1));
  });

  const total = textosPorPeca.length;
  const repetidas = [...contagem.entries()]
    .filter(([, n]) => n / total > LIMITE && n >= PISO)
    .sort((a, b) => b[1] - a[1]);

  checa('    nenhuma frase aparece em mais de 1 a cada 3 peças',
    repetidas.length === 0,
    'frases coladas em quase tudo (vira assinatura de template):\n      '
      + repetidas.map(([f, n]) => `[${n}/${total}] ${f.slice(0, 110)}`).join('\n      '));
})();
console.log('');

console.log('──────────────────────────────────────');
console.log(ok + ' ok · ' + falhas + ' falha(s)');
if (falhas) {
  console.log('\nFalha aqui = a pessoa lê uma frase que não bate com a peça.');
}
console.log('');
process.exit(falhas > 0 ? 1 : 0);
