/* ------------------------------------------------------------------
   Runtime da home de marketing (LookMap Landing Extensao).
   O DESIGN vem do arquivo de design, traduzido 1:1 pelo build.py.
   Este arquivo só preenche os bindings e reproduz as animações.
   ------------------------------------------------------------------ */
(function () {
  'use strict';

  // O zip é gerado por landing/empacotar.sh (o servir.sh chama sozinho).
  // Enquanto a extensão não está na loja do Chrome, baixar não basta: a pessoa
  // precisa dos 3 passos para carregar a pasta. Por isso o botão faz as duas
  // coisas — entrega o arquivo E abre o modal com as instruções.
  var DOWNLOAD_URL = 'lookpilot-extensao.zip';

  var installOpen = false;

  /* ---------- ==negrito== do design ------------------------------- */
  function mark(t) {
    return String(t == null ? '' : t).split(/==(.+?)==/).map(function (p, i) {
      if (i % 2) {
        var b = document.createElement('strong');
        b.style.fontWeight = '700';
        b.style.color = '#1D1D1F';
        b.textContent = p;
        return b;
      }
      return document.createTextNode(p);
    });
  }

  function setaBaixar() {
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('aria-hidden', 'true');
    [['M12 4v13m0 0l-5-5m5 5l5-5', 'round'], ['M5 20h14', null]].forEach(function (d) {
      var p = document.createElementNS(ns, 'path');
      p.setAttribute('d', d[0]);
      p.setAttribute('stroke', 'currentColor');
      p.setAttribute('stroke-width', '2');
      p.setAttribute('stroke-linecap', 'round');
      if (d[1]) p.setAttribute('stroke-linejoin', d[1]);
      svg.appendChild(p);
    });
    return svg;
  }

  function baixar() {
    if (DOWNLOAD_URL) {
      // <a download> em vez de window.open: não abre aba nem é bloqueado como popup
      var a = document.createElement('a');
      a.href = DOWNLOAD_URL;
      a.setAttribute('download', '');
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
    installOpen = true;
    render();
    document.documentElement.style.overflow = 'hidden';
  }

  function vals() {
    return {
      installOpen: installOpen,
      onDownload: function () { baixar(); },
      onInstallClose: function () {
        installOpen = false; render();
        document.documentElement.style.overflow = '';
      },
      arrowDown: setaBaixar(),
      heroSubEl: mark('O ==LookPilot== lê a etiqueta por você em qualquer loja online e diz, em segundos, se a peça vale mesmo a pena.'),
      passos: [
        { n: '1', txt: 'Clique duas vezes no arquivo .zip baixado — ele descompacta sozinho numa pasta chamada "lookpilot".' },
        { n: '2', txt: 'Abra chrome://extensions e ligue o Modo do desenvolvedor.' },
        { n: '3', txt: 'Clique em “Carregar sem compactação” e escolha essa pasta "lookpilot" que acabou de aparecer (não o arquivo .zip). Pronto — abra qualquer loja.' }
      ],
      resp1El: mark('O LookPilot abre a etiqueta e lê fibra a fibra — ==100% lã ou 94% sintético==, sem marketing pelo meio. O que a loja esconde nas letras miúdas, você vê num relance.'),
      resp2El: mark('A composição vira uma ==nota de 0 a 100== e um veredito direto — de "não vale a pena" a "pode comprar tranquila". Cada fibra tem ficha própria, com ==fontes técnicas== por trás de cada número: é dado, não opinião.'),
      resp3El: mark('Gostou do resultado? ==Salve a peça== com um clique. Com o tempo, isso vira o ==LookMap==: o mapa do guarda-roupa inteiro — e você compra menos e melhor, porque já sabe o que tem.')
    };
  }

  /* ---------- motor de bindings (igual ao da análise) -------------- */
  function get(o, path) {
    return path.split('.').reduce(function (a, k) { return (a == null ? undefined : a[k]); }, o);
  }
  function interp(tpl, scope) {
    return tpl.replace(/\{\{\s*([\w.]+)\s*\}\}/g, function (_, p) {
      var v = get(scope, p); return v == null ? '' : String(v);
    });
  }
  function setNode(el, v) {
    el.textContent = '';
    if (v == null) return;
    // clonar: o mesmo nó pode estar ligado a vários pontos
    var poe = function (n) {
      el.appendChild(n.nodeType ? (n.parentNode ? n.cloneNode(true) : n) : document.createTextNode(String(n)));
    };
    if (Array.isArray(v)) { v.forEach(poe); return; }
    if (v.nodeType) { poe(v); return; }
    el.textContent = String(v);
  }
  function sel(root, q) {
    return Array.prototype.filter.call(root.querySelectorAll(q), function (el) {
      var h = el.closest('[data-for-item]');
      return !h || h === root;
    });
  }
  function apply(root, scope) {
    sel(root, '[data-if]').forEach(function (el) {
      el.style.display = get(scope, el.getAttribute('data-if')) ? 'contents' : 'none';
    });
    sel(root, 'template[data-for]').forEach(function (tpl) {
      var list = get(scope, tpl.getAttribute('data-for')) || [];
      var as = tpl.getAttribute('data-as') || 'item';
      (tpl.__rendered || []).forEach(function (n) { n.remove(); });
      tpl.__rendered = [];
      list.forEach(function (item) {
        var holder = document.createElement('div');
        holder.style.display = 'contents';
        holder.setAttribute('data-for-item', '');
        holder.appendChild(tpl.content.cloneNode(true));
        var sub = Object.create(scope); sub[as] = item;
        apply(holder, sub);
        tpl.parentNode.insertBefore(holder, tpl);
        tpl.__rendered.push(holder);
      });
    });
    sel(root, '[data-txt]').forEach(function (el) {
      setNode(el, get(scope, el.getAttribute('data-txt')));
    });
    sel(root, '*').forEach(function (el) {
      Array.prototype.slice.call(el.attributes).forEach(function (a) {
        if (a.name.indexOf('data-tpl-') !== 0) return;
        el.setAttribute(a.name.slice(9), interp(a.value, scope));
      });
    });
    sel(root, '[data-on-click]').forEach(function (el) {
      if (!el.__bound) {
        el.__bound = true;
        el.addEventListener('click', function (ev) {
          var fn = get(el.__scope || scope, el.getAttribute('data-on-click'));
          if (typeof fn === 'function') { ev.preventDefault(); fn(); }
        });
      }
      el.__scope = scope;
    });
  }

  var montado = false;
  function render() {
    var scope = vals();
    apply(document.body, scope);
    if (!montado) { montado = true; anima(); }
  }

  /* ---------- animações (as mesmas do design) --------------------- */
  function anima() {
    document.title = 'LookPilot — a etiqueta, lida por você';
    var reduzido = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduzido) return;

    var tentativas = 40;
    (function espera() {
      if (!(window.gsap && window.ScrollTrigger)) {
        if (--tentativas > 0) setTimeout(espera, 150);
        return;
      }
      var g = window.gsap;
      g.registerPlugin(window.ScrollTrigger);

      g.set('[data-hero]', { opacity: 0, y: 48, scale: 0.97 });
      g.to('[data-hero]', { opacity: 1, y: 0, scale: 1, duration: 1.3, ease: 'power4.out', stagger: 0.13, delay: 0.05, clearProps: 'transform' });

      var hhl = document.querySelector('[data-hero-hl]');
      if (hhl) g.fromTo(hhl, { backgroundSize: '0% .62em' }, { backgroundSize: '100% .62em', duration: 1, ease: 'power3.inOut', delay: 0.95 });

      g.utils.toArray('[data-hero-chip]').forEach(function (el, i) {
        g.fromTo(el, { opacity: 0, scale: 0.5, rotation: i ? 11 : -13, y: 34 },
          { opacity: 1, scale: 1, rotation: i ? 4 : -5, y: 0, duration: 1, ease: 'back.out(1.8)', delay: 1.1 + i * 0.18 });
        g.to(el, { y: i ? -12 : 10, duration: 2.8 + i * 0.6, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 2.2 + i * 0.18 });
      });

      var hero = document.getElementById('topo');
      if (hero) g.to(hero, { opacity: 0.2, y: -70, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom 25%', scrub: true } });

      g.utils.toArray('[data-ap]').forEach(function (el) {
        g.fromTo(el, { opacity: 0, y: 90 }, { opacity: 1, y: 0, duration: 1.2, ease: 'power4.out', clearProps: 'opacity,transform',
          scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
      });

      g.utils.toArray('[data-plx]').forEach(function (el, i) {
        g.fromTo(el, { y: 90, rotate: i % 2 ? 2.5 : -2.5 }, { y: -90, rotate: i % 2 ? -1.5 : 1.5, ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 0.8 } });
      });

      g.utils.toArray('[data-hl]').forEach(function (el) {
        var alvo = el.style.backgroundSize || '100% .62em';
        g.fromTo(el, { backgroundSize: alvo.replace('100%', '0%') }, { backgroundSize: alvo, duration: 1.2, ease: 'power3.inOut',
          scrollTrigger: { trigger: el, start: 'top 82%', once: true } });
      });

      // contagem da nota de demonstração
      var num = document.querySelector('[data-score-num]');
      var bar = document.querySelector('[data-score-bar]');
      if (num && bar) {
        var alvoNota = 86;
        num.textContent = '0';
        g.set(bar, { width: '0%' });
        window.ScrollTrigger.create({
          trigger: num, start: 'top 80%', once: true,
          onEnter: function () {
            var o = { v: 0 };
            g.to(o, { v: alvoNota, duration: 1.3, ease: 'power3.out', onUpdate: function () { num.textContent = Math.round(o.v); } });
            g.to(bar, { width: alvoNota + '%', duration: 1.3, ease: 'power3.out' });
          }
        });
      }

      var tiles = document.querySelector('[data-tiles]');
      if (tiles) {
        g.from(tiles.children, { opacity: 0, scale: 0.6, y: 26, duration: 0.9, ease: 'back.out(2.2)', stagger: 0.09,
          scrollTrigger: { trigger: tiles, start: 'top 82%', once: true } });
      }
    })();
  }

  // Escape fecha o modal de instalação
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && installOpen) {
      installOpen = false; render();
      document.documentElement.style.overflow = '';
    }
  });

  function iniciar() {
    render();
    // a página de análise manda para cá com ?baixar=1: já chega baixando
    if (/[?&]baixar=1/.test(location.search)) baixar();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
