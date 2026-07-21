/* ------------------------------------------------------------------
   Runtime da página de análise (v15 Apple White).
   O DESIGN não é definido aqui — a marcação e os estilos vêm do
   ficheiro de design (LookPilot Experiencia v15 Apple White.dc.html),
   transformados 1:1. Este ficheiro só:
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
  // senão as duas superfícies contradizem-se no mesmo score).
  var score = has('score') ? clamp(int('score', DEFAULT.score), 0, 100) : DEFAULT.score;
  var verdictParam = Q.get('verdict');

  var galeria = (Q.get('galeria') || '').split('|').filter(Boolean);
  var imagem = Q.get('imagem') || galeria[0] || DEFAULT.heroImg;
  var fotos = galeria.length ? galeria : (imagem ? [imagem] : []);
  var temFoto = !!imagem;

  var nome = Q.get('nome') || DEFAULT.fibra;
  var loja = Q.get('loja') || 'ZARA';
  var preco = Q.get('preco') || DEFAULT.preco;
  var moeda = Q.get('moeda') || '€';
  var origem = Q.get('origem') || DEFAULT.url;
  var fibras = Q.get('fibras') || '';
  var viagem100 = has('viagem') ? clamp(int('viagem', 80), 0, 100) : DEFAULT.viagem * 10;
  var vg = Math.round(viagem100 / 10); // o design trabalha o selo em 0–10

  // composição para a etiqueta: "Lã:100" -> "100% lã"
  var etiqComp = fibras
    ? fibras.split(',').map(function (p) {
        var s = p.split(':');
        return (s[1] ? s[1] + '% ' : '') + (s[0] || '').toLowerCase();
      }).join(' · ')
    : DEFAULT.etiqComp;

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

  var cartoes = DEFAULT.cartoes.map(function (c, i) {
    var foto = fotos.length ? fotos[i % fotos.length] : '';
    return {
      num: c.num, tema: c.tema, pergunta: c.pergunta,
      dir: i % 2 === 1 ? 'rtl' : 'ltr',
      isPrimeiro: i === 0,
      respostaEl: mark(c.resposta),
      mediaEl: mediaEl(foto, c.alt,
        'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:' + c.pos +
        ';transform:scale(' + c.zoom + ');transform-origin:' + c.pos + ';filter:saturate(1.06) sepia(.06)')
    };
  });

  var seloAprovado = vg >= 7;
  var seloAcc = seloAprovado ? '#FF009D' : '#C89B5E';
  var seloIcon = seloAprovado ? '✓' : '!';
  var traitsOk = [
    { titulo: 'Não amarrota', texto: 'Sai da mala e vai direto pro corpo. A fibra relaxa os vincos sozinha em poucos minutos.' },
    { titulo: 'Uma peça, vários climas', texto: 'Segura o frio e respira no ameno. Uma peça só cobre a viagem inteira.' },
    { titulo: 'Areja em vez de lavar', texto: 'Não guarda cheiro. Uma noite no cabide e está pronta pro dia seguinte.' }
  ];
  var traitsCau = [
    { titulo: 'Amarrota fácil', texto: 'Sai da mala com vincos. Precisa de ferro ou vapor antes de vestir.' },
    { titulo: 'Esquenta e não respira', texto: 'Fibra sintética retém calor. Num dia de viagem longo, pesa.' },
    { titulo: 'Precisa lavar mais', texto: 'Retém cheiro rápido: não dá pra arejar e reusar.' }
  ];
  var selo = (seloAprovado ? traitsOk : traitsCau).map(function (t) {
    return { titulo: t.titulo, texto: t.texto, cor: seloAcc, icon: seloIcon };
  });

  var guardado = false;

  function vals() {
    return {
      // hero
      heroFibra: nome,
      heroPreco: preco,
      heroDuvida: has('nome') ? 'O que a etiqueta diz sobre esta peça?' : DEFAULT.duvida,
      heroIntroEl: mark(has('score')
        ? 'O ==LookPilot== leu a etiqueta pra você.' + (etiqComp ? ' Composição: ==' + etiqComp + '==.' : '')
        : DEFAULT.heroIntro),
      verdict: verdictParam || (score >= 75 ? 'Vale a pena.' : score >= 50 ? 'Compra ponderada.' : 'Deixa ficar.'),
      scoreTo: score,
      scoreCor: score >= 75 ? '#FF009D' : '#A67C3B',
      lojaUrl: origem,
      // fotografia
      heroMediaEl: mediaEl(imagem, nome, 'display:block;width:100%;aspect-ratio:21/10;object-fit:cover;object-position:' + DEFAULT.heroPos + ';filter:saturate(1.08) sepia(.06) contrast(1.03)'),
      capL: has('nome') ? nome : DEFAULT.capL,
      capR: loja + (Q.get('confianca') ? ' · confiança ' + int('confianca', 0) + '%' : ''),
      // perguntas
      cartoes: cartoes,
      etiqComp: etiqComp,
      // a extensão não lê a referência da etiqueta; sem ela, fica vazio em vez
      // de repetir a loja (que já aparece acima, em "Etiqueta · ZARA")
      etiqRef: has('nome') ? '' : DEFAULT.etiqRef,
      // selo viagem
      selo: selo,
      seloViagem: vg,
      seloAprovado: seloAprovado,
      seloCautela: !seloAprovado,
      seloMini: vg >= 7 ? 'Ótima pra levar' : vg >= 5 ? 'Dá pra levar, com ressalvas' : 'Pouco prática',
      // lookmap
      lookmapLeadEl: mark(DEFAULT.lookmapLead.replace('==86==', '==' + score + '==')),
      lookmapAtualEl: mediaEl(imagem, nome, 'width:100%;height:100%;object-fit:cover;object-position:50% 30%;filter:saturate(1.06) sepia(.06)'),
      lookmapAtualNota: score,
      lookmapAtualTipo: nome,
      lookmapAtualCor: score >= 50 ? '#1D1D1F' : '#6E6E73',
      lookmapOutras: [],
      pecaTemFoto: temFoto,
      pecaSemFoto: !temFoto,
      naoGuardado: !guardado,
      guardado: guardado,
      onSalvar: function () { guardado = true; render(); },
      // vistas
      isDetalhe: true,
      isHistorico: false,
      voltarPecas: false,
      onHistorico: function () { var e = document.getElementById('lookmap'); if (e) e.scrollIntoView({ behavior: 'smooth' }); },
      onDetalhe: function () {},
      guardadas: [], nGuardadas: 0, temGuardadas: false, semGuardadas: true
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
    if (Array.isArray(v)) { v.forEach(function (n) { el.appendChild(n.nodeType ? n : document.createTextNode(String(n))); }); return; }
    if (v.nodeType) { el.appendChild(v); return; }
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
    // handlers
    sel(root, '[data-on-click]').forEach(function (el) {
      if (el.__bound) return; el.__bound = true;
      el.addEventListener('click', function () {
        var fn = get(scope, el.getAttribute('data-on-click'));
        if (typeof fn === 'function') fn();
      });
    });
  }

  var mounted = false;
  function render() {
    var scope = vals();
    apply(document.body, scope);
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

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render);
  else render();
})();
