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
  // Nota média de quem já comprou (vem do JSON-LD da própria loja, mesma
  // fonte confiável do preço) — informativo, não entra em nenhum cálculo.
  var notaAva = Q.get('nota_ava') || '';
  var notaAvaN = Q.get('nota_ava_n') || '';
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
  // certificação (GRS/OCS...) — o card já usava isto pra dizer "sem
  // certificação de reciclado, é a fibra menos sustentável"; a landing
  // reconstruía o capítulo 01 sem esse dado, então perdia a nuance
  var certs = (Q.get('certs') || '').split(',').filter(Boolean);
  var mainIsSynthetic = Q.get('sintetico') === '1';
  // malha amarrota muito menos que tecido plano da MESMA fibra (camiseta de
  // jersey vs camisa de popeline, ambas 100% algodão). O card já usava este
  // sinal; aqui ele faltava, e a página dizia "Amarrota fácil" numa peça que
  // o card, logo acima, dizia que amassa pouco.
  var ehMalha = Q.get('malha') === '1';
  // sarja, ganga, canvas, corte "carpinteiro"... o mesmo raciocínio da
  // malha, do outro lado do espectro: tecido plano mas GROSSO amarrota bem
  // menos que o algodão fino médio do banco.
  var naoAmarrotaPelaEspessura = ehMalha || Q.get('encorpado') === '1';
  // Casaco acolchoado/de pena: a composição na etiqueta só descreve o
  // tecido de FORA — o recheio (pena ou enchimento sintético), que é o que
  // determina peso e formação de bolinhas de verdade, não aparece nela.
  // Sem isto, "pesa na mala" e "cria bolinhas" eram lidos do tecido externo
  // como se descrevessem a peça inteira.
  var ehAcolchoado = Q.get('acolchoado') === '1';
  // Especificação técnica na etiqueta (impermeável, corta-vento, membrana).
  // Num casaco técnico o sintético é o material certo, não atalho de custo:
  // nenhuma fibra natural faz impermeável-respirável. Sem este sinal a
  // página cobrava sustentabilidade de um casaco de montanha.
  var ehTecnico = Q.get('tecnico') === '1';
  // versatilidade no escopo de fora: tracosViagemBrutos() também usa (fica
  // fora de prosaCartoes(), que já tinha a sua própria cópia local)
  var ver = int('versatilidade', 50);
  // propriedades cruas da fibra (0-10, 10 = melhor): bol=não bola,
  // ama=não amarrota, sec=seca rápido, cal=isola, res=respira, sus=sustentável.
  //
  // `pes` (peso) é a exceção: aqui 10 = MAIS pesado, não melhor — é peso
  // literal (caxemira 2, seda 3, merino 4 são as fibras mais leves que
  // existem; lã comum 5, poliéster 7). Uma versão anterior deste arquivo
  // lia como se fosse "leveza" (10=melhor, igual às outras), o que invertia
  // tudo: tratava merino — a fibra que mais esquenta sem pesar — como
  // pesada. Corrigido; ver uso em tracosViagemBrutos.
  var props = (function () {
    var o = {}, s = Q.get('props') || '';
    s.split(',').forEach(function (par) {
      var kv = par.split(':');
      if (kv[0] && kv[1] !== undefined) o[kv[0].trim()] = parseInt(kv[1], 10);
    });
    return o;
  })();
  /* ---------- selos de aptidão -----------------------------------
     Nascem aqui, na análise de uma peça, mas o valor deles é no LookMap:
     lá a pergunta deixa de ser "esta peça serve?" e vira "quais das minhas
     peças servem pra este roteiro?". Por isso ficam GRAVADOS na peça salva
     (ver salvarPeca) — sem isso o filtro nasceria sem dado pra filtrar.
     Fonte: blocos `climas` e `viagem` do fibers.json, curados por fibra. */
  var selosFibra = (function () {
    var o = {}, s = Q.get('selos') || '';
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
      t1 = 'A composição não veio na página. Sem etiqueta, a nota se apoia no resto.';
    } else if (modNome && modExplica) {
      // história "não é a fibra comum": o modificador detectado na página
      t1 = 'Não é ' + principal.nome.toLowerCase() + ' qualquer: é ==' + modNome + '==. ' + modExplica;
    } else if (mistura && secundaria) {
      // história da mistura: o que a fibra secundária faz NESTA dose
      t1 = '==' + comp + '==. Os ' + secundaria.pct + '% de ' +
           secundaria.nome.toLowerCase() + ' não estão ali por acaso: ' +
           mistura.charAt(0).toLowerCase() + mistura.slice(1);
    } else if (mix.nat >= 90) {
      var f = principal.nome.toLowerCase();
      t1 = variante([
        'De ' + f + ', e só: ==' + comp + '==, sem sintético escondido.',
        '==' + comp.charAt(0).toUpperCase() + comp.slice(1) + '.== O que está no rótulo é o que você veste.'
      ], f.length);
    } else if (mix.sin >= 70) {
      var traco = lista.find(function (f) {
        return NATURAIS.some(function (x) { return f.nome.toLowerCase().indexOf(x) === 0; });
      });
      // Casaco acolchoado ou técnico: o sintético aqui não é atalho de custo.
      // Num acolchoado a etiqueta descreve só o casco (o recheio, que é o que
      // aquece, não aparece); num técnico, nenhuma fibra natural faz
      // impermeável-respirável. "O toque engana" e "a fibra menos sustentável"
      // são leituras de peça barata coladas numa peça de engenharia.
      if (ehAcolchoado) {
        t1 = '==' + comp + '== é só o tecido de fora. Num acolchoado o que aquece é o recheio — e ele não entra na etiqueta de composição.';
      } else if (ehTecnico) {
        t1 = '==' + comp + '==, e aqui é o material certo: casaco técnico é sintético porque fibra natural encharca e pesa. Nenhuma faz impermeável e respirável ao mesmo tempo.';
        if (certs.length) t1 += ' Tem certificação ==' + certs.join(', ') + '==.';
      } else {
        t1 = traco
          ? 'Tem ' + traco.nome.toLowerCase() + ' na etiqueta — ==' + traco.pct + '%==. Suficiente pra escrever no rótulo, não pra mudar nada.'
          : 'Quase toda de sintético: ==' + comp + '==. O toque engana; a composição, não.';
        // certificação: o card já cruza isso com o domínio sintético pra
        // explicar a sustentabilidade
        if (mainIsSynthetic) {
          t1 += certs.length
            ? ' Tem certificação ==' + certs.join(', ') + '==, então a origem é verificada.'
            : ' Sem certificação de reciclado, é a fibra menos sustentável.';
        }
      }
    } else {
      t1 = 'Mistura: ==' + comp + '==. Nem fibra nobre pura, nem sintético barato.';
    }

    // 02 · O corpo — o que a pessoa SENTE vestindo, a partir das propriedades
    // do corpo (respira, aquece). Cada situação tem várias formas de ser
    // dita, escolhidas de modo estável por peça: a mesma peça lê sempre igual,
    // peças diferentes leem diferente.
    // Sem cauda por faixa de conforto: colar um fechamento genérico em toda
    // frase era a mesma montagem mecânica do selo, e às vezes contradizia a
    // ressalva que a própria frase já trazia.
    //
    // Cuidado de escrita aqui: verbo em 3ª pessoa abrindo a frase sem sujeito
    // lê como ORDEM em pt-BR ("Deixa o corpo respirar" = alguém te mandando
    // deixar). Pior com verbos frequentes no imperativo falado (deixa, veste,
    // segura). Onde a frase precisa abrir no verbo, prefira a forma negada —
    // "não abafa" não tem leitura imperativa, porque a ordem negativa em
    // pt-BR usa subjuntivo ("não abafe").
    var t2;
    if (props.res !== undefined || props.cal !== undefined) {
      var respira = props.res, aquece = props.cal;
      // Num casaco a pergunta muda. "Abafa num dia inteiro fora" descreve
      // quem veste a peça o dia todo colada ao corpo — mas casaco é camada
      // de fora, que se abre e se tira. O que interessa é se segura o frio
      // lá fora e o que acontece ao entrar num lugar aquecido.
      // E se for acolchoado, o calor vem do RECHEIO: julgar pelo 'cal' da
      // fibra do casco (a única que a etiqueta declara) é ler a parte errada.
      if (tipoKey === 'casaco') {
        if (ehAcolchoado) {
          t2 = variante([
            '==Aquece pelo recheio==, não pelo tecido de fora. Em lugar aquecido, você abre o fecho.',
            'O ==recheio é que segura o frio== — o tecido de fora corta o vento. Dentro, abre e resolve.'
          ]);
        } else if (respira <= 4) {
          t2 = variante([
            '==Corta o vento e segura o frio.== Em lugar aquecido, você vai querer abrir.',
            'Feito pra rua: ==barra o frio de fora==. Dentro, abre o fecho e resolve.'
          ]);
        } else {
          t2 = variante([
            '==Segura o frio sem virar estufa== — dá pra entrar num lugar aquecido sem sufocar.',
            '==Aquece e ainda respira==: não precisa tirar assim que você entra.'
          ]);
        }
      } else if (respira >= 8 && aquece >= 7) {
        t2 = variante([
          '==Aquece sem abafar.== Dá pra passar o dia inteiro com ela.',
          '==Não vira estufa==: segura o frio e ainda deixa o corpo respirar.'
        ]);
      } else if (respira >= 8 && aquece <= 4) {
        // "camada por cima" só faz sentido pra parte de cima do corpo — uma
        // calça não veste outra calça por cima. Frase sem direção implícita,
        // funciona pra qualquer peça.
        t2 = variante([
          'É fresca: ==o corpo respira==. No frio, não resolve sozinha.',
          '==Não abafa== — o calor sai em vez de ficar preso. No frio, pede reforço.'
        ]);
      } else if (respira <= 4 && aquece >= 7) {
        t2 = variante([
          'Segura o frio, mas ==não respira==. Em lugar fechado você sente.',
          'Aquece — e ==guarda esse calor todo==. Boa na rua, sufocante assim que você entra.'
        ]);
      } else if (respira <= 4) {
        // "você vai querer tirar" também pressupõe peça de cima (dá pra tirar
        // uma jaqueta em público; uma calça, não). Mesmo ajuste de antes.
        t2 = variante([
          '==Abafa==: o calor do corpo não sai — e isso pesa num dia inteiro fora.',
          '==Não deixa a pele respirar.== Numa tarde inteira vestida, incomoda.'
        ]);
      } else {
        t2 = variante([
          'Nem abafa, nem esquenta demais — ==no corpo, não chama atenção==.',
          '==Fica no meio== — e por isso serve quase sempre.'
        ]);
      }
    } else {
      t2 = [
        mix.sin >= 70 ? 'Sintético ==retém calor e respira pouco==: num dia longo, abafa.' : 'Não é a peça que você vai querer vestir o dia inteiro.',
        'Cumpre o dia sem incomodar, mas ' + (mix.sin >= 50 ? 'a parte sintética cobra no calor.' : 'não é a mais confortável do armário.'),
        (principal ? principal.nome + ' ' : '') + '==veste bem de verdade==: respira em vez de virar estufa.'
      ][faixa(conf, 70, 45)];
    }

    // 03 · O tempo — quando a extensão manda a propriedade crua, a história
    // é o defeito concreto (bolinhas) em vez da faixa da nota.
    var t3;
    if (props.bol !== undefined && props.bol <= 4) {
      t3 = '==Vai criar bolinhas== nos pontos de atrito — cintura, axila, alça da bolsa.' +
        (props.ama !== undefined && props.ama <= 4 ? ' E sai amassada da gaveta.' : '') +
        (dur >= 60 ? ' O tecido aguenta; a aparência é que cansa antes.' : '');
    } else if (props.bol !== undefined && props.bol >= 8 && dur >= 60) {
      t3 = 'Envelhece bem: depois de muita lavagem, mesma cara. ==Não enche de bolinhas.==' +
        (man >= 60 ? ' Lavagem normal e pronto.' : ' Só cobra atenção na hora de lavar.');
    } else t3 = [
      (mix.sin >= 50 ? 'O sintético ==forma bolinhas== com o atrito e desbota.' : 'A malha cede com o uso.') + ' Peça pra meses, não pra anos.',
      'Dura se você respeitar a lavagem — ' + (man >= 60 ? 'e a manutenção é simples.' : 'mas ==a manutenção é exigente==.'),
      'Aguenta o uso repetido sem perder a forma' + (man >= 60 ? ', e o cuidado é simples.' : ' — desde que você respeite a lavagem.')
    ][faixa(dur, 70, 45)];

    // 04 · No dia a dia — a cor e o padrão são o maior fator de combinação,
    // por isso a história vem deles quando a extensão os detecta; a nota de
    // versatilidade entra como consequência.
    var t4;
    if (estampado) {
      t4 = '==Estampado pede peças lisas à volta.== ' +
        (ver >= 60 ? 'Ainda assim rende: vira o ponto de partida do look, não o obstáculo.'
                   : 'Sai menos que ' + (tipoArt === 'este' ? 'um ' : 'uma ') + tipo + ' lisa, e o preço por uso sobe junto.');
    } else if (/neutr/i.test(corNota)) {
      // A extensão não conhece o seu guarda-roupa — só sabe se a cor é
      // neutra e se é estampado. "Combina com o que você já tem" prometia um
      // conhecimento que não existe; a nota é sobre a peça em si (cor lisa e
      // neutra combina fácil, ponto), não sobre o que está no seu armário.
      t4 = [
        'Combina fácil e mesmo assim fica no cabide: o que segura não é a cor.',
        '==Combina fácil==, sem ser a primeira escolha da manhã.',
        'Entra em qualquer combinação. É ' + tipoArt + ' ' + tipo + ' que você ==veste sem pensar==.'
      ][faixa(ver, 70, 45)];
    } else if (corNota) {
      // cor marcante: a cor é que decide a frequência de uso
      t4 = [
        'A cor manda aqui: ==pede o resto do look em volta== e sai pouco.',
        'A cor pede um pouco de intenção, mas ainda é fácil de combinar.',
        'Mesmo com cor marcante, ==sai muito==: é fácil de combinar.'
      ][faixa(ver, 70, 45)];
    } else {
      t4 = [
        'Peça de ocasião: ==pede combinação específica== e fica parada no cabide.',
        '==Combina fácil==, mas não é a primeira escolha.',
        'Vai, e muito. ==Funciona como neutro==: jeans, alfaiataria, saia.'
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

  // os traços seguem a composição real da peça, não a do suéter de demonstração
  var _mix = classifica(parseFibras());
  var _sintetica = _mix.sin >= 50;

  /* Traços do selo de viagem, DERIVADOS das propriedades da fibra.

     Antes eram uma lista fixa e só os títulos trocavam — o que produzia
     afirmações que o próprio banco contradiz: uma viscose (respira 8, tanto
     como a lã, e nem sequer é sintética) recebia "Esquenta e não respira —
     fibra sintética retém calor".

     Agora cada traço só aparece se a propriedade o sustentar, e a lista é
     MISTA: uma peça pouco prática que respira bem mostra as duas coisas. É
     mais honesto e mais útil do que três defeitos em fila — e o design já
     previa cor e ícone por traço.                                          */
  function tracosViagemBrutos() {
    var p = props, out = [];
    var tem = function (k) { return p[k] !== undefined; };
    var bom  = function (titulo, texto) { out.push({ titulo: titulo, texto: texto, bom: true }); };
    var mau  = function (titulo, texto) { out.push({ titulo: titulo, texto: texto, bom: false }); };
    // casaco é pra usar por cima: calor vira o critério principal (defeito
    // real é NÃO esquentar), mas respirar continua importando nos dois
    // sentidos — um casaco que não respira também sufoca ao entrar num
    // lugar aquecido ou no metrô lotado, só que o jeito de sentir é outro.
    var isCasaco = tipoKey === 'casaco';

    // ordem = relevância para quem faz mala
    // A mesma fibra amarrota conforme a construção: em malha ou tecido
    // grosso/estruturado (sarja, ganga, corte "carpinteiro"), muito menos.
    // Mesma regra que conclusionText() já aplica no card.
    if (tem('ama') && p.ama <= 5 && ehMalha) bom('Malha amassa pouco', 'Num tecido plano esta fibra amarrotaria; em malha, sai da mala bem melhor.');
    else if (tem('ama') && p.ama <= 5 && naoAmarrotaPelaEspessura) bom('Tecido grosso, não amassa como o fino', 'É estruturado — bem diferente do algodão fino que sai amassado da mala.');
    else if (tem('ama') && p.ama <= 5) mau('Amarrota fácil', 'Sai da mala com vincos. Precisa de ferro ou vapor antes de vestir.');
    else if (tem('ama') && p.ama >= 7) bom('Não amarrota', 'Sai da mala e vai direto pro corpo, sem passar por ferro nenhum.');

    // combina fácil = menos peças na mala pro mesmo número de looks; usa o
    // mesmo 'ver' que já move a pergunta "No dia a dia". Estampado precisa
    // do mesmo cuidado de lá: mesmo com nota boa, ainda é estampado — não dá
    // pra prometer "combina com tudo" sem reconhecer isso.
    if (estampado) {
      if (ver >= 60) bom('Rende mesmo sendo estampado', 'Vira o ponto de partida do look em vez de pedir peça lisa extra na mala.');
      else mau('Estampado pede combinação pensada', 'Não resolve sozinha — precisa de mais peças lisas em volta.');
    } else if (ver >= 70) {
      bom('Fácil de combinar', 'Rende mais looks sem precisar de mais peça nenhuma na mala.');
    } else if (ver <= 45) {
      mau('Pede combinação específica', 'Ocupa espaço na mala pra resolver só uma situação.');
    }

    if (isCasaco) {
      if (tem('cal') && p.cal <= 4) mau('Não esquenta muito', 'Pra um casaco, é o ponto que mais pesa — essa fibra não é a primeira escolha pro frio.');
      else if (tem('cal') && p.cal >= 7) bom('Aguenta o frio', 'Uma peça só resolve, sem precisar de camadas por baixo.');
      // peso: baixo = leve (0-10, 10=mais pesado). Num casaco é onde mais
      // conta — é a peça que mais ocupa espaço e mais pesa no corpo o dia
      // inteiro. Merino é o exemplo: esquenta (cal 9) e ainda é leve (pes 4).
      if (ehAcolchoado) {
        bom('Leve pro tanto que esquenta', 'O recheio é que segura o calor, não o tecido de fora — por isso pesa pouco pro que entrega.');
      } else if (tem('pes') && p.pes >= 7) mau('Pesa na mala e no corpo', 'É a peça que mais ocupa espaço — e você sente o peso dela o dia inteiro.');
      else if (tem('pes') && p.pes <= 4) bom('Esquenta sem pesar', 'Aquece de verdade sem virar a peça mais pesada da mala.');
      if (tem('res') && p.res <= 4) mau('Prende o suor por dentro', 'Vira estufa assim que você entra em algum lugar aquecido ou pega o metrô lotado.');
      else if (tem('res') && p.res >= 8) bom('Esquenta sem virar estufa', 'Segura o frio de fora sem sufocar quando você entra em algum lugar aquecido.');
      // sintético esquenta menos do que a nota de calor sugere e ainda gera
      // estática no ar seco do inverno — vale mesmo com nota de calor ok
      if (_sintetica) mau('Sintético no frio', 'Esquenta menos que lã no mesmo peso, e gera estática no ar seco do inverno.');
    } else {
      if (tem('res') && p.res <= 4) mau('Esquenta e não respira', 'O calor do corpo fica preso. Num dia de viagem longo, incomoda.');
      else if (tem('res') && p.res >= 8) bom('O corpo respira', 'O calor não fica preso, mesmo num dia inteiro fora.');
      if (tem('cal') && p.cal >= 8) bom('Aguenta o frio', 'Uma peça só resolve, sem precisar de camadas por baixo.');
      if (tem('pes') && p.pes >= 8) mau('Pesa na mala', 'Sozinha já ocupa espaço — pensa duas vezes antes de levar mais de uma.');
    }

    if (tem('sec') && p.sec <= 4) mau('Seca devagar', 'Lavar no meio da viagem custa um dia à espera de secar.');
    else if (tem('sec') && p.sec >= 7) bom('Seca da noite pro dia', 'Lava no lavatório à noite e de manhã está pronta.');

    if (tem('bol') && p.bol <= 4 && !ehAcolchoado) mau('Cria bolinhas', 'O atrito da mala e da alça encaroça o tecido.');

    return out;
  }

  var _tracosBrutos = tracosViagemBrutos();
  /* O selo PESA, não veta.

     Histórico: primeiro o selo olhava só a média (vg>=7), e aprovava peça
     com um card reprovando logo abaixo ("Aprovado pra viagem" ao lado de
     "Amarrota fácil"). A correção foi longe demais — passou a bastar UM
     traço ruim pra reprovar, e aí quase nada era aprovado: não existe fibra
     sem defeito (algodão amassa, poliéster abafa, linho amassa muito, lã
     seca devagar). Selo que fica sempre no mesmo estado não informa nada.

     A contradição de verdade era de TEXTO — o lead prometia "não amarrota"
     numa peça que amarrota —, e isso se resolve em seloLeadEl, que só cita
     qualidade que a fibra tem.

     Agora: aprovado = média boa E os pontos bons não perdem dos ruins.
     Poliéster (não amassa, seca rápido, mas abafa) passa; algodão (respira,
     mas amassa e seca devagar) fica em "dá pra levar, com ressalvas", que é
     a leitura honesta. Um defeito visível ao lado do selo deixa de ser
     contradição: o selo dá o veredito, os cards dão o preço a pagar.

     Ajuste: EMPATE também aprova (>=, não >). A maioria das fibras só tem
     2-4 traços relevantes no total, e empate (1 bom/1 mau, 2/2) é o
     resultado mais comum, não a exceção — exigir maioria clara reprovava
     quase tudo que não fosse neutro-perfeito. Medido contra o banco: com
     ">" e cor de peça comum ("cor média"), só 5 de 13 fibras aprovavam; com
     ">=", 9 de 13. Reprovar deve significar "os defeitos SUPERAM as
     qualidades", não "não superam por uma margem confortável".            */
  var _bons = _tracosBrutos.filter(function (t) { return t.bom; }).length;
  var _maus = _tracosBrutos.length - _bons;
  // Uma exceção à contagem: amassar muito é desqualificante pra mala, e
  // contar traços como se pesassem igual aprovaria linho (amassa=1, o pior
  // do banco) por respirar e secar bem. Peça que sai inutilizável da
  // bagagem não é compensada por outra virtude — é o único ponto onde o
  // contexto "viagem" justifica um corte seco. Pega linho, cânhamo, rami.
  // ...e o corte duro também respeita a construção: o veto existe pra peça
  // que sai inutilizável da mala, o que não é o caso de uma malha.
  var _amassaMuito = props.ama !== undefined && props.ama <= 3 && !naoAmarrotaPelaEspessura;
  var seloAprovado = _tracosBrutos.length
    ? (vg >= 7 && _bons >= _maus && !_amassaMuito)
    : vg >= 7;
  var seloAcc = seloAprovado ? '#FF009D' : '#C89B5E';
  var seloIcon = seloAprovado ? '✓' : '!';

  /* Aptidões da peça, no formato que o LookMap vai filtrar. Chave curta e
     estável — é ela que fica gravada no localStorage, então mudar o nome
     depois invalida o histórico de quem já salvou.
       viagem  <- o selo que já existia (média + balanço dos traços)
       frio    <- climas.inverno
       quente  <- climas.verao
       cabine  <- viagem.ocupa_pouco_espaco && funciona_mala_capsula
     Rain Ready, Hiking e Business ficaram DE FORA de propósito: dependem de
     acabamento e de corte, que a etiqueta não diz. Um selo errado custa mais
     do que um selo ausente.                                              */
  function aptidoes() {
    var a = [];
    if (seloAprovado) a.push('viagem');
    if (selosFibra.inverno !== undefined && selosFibra.inverno >= 8) a.push('frio');
    if (selosFibra.verao !== undefined && selosFibra.verao >= 8) a.push('quente');
    if (selosFibra.cabine) a.push('cabine');
    return a;
  }
  var APTIDAO_NOME = { viagem: 'Viagem', frio: 'Clima frio', quente: 'Clima quente', cabine: 'Cabine' };

  function tracosViagem() {
    var out = _tracosBrutos.slice();
    if (!out.length) {
      out.push(seloAprovado
        ? { titulo: 'Boa companheira de mala', texto: 'Aguenta a viagem sem exigir cuidado especial.', bom: true }
        : { titulo: 'Pede atenção na mala', texto: 'Não é a peça mais prática para levar numa viagem.', bom: false });
    }
    return out.slice(0, 3);
  }

  var selo = tracosViagem().map(function (tr) {
    return {
      titulo: tr.titulo, texto: tr.texto,
      cor: tr.bom ? '#FF009D' : '#C89B5E',
      icon: tr.bom ? '\u2713' : '!'
    };
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
  // Mesmo mecanismo de marketing.js: ver nota lá. Vercel + Google Analytics,
  // cada um só dispara se o próprio script dele tiver carregado.
  function evento(nome) {
    if (typeof window.va === 'function') window.va('event', { name: nome });
    if (typeof window.gtag === 'function') window.gtag('event', nome);
  }

  function salvarPeca() {
    if (!has('score') || estaGuardada()) return;
    evento('salvou_peca');
    var l = lerGuardadas();
    l.unshift({
      id: pecaId, tipo: nome, nota: score, loja: loja,
      thumb: imagem, verdict: verdictParam || '', quando: Date.now(),
      // aptidões gravadas na peça: é sobre elas que o filtro do LookMap
      // trabalha ("quais das minhas peças servem pra este roteiro?"). Dá
      // pra rederivar da url guardada, mas gravar aqui deixa o filtro
      // trivial e independente do formato dos parâmetros mudar.
      aptidoes: aptidoes(),
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
      capR: loja
        + (notaAva ? ' · ★ ' + notaAva + (notaAvaN ? ' (' + notaAvaN + ')' : '') : '')
        + (Q.get('confianca') ? ' · confiança ' + int('confianca', 0) + '%' : ''),
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
      // O chip do selo passa a carregar também as outras aptidões da peça
      // (clima frio/quente, cabine). É extensão do TEXTO, não do layout —
      // o desenho do bloco fica intacto.
      seloMini: (function () {
        var base = seloAprovado ? 'Ótima pra levar' : vg >= 5 ? 'Dá pra levar, com ressalvas' : 'Pouco prática';
        var extras = aptidoes().filter(function (k) { return k !== 'viagem'; })
                               .map(function (k) { return APTIDAO_NOME[k]; });
        return extras.length ? base + ' · ' + extras.join(' · ') : base;
      })(),
      /* Antes: [nome da fibra] + [defeitos juntados com "e"] + uma cauda fixa
         igual pra toda peça ("conte com ferro ou vapor"). Três problemas:
         o nome da fibra virava sujeito solto ("Algodão amarrota"), a lista
         denunciava montagem, e a cauda não checava o defeito — mandava
         passar a ferro uma peça cujo único problema era reter calor.
         Agora cada combinação de defeitos tem frase inteira, escrita como
         cena concreta, com o conselho que corresponde ao problema real. */
      seloLeadCautelaEl: mark((function () {
        var o = tipoArt === 'este' ? 'o' : 'a';
        var A = props.ama !== undefined && props.ama <= 5;   // amarrota
        var B = props.res !== undefined && props.res <= 5;   // abafa
        var S = props.sec !== undefined && props.sec <= 4;   // seca devagar
        // Num casaco, reter calor é a FUNÇÃO da peça, não um defeito a
        // avisar. "Abafa quando o dia estica" descreve quem não pode tirar a
        // roupa — e casaco tira-se. Só as cautelas que continuam a valer
        // (amassar na mala, secar devagar) ficam de pé.
        if (tipoKey === 'casaco') B = false;
        var FRASES = {
          A: ['==Sai amassad' + o + ' da mala==, por melhor que você dobre. Conte com um ferro do outro lado.',
              '==Amassa na mala.== No destino é ferro ou vapor antes de vestir.'],
          AB: ['==Amassa na mala== e prende o calor num dia inteiro fora.',
               'Chega ==amassad' + o + '== e ==abafa== quando o dia estica.'],
          AS: ['==Sai amassad' + o + ' da mala==, e lavar no meio da viagem custa um dia esperando secar.',
               '==Amassa e seca devagar.== Ferro no destino, e paciência se lavar.'],
          ABS: ['Amassa, abafa e demora a secar. É a peça que mais vai dar trabalho.',
                '==Amarrota, retém calor e seca devagar.== Dá pra levar, mas cobra.'],
          B: ['==Prende o calor.== Num dia inteiro na rua você sente.',
              '==Abafa quando o dia estica.== Funciona se o destino for frio.'],
          BS: ['==Abafa num dia longo== e ==demora a secar==. Leve se o clima ajudar.',
               'Retém calor e seca devagar — os dois pesam em viagem.'],
          S: ['==Seca devagar.== Lavar no meio da viagem custa um dia de espera.',
              '==Demora a secar.== Lavar à noite e vestir de manhã não vai dar.'],
          '': ['Pede um pouco de atenção na mala, mas nada que atrapalhe a viagem.']
        };
        var chave = (A ? 'A' : '') + (B ? 'B' : '') + (S ? 'S' : '');
        return variante(FRASES[chave] || FRASES[''], 11);
      })()),
      // Mesma reescrita do texto de cautela acima: frase inteira por caso,
      // em vez de "[fibra] viaja bem: [lista]. [cauda fixa]".
      seloLeadEl: mark((function () {
        var naoAmarrota = props.ama !== undefined && props.ama > 5;
        var secaRapido  = props.sec !== undefined && props.sec >= 7;
        var respira     = props.res !== undefined && props.res >= 8;
        var aquece      = props.cal !== undefined && props.cal >= 7;

        // casaco: o que importa é resolver o frio sem virar estufa por dentro
        if (tipoKey === 'casaco') {
          if (aquece && respira) return variante([
            '==Resolve o frio sem virar estufa== quando você entra em algum lugar aquecido.',
            'Segura a rua fria e aguenta o interior aquecido ==sem te fazer suar==.'
          ], 13);
          if (aquece) return variante([
            '==Segura o frio sozinho==, sem camadas por baixo — e isso já libera mala.',
            'Aguenta o frio ==sem reforço==: um casaco, nada por baixo.'
          ], 13);
          if (respira) return '==Respira mesmo isolando do frio==: dá pra entrar num lugar aquecido sem tirar.';
        }

        if (naoAmarrota && secaRapido) return variante([
          '==Sai da mala pronta pra vestir==, e lavada à noite já está seca de manhã.',
          'Sem ferro, e ==seca da noite pro dia==. Uma peça dessas rende como três.'
        ], 13);
        if (naoAmarrota) return variante([
          '==Sai da mala e vai direto pro corpo==, sem ferro nenhum.',
          'Vai na mala e sai pronta: ==sem vinco, sem ferro==.'
        ], 13);
        if (secaRapido) return '==Lavada à noite, está seca de manhã.== Uma peça dessas substitui três.';
        if (respira && aquece) return '==Aguenta a rua fria e o interior aquecido sem te fazer suar== — o que é raro.';
        if (respira) return '==Respira bem==: o calor não fica preso, mesmo num dia inteiro fora.';
        return 'Resolve a viagem sem exigir cuidado nenhum.';
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
