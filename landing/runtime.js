/* ------------------------------------------------------------------
   Runtime da página de análise (v15 Apple White).
   O DESIGN não é definido aqui — a marcação e os estilos vêm do
   arquivo de design (LookPilot Experiencia v15 Apple White.dc.html),
   transformados 1:1. Este arquivo só:
     1. lê os parâmetros que a extensão LookPilot envia na URL,
     2. preenche os bindings do design,
     3. reproduz as animações (reveal, parallax, contagem, scan).
   ------------------------------------------------------------------ */
(function () {
  'use strict';

  var Q = new URLSearchParams(location.search);
  var has = function (k) { var v = Q.get(k); return v !== null && v !== ''; };
  var clamp = function (n, a, b) { return Math.max(a, Math.min(b, n)); };
  var int = function (k, d) { var n = parseInt(Q.get(k), 10); return isNaN(n) ? d : n; };

  /* ---------- conteúdo padrão (demo do design) ------------------- */
  var DEFAULT = {
    fibra: 'Suéter 100% lã', preco: '9,99', score: 86, viagem: 8,
    duvida: 'Lã pura por 9,99 € — qual é a pegadinha?',
    etiqComp: '100% lã', etiqRef: 'Ref. 17024089 · Made in Portugal',
    url: 'https://www.zara.com/',
    lookmapLead: 'Um ==86== não aparece todo dia. Salve a peça pra não esquecer o que a faz valer — e comparar com a próxima.',
    heroIntro: 'O ==LookPilot== leu a etiqueta pra você. É ==lã de verdade==, sem mistura — e por 9,99 € isso quase não existe.',
    heroImg: '', heroAlt: 'Foto da peça', heroPos: '60% 16%',
    capL: 'Suéter 100% lã · verde', capR: 'ZARA · ref. 17024089',
    cartoes: [
      { num: '01', tema: 'A matéria', pergunta: 'Do que é feita, de verdade?',
        resposta: 'De lã, e só. A etiqueta foi lida fio por fio: ==100% lã==, sem nenhuma fibra sintética escondida. Por 9,99 €, isso quase não existe — e é o que puxa a nota pra cima.',
        alt: 'Malha do suéter em grande plano', pos: '56% 34%', zoom: '2' },
      { num: '02', tema: 'O corpo', pergunta: 'Como veste no corpo?',
        resposta: 'Lã 100% ==aquece de verdade==: segura o corpo no frio sem precisar de três camadas por baixo. E como respira, não vira estufa quando você entra no ônibus lotado.',
        alt: 'Peça vestida num gesto do dia a dia', pos: '60% 14%', zoom: '1' },
      { num: '03', tema: 'O tempo', pergunta: 'Vai durar?',
        resposta: 'A malha da gola e do punho volta ao lugar em vez de arriar. Água fria e secar na sombra — só isso. Esse cuidado fácil pesou na nota: é peça pra ==durar temporadas==.',
        alt: 'Gola e punho em detalhe', pos: '56% 21%', zoom: '2.2' },
      { num: '04', tema: 'No dia a dia', pergunta: 'Vai sair do armário?',
        resposta: 'Vai, e muito. Funciona como neutro: cai bem com ==jeans, alfaiataria e saia midi==. Peça que combina sem você pensar acaba sendo a mais barata que você tem.',
        alt: 'Peça vista por inteiro', pos: '56% 40%', zoom: '1.2' }
    ]
  };

  /* ---------- dados vindos da extensão ---------------------------- */
  // score/veredito: o veredito vem PRONTO do card (não se recalcula aqui,
  // senão as duas superfícies se contradizem no mesmo score).
  var score = has('score') ? clamp(int('score', DEFAULT.score), 0, 100) : DEFAULT.score;
  var verdictParam = Q.get('verdict');

  var galeria = (Q.get('galeria') || '').split('|').filter(Boolean);
  var imagem = Q.get('imagem') || galeria[0] || DEFAULT.heroImg;
  var fotos = galeria.length ? galeria : (imagem ? [imagem] : []);
  var temFoto = !!imagem;

  // "real" = veio de uma análise da extensão. Nesse caso um campo em falta
  // NÃO pode cair no conteúdo da demonstração — mostrar "100% lã" numa peça
  // que ainda não foi lida é pior do que não mostrar nada. Entra skeleton.
  var real = has('score');
  var nome = Q.get('nome') || (real ? '' : DEFAULT.fibra);
  var loja = Q.get('loja') || (real ? '' : 'ZARA');
  var preco = Q.get('preco') || (real ? '' : DEFAULT.preco);
  var moeda = Q.get('moeda') || '€';
  // sem origem numa análise real, o link fica inerte — nunca cair no zara.com
  // da demonstração quando a peça é de outra loja
  var origem = Q.get('origem') || (has('score') ? '#' : DEFAULT.url);
  var fibras = Q.get('fibras') || '';
  // história vinda da extensão (conhecimento que só ela tem: blends.json e
  // os modificadores de qualidade detectados no texto da página)
  var mistura = Q.get('mistura') || '';
  var modNome = Q.get('modnome') || '';
  var modExplica = Q.get('modexplica') || '';
  var fibraNome = Q.get('fibra') || '';
  var fibraTip = Q.get('fibratip') || '';
  // propriedades cruas da fibra (0-10, 10 = melhor): bol=não bola,
  // ama=não amarrota, sec=seca rápido, cal=isola, res=respira, pes, sus
  var props = (function () {
    var o = {}, s = Q.get('props') || '';
    s.split(',').forEach(function (par) {
      var kv = par.split(':');
      if (kv[0] && kv[1] !== undefined) o[kv[0].trim()] = parseInt(kv[1], 10);
    });
    return o;
  })();
  var corNota = Q.get('cornota') || '';
  var estampado = Q.get('estampado') === '1';
  // tipo de peça detectado pela extensão (garmentType) -> substantivo natural
  var TIPOS = {
    camiseta: 'camiseta', camisa: 'camisa', blazer: 'blazer', calca: 'calça',
    vestido: 'vestido', casaco: 'casaco', malha: 'malha',
    shoes: 'par', bags: 'bolsa', clothing: 'peça'
  };
  var tipoKey = Q.get('tipo') || '';
  var tipo = TIPOS[tipoKey] || 'peça';
  var tipoArt = (tipo === 'blazer' || tipo === 'vestido' || tipo === 'casaco' || tipo === 'par') ? 'este' : 'esta';
  // sem dado de viagem numa análise real, fica no meio: o selo não pode
  // afirmar "ótima pra levar" sobre uma peça que ninguém mediu
  var viagem100 = has('viagem') ? clamp(int('viagem', 80), 0, 100)
                                : (real ? 50 : DEFAULT.viagem * 10);
  var vg = Math.round(viagem100 / 10); // o design trabalha o selo em 0–10

  /* ---------- limpeza do nome da fibra ---------------------------
     Segunda linha de defesa: a extensão já apara o lixo que o texto da loja
     arrasta ("algodão que contenha", "algodão chat analisando a peça"), mas a
     página não deve confiar cegamente no parâmetro — uma versão antiga da
     extensão, ou uma loja com texto estranho, voltaria a mostrar a frase toda
     na etiqueta. Mantém a fibra e os qualificadores que importam; corta o
     resto.                                                                */
  var RAIZES = ['lã','la','algodão','algodao','linho','seda','caxemira','cashmere','alpaca',
    'mohair','cânhamo','canhamo','lyocell','tencel','juta','ramie','poliéster','poliester',
    'poliamida','acrílico','acrilico','elastano','nylon','polipropileno','poliuretano',
    'viscose','modal','rayon','couro','camurça','camurca','lona','borracha'];
  var QUALIFICADORES = ['orgânico','organico','orgânica','organica','reciclado','reciclada',
    'merino','pima','supima','egípcio','egipcio','penteado','mercerizado','virgem','bio'];
  function limpaFibra(n) {
    var palavras = String(n || '').toLowerCase().split(/\s+/).filter(Boolean);
    var i = palavras.findIndex(function (p) {
      return RAIZES.some(function (r) { return p.indexOf(r) === 0; });
    });
    if (i === -1) return palavras.join(' ');           // não reconheceu: deixa como veio
    var saida = [palavras[i]];
    for (var j = i + 1; j < palavras.length; j++) {
      if (QUALIFICADORES.indexOf(palavras[j]) !== -1) saida.push(palavras[j]);
      else if (palavras[j] !== 'de' && palavras[j] !== 'da') break;
    }
    return saida.join(' ');
  }

  // composição para a etiqueta: "Lã:100" -> "100% lã"
  var etiqComp = fibras
    ? fibras.split(',').map(function (p) {
        var s = p.split(':');
        return (s[1] ? s[1] + '% ' : '') + limpaFibra(s[0]);
      }).join(' · ')
    : (real ? '' : DEFAULT.etiqComp);

  /* ---------- campos em falta ------------------------------------
     A página monta tudo de uma vez a partir da URL — não há carregamento
     assíncrono. Por isso um skeleton em TEXTO nunca resolveria: ficaria a
     tremeluzir para sempre (era o que acontecia com o preço). Campo em falta
     some, com o separador junto. O único skeleton legítimo é o das fotos,
     que essas sim carregam da loja depois (ver mediaEl).                  */

  /* ---------- preço + moeda --------------------------------------
     O design escrevia "€" fixo. A extensão envia `moeda` como CÓDIGO
     (og:price:currency -> "EUR", "GBP"), por isso é preciso converter —
     escrever "12,99 EUR" ficaria pior do que o erro original.          */
  var SIMBOLOS = {
    EUR: '€', USD: '$', GBP: '£', BRL: 'R$', CHF: 'CHF', JPY: '¥',
    PLN: 'zł', SEK: 'kr', DKK: 'kr', NOK: 'kr', CZK: 'Kč', HUF: 'Ft',
    RON: 'lei', TRY: '₺', CAD: 'C$', AUD: 'A$', MXN: 'MX$', CNY: '¥'
  };
  function precoFormatado() {
    if (!preco) return '';
    // alguns sites já mandam o símbolo dentro do preço — não duplicar
    if (/[€$£¥₺]|R\$|zł|kr|Kč|Ft|lei/i.test(preco)) return preco;
    var m = (moeda || '').trim().toUpperCase();
    var s = SIMBOLOS[m] || (m.length <= 3 && m ? m : '€');
    // símbolos que se escrevem antes do valor
    return (s === '$' || s === 'R$' || s === '£' || s === 'C$' || s === 'A$' || s === 'MX$')
      ? s + ' ' + preco
      : preco + ' ' + s;
  }

  /* ---------- montagem dos valores (porta o renderVals) ----------- */
  function mark(t) {
    // ==negrito== do design
    return String(t == null ? '' : t).split(/==(.+?)==/).map(function (p, i) {
      if (i % 2) { var b = document.createElement('strong'); b.style.fontWeight = '700'; b.style.color = 'inherit'; b.textContent = p; return b; }
      return document.createTextNode(p);
    });
  }

  function mediaEl(src, alt, st) {
    var frag = document.createDocumentFragment();
    var sk = document.createElement('div');
    sk.setAttribute('aria-hidden', 'true');
    sk.style.cssText = 'position:absolute;inset:0;background:linear-gradient(90deg,#F0F0F2 25%,#E6E6E9 50%,#F0F0F2 75%);background-size:200% 100%;animation:apShimmer 1.6s linear infinite;transition:opacity .4s ease;pointer-events:none';
    frag.appendChild(sk);
    if (src) {
      var img = document.createElement('img');
      img.src = src; img.alt = alt || ''; img.loading = 'lazy';
      img.style.cssText = 'opacity:0;transition:opacity .5s ease;' + (st || '');
      var done = function () { img.style.opacity = '1'; sk.style.opacity = '0'; sk.style.animation = 'none'; };
      if (img.complete && img.naturalWidth) done(); else { img.onload = done; img.onerror = function () { sk.style.animation = 'none'; }; }
      frag.appendChild(img);
    }
    return frag;
  }

  /* ---------- prosa adaptada à peça analisada --------------------
     As quatro perguntas do design mapeiam nas dimensões que a extensão
     já envia, por isso a resposta pode ser escrita a partir da análise
     em vez de ficar presa ao texto do suéter de demonstração:
       01 A matéria  <- fibras + qualidade
       02 O corpo    <- conforto
       03 O tempo    <- durabilidade + manutenção
       04 No dia a dia <- versatilidade
     Sem parâmetros, mantém o texto original do design.          */
  var NATURAIS = ['lã','la','algodão','algodao','linho','seda','caxemira','cashmere','alpaca','mohair','cânhamo','canhamo','lyocell','tencel','juta','ramie'];
  var SINTETICAS = ['poliéster','poliester','poliamida','acrílico','acrilico','elastano','nylon','polipropileno','poliuretano','viscose','modal','rayon'];

  function parseFibras() {
    if (!fibras) return [];
    return fibras.split(',').map(function (p) {
      var s = p.split(':');
      // limpa aqui também: esta lista alimenta a prosa dos capítulos, que
      // senão escreve "De algodão que contenha, e só"
      return { nome: limpaFibra(s[0]), pct: parseInt(s[1], 10) || 0 };
    }).filter(function (f) { return f.nome; });
  }
  function classifica(lista) {
    var nat = 0, sin = 0;
    lista.forEach(function (f) {
      var n = f.nome.toLowerCase();
      var isNat = NATURAIS.some(function (x) { return n.indexOf(x) === 0; });
      var isSin = SINTETICAS.some(function (x) { return n.indexOf(x) === 0; });
      if (isNat) nat += f.pct; else if (isSin) sin += f.pct;
    });
    return { nat: nat, sin: sin };
  }
  function faixa(v, alto, medio) { return v >= alto ? 2 : v >= medio ? 1 : 0; }

  // Escolha estável por peça: mesma peça -> mesmo texto (não muda a cada
  // recarregamento); peças diferentes -> textos diferentes, para a secção não
  // soar decorada.
  var _semente = (function () {
    var s = (Q.get('nome') || '') + '|' + (Q.get('fibra') || '') + '|' + score, h = 0;
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
  })();
  function variante(lista, desvio) {
    return lista[(_semente + (desvio || 0)) % lista.length];
  }

  function prosaCartoes() {
    if (!has('score')) return DEFAULT.cartoes.map(function (c) { return c.resposta; });
    var lista = parseFibras(), mix = classifica(lista);
    var comp = lista.map(function (f) { return f.pct + '% ' + f.nome.toLowerCase(); }).join(', ');
    var principal = lista.slice().sort(function (a, b) { return b.pct - a.pct; })[0];
    var qual = int('qualidade', 50), conf = int('conforto', 50);
    var dur = int('durabilidade', 50), man = int('manutencao', 50), ver = int('versatilidade', 50);

    // 01 · A matéria — o ato é fixo, a HISTÓRIA que ele conta é que muda.
    // Ordem de prioridade: o que for mais específico desta peça ganha.
    var t1;
    var secundaria = lista.slice().sort(function (a, b) { return b.pct - a.pct; })[1];
    if (!lista.length) {
      t1 = 'A composição não veio na página da loja. Sem etiqueta, a nota se apoia no resto — e é por isso que ela não sobe mais.';
    } else if (modNome && modExplica) {
      // história "não é a fibra comum": o modificador detectado na página
      t1 = 'Não é ' + principal.nome.toLowerCase() + ' qualquer: é ==' + modNome + '==. ' + modExplica;
    } else if (mistura && secundaria) {
      // história da mistura: o que a fibra secundária faz NESTA dose
      t1 = 'Na etiqueta, ==' + comp + '==. Os ' + secundaria.pct + '% de ' +
           secundaria.nome.toLowerCase() + ' não estão ali por acaso: ' +
           mistura.charAt(0).toLowerCase() + mistura.slice(1);
    } else if (mix.nat >= 90) {
      // três formas de contar a mesma verdade — a fórmula repetida em todas as
      // peças era o que mais denunciava texto gerado. A escolha é estável por
      // peça (não muda a cada recarregamento).
      var f = principal.nome.toLowerCase();
      var variantes = [
        'De ' + f + ', e só. A etiqueta foi lida fio por fio: ==' + comp + '==, sem nenhuma fibra sintética escondida.',
        '==' + comp.charAt(0).toUpperCase() + comp.slice(1) + '.== Sem mistura, sem sintético escondido no meio — o que está no rótulo é o que você veste.',
        'É ' + f + ' de verdade. Lemos o rótulo inteiro à procura de sintético escondido e não achamos nada: ==' + comp + '==.'
      ];
      t1 = variantes[(f.length + score) % variantes.length];
      t1 += qual >= 70 ? ' É o que puxa a nota pra cima.' : ' A matéria segura a nota, sem a levantar.';
    } else if (mix.sin >= 70) {
      var traco = lista.find(function (f) {
        return NATURAIS.some(function (x) { return f.nome.toLowerCase().indexOf(x) === 0; });
      });
      t1 = traco
        ? 'Tem ' + traco.nome.toLowerCase() + ' na etiqueta — ==' + traco.pct + '%==. O suficiente pra escrever no rótulo e não o suficiente pra mudar nada: quem manda são os sintéticos.'
        : 'Quase toda de sintético. A etiqueta diz ==' + comp + '==. O toque até engana; a composição, não.';
      t1 += qual >= 45 ? '' : ' É aqui que a nota perde pontos.';
    } else {
      t1 = 'É uma mistura: ==' + comp + '==. Nem fibra nobre pura, nem sintético barato — está no meio.';
      t1 += qual >= 70 ? ' É o que puxa a nota pra cima.'
          : qual >= 45 ? ' A matéria segura a nota, sem a levantar.'
                       : ' É aqui que a nota perde pontos.';
    }

    // 02 · O corpo — o que a pessoa SENTE vestindo, a partir das propriedades
    // do corpo (respira, aquece, pesa). Cada situação tem várias formas de ser
    // dita, escolhidas de modo estável por peça: a mesma peça lê sempre igual,
    // peças diferentes leem diferente.
    var t2;
    if (props.res !== undefined || props.cal !== undefined) {
      var respira = props.res, aquece = props.cal, leve = props.pes;
      var corpo;
      if (respira >= 8 && aquece >= 7) {
        corpo = variante([
          '==Aquece sem abafar.== Segura o frio e ainda deixa o corpo respirar — dá pra passar o dia inteiro com ela.',
          'Segura o frio ==sem virar estufa==. Você entra no ônibus lotado e não precisa arrancá-la do corpo.',
          '==Quente e arejada ao mesmo tempo==, o que é raro. Aguenta a rua fria e o interior aquecido sem te fazer suar.'
        ]);
      } else if (respira >= 8 && aquece <= 4) {
        corpo = variante([
          'É fresca: ==o corpo respira== e o calor não fica preso. Resolve bem no calor — no frio, pede uma camada por cima.',
          '==Deixa o corpo respirar.== No calor é um alívio; quando esfria, você vai querer algo por cima.',
          'Leve no corpo e ==arejada==. Feita pros dias quentes — sozinha, no frio, não segura.'
        ]);
      } else if (respira <= 4 && aquece >= 7) {
        corpo = variante([
          'Segura bem o frio, mas ==não respira==. Em lugar fechado, ou num dia que estica, você começa a sentir.',
          'Aquece — e ==guarda esse calor todo==. Boa na rua, sufocante assim que você entra em algum lugar.',
          '==Esquenta rápido e não deixa sair.== No frio de fora ajuda; no aquecido de dentro, incomoda.'
        ]);
      } else if (respira <= 4) {
        corpo = variante([
          '==Abafa.== O calor do corpo não sai, e num dia longo isso cansa mais do que parece.',
          '==Não deixa a pele respirar.== Numa tarde inteira vestida, você sente o corpo pedindo ar.',
          'Prende o calor. ==Num dia cheio incomoda== — ainda mais em lugar fechado.'
        ]);
      } else {
        corpo = variante([
          'Veste sem drama: não abafa nem esquenta demais, cumpre o dia.',
          'Nem quente nem fresca — ==fica no meio==, e por isso serve quase sempre.',
          'No corpo não chama atenção: ==nem sufoca, nem deixa você com frio==.'
        ]);
      }
      if (leve !== undefined && leve <= 3) corpo += ' E pesa no corpo.';
      t2 = corpo + ' ' + [
        variante(['No corpo é onde ela perde — você sente ao longo do dia.',
                  'É aqui que ela cobra: o corpo percebe.',
                  'O incômodo aparece justamente no uso longo.'], 7),
        variante(['Nada que incomode, mas também não é a que você procura primeiro.',
                  'Cumpre o dia sem reclamação, sem virar favorita.',
                  'Serve bem, sem ser a que você pega por impulso.'], 7),
        variante(['É das que você esquece que está usando.',
                  'Veste e some — no bom sentido.',
                  'Do tipo que você põe e não pensa mais nela.'], 7)
      ][faixa(conf, 70, 45)];
    } else {
      t2 = [
        'Pesa no uso. ' + (mix.sin >= 70 ? 'Fibra sintética ==retém calor e respira pouco==: num dia longo ou lugar fechado, abafa.' : 'Não é a peça que você vai querer vestir o dia inteiro.'),
        'Veste bem, sem encantar. Cumpre o dia sem incomodar, mas ' + (mix.sin >= 50 ? 'a parte sintética cobra em dias quentes.' : 'não é a peça mais confortável do armário.'),
        (principal ? principal.nome + ' ' : '') + '==veste bem de verdade==: aquece ou refresca conforme o dia e respira em vez de virar estufa.'
      ][faixa(conf, 70, 45)];
    }

    // 03 · O tempo — quando a extensão manda a propriedade crua, a história
    // é o defeito concreto (bolinhas) em vez da faixa da nota.
    var t3;
    if (props.bol !== undefined && props.bol <= 4) {
      t3 = '==Vai criar bolinhas.== Onde a roupa roça o dia inteiro — cintura, axila, alça da bolsa — o tecido encaroça' +
        (props.ama !== undefined && props.ama <= 4 ? ', e ainda sai amassada da gaveta' : '') + '. ' +
        (dur >= 60 ? 'O tecido em si aguenta bem; o que cansa antes é a aparência.'
                   : 'É o que faz ' + (tipoArt === 'este' ? 'este ' : 'esta ') + tipo + ' parecer velh' + (tipoArt === 'este' ? 'o' : 'a') + ' antes da hora.');
    } else if (props.bol !== undefined && props.bol >= 8 && dur >= 60) {
      t3 = 'Envelhece bem. Depois de muita lavagem continua com a mesma cara — ==não é do tipo que enche de bolinhas==. ' +
        (man >= 60 ? 'E não pede nada de especial: lavagem normal e pronto.'
                   : 'Só cobra atenção na hora de lavar.');
    } else t3 = [
      'Pouco. ' + (mix.sin >= 50 ? 'O sintético ==forma bolinhas== com o atrito e desbota.' : 'A malha cede com o uso.') + ' É peça pra meses, não pra anos.',
      'Dura, com cuidado. Aguenta a temporada se você respeitar a lavagem — ' + (man >= 60 ? 'e a manutenção é simples.' : 'mas ==a manutenção é exigente==.'),
      'Vai durar. ' + (fibraNome ? 'A ' + fibraNome.toLowerCase() + ' aguenta' : 'A fibra aguenta') + ' o uso repetido sem perder a forma' + (man >= 60 ? ', e o cuidado é simples.' : ' — desde que você respeite a lavagem.') + ' É ' + tipo + ' pra ==durar temporadas==.'
    ][faixa(dur, 70, 45)];

    // 04 · No dia a dia — a cor e o padrão são o maior fator de combinação,
    // por isso a história vem deles quando a extensão os detecta; a nota de
    // versatilidade entra como consequência.
    var t4;
    if (estampado) {
      t4 = 'Depende do resto do armário. ==Estampado pede peças lisas à volta== — não entra em qualquer look. ' +
        (ver >= 60 ? 'Ainda assim rende: o estampado vira o ponto de partida do look, não o obstáculo.'
                   : 'Sai menos que ' + (tipoArt === 'este' ? 'um ' : 'uma ') + tipo + ' lisa, e o preço por uso sobe junto.');
    } else if (/neutr/i.test(corNota)) {
      // cor neutra e lisa — não repetir "combina com tudo" duas vezes
      t4 = [
        'Combina fácil, mas mesmo assim fica no cabide: o que segura ' + tipoArt + ' ' + tipo + ' não é a cor.',
        'Entra em quase tudo que você já tem. Não é a primeira escolha da manhã, mas resolve.',
        'Entra em qualquer combinação. É ' + tipoArt + ' ' + tipo + ' que você ==veste sem pensar== — e é sempre essa que mais sai do armário.'
      ][faixa(ver, 70, 45)];
    } else if (corNota) {
      // cor marcante: a cor é que decide a frequência de uso
      t4 = [
        'A cor manda aqui: ==pede o resto do look em volta== e por isso sai pouco. O preço por uso sobe.',
        'A cor pede um pouco de intenção, mas cabe no que você já tem.',
        'Mesmo com cor marcante, ==sai muito==: funciona com o que você já usa e ainda dá o ponto de cor.'
      ][faixa(ver, 70, 45)];
    } else {
      t4 = [
        'Pouco. É peça de ocasião: ==pede combinação específica== e acaba parada no cabide. Custe o que custar, o preço por uso sobe.',
        'De vez em quando. Combina com o que você já tem, mas não é a primeira escolha — vai sair do armário sem pressa.',
        'Vai, e muito. ==Funciona como neutro==: cai bem com jeans, alfaiataria e saia. Peça que combina sem você pensar acaba sendo a mais barata que você tem.'
      ][faixa(ver, 70, 45)];
    }

    return [t1, t2, t3, t4];
  }

  var textos = prosaCartoes();
  var cartoes = DEFAULT.cartoes.map(function (c, i) {
    var foto = fotos.length ? fotos[i % fotos.length] : '';
    return {
      num: c.num, tema: c.tema, pergunta: c.pergunta,
      dir: i % 2 === 1 ? 'rtl' : 'ltr',
      isPrimeiro: i === 0,
      respostaEl: mark(textos[i]),
      mediaEl: mediaEl(foto, c.alt,
        'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:' + c.pos +
        ';transform:scale(' + c.zoom + ');transform-origin:' + c.pos + ';filter:saturate(1.06) sepia(.06)')
    };
  });

  var seloAprovado = vg >= 7;
  var seloAcc = seloAprovado ? '#FF009D' : '#C89B5E';
  var seloIcon = seloAprovado ? '✓' : '!';
  // os traços seguem a composição real da peça, não a do suéter de demonstração
  var _mix = classifica(parseFibras());
  var _sintetica = _mix.sin >= 50;
  var traitsOk = [
    { titulo: 'Não amarrota', texto: _sintetica
        ? 'Sai da mala pronta: fibra sintética não marca vinco e dispensa ferro.'
        : 'Sai da mala e vai direto pro corpo. A fibra relaxa os vincos sozinha em poucos minutos.' },
    { titulo: 'Uma peça, vários climas', texto: 'Segura o frio e respira no ameno. Uma peça só cobre a viagem inteira.' },
    { titulo: _sintetica ? 'Seca da noite pro dia' : 'Areja em vez de lavar', texto: _sintetica
        ? 'Lava no lavatório e seca rápido — não ocupa dia de viagem à espera.'
        : 'Não guarda cheiro. Uma noite no cabide e está pronta pro dia seguinte.' }
  ];
  var traitsCau = [
    { titulo: 'Amarrota fácil', texto: 'Sai da mala com vincos. Precisa de ferro ou vapor antes de vestir.' },
    { titulo: _sintetica ? 'Esquenta e não respira' : 'Volume na mala', texto: _sintetica
        ? 'Fibra sintética retém calor. Num dia de viagem longo, pesa.'
        : 'Ocupa espaço e seca devagar — pesa numa mala pequena.' },
    { titulo: 'Precisa lavar mais', texto: _sintetica
        ? 'Retém cheiro rápido: não dá pra arejar e reusar.'
        : 'Não dá pra esticar muitos usos entre lavagens.' }
  ];
  var selo = (seloAprovado ? traitsOk : traitsCau).map(function (t) {
    return { titulo: t.titulo, texto: t.texto, cor: seloAcc, icon: seloIcon };
  });

  /* ---------- peças salvas (o design diz "salvas neste navegador") ---- */
  var STORE = 'lookpilot-guardadas';
  function lerGuardadas() {
    try { return JSON.parse(localStorage.getItem(STORE)) || []; } catch (e) { return []; }
  }
  function gravarGuardadas(l) {
    try { localStorage.setItem(STORE, JSON.stringify(l.slice(0, 24))); } catch (e) {}
  }
  // identidade da peça: o link da loja é o mais estável; senão, nome+loja
  var pecaId = (Q.get('origem') || (nome + '|' + loja)).slice(0, 200);
  function estaGuardada() {
    return lerGuardadas().some(function (h) { return h.id === pecaId; });
  }
  function salvarPeca() {
    if (!has('score') || estaGuardada()) return;
    var l = lerGuardadas();
    l.unshift({
      id: pecaId, tipo: nome, nota: score, loja: loja,
      thumb: imagem, verdict: verdictParam || '', quando: Date.now(),
      url: location.search
    });
    gravarGuardadas(l);
    // mede a única coisa que decide a tese do histórico: chegou à 2ª peça?
    if (window.metrica) window.metrica.registar('salvou', { noHistorico: l.length });
  }

  var view = 'detalhe';
  var guardado = estaGuardada();

  function vals() {
    // cartões da vista "Minhas peças" — cada um reabre a análise guardada
    var guardadas = lerGuardadas().map(function (h) {
      var cor = h.nota >= 75 ? '#E8E3DA' : h.nota >= 50 ? '#EDE9E2' : '#E6E6E9';
      return {
        tipo: h.tipo || 'Peça', nota: h.nota, cor: cor,
        role: 'button', tabIx: 0, cursor: 'pointer',
        ariaLabel: (h.tipo || 'Peça') + ', nota ' + h.nota + ' de 100' + (h.verdict ? ' — ' + h.verdict : ''),
        cardOutline: '1px solid rgba(0,0,0,.05)',
        cardShadow: '0 8px 22px rgba(0,0,0,.06)',
        badgeBg: '#FFFFFF', badgeColor: '#1D1D1F',
        mediaEl: mediaEl(h.thumb, h.tipo || '',
          'width:100%;height:100%;object-fit:cover;object-position:50% 30%;filter:saturate(1.06) sepia(.06)'),
        // location.search mantinha o #minhas-pecas, por isso a página
        // recarregava DE VOLTA na lista em vez de abrir a análise
        abrir: function () { location.assign(location.pathname + (h.url || '')); },
        abrirKey: function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); location.assign(location.pathname + (h.url || '')); } }
      };
    });
    return {
      // hero
      heroFibra: nome,
      heroPreco: preco,
      heroPrecoEl: precoFormatado(),
      loja: loja,
      // numa análise real, mesmo sem nome, nunca cair na pergunta da demo
      // ("Lã pura por 9,99 € — qual é a pegadinha?")
      heroDuvida: real ? 'O que a etiqueta diz sobre esta peça?' : DEFAULT.duvida,
      heroIntroEl: mark(has('score')
        ? 'O ==LookPilot== leu a etiqueta pra você.' + (etiqComp ? ' Composição: ==' + etiqComp + '==.' : '')
        : DEFAULT.heroIntro),
      verdict: verdictParam || (score >= 75 ? 'Vale a pena.' : score >= 50 ? 'Compra ponderada.' : 'Deixa ficar.'),
      scoreTo: score,
      // A cor tem de virar no MESMO ponto que o veredito, senão a página diz
      // "Vale a pena" e pinta o número de âmbar (cautela). O design usava 75
      // porque o veredito dele também virava em 75; o veredito agora vem da
      // extensão, cujas faixas viram em 70 ("Vale a pena" e acima = positivo).
      scoreCor: score >= 70 ? '#FF009D' : '#A67C3B',
      lojaUrl: origem,
      // fotografia
      heroMediaEl: mediaEl(imagem, nome, 'display:block;width:100%;aspect-ratio:21/10;object-fit:cover;object-position:' + DEFAULT.heroPos + ';filter:saturate(1.08) sepia(.06) contrast(1.03)'),
      capL: has('nome') ? nome : (real ? '' : DEFAULT.capL),
      capR: loja + (Q.get('confianca') ? ' · confiança ' + int('confianca', 0) + '%' : ''),
      // perguntas
      cartoes: cartoes,
      etiqComp: etiqComp,
      // a extensão não lê a referência da etiqueta; sem ela, fica vazio em vez
      // de repetir a loja (que já aparece acima, em "Etiqueta · ZARA")
      etiqRef: real ? '' : DEFAULT.etiqRef,
      // selo viagem
      selo: selo,
      seloViagem: vg,
      seloAprovado: seloAprovado,
      seloCautela: !seloAprovado,
      seloMini: vg >= 7 ? 'Ótima pra levar' : vg >= 5 ? 'Dá pra levar, com ressalvas' : 'Pouco prática',
      // a variante de cautela afirmava "amarrota fácil e retém calor e cheiro"
      // para qualquer fibra; agora nomeia só os defeitos que esta fibra tem
      seloLeadCautelaEl: mark((function () {
        var f = fibraNome || 'Essa fibra';
        var defeitos = [];
        if (props.ama !== undefined && props.ama <= 5) defeitos.push('==amarrota na mala==');
        if (props.res !== undefined && props.res <= 5) defeitos.push('retém calor');
        if (props.sec !== undefined && props.sec <= 4) defeitos.push('seca devagar');
        if (props.pes !== undefined && props.pes <= 4) defeitos.push('pesa na bagagem');
        if (!defeitos.length) defeitos.push('==amarrota na mala==');
        var lista = defeitos.length > 1
          ? defeitos.slice(0, -1).join(', ') + ' e ' + defeitos[defeitos.length - 1]
          : defeitos[0];
        return f + ' ' + lista + '. Dá pra levar, mas conte com ferro ou vapor — e uma lavagem a mais na volta.';
      })()),
      // o design abria com "Lã é a fibra que mais viaja" — nomeia a fibra real
      seloLeadEl: mark((function () {
        var f = parseFibras().slice().sort(function (a, b) { return b.pct - a.pct; })[0];
        var nome = f ? f.nome.toLowerCase() : 'essa fibra';
        var nat = classifica(parseFibras()).nat >= 50;
        return (f ? nome.charAt(0).toUpperCase() + nome.slice(1) : 'Essa fibra') +
          ' viaja bem: ==não amarrota==, ' +
          (nat ? 'aquece e respira na mesma peça, e disfarça o uso. Você leva menos peças — e lava menos ainda.'
               : 'seca rápido e dispensa ferro. Você leva menos peças — e resolve a lavagem no lavatório.');
      })()),
      // lookmap
      // o design tinha uma frase por faixa de nota (86 celebra, 58 pondera);
      // trocar só o número faria "Um 42 não aparece todo dia" — sem sentido.
      lookmapLeadEl: mark(
        score >= 75 ? 'Um ==' + score + '== não aparece todo dia. Salve a peça pra não esquecer o que a faz valer — e comparar com a próxima.'
      : score >= 50 ? 'Um ==' + score + '== pede cabeça fria. Salve a peça pra lembrar por que hesitou — e comparar antes de decidir.'
                    : 'Um ==' + score + '== acende o alerta. Salve a peça pra lembrar por que não valeu — e reconhecer a próxima parecida.'),
      lookmapAtualEl: mediaEl(imagem, nome, 'width:100%;height:100%;object-fit:cover;object-position:50% 30%;filter:saturate(1.06) sepia(.06)'),
      lookmapAtualNota: score,
      lookmapAtualTipo: nome,
      lookmapAtualCor: score >= 50 ? '#1D1D1F' : '#6E6E73',
      lookmapOutras: [],
      pecaTemFoto: temFoto,
      pecaSemFoto: !temFoto,
      naoGuardado: !guardado,
      guardado: guardado,
      onSalvar: function () { salvarPeca(); guardado = true; render(); },
      // vistas: relatório desta peça <-> "Minhas peças"
      isDetalhe: view === 'detalhe',
      isHistorico: view === 'historico',
      voltarPecas: false,
      // Abrir "Minhas peças" empurra uma entrada no histórico, para que o
      // Voltar do navegador (e o da página) funcionem naturalmente.
      onHistorico: function () {
        if (view === 'historico') return;
        view = 'historico';
        try { history.pushState({ lpView: 'historico' }, '', '#minhas-pecas'); } catch (e) {}
        render(); window.scrollTo(0, 0);
      },
      // "Voltar" = página anterior de verdade: o relatório se viemos dele, ou
      // a página de onde a pessoa chegou (marketing, loja) se entrou direto.
      onVoltar: function () {
        if (history.length > 1) history.back();
        else { view = 'detalhe'; render(); window.scrollTo(0, 0); }
      },
      // ir explicitamente para o relatório (logo do cabeçalho, "Voltar ao
      // relatório" do estado vazio)
      onDetalhe: function () {
        if (view === 'detalhe') { window.scrollTo(0, 0); return; }
        view = 'detalhe';
        try { history.pushState({ lpView: 'detalhe' }, '', location.pathname + location.search); } catch (e) {}
        render(); window.scrollTo(0, 0);
      },
      guardadas: guardadas,
      nGuardadas: guardadas.length,
      nGuardadasLabel: guardadas.length + (guardadas.length === 1 ? ' peça' : ' peças'),
      temGuardadas: guardadas.length > 0,
      semGuardadas: guardadas.length === 0
    };
  }

  /* ---------- motor de bindings ----------------------------------- */
  function get(obj, path) {
    return path.split('.').reduce(function (o, k) { return (o == null ? undefined : o[k]); }, obj);
  }
  function interp(tpl, scope) {
    return tpl.replace(/\{\{\s*([\w.]+)\s*\}\}/g, function (_, p) {
      var v = get(scope, p); return v == null ? '' : String(v);
    });
  }
  function setNode(el, v) {
    el.textContent = '';
    if (v == null) return;
    // CLONAR: um nó DOM só pode existir num sítio. O mesmo valor pode estar
    // ligado a vários pontos (ex.: `loja` aparece 2x, e os bindings dentro da
    // lista dos capítulos são clonados 4x), e sem clonar o nó era MOVIDO de um
    // ponto para o seguinte, deixando os anteriores vazios.
    var põe = function (n) {
      el.appendChild(n.nodeType ? (n.parentNode ? n.cloneNode(true) : n) : document.createTextNode(String(n)));
    };
    if (Array.isArray(v)) { v.forEach(põe); return; }
    if (v.nodeType) { põe(v); return; }
    el.textContent = String(v);
  }

  // só processa elementos que pertencem a ESTE escopo — os que estão dentro
  // de um item de lista já renderizado são tratados pelo apply() daquele item.
  function sel(root, q) {
    return Array.prototype.filter.call(root.querySelectorAll(q), function (el) {
      var h = el.closest('[data-for-item]');
      return !h || h === root;
    });
  }

  function apply(root, scope) {
    // condicionais
    sel(root, '[data-if]').forEach(function (el) {
      el.style.display = get(scope, el.getAttribute('data-if')) ? 'contents' : 'none';
    });
    // listas
    sel(root, 'template[data-for]').forEach(function (tpl) {
      var list = get(scope, tpl.getAttribute('data-for')) || [];
      var as = tpl.getAttribute('data-as') || 'item';
      var marker = tpl.__marker || tpl;
      // limpa render anterior
      (tpl.__rendered || []).forEach(function (n) { n.remove(); });
      tpl.__rendered = [];
      list.forEach(function (item) {
        var frag = tpl.content.cloneNode(true);
        var holder = document.createElement('div');
        holder.style.display = 'contents';
        holder.setAttribute('data-for-item', '');
        holder.appendChild(frag);
        var sub = Object.create(scope); sub[as] = item;
        apply(holder, sub);
        marker.parentNode.insertBefore(holder, marker);
        tpl.__rendered.push(holder);
      });
    });
    // texto
    sel(root, '[data-txt]').forEach(function (el) {
      setNode(el, get(scope, el.getAttribute('data-txt')));
    });
    // atributos com template
    sel(root, '*').forEach(function (el) {
      Array.prototype.slice.call(el.attributes).forEach(function (a) {
        if (a.name.indexOf('data-tpl-') !== 0) return;
        el.setAttribute(a.name.slice(9), interp(a.value, scope));
      });
    });
    // slots de media (elementos React no original)
    sel(root, '[data-media]').forEach(function (el) {
      var v = get(scope, el.getAttribute('data-media'));
      el.textContent = '';
      if (v) el.appendChild(v.nodeType ? v : document.createTextNode(''));
    });
    // handlers — o escopo é relido a cada evento, por isso continua correto
    // depois de um re-render (o item da lista pode ter mudado)
    sel(root, '[data-on-click]').forEach(function (el) {
      if (el.__bound) return; el.__bound = true;
      el.addEventListener('click', function (ev) {
        var fn = get(el.__scope || scope, el.getAttribute('data-on-click'));
        if (typeof fn === 'function') { ev.preventDefault(); fn(); }
      });
    });
    sel(root, '[data-on-keydown]').forEach(function (el) {
      if (el.__boundKey) return; el.__boundKey = true;
      el.addEventListener('keydown', function (ev) {
        var fn = get(el.__scope || scope, el.getAttribute('data-on-keydown'));
        if (typeof fn === 'function') fn(ev);
      });
    });
    // guarda o escopo para os handlers acima
    sel(root, '[data-on-click],[data-on-keydown]').forEach(function (el) { el.__scope = scope; });
  }

  // pill do hero: "nome · LOJA ↗ · preço". Cada segmento traz o seu separador,
  // por isso um campo vazio deixaria um "·" solto no ar.
  function arrumaPill() {
    var elNome  = document.querySelector('[data-txt="heroFibra"]');
    // o nome da loja, não o link inteiro: o link também contém a seta "↗",
    // que sozinha faria o segmento parecer preenchido
    var elLojaTxt = document.querySelector('#topo a[data-brand] [data-txt="loja"]');
    var elLoja  = elLojaTxt ? elLojaTxt.closest('a') : null;
    var elPreco = document.querySelector('[data-txt="heroPrecoEl"]');
    var temNome  = !!(elNome    && elNome.textContent.trim());
    var temLoja  = !!(elLojaTxt && elLojaTxt.textContent.trim());
    var temPreco = !!(elPreco   && elPreco.textContent.trim());

    if (elPreco && elPreco.parentNode) elPreco.parentNode.style.display = temPreco ? '' : 'none';
    if (elLoja) elLoja.style.display = temLoja ? '' : 'none';
    if (elNome && elNome.parentNode) {
      elNome.parentNode.style.display = temNome ? '' : 'none';
      // o "·" no fim do nome só faz sentido se vier algo a seguir
      var sep = elNome.parentNode.lastChild;
      // só antes da loja: o segmento do preço já traz o seu próprio "·",
      // senão saía "Camiseta · · 12,99 €"
      if (sep && sep.nodeType === 3) sep.textContent = temLoja ? ' ·' : '';
    }
    // nada para mostrar: esconde o chip inteiro, senão fica uma pílula vazia
    var pill = elNome ? elNome.closest('p') : null;
    if (pill) pill.style.display = (temNome || temLoja || temPreco) ? '' : 'none';
  }

  var mounted = false;
  function render() {
    var scope = vals();
    apply(document.body, scope);
    arrumaPill();
    if (!mounted) { mounted = true; animate(scope); }
  }

  /* ---------- animações (equivalentes às do design) --------------- */
  function animate(scope) {
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.title = (scope.verdict || 'Análise') + ' · ' + score + '/100 — LookPilot';
    if (reduced) {
      Array.prototype.forEach.call(document.querySelectorAll('[data-countup]'), function (el) { el.textContent = score; });
      Array.prototype.forEach.call(document.querySelectorAll('[data-hl],[data-scan-line]'), function (el) { el.style.backgroundSize = '100% .62em'; });
      return;
    }
    var hasGsap = typeof window.gsap !== 'undefined';
    if (hasGsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

    // reveal
    Array.prototype.forEach.call(document.querySelectorAll('[data-ap]'), function (el) {
      if (hasGsap) {
        gsap.fromTo(el, { opacity: 0, y: 22 }, {
          opacity: 1, y: 0, duration: 1, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true }
        });
      }
    });
    // parallax suave nas fotos dos capítulos
    if (hasGsap) {
      Array.prototype.forEach.call(document.querySelectorAll('[data-plx]'), function (el) {
        gsap.fromTo(el, { y: 18 }, { y: -18, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
      });
    }
    // contagem da nota
    Array.prototype.forEach.call(document.querySelectorAll('[data-countup]'), function (el) {
      var run = function () {
        var t0 = performance.now(), dur = 1500;
        (function step(t) {
          var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(score * e);
          if (p < 1) requestAnimationFrame(step);
        })(t0);
      };
      el.textContent = '0';
      if (hasGsap && window.ScrollTrigger) ScrollTrigger.create({ trigger: el, start: 'top 85%', once: true, onEnter: run });
      else run();
    });
    // marcador da etiqueta + realce
    Array.prototype.forEach.call(document.querySelectorAll('[data-scan-line]'), function (el) {
      if (hasGsap && window.ScrollTrigger) {
        ScrollTrigger.create({ trigger: el, start: 'top 85%', once: true, onEnter: function () { el.style.backgroundSize = '100% 100%'; } });
      } else { el.style.backgroundSize = '100% 100%'; }
    });
  }

  // o Voltar do navegador sincroniza a vista (e a âncora #minhas-pecas
  // permite abrir "Minhas peças" diretamente por link)
  window.addEventListener('popstate', function (e) {
    var v = (e.state && e.state.lpView) || (location.hash === '#minhas-pecas' ? 'historico' : 'detalhe');
    if (v !== view) { view = v; render(); window.scrollTo(0, 0); }
  });
  if (location.hash === '#minhas-pecas') view = 'historico';

  // só conta como análise vista quando veio da extensão (tem score) — a
  // página de demonstração não polui a medição
  if (real && window.metrica) window.metrica.registar('analise');

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render);
  else render();
})();
