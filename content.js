(function() {
  if (window.__fabricAnalyzerInjected) return;
  if (!document.body && !document.documentElement) return;
  if (location.protocol === 'file:' || location.protocol === 'chrome-extension:') return;
  window.__fabricAnalyzerInjected = true;

  const LOOKMAP_BASE_URL = 'https://lookmap.ai/analise';

  function buildAnaliseURL(scores, fibers, buy, verdictLabel, productUrl) {
    const params = new URLSearchParams();
    params.set('score',     buy);
    params.set('verdict',   verdictLabel);
    // Dimensões (0–100)
    if (scores) {
      params.set('qualidade',     Math.round(scores.quality     || 0));
      params.set('durabilidade',  Math.round(scores.durability  || 0));
      params.set('conforto',      Math.round(scores.comfort     || 0));
      params.set('versatilidade', Math.round(scores.versatility || 0));
      params.set('manutencao',    Math.round(scores.maintenance || 0));
      params.set('custo',         Math.round(scores.costBenefit || 0));
      params.set('viagem',        Math.round(scores.travel      || 0));
    }
    // Fibras: "Poliéster:99,Elastano:1"
    const fibersParam = (scores?.fibers || fibers)
      .map(f => `${f.name}:${f.pct || 0}`)
      .join(',');
    if (fibersParam) params.set('fibras', fibersParam);
    // Produto
    if (productUrl) params.set('origem', productUrl);
    return `${LOOKMAP_BASE_URL}?${params.toString()}`;
  }

  // Fiber data now in shared.js (FIBER_DB)

  const SECONDARY_LABELS = ['bordado','bordados','embroidery','forro','lining','trim','detalhe','bolso','pocket','etiqueta','elástico','elastic','ribana','inviés','invies','bias','vies','entretela','interfacing','fita','tape'];
  const PRIMARY_LABELS   = ['exterior','externo','shell','corpo','body','tecido base','principal','composição','material','tecido','main','main fabric','outer'];
  const FIBER_KEYS = Object.keys(FIBER_DB).sort((a,b) => b.length - a.length);

  // ─── Single unified parser ──────────────────────────────────────
  // Handles: "80% algodão", "algodão 80%", "pele bovina" (no %), "couro sintético"
  function parseComposition(text, category) {
    // Normaliza prefixos inline como "Main: 95% cotton" → separados por newline
    text = text
      .replace(/\bMain\s*:\s*/gi, '\nMain\n')
      .replace(/\bOuter\s*:\s*/gi, '\nOuter\n')
      .replace(/\bShell\s*:\s*/gi, '\nShell\n')
      .replace(/\bLining\s*:\s*/gi, '\nForro\n')
      .replace(/\bExterior\s*:\s*/gi, '\nExterior\n')
      .replace(/Tecido\s+Secundário\s*:?\s*/gi, '\nTecido Secundário\n')
      .replace(/Tecido\s+Principal\s*:?\s*/gi, '\nTecido Principal\n')
      .replace(/Secondary\s+Fabric\s*:?\s*/gi, '\nSecondary Fabric\n');
    // Remove tudo a partir da primeira secção secundária para não cruzar dados entre tecidos
    text = text.replace(/(?:Tecido\s+Secund[aá]rio|Secondary\s+Fabric)[\s\S]*/gi, '');
    const norm = text.normalize('NFC').toLowerCase()
      .replace(/\r?\n/g, ';')   // newlines → ; para Pass 1a não capturar cross-line
      .replace(/\s+/g, ' ');
    const results = [];
    const seen = new Set();
    const db = (typeof MATERIALS !== 'undefined' && MATERIALS[category]) ? MATERIALS[category] : {};

    const addFiber = (pct, word) => {
      word = word.trim();
      let data = getFiber(word) || (typeof getMaterialData === 'function' ? getMaterialData(word, category) : null);
      // Se não encontrou, tenta nomes progressivamente mais curtos (ex: "algodão de cultivo orgânico" → "algodão")
      if (!data) {
        const parts = word.split(/\s+/);
        for (let len = parts.length - 1; len >= 1; len--) {
          const shorter = parts.slice(0, len).join(' ');
          const d = getFiber(shorter) || (typeof getMaterialData === 'function' ? getMaterialData(shorter, category) : null);
          if (d) { data = d; word = shorter; break; }
        }
      }
      if (data && !seen.has(word)) { seen.add(word); results.push({ pct, name: word, data }); }
    };

    // Pass 1a: "XX% fibra" (número antes) — ex: Zara, Mango
    // Limite alargado para 50 chars para cobrir descrições longas como "algodão de cultivo orgânico certificado OCS"
    const pairRe = /(\d+(?:[.,]\d+)?)\s*%\s*(?:de\s+)?([a-zà-öø-ÿ][a-zà-öø-ÿ\s]{1,50}?)(?=[,;.\n]|\d|$)/gi;
    let m;
    while ((m = pairRe.exec(norm)) !== null) {
      addFiber(parseFloat(m[1].replace(',', '.')), m[2]);
    }

    // Pass 1b: "fibra XX%" (número depois) — ex: Massimo Dutti
    if (results.length === 0) {
      const revRe = /([a-zà-öø-ÿ][a-zà-öø-ÿ\s]{1,25}?)\s+(\d+(?:[.,]\d+)?)\s*%/gi;
      while ((m = revRe.exec(norm)) !== null) {
        addFiber(parseFloat(m[2].replace(',', '.')), m[1]);
      }
    }

    // Pass 2: category material keywords without % (shoes/bags often do this)
    if (results.length === 0 && category !== 'clothing') {
      const keys = Object.keys(db).sort((a, b) => b.length - a.length);
      keys.forEach(key => {
        if (norm.includes(key) && !seen.has(key)) {
          seen.add(key);
          results.push({ pct: results.length === 0 ? 100 : 15, name: key, data: db[key], estimated: true });
        }
      });
      // Synthetic catch-all
      if (results.length === 0 && /sint[eé]tico|faux|vegan leather|couro sint|pu |pvc/.test(norm)) {
        const synData = db['couro sintético'] || { quality:42, durability:48, comfort:55, maintenance:82, travel:65, label:'Material sint.', tip:'Material sintético — durabilidade limitada' };
        results.push({ pct: 100, name: 'couro sintético', data: synData, estimated: true });
      }
    }

    return results;
  }

  // ─── Section splitter (unchanged) ────────────────────────────────
  function splitIntoSections(text) {
    // Normaliza prefixos de calçado inline (Upper: / Sole: / Sock:) para cabeçalhos próprios
    text = text
      .replace(/\bUpper\s*:\s*/gi, '\nUpper\n')
      .replace(/\b(Out)?sole\s*:\s*/gi, '\nSole\n')
      .replace(/\bSola\s*:\s*/gi, '\nSole\n')
      .replace(/\bSolado\s*:\s*/gi, '\nSole\n')
      .replace(/\bInsole\s*:\s*/gi, '\nPalmilha\n')
      .replace(/\bSock\s*:\s*/gi, '\nPalmilha\n')
      .replace(/\bLining\s*:\s*/gi, '\nForro\n')
      .replace(/\bGáspea\s*:\s*/gi, '\nGáspea\n')
      .replace(/\bCabedal\s*:\s*/gi, '\nCabedal\n')
      .replace(/Tecido\s+Principal\s*:?\s*/gi, '\nTecido Principal\n')
      .replace(/Tecido\s+Secundário\s*:?\s*/gi, '\nTecido Secundário\n')
      .replace(/Secondary\s+Fabric\s*:?\s*/gi, '\nTecido Secundário\n');
    const lines = text.split(/\n|\r/);
    const sections = [];
    let currentLabel = 'principal', currentText = '', liningContext = false;
    const SECONDARY = ['bordado','bordados','embroidery','forro','lining','trim','detalhe','bolso','pocket','etiqueta','elástico','elastic','ribana','inviés','invies','bias','vies','entretela','fita','tecido secundário','tecido secundario','sole','sola','solado','palmilha','insole'];
    const PRIMARY   = ['exterior','externo','shell','corpo','body','tecido base','principal','composição','material','tecido','main','outer','gáspea','gaspea','cabedal','upper'];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const low = trimmed.toLowerCase();
      const isHeader = trimmed.length < 45 && !trimmed.includes('%') &&
        (trimmed === trimmed.toUpperCase() ||
         SECONDARY.some(l => low === l) ||
         PRIMARY.some(l => low === l));
      if (isHeader) {
        // "FORRO" abre contexto de forro; "EXTERIOR" fecha-o
        if (/forro|lining/.test(low)) liningContext = true;
        else if (/exterior|externo|shell|outer/.test(low)) liningContext = false;
        // Dentro do forro, "tecido principal/secundário" continuam a ser forro (secundário)
        if (currentText) { sections.push({ label: currentLabel, text: currentText }); currentText = ''; }
        // Se estamos em contexto de forro, marca o label como forro mesmo que diga "tecido principal"
        currentLabel = liningContext && /tecido (principal|secund)/.test(low) ? 'forro ' + trimmed : trimmed;
      }
      else currentText += ' ' + trimmed;
    }
    if (currentText) sections.push({ label: currentLabel, text: currentText });
    return sections.length > 0 ? sections : [{ label: 'principal', text }];
  }

  // ─── Pick best section ────────────────────────────────────────────
  function findPrimarySection(sections, category) {
    // Category-specific section priorities
    let PRIMARY, SECONDARY;
    if (category === 'shoes') {
      // Pra calçado, a GÁSPEA/cabedal é a parte principal; forro/sola/palmilha são secundárias
      PRIMARY   = ['gáspea','gaspea','cabedal','exterior','upper','externo'];
      SECONDARY = ['forro','lining','sola','sole','palmilha','insole','entressola','solado'];
    } else if (category === 'bags') {
      PRIMARY   = ['exterior','externo','corpo','body','material principal','principal'];
      SECONDARY = ['forro','lining','alça','strap','detalhe'];
    } else {
      PRIMARY   = ['exterior','externo','corpo','body','tecido base','principal','composição','material'];
      SECONDARY = ['bordado','bordados','forro','lining','trim','bolso','etiqueta','elástico','ribana','inviés','invies','bias','vies','entretela','tecido secundário','tecido secundario'];
    }
    const scored = sections.map(sec => {
      const fibers = parseComposition(sec.text, category);
      if (!fibers.length) return null;
      const label = sec.label.toLowerCase();
      const total = fibers.reduce((acc, f) => acc + f.pct, 0);
      let priority = fibers.length;
      // Exterior tem prioridade forte; forro é fortemente penalizado (é a peça por dentro)
      if (/forro|lining/.test(label))             priority -= 30;
      else if (PRIMARY.some(l => label.includes(l)))   priority += 15;
      if (SECONDARY.some(l => label.includes(l))) priority -= 15;
      if (total >= 98 && total <= 102) priority += 20;
      else if (total >= 90 && total <= 110) priority += 8;
      else priority -= 5;
      return { ...sec, fibers, priority, total };
    }).filter(Boolean);
    if (!scored.length) return null;
    scored.sort((a, b) => b.priority - a.priority);
    return scored[0];
  }

  // ─── Main scan ────────────────────────────────────────────────────
  let openedCompositionModal = false;
  let compClickAttempts = 0;

  // Clique robusto: alguns handlers React reagem a pointer/mouse, não só a click().
  function robustClick(el) {
    if (!el) return;
    const opts = { bubbles: true, cancelable: true, view: window };
    try { el.dispatchEvent(new PointerEvent('pointerdown', opts)); } catch(e) {}
    try { el.dispatchEvent(new MouseEvent('mousedown', opts)); } catch(e) {}
    try { el.dispatchEvent(new PointerEvent('pointerup', opts)); } catch(e) {}
    try { el.dispatchEvent(new MouseEvent('mouseup', opts)); } catch(e) {}
    try { el.click(); } catch(e) {}
  }

  function autoExpandAccordions() {
    // 1) Acordeões inline acessíveis — padrões que NUNCA navegam
    const kw = ['composição','composition','material','materiais','fabric','tecido','cuidados','care','origem','origin','detalhes','details','product details','product information','about this product','sobre o produto','informações do produto'];
    document.querySelectorAll('[aria-expanded="false"],details:not([open]) > summary').forEach(el => {
      if (el.tagName === 'A' || el.closest('a[href]')) return;
      const txt = (el.textContent || el.getAttribute('aria-label') || '').trim().toLowerCase();
      if (!txt || txt.length > 60) return;
      if (!kw.some(k => txt.includes(k))) return;
      try { el.click(); } catch(e) {}
    });

    // 2) Gatilho de composição (modal OU acordeão) — ex: Reserved (modal),
    // Mango (acordeão). Keywords ESTRITAS: só frases específicas de composição,
    // que NUNCA são botões de navegação (ao contrário de "detalhes"/"material").
    // Por serem estritas, podemos alargar a TODOS os elementos clicáveis sem
    // risco de mudar de página — incluindo div/span/li/headings.
    // Já existe um modal/secção de composição aberto? Não voltar a clicar (evita
    // toggle que fecharia). NB: offsetParent é null em elementos position:fixed —
    // usar getClientRects() para saber se está mesmo visível.
    const isVisible = el => el && el.getClientRects().length > 0;
    const compAlreadyOpen = [...document.querySelectorAll('[role="dialog"],dialog')]
      .some(d => isVisible(d) && /composi[çc]|\d{1,3}\s*%\s*(algod|poli|linho|viscose|elast|nylon|seda|modal|lyocell)/i.test(d.textContent || ''));

    // Re-tenta o clique até 4 vezes (páginas lentas: o 1º clique aos 50ms pode
    // falhar antes da página estar pronta). Pára quando o modal abre.
    if (!compAlreadyOpen && compClickAttempts < 4) {
      // Match seguro: o texto CONTÉM "composi"/"composición" (composição/
      // composition — sempre indica composição, nunca é botão de navegação),
      // ex: Mango "Pormenores, composição e cuidados a ter". OU bate exato numa
      // frase de "material e cuidados" (Reserved), que sem "composi" precisa de
      // match exacto para não apanhar navegação tipo "material" isolado.
      const exact = ['material e cuidados','materiais e cuidados','material e cuidado','material & care','material and care'];
      const matches = txt => /composi(?:ção|tion|ción)/.test(txt) || exact.includes(txt);
      const cand = [];
      document.querySelectorAll('button,[role="button"],[role="tab"],summary,div,span,li,h2,h3,h4,p,[class*="omposition"],[class*="CompositionTitle"]').forEach(el => {
        if (el.tagName === 'A' || el.closest('a[href]')) return;    // nunca links
        if (el.children.length > 2) return;                         // só cabeçalhos
        if (!isVisible(el)) return;                                 // ignora escondidos
        let txt = (el.textContent || el.getAttribute('aria-label') || '').trim().toLowerCase().replace(/[:.\s]+$/, '');
        if (!txt || txt.length > 55 || !matches(txt)) return;
        cand.push(el);
      });
      // Prioriza controlos realmente clicáveis (button/role=button/summary) sobre
      // divs/spans — em document-order o gatilho real pode não ser o primeiro.
      const clickable = el => el.tagName === 'BUTTON' || el.getAttribute('role') === 'button' ||
                              el.tagName === 'SUMMARY' || el.closest('button,[role="button"],summary');
      cand.sort((a, b) => (clickable(b) ? 1 : 0) - (clickable(a) ? 1 : 0));
      const el = cand[0];
      if (el) {
        robustClick(el);
        const parent = el.closest('button,[role="button"],summary,[onclick],[class*="ccordion"],[class*="ollaps"],[class*="xpand"]');
        if (parent && parent !== el && parent.tagName !== 'A' && !parent.closest('a[href]')) robustClick(parent);
        openedCompositionModal = true;   // marca que TENTÁMOS abrir (p/ fechar depois)
        compClickAttempts++;
      }
    }
  }

  // Fecha o modal de composição que nós abrimos (não deixa o utilizador preso nele)
  function closeCompositionModal() {
    if (!openedCompositionModal) return;
    openedCompositionModal = false;
    const isVisible = el => el && el.getClientRects().length > 0;
    // Há lojas (Mango) com vários dialogs pré-renderizados escondidos — só os
    // VISÍVEIS e com composição interessam. Clica em todos os controlos de fecho.
    const dialogs = [...document.querySelectorAll('[role="dialog"],dialog')].filter(d =>
      isVisible(d) && (/composi[çc]/i.test(d.textContent || '') ||
                       /\d{1,3}\s*%\s*(algod|poli|linho|viscose|elast|lã|nylon|seda|modal|lyocell)/i.test(d.textContent || '')));
    dialogs.forEach(modal => {
      // O botão de fechar pode ser <button>, um aria-label, OU um <div class="...close...">.
      // Preferir controlos ESPECÍFICOS de fecho; só usar <button> genérico se não
      // houver nenhum (evita clicar em abas tipo "Envios" dentro do modal).
      const specific = modal.querySelectorAll('[aria-label*="echar" i],[aria-label*="close" i],[class*="close" i],[class*="fechar" i],[class*="Close"]');
      const targets = specific.length ? specific : modal.querySelectorAll('button');
      targets.forEach(c => { if (isVisible(c)) robustClick(c); });
    });
    // Recurso: tecla Escape fecha a maioria dos modais acessíveis
    try {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, which: 27, bubbles: true }));
    } catch(e) {}
  }

  function extractAllText() {
    // Alvo prioritário: lista de composição explícita (ex: Reserved usa
    // classes "compositionstyled__CompositionList"). Se existir e tiver %,
    // é a fonte mais fiável — usa-a directamente.
    const compEl = document.querySelector('[class*="ompositionList"],[class*="omposition-list"],[class*="ompositionText"]');
    if (compEl) {
      const root = compEl.closest('ul,[class*="ompositionList"]') || compEl;
      const compText = (root.textContent || '').trim();
      if (/\d{1,3}\s*%\s*[a-zà-öø-ÿ]/i.test(compText)) return compText;
    }

    // Remove zonas de ruído (produtos relacionados, recomendações, rodapé)
    // que contêm composições de OUTRAS peças
    const noiseSelectors = [
      '[class*="related"]','[class*="recommend"]','[class*="suggestion"]',
      '[class*="you-may"]','[class*="also-like"]','[class*="carousel"]',
      '[class*="slider"]','[class*="cross-sell"]','[class*="upsell"]',
      '[id*="related"]','[id*="recommend"]','footer','nav',
      '[class*="complete-the-look"]','[class*="combine"]','[class*="outfit"]'
    ];
    const noiseNodes = new Set();
    noiseSelectors.forEach(sel => {
      try { document.querySelectorAll(sel).forEach(n => noiseNodes.add(n)); } catch(e) {}
    });
    const inNoise = el => {
      for (const n of noiseNodes) { if (n.contains(el)) return true; }
      return false;
    };

    // Tenta primeiro extrair só a zona de composição (perto do marcador)
    const compZone = findCompositionZone();
    if (compZone) return compZone;

    // Fallback: texto da página mas sem as zonas de ruído, e sem duplicar aninhados
    let text = '';
    document.querySelectorAll('p,li,span,div,td,dd,dt').forEach(el => {
      if (el.children.length > 0) return;       // só folhas, evita duplicar aninhados
      if (inNoise(el)) return;                   // ignora produtos relacionados
      const t = (el.textContent || '').trim();
      if (t.length > 1 && t.length < 400) text += '\n' + t;
    });
    // Deteta composição REAL: "% fibra" ou "fibra %" — não descontos tipo "-46%"
    // nem "50% de desconto" (Mango). Exclui palavras de desconto/poupança.
    // (o leaf-scan ignora <p> com filhos, onde lojas como Pull&Bear metem a descrição)
    // `[^\S\n]` = espaço mas NÃO quebra de linha — impede casar "50%\nSelecione"
    // (desconto numa linha + palavra na seguinte) como se fosse composição.
    const NOT_FIBER = /^(desconto|desc|discount|off|rebaix|reduc|poupan|save|menos|extra|ate|até|mais|desde|apenas|only|gratis|grátis|selecion|select|tamanho|size)/i;
    const hasComposition = s => {
      const re = /\d{1,3}[.,]?\d*[^\S\n]*%[^\S\n]*(?:de[^\S\n]+)?([a-zà-öø-ÿ]{3,})/gi;
      let m;
      while ((m = re.exec(s)) !== null) { if (!NOT_FIBER.test(m[1])) return true; }
      const re2 = /([a-zà-öø-ÿ]{3,})[^\S\n]+\d{1,3}[.,]?\d*[^\S\n]*%/gi;
      while ((m = re2.exec(s)) !== null) { if (!NOT_FIBER.test(m[1])) return true; }
      return /\bmain\s*:/i.test(s);
    };

    // Último recurso: se o leaf-scan não apanhou composição, usa innerText completo
    if (!hasComposition(text)) {
      const bodyText = (document.body.innerText || '').trim();
      if (hasComposition(bodyText)) return bodyText;
    }
    return text;
  }

  // Procura a zona de composição: o bloco de texto à volta de um marcador
  function findCompositionZone() {
    const markers = ['composição','composition','composição e cuidados','materiais','material','fabric','tecido','product details','product information','about me','details & care','fabric & care'];
    const all = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,dt,th,strong,b,p,span,div'));
    for (const el of all) {
      const txt = (el.textContent || '').trim().toLowerCase();
      if (txt.length < 40 && markers.some(mk => txt === mk || txt.startsWith(mk))) {
        // Encontrou um cabeçalho de composição — apanha o texto à volta
        let zone = '';
        let node = el;
        // Texto do próprio container e dos próximos irmãos
        const container = el.closest('section,div,article,dl,ul') || el.parentElement;
        if (container) {
          zone = (container.textContent || '').trim();
          if (zone.length > 30 && zone.length < 2500 && /\d+\s*%|%\s*\d+|algod|cotton|poli|polyester|elasta|elastane|lyocell|lã|wool|linho|linen|viscose|couro|pele|leather|nylon|silk|seda/i.test(zone)) {
            return zone;
          }
        }
      }
    }
    return null;
  }

  let scanDone = false;

  function tryScan() {
    if (scanDone) return;
    autoExpandAccordions();
    const text    = extractAllText();
    const url     = location.href;
    const title   = document.title || '';
    const h1      = document.querySelector('h1')?.textContent || '';
    const category = typeof detectCategory === 'function' ? detectCategory(text.slice(0, 3000), url, title) : 'clothing';
    const sections = splitIntoSections(text);
    const primary  = findPrimarySection(sections, category);
    if (primary?.fibers?.length) {
      closeCompositionModal(); injectCard({ ...primary, category }); scanDone = true; return;
    }
    // Fallback: parse full text
    const full = parseComposition(text, category);
    if (full.length) { closeCompositionModal(); injectCard({ label: 'principal', text, fibers: full, category }); scanDone = true; }
  }

  // ─── Card injection ---

  function setBadge(text, color) {
    try { chrome.runtime.sendMessage({ action: 'setBadge', text, color }); } catch(e) {}
  }

  function removeCard() {
    const el = document.getElementById('__fqa-card');
    if (el) {
      el.remove();
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.remove('fqa-last-result');
      }
    }
  }

  function injectCard(section) {
    const category = section.category || 'clothing';
    const catInfo = (typeof CATEGORY_SIGNALS !== 'undefined' && CATEGORY_SIGNALS[category])
      ? CATEGORY_SIGNALS[category] : { label: 'Peça', icon: '👗' };
    // Remove o card de loading antes de mostrar o resultado
    const existing = document.getElementById('__fqa-card');
    if (existing && !existing.querySelector('.__fqa-spin')) return;
    if (existing) existing.remove();
    const fibers = section.fibers;
    const fullPageText = extractAllText();
    // Certificações podem estar numa secção separada ("Materiais Certificados")
    // fora da zona de composição — passa o texto completo da página só para detetá-las
    const certText = (document.body.innerText || '') + ' ' + fullPageText;
    // titleText: só o título do produto + campo de cor — para deteção de padrão/estampado
    // sem ser contaminado por boilerplates da composição (ex: H&M "ornamentos e estampados")
    const h1 = document.querySelector('h1')?.textContent || '';
    const colorEl = document.querySelector('[class*="color"],[class*="colour"],[class*="cor"],[data-testid*="color"]');
    const titleText = (h1 + ' ' + (colorEl?.textContent || '') + ' ' + (document.title || '')).trim();
    const scores = calcScores(fibers, fullPageText, certText, titleText);
    const v = verdict(scores);
    const total = fibers.reduce((acc,f)=>acc+(f.pct||0),0);
    const mismatch = '';

    const card = document.createElement('div');
    card.id = '__fqa-card';
    card.style.cssText = 'all:initial;position:fixed;bottom:20px;right:20px;z-index:2147483647;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#FAFAF8;border:1px solid #E0DBD4;border-radius:14px;box-shadow:0 4px 28px rgba(0,0,0,0.13);width:280px;overflow:hidden;';

    // Buy Score: o score principal, com pesos do tipo de peça
    const garmentType = section.garmentType || (scores.isKnit ? 'malha' : category);
    const buy = typeof buyScore === 'function' ? buyScore(scores, garmentType) : (scores?.overall || 0);
    const warmth = typeof warmthScore === 'function' ? warmthScore(scores.fibers || fibers) : null;
    const warmthInfo = (typeof warmthLabel === 'function' && warmth != null) ? warmthLabel(warmth) : null;
    // Só mostra calor em peças de inverno (calor médio+) — não polui roupa de verão
    const showWarmth = warmthInfo && warmth >= 45;
    const bv = typeof buyVerdict === 'function' ? buyVerdict(buy) : { emoji:'', label:v.label, color:v.color, bg:'#f5f5f5' };

    // Guardar no histórico e resultado atual partilhado com o popup
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      const entry = { fibers, score: scores?.overall || 0, grade: v.label, date: new Date().toLocaleDateString('pt-BR') };
      chrome.storage.local.get('fqa-history', data => {
        const h = data['fqa-history'] || [];
        h.unshift(entry);
        chrome.storage.local.set({ 'fqa-history': h.slice(0, 20) });
      });
      // Guardar resultado atual por URL para o popup mostrar directamente
      chrome.storage.local.set({ 'fqa-last-result': { url: location.href, fibers, scores, buyScore: buy, verdictLabel: bv.label, verdictColor: bv.color } });
    }

    card.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@1&display=swap');
        #__fqa-card * { box-sizing:border-box; }
        #__fqa-card .lm-verdict { font-family:'DM Serif Display',Georgia,serif; font-style:italic; font-size:26px; line-height:1.1; letter-spacing:-0.01em; font-weight:400; display:block; margin-bottom:5px; }
        #__fqa-card .lm-score-sub { display:flex; align-items:baseline; gap:5px; }
        #__fqa-card .lm-score-big { font-family:'DM Serif Display',Georgia,serif; font-style:italic; font-size:22px; font-weight:400; line-height:1; }
      </style>

      <div style="padding:14px 16px 0;display:flex;justify-content:space-between;align-items:center;">
        <svg role="img" width="74" height="23" viewBox="0 0 317 98" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;" aria-label="LookPilot"><path d="M29.6 22.18H33.8V73H29.6V22.18ZM59.6809 73.7C56.3675 73.7 53.4042 72.93 50.7909 71.39C48.2242 69.85 46.2175 67.7033 44.7709 64.95C43.3242 62.1967 42.6009 59.07 42.6009 55.57C42.6009 52.07 43.3242 48.9433 44.7709 46.19C46.2642 43.39 48.2942 41.22 50.8609 39.68C53.4742 38.0933 56.4375 37.3 59.7509 37.3C63.0175 37.3 65.9342 38.0933 68.5009 39.68C71.1142 41.22 73.1442 43.3667 74.5909 46.12C76.0842 48.8733 76.8309 52 76.8309 55.5C76.8309 59 76.0842 62.1267 74.5909 64.88C73.1442 67.6333 71.1142 69.8033 68.5009 71.39C65.9342 72.93 62.9942 73.7 59.6809 73.7ZM59.7509 69.92C63.6242 69.92 66.7275 68.59 69.0609 65.93C71.4409 63.27 72.6309 59.7933 72.6309 55.5C72.6309 52.6533 72.0942 50.1567 71.0209 48.01C69.9475 45.8167 68.4309 44.1133 66.4709 42.9C64.5109 41.6867 62.2709 41.08 59.7509 41.08C57.1842 41.08 54.9209 41.6867 52.9609 42.9C51.0009 44.1133 49.4842 45.84 48.4109 48.08C47.3375 50.2733 46.8009 52.77 46.8009 55.57C46.8009 58.37 47.3375 60.8667 48.4109 63.06C49.4842 65.2067 51.0009 66.8867 52.9609 68.1C54.9209 69.3133 57.1842 69.92 59.7509 69.92ZM100.355 73.7C97.0414 73.7 94.078 72.93 91.4647 71.39C88.898 69.85 86.8914 67.7033 85.4447 64.95C83.998 62.1967 83.2747 59.07 83.2747 55.57C83.2747 52.07 83.998 48.9433 85.4447 46.19C86.938 43.39 88.968 41.22 91.5347 39.68C94.148 38.0933 97.1114 37.3 100.425 37.3C103.691 37.3 106.608 38.0933 109.175 39.68C111.788 41.22 113.818 43.3667 115.265 46.12C116.758 48.8733 117.505 52 117.505 55.5C117.505 59 116.758 62.1267 115.265 64.88C113.818 67.6333 111.788 69.8033 109.175 71.39C106.608 72.93 103.668 73.7 100.355 73.7ZM100.425 69.92C104.298 69.92 107.401 68.59 109.735 65.93C112.115 63.27 113.305 59.7933 113.305 55.5C113.305 52.6533 112.768 50.1567 111.695 48.01C110.621 45.8167 109.105 44.1133 107.145 42.9C105.185 41.6867 102.945 41.08 100.425 41.08C97.858 41.08 95.5947 41.6867 93.6347 42.9C91.6747 44.1133 90.158 45.84 89.0847 48.08C88.0114 50.2733 87.4747 52.77 87.4747 55.57C87.4747 58.37 88.0114 60.8667 89.0847 63.06C90.158 65.2067 91.6747 66.8867 93.6347 68.1C95.5947 69.3133 97.858 69.92 100.425 69.92ZM154.889 73H150.269L138.719 57.25C138.205 56.6433 137.482 56.2 136.549 55.92C135.615 55.64 134.635 55.5 133.609 55.5H130.529V73H126.329V22.18H130.529V51.72H133.049C134.682 51.72 135.965 51.6733 136.899 51.58C137.879 51.4867 138.742 51.2533 139.489 50.88C141.075 50.0867 142.452 48.8033 143.619 47.03C144.832 45.21 145.742 43.39 146.349 41.57C147.002 39.7033 147.329 38.42 147.329 37.72H151.179C151.132 39.3067 150.549 41.3367 149.429 43.81C148.355 46.2367 147.049 48.4533 145.509 50.46C143.969 52.4667 142.545 53.68 141.239 54.1L154.889 73Z" fill="black"/><path d="M176.514 37.02C179.78 37.02 182.557 37.8367 184.844 39.47C187.177 41.1033 188.927 43.2967 190.094 46.05C191.307 48.7567 191.914 51.7433 191.914 55.01C191.914 58.6033 191.214 61.8233 189.814 64.67C188.46 67.47 186.454 69.6867 183.794 71.32C181.18 72.9067 178.1 73.7 174.554 73.7C173.154 73.7 170.774 73.49 167.414 73.07V91.2H161.884V48.5C161.884 44.86 160.904 42.2 158.944 40.52L162.794 36.95C163.494 37.37 164.194 38 164.894 38.84C165.594 39.6333 166.177 40.5667 166.644 41.64C167.764 40.24 169.234 39.12 171.054 38.28C172.874 37.44 174.694 37.02 176.514 37.02ZM174.204 68.52C178.124 68.52 181.087 67.33 183.094 64.95C185.147 62.57 186.174 59.3967 186.174 55.43C186.174 51.6967 185.31 48.57 183.584 46.05C181.857 43.4833 179.547 42.2 176.654 42.2C174.367 42.2 172.29 42.9467 170.424 44.44C168.604 45.8867 167.6 47.7533 167.414 50.04V68.1C170.214 68.38 172.477 68.52 174.204 68.52ZM200.083 37.93L205.823 38V73.07L200.083 73V37.93ZM202.813 31.14C201.88 31.14 201.04 30.7667 200.293 30.02C199.547 29.2733 199.173 28.4333 199.173 27.5C199.173 26.52 199.547 25.6567 200.293 24.91C201.04 24.1633 201.88 23.79 202.813 23.79C203.793 23.79 204.657 24.1633 205.403 24.91C206.197 25.6567 206.593 26.52 206.593 27.5C206.593 28.4333 206.197 29.2733 205.403 30.02C204.657 30.7667 203.793 31.14 202.813 31.14ZM216.696 22.11H222.296V73.07H216.696V22.11ZM247.799 73.7C244.486 73.7 241.499 72.9067 238.839 71.32C236.226 69.7333 234.173 67.5633 232.679 64.81C231.186 62.01 230.439 58.86 230.439 55.36C230.439 51.86 231.186 48.71 232.679 45.91C234.219 43.0633 236.296 40.8467 238.909 39.26C241.569 37.6267 244.556 36.81 247.869 36.81C251.183 36.81 254.146 37.6033 256.759 39.19C259.419 40.7767 261.496 42.9933 262.989 45.84C264.483 48.64 265.229 51.79 265.229 55.29C265.229 58.79 264.483 61.94 262.989 64.74C261.496 67.54 259.419 69.7333 256.759 71.32C254.099 72.9067 251.113 73.7 247.799 73.7ZM247.869 68.52C251.369 68.52 254.169 67.3067 256.269 64.88C258.416 62.4533 259.489 59.2567 259.489 55.29C259.489 51.2767 258.416 48.0567 256.269 45.63C254.169 43.2033 251.369 41.99 247.869 41.99C245.583 41.99 243.553 42.55 241.779 43.67C240.006 44.79 238.629 46.3533 237.649 48.36C236.669 50.3667 236.179 52.6767 236.179 55.29C236.179 59.2567 237.253 62.4533 239.399 64.88C241.546 67.3067 244.369 68.52 247.869 68.52ZM283.306 73.98C279.946 73.98 277.333 73 275.466 71.04C273.6 69.0333 272.666 66.1633 272.666 62.43V28.97H278.406V37.51H289.186V42.69H278.406V62.43C278.406 64.7167 278.873 66.3033 279.806 67.19C280.786 68.0767 281.93 68.52 283.236 68.52C284.17 68.52 284.916 68.4267 285.476 68.24C286.083 68.0533 286.876 67.7033 287.856 67.19L290.516 71.88C288.65 73.28 286.246 73.98 283.306 73.98Z" fill="#FF009D"/></svg>
        <button id="__fqa-close" aria-label="Fechar" style="all:initial;cursor:pointer;color:#8A8078;font-size:20px;line-height:1;padding:0 2px;">×</button>
      </div>

      <div style="padding:10px 16px 14px;">
        <span class="lm-verdict" style="color:${bv.color};">${bv.label}</span>
        <div class="lm-score-sub">
          <span class="lm-score-big" style="color:${bv.color};">${buy}</span>
          <span style="font-size:12px;color:#8A8078;font-weight:300;">/100</span>
          <span style="font-size:10px;color:#8A8078;letter-spacing:0.06em;text-transform:uppercase;margin-left:2px;">buy score</span>
        </div>
      </div>

      <div style="height:1px;background:#E0DBD4;"></div>

      <div style="padding:12px 14px;">
        ${mismatch}

        <div style="font-size:11px;color:#6B6460;line-height:1.5;margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid #f0f0f0;">
          ${(category === 'shoes' || category === 'bags') && typeof getCategoryConclusion === 'function' ? getCategoryConclusion(scores, category, (scores.fibers||fibers)[0]?.data?.label || (scores.fibers||fibers)[0]?.name) : conclusionText(scores, scores.fibers || [...fibers])}
        </div>

        ${scores.qualityModifier ? `
        <div style="font-size:11px;color:#7a5c00;line-height:1.5;margin-bottom:10px;padding:8px 10px;background:#fdf6e3;border-radius:8px;">
          <span style="font-weight:600;">⭐ ${scores.qualityModifier.nome}:</span> ${scores.qualityModifier.explica}
        </div>` : ''}

        ${typeof blendText === 'function' && blendText(scores.fibers || fibers) ? `
        <div style="font-size:11px;color:#6b5b95;line-height:1.5;margin-bottom:10px;padding:8px 10px;background:#f5f3fa;border-radius:8px;">
          <span style="font-weight:600;">A mistura:</span> ${blendText(scores.fibers || fibers)}
        </div>` : ''}

        ${scores.certs && scores.certs.length ? `
        <div style="font-size:11px;color:#0F6E56;line-height:1.5;margin-bottom:10px;padding:8px 10px;background:#E1F5EE;border-radius:8px;">
          ✓ Certificação ${scores.certs.join(', ')} — origem verificada
        </div>` : ''}

        ${showWarmth ? `
        <div style="background:#FFF4ED;border-radius:8px;padding:9px 11px;margin-bottom:10px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px;">
            <span style="font-size:11px;font-weight:600;color:#9A3412;">🔥 Calor: ${warmthInfo.label}</span>
            <span style="font-size:10px;color:#C2683A;">${toTen(warmth)}/10</span>
          </div>
          <div style="height:5px;background:#F3D9C8;border-radius:3px;overflow:hidden;">
            <div style="height:100%;width:${warmth}%;background:linear-gradient(90deg,#F59E0B,#DC2626);border-radius:3px;"></div>
          </div>
          <div style="font-size:11px;color:#B45309;line-height:1.5;margin-top:5px;">${warmthInfo.txt}.</div>
        </div>` : ''}

        ${scores.travel >= 72 ? `
        <div style="background:#f8f4ff;border-radius:8px;padding:9px 11px;margin-bottom:10px;">
          <div style="font-size:11px;font-weight:600;color:#6b21a8;margin-bottom:3px;">✈️ Travel Score: ${toTen(scores.travel)}/10</div>
          <div style="font-size:11px;color:#7e22ce;line-height:1.5;">${travelText(scores, scores.fibers || fibers)}</div>
        </div>` : `
        <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#9a8fb0;margin-bottom:10px;padding:0 2px;">
          <span>✈️ Viagem: ${toTen(scores.travel)}/10</span>
          <span style="color:#C9C2D6;">·</span>
          <span style="color:#8a8194;">${travelText(scores, scores.fibers || fibers)}</span>
        </div>`}

        <div style="display:flex;gap:8px;margin-bottom:10px;">
          <button id="__fqa-share" style="display:flex;align-items:center;justify-content:center;gap:5px;font-size:11px;font-weight:600;color:#fff;background:#FF009D;border:none;cursor:pointer;padding:9px 12px;border-radius:8px;letter-spacing:0.02em;font-family:inherit;white-space:nowrap;">
            <span>📷</span> ${t('card_share')}
          </button>
          <a href="${buildAnaliseURL(scores, fibers, buy, bv.label, location.href)}" target="_blank" style="flex:1;display:flex;align-items:center;justify-content:center;gap:4px;font-size:11px;font-weight:600;color:#FF009D;text-decoration:none;background:none;border:1px solid #FF009D;padding:9px;border-radius:8px;letter-spacing:0.02em;white-space:nowrap;">
            Ver análise completa →
          </a>
        </div>

        <div style="font-size:10px;color:#ccc;text-align:center;border-top:1px solid #f5f5f5;padding-top:8px;">
          LookPilot
        </div>
      </div>
    `;

    document.body.appendChild(card);
    avoidCartButton(card);
    card.querySelector('#__fqa-close').addEventListener('click', () => { removeCard(); setBadge('','#FF1493'); });
    const shareBtn = card.querySelector('#__fqa-share');
    if (shareBtn) shareBtn.addEventListener('click', () => generateShareCard(scores, fibers, buy, v, catInfo, warmth, warmthInfo, showWarmth));
    setBadge('✓', '#16a34a');
  }

  // Reposiciona o card se sobrepuser o botão de compra da loja
  function avoidCartButton(card) {
    const cartSelectors = [
      'button[class*="add-to-cart"]','button[class*="addtocart"]','button[class*="add_to_cart"]',
      'button[class*="add-to-bag"]','button[class*="addtobag"]',
      'button[class*="add-to-basket"]','button[class*="addtobasket"]',
      'button[id*="add-to-cart"]','button[id*="addtocart"]',
      'button[id*="add-to-bag"]','button[id*="add-to-basket"]',
      '[data-testid*="add-to-cart"]','[data-testid*="addtocart"]',
      '[data-testid*="add-to-bag"]','[data-testid*="add-to-basket"]',
      // Zara, Mango, H&M, ASOS, Uniqlo específicos
      '.add-to-cart-btn','#add-to-cart','.AddToCart','#AddToCart',
      '.product-form__submit','[name="add"]',
    ];

    const cartBtn = cartSelectors.reduce((found, sel) => {
      if (found) return found;
      try { return document.querySelector(sel); } catch(e) { return null; }
    }, null);

    if (!cartBtn) return;

    const btnRect  = cartBtn.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();

    // Verifica sobreposição real (o card está fixo no canto inferior direito)
    const overlaps =
      btnRect.right  > cardRect.left - 16 &&
      btnRect.left   < cardRect.right + 16 &&
      btnRect.bottom > cardRect.top  - 16 &&
      btnRect.top    < cardRect.bottom + 16;

    if (!overlaps) return;

    // Tenta mover para o canto superior direito
    const topPos = Math.max(20, btnRect.top - cardRect.height - 24);
    card.style.bottom = 'auto';
    card.style.top    = topPos + 'px';

    // Se ainda sobrepuser (botão muito alto), move para a esquerda
    const newCardRect = card.getBoundingClientRect();
    const stillOverlaps =
      btnRect.right  > newCardRect.left - 16 &&
      btnRect.left   < newCardRect.right + 16 &&
      btnRect.bottom > newCardRect.top   - 16 &&
      btnRect.top    < newCardRect.bottom + 16;

    if (stillOverlaps) {
      card.style.top   = 'auto';
      card.style.bottom = '20px';
      card.style.right  = 'auto';
      card.style.left   = '20px';
    }
  }

  function showScanningCard() {
    removeCard();
    const card = document.createElement('div');
    card.id = '__fqa-card';
    card.style.cssText = 'all:initial;position:fixed;bottom:20px;right:20px;z-index:2147483647;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#FAFAF8;border:1px solid #E0DBD4;border-radius:14px;box-shadow:0 4px 28px rgba(0,0,0,0.13);width:280px;overflow:hidden;';
    card.innerHTML = `
      <style>
        @keyframes __fqa-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.85)} }
        #__fqa-card .__fqa-spin { animation: __fqa-pulse 1.4s ease-in-out infinite; }
      </style>
      <div style="padding:14px 16px 0;display:flex;justify-content:space-between;align-items:center;">
        <svg role="img" width="65" height="20" viewBox="0 0 317 98" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="LookPilot"><path d="M29.6 22.18H33.8V73H29.6V22.18ZM59.6809 73.7C56.3675 73.7 53.4042 72.93 50.7909 71.39C48.2242 69.85 46.2175 67.7033 44.7709 64.95C43.3242 62.1967 42.6009 59.07 42.6009 55.57C42.6009 52.07 43.3242 48.9433 44.7709 46.19C46.2642 43.39 48.2942 41.22 50.8609 39.68C53.4742 38.0933 56.4375 37.3 59.7509 37.3C63.0175 37.3 65.9342 38.0933 68.5009 39.68C71.1142 41.22 73.1442 43.3667 74.5909 46.12C76.0842 48.8733 76.8309 52 76.8309 55.5C76.8309 59 76.0842 62.1267 74.5909 64.88C73.1442 67.6333 71.1142 69.8033 68.5009 71.39C65.9342 72.93 62.9942 73.7 59.6809 73.7ZM59.7509 69.92C63.6242 69.92 66.7275 68.59 69.0609 65.93C71.4409 63.27 72.6309 59.7933 72.6309 55.5C72.6309 52.6533 72.0942 50.1567 71.0209 48.01C69.9475 45.8167 68.4309 44.1133 66.4709 42.9C64.5109 41.6867 62.2709 41.08 59.7509 41.08C57.1842 41.08 54.9209 41.6867 52.9609 42.9C51.0009 44.1133 49.4842 45.84 48.4109 48.08C47.3375 50.2733 46.8009 52.77 46.8009 55.57C46.8009 58.37 47.3375 60.8667 48.4109 63.06C49.4842 65.2067 51.0009 66.8867 52.9609 68.1C54.9209 69.3133 57.1842 69.92 59.7509 69.92ZM100.355 73.7C97.0414 73.7 94.078 72.93 91.4647 71.39C88.898 69.85 86.8914 67.7033 85.4447 64.95C83.998 62.1967 83.2747 59.07 83.2747 55.57C83.2747 52.07 83.998 48.9433 85.4447 46.19C86.938 43.39 88.968 41.22 91.5347 39.68C94.148 38.0933 97.1114 37.3 100.425 37.3C103.691 37.3 106.608 38.0933 109.175 39.68C111.788 41.22 113.818 43.3667 115.265 46.12C116.758 48.8733 117.505 52 117.505 55.5C117.505 59 116.758 62.1267 115.265 64.88C113.818 67.6333 111.788 69.8033 109.175 71.39C106.608 72.93 103.668 73.7 100.355 73.7ZM100.425 69.92C104.298 69.92 107.401 68.59 109.735 65.93C112.115 63.27 113.305 59.7933 113.305 55.5C113.305 52.6533 112.768 50.1567 111.695 48.01C110.621 45.8167 109.105 44.1133 107.145 42.9C105.185 41.6867 102.945 41.08 100.425 41.08C97.858 41.08 95.5947 41.6867 93.6347 42.9C91.6747 44.1133 90.158 45.84 89.0847 48.08C88.0114 50.2733 87.4747 52.77 87.4747 55.57C87.4747 58.37 88.0114 60.8667 89.0847 63.06C90.158 65.2067 91.6747 66.8867 93.6347 68.1C95.5947 69.3133 97.858 69.92 100.425 69.92ZM154.889 73H150.269L138.719 57.25C138.205 56.6433 137.482 56.2 136.549 55.92C135.615 55.64 134.635 55.5 133.609 55.5H130.529V73H126.329V22.18H130.529V51.72H133.049C134.682 51.72 135.965 51.6733 136.899 51.58C137.879 51.4867 138.742 51.2533 139.489 50.88C141.075 50.0867 142.452 48.8033 143.619 47.03C144.832 45.21 145.742 43.39 146.349 41.57C147.002 39.7033 147.329 38.42 147.329 37.72H151.179C151.132 39.3067 150.549 41.3367 149.429 43.81C148.355 46.2367 147.049 48.4533 145.509 50.46C143.969 52.4667 142.545 53.68 141.239 54.1L154.889 73Z" fill="black"/><path d="M176.514 37.02C179.78 37.02 182.557 37.8367 184.844 39.47C187.177 41.1033 188.927 43.2967 190.094 46.05C191.307 48.7567 191.914 51.7433 191.914 55.01C191.914 58.6033 191.214 61.8233 189.814 64.67C188.46 67.47 186.454 69.6867 183.794 71.32C181.18 72.9067 178.1 73.7 174.554 73.7C173.154 73.7 170.774 73.49 167.414 73.07V91.2H161.884V48.5C161.884 44.86 160.904 42.2 158.944 40.52L162.794 36.95C163.494 37.37 164.194 38 164.894 38.84C165.594 39.6333 166.177 40.5667 166.644 41.64C167.764 40.24 169.234 39.12 171.054 38.28C172.874 37.44 174.694 37.02 176.514 37.02ZM174.204 68.52C178.124 68.52 181.087 67.33 183.094 64.95C185.147 62.57 186.174 59.3967 186.174 55.43C186.174 51.6967 185.31 48.57 183.584 46.05C181.857 43.4833 179.547 42.2 176.654 42.2C174.367 42.2 172.29 42.9467 170.424 44.44C168.604 45.8867 167.6 47.7533 167.414 50.04V68.1C170.214 68.38 172.477 68.52 174.204 68.52ZM200.083 37.93L205.823 38V73.07L200.083 73V37.93ZM202.813 31.14C201.88 31.14 201.04 30.7667 200.293 30.02C199.547 29.2733 199.173 28.4333 199.173 27.5C199.173 26.52 199.547 25.6567 200.293 24.91C201.04 24.1633 201.88 23.79 202.813 23.79C203.793 23.79 204.657 24.1633 205.403 24.91C206.197 25.6567 206.593 26.52 206.593 27.5C206.593 28.4333 206.197 29.2733 205.403 30.02C204.657 30.7667 203.793 31.14 202.813 31.14ZM216.696 22.11H222.296V73.07H216.696V22.11ZM247.799 73.7C244.486 73.7 241.499 72.9067 238.839 71.32C236.226 69.7333 234.173 67.5633 232.679 64.81C231.186 62.01 230.439 58.86 230.439 55.36C230.439 51.86 231.186 48.71 232.679 45.91C234.219 43.0633 236.296 40.8467 238.909 39.26C241.569 37.6267 244.556 36.81 247.869 36.81C251.183 36.81 254.146 37.6033 256.759 39.19C259.419 40.7767 261.496 42.9933 262.989 45.84C264.483 48.64 265.229 51.79 265.229 55.29C265.229 58.79 264.483 61.94 262.989 64.74C261.496 67.54 259.419 69.7333 256.759 71.32C254.099 72.9067 251.113 73.7 247.799 73.7ZM247.869 68.52C251.369 68.52 254.169 67.3067 256.269 64.88C258.416 62.4533 259.489 59.2567 259.489 55.29C259.489 51.2767 258.416 48.0567 256.269 45.63C254.169 43.2033 251.369 41.99 247.869 41.99C245.583 41.99 243.553 42.55 241.779 43.67C240.006 44.79 238.629 46.3533 237.649 48.36C236.669 50.3667 236.179 52.6767 236.179 55.29C236.179 59.2567 237.253 62.4533 239.399 64.88C241.546 67.3067 244.369 68.52 247.869 68.52ZM283.306 73.98C279.946 73.98 277.333 73 275.466 71.04C273.6 69.0333 272.666 66.1633 272.666 62.43V28.97H278.406V37.51H289.186V42.69H278.406V62.43C278.406 64.7167 278.873 66.3033 279.806 67.19C280.786 68.0767 281.93 68.52 283.236 68.52C284.17 68.52 284.916 68.4267 285.476 68.24C286.083 68.0533 286.876 67.7033 287.856 67.19L290.516 71.88C288.65 73.28 286.246 73.98 283.306 73.98Z" fill="#FF009D"/></svg>
        <button id="__fqa-close" aria-label="Fechar" style="all:initial;cursor:pointer;color:#8A8078;font-size:20px;line-height:1;padding:0 2px;">×</button>
      </div>
      <div style="padding:20px 16px 22px;text-align:center;">
        <svg class="__fqa-spin" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FF009D" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="display:block;margin:0 auto 10px;">
          <path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/>
          <path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
          <rect x="7" y="7" width="10" height="10" rx="1"/>
        </svg>
        <div style="font-size:12px;color:#6B6460;">${t('scanning')}</div>
      </div>
    `;
    document.body.appendChild(card);
    card.querySelector('#__fqa-close').addEventListener('click', removeCard);
    setBadge('…', '#FF009D');
  }

  function injectEmptyCard() {
    const existing = document.getElementById('__fqa-card');
    if (existing && !existing.querySelector('.__fqa-spin')) return;
    if (existing) existing.remove();
    const card = document.createElement('div');
    card.id = '__fqa-card';
    card.style.cssText = 'all:initial;position:fixed;bottom:20px;right:20px;z-index:2147483647;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#FAFAF8;border:1px solid #E0DBD4;border-radius:14px;box-shadow:0 4px 28px rgba(0,0,0,0.13);width:280px;overflow:hidden;';
    card.innerHTML = `
      <div style="padding:14px 16px;display:flex;justify-content:space-between;align-items:center;">
        <svg role="img" width="65" height="20" viewBox="0 0 317 98" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="LookPilot"><path d="M29.6 22.18H33.8V73H29.6V22.18ZM59.6809 73.7C56.3675 73.7 53.4042 72.93 50.7909 71.39C48.2242 69.85 46.2175 67.7033 44.7709 64.95C43.3242 62.1967 42.6009 59.07 42.6009 55.57C42.6009 52.07 43.3242 48.9433 44.7709 46.19C46.2642 43.39 48.2942 41.22 50.8609 39.68C53.4742 38.0933 56.4375 37.3 59.7509 37.3C63.0175 37.3 65.9342 38.0933 68.5009 39.68C71.1142 41.22 73.1442 43.3667 74.5909 46.12C76.0842 48.8733 76.8309 52 76.8309 55.5C76.8309 59 76.0842 62.1267 74.5909 64.88C73.1442 67.6333 71.1142 69.8033 68.5009 71.39C65.9342 72.93 62.9942 73.7 59.6809 73.7ZM59.7509 69.92C63.6242 69.92 66.7275 68.59 69.0609 65.93C71.4409 63.27 72.6309 59.7933 72.6309 55.5C72.6309 52.6533 72.0942 50.1567 71.0209 48.01C69.9475 45.8167 68.4309 44.1133 66.4709 42.9C64.5109 41.6867 62.2709 41.08 59.7509 41.08C57.1842 41.08 54.9209 41.6867 52.9609 42.9C51.0009 44.1133 49.4842 45.84 48.4109 48.08C47.3375 50.2733 46.8009 52.77 46.8009 55.57C46.8009 58.37 47.3375 60.8667 48.4109 63.06C49.4842 65.2067 51.0009 66.8867 52.9609 68.1C54.9209 69.3133 57.1842 69.92 59.7509 69.92ZM100.355 73.7C97.0414 73.7 94.078 72.93 91.4647 71.39C88.898 69.85 86.8914 67.7033 85.4447 64.95C83.998 62.1967 83.2747 59.07 83.2747 55.57C83.2747 52.07 83.998 48.9433 85.4447 46.19C86.938 43.39 88.968 41.22 91.5347 39.68C94.148 38.0933 97.1114 37.3 100.425 37.3C103.691 37.3 106.608 38.0933 109.175 39.68C111.788 41.22 113.818 43.3667 115.265 46.12C116.758 48.8733 117.505 52 117.505 55.5C117.505 59 116.758 62.1267 115.265 64.88C113.818 67.6333 111.788 69.8033 109.175 71.39C106.608 72.93 103.668 73.7 100.355 73.7ZM100.425 69.92C104.298 69.92 107.401 68.59 109.735 65.93C112.115 63.27 113.305 59.7933 113.305 55.5C113.305 52.6533 112.768 50.1567 111.695 48.01C110.621 45.8167 109.105 44.1133 107.145 42.9C105.185 41.6867 102.945 41.08 100.425 41.08C97.858 41.08 95.5947 41.6867 93.6347 42.9C91.6747 44.1133 90.158 45.84 89.0847 48.08C88.0114 50.2733 87.4747 52.77 87.4747 55.57C87.4747 58.37 88.0114 60.8667 89.0847 63.06C90.158 65.2067 91.6747 66.8867 93.6347 68.1C95.5947 69.3133 97.858 69.92 100.425 69.92ZM154.889 73H150.269L138.719 57.25C138.205 56.6433 137.482 56.2 136.549 55.92C135.615 55.64 134.635 55.5 133.609 55.5H130.529V73H126.329V22.18H130.529V51.72H133.049C134.682 51.72 135.965 51.6733 136.899 51.58C137.879 51.4867 138.742 51.2533 139.489 50.88C141.075 50.0867 142.452 48.8033 143.619 47.03C144.832 45.21 145.742 43.39 146.349 41.57C147.002 39.7033 147.329 38.42 147.329 37.72H151.179C151.132 39.3067 150.549 41.3367 149.429 43.81C148.355 46.2367 147.049 48.4533 145.509 50.46C143.969 52.4667 142.545 53.68 141.239 54.1L154.889 73Z" fill="black"/><path d="M176.514 37.02C179.78 37.02 182.557 37.8367 184.844 39.47C187.177 41.1033 188.927 43.2967 190.094 46.05C191.307 48.7567 191.914 51.7433 191.914 55.01C191.914 58.6033 191.214 61.8233 189.814 64.67C188.46 67.47 186.454 69.6867 183.794 71.32C181.18 72.9067 178.1 73.7 174.554 73.7C173.154 73.7 170.774 73.49 167.414 73.07V91.2H161.884V48.5C161.884 44.86 160.904 42.2 158.944 40.52L162.794 36.95C163.494 37.37 164.194 38 164.894 38.84C165.594 39.6333 166.177 40.5667 166.644 41.64C167.764 40.24 169.234 39.12 171.054 38.28C172.874 37.44 174.694 37.02 176.514 37.02ZM174.204 68.52C178.124 68.52 181.087 67.33 183.094 64.95C185.147 62.57 186.174 59.3967 186.174 55.43C186.174 51.6967 185.31 48.57 183.584 46.05C181.857 43.4833 179.547 42.2 176.654 42.2C174.367 42.2 172.29 42.9467 170.424 44.44C168.604 45.8867 167.6 47.7533 167.414 50.04V68.1C170.214 68.38 172.477 68.52 174.204 68.52ZM200.083 37.93L205.823 38V73.07L200.083 73V37.93ZM202.813 31.14C201.88 31.14 201.04 30.7667 200.293 30.02C199.547 29.2733 199.173 28.4333 199.173 27.5C199.173 26.52 199.547 25.6567 200.293 24.91C201.04 24.1633 201.88 23.79 202.813 23.79C203.793 23.79 204.657 24.1633 205.403 24.91C206.197 25.6567 206.593 26.52 206.593 27.5C206.593 28.4333 206.197 29.2733 205.403 30.02C204.657 30.7667 203.793 31.14 202.813 31.14ZM216.696 22.11H222.296V73.07H216.696V22.11ZM247.799 73.7C244.486 73.7 241.499 72.9067 238.839 71.32C236.226 69.7333 234.173 67.5633 232.679 64.81C231.186 62.01 230.439 58.86 230.439 55.36C230.439 51.86 231.186 48.71 232.679 45.91C234.219 43.0633 236.296 40.8467 238.909 39.26C241.569 37.6267 244.556 36.81 247.869 36.81C251.183 36.81 254.146 37.6033 256.759 39.19C259.419 40.7767 261.496 42.9933 262.989 45.84C264.483 48.64 265.229 51.79 265.229 55.29C265.229 58.79 264.483 61.94 262.989 64.74C261.496 67.54 259.419 69.7333 256.759 71.32C254.099 72.9067 251.113 73.7 247.799 73.7ZM247.869 68.52C251.369 68.52 254.169 67.3067 256.269 64.88C258.416 62.4533 259.489 59.2567 259.489 55.29C259.489 51.2767 258.416 48.0567 256.269 45.63C254.169 43.2033 251.369 41.99 247.869 41.99C245.583 41.99 243.553 42.55 241.779 43.67C240.006 44.79 238.629 46.3533 237.649 48.36C236.669 50.3667 236.179 52.6767 236.179 55.29C236.179 59.2567 237.253 62.4533 239.399 64.88C241.546 67.3067 244.369 68.52 247.869 68.52ZM283.306 73.98C279.946 73.98 277.333 73 275.466 71.04C273.6 69.0333 272.666 66.1633 272.666 62.43V28.97H278.406V37.51H289.186V42.69H278.406V62.43C278.406 64.7167 278.873 66.3033 279.806 67.19C280.786 68.0767 281.93 68.52 283.236 68.52C284.17 68.52 284.916 68.4267 285.476 68.24C286.083 68.0533 286.876 67.7033 287.856 67.19L290.516 71.88C288.65 73.28 286.246 73.98 283.306 73.98Z" fill="#FF009D"/></svg>
        <button id="__fqa-close" aria-label="Fechar" style="all:initial;cursor:pointer;color:#8A8078;font-size:20px;line-height:1;padding:0 2px;">×</button>
      </div>
      <div style="padding:16px 14px;text-align:center;">
        <div style="font-size:11px;color:#8A8078;line-height:1.7;">${t('card_not_found').replace('\n','<br>')}</div>
      </div>
    `;
    document.body.appendChild(card);
    avoidCartButton(card);
    card.querySelector('#__fqa-close').addEventListener('click', removeCard);
    setBadge('!', '#d97706');
  }

  // Clear card on SPA navigation (scan stays user-triggered).
  // Só conta como navegação a mudança de PATH — não hash/query (abrir um modal
  // de composição muda muitas vezes a query/hash e isso NÃO é trocar de produto).
  // E nunca durante um scan ativo, para não apagar o loading a meio.
  let scanning = false;
  const pathOf = () => location.origin + location.pathname;
  let lastPath = pathOf();
  new MutationObserver(() => {
    if (scanning) return;
    const p = pathOf();
    if (p !== lastPath) {
      lastPath = p;
      scanDone = false;
      removeCard();
    }
  }).observe(document.body || document.documentElement, { childList: true, subtree: true });

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === 'ping') {
      sendResponse({ alive: true });
      return true;
    }
    if (msg.action === 'scanPage') {
      scanDone = false;
      scanning = true;
      openedCompositionModal = false;
      compClickAttempts = 0;
      showScanningCard();
      // tryScan blindado: um erro de parsing numa loja não pode travar o pipeline
      const safeScan = () => { try { if (!scanDone) tryScan(); } catch (e) { console.warn('[LookPilot] scan falhou:', e); } };
      // O fallback de fecho é agendado JÁ — independente de qualquer erro acima.
      // TUDO blindado: nada aqui pode impedir o loading de ser substituído.
      setTimeout(() => {
        try { closeCompositionModal(); } catch (e) {}
        try { if (!scanDone) injectEmptyCard(); } catch (e) { try { removeCard(); } catch(e2) {} }
        try { sendResponse({ found: scanDone }); } catch (e) {}
        scanning = false;
        lastPath = pathOf();
      }, 3700);
      // Deixa o browser renderizar o loading antes de começar o scan.
      // Retries progressivos: acordeões de lojas lentas (Reserved) carregam
      // o conteúdo da composição só depois do clique de expansão.
      setTimeout(() => {
        safeScan();
        [400, 900, 1500, 2200, 3000, 3500].forEach(ms =>
          setTimeout(safeScan, ms));
      }, 50);
      return true;
    }
  });

  // ─── Card partilhável: desenha o resultado num canvas e faz download ──
  function generateShareCard(scores, fibers, buy, v, catInfo, warmth, warmthInfo, showWarmth) {
    const bv = typeof buyVerdict === 'function' ? buyVerdict(buy) : { label: v.label };
    const conclusion = typeof conclusionText === 'function' ? conclusionText(scores, scores.fibers || fibers) : '';
    const travel = typeof travelText === 'function' ? travelText(scores, scores.fibers || fibers) : '';
    const travelTen = Math.round((scores.travel || 0) / 10);
    const certs = (scores.certs || []);
    // cor do veredito (WCAG AA)
    const vColor = buy >= 70 ? '#155D35' : buy >= 55 ? '#7A5200' : '#C0392B';

    const W = 1080, H = 1350;          // formato 4:5 (Instagram/WhatsApp)
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    const PAD = 90;

    // fundo
    ctx.fillStyle = '#FAFAF8'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#E0DBD4'; ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, W - 40, H - 40);

    // helper de texto multilinha
    function wrap(text, x, y, maxW, lh, font, color, align) {
      ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align || 'left';
      const words = (text || '').split(' '); let line = '', yy = y;
      for (const w of words) {
        const test = line ? line + ' ' + w : w;
        if (ctx.measureText(test).width > maxW && line) { ctx.fillText(line, x, yy); line = w; yy += lh; }
        else line = test;
      }
      if (line) ctx.fillText(line, x, yy);
      return yy;
    }

    // logo / marca
    ctx.font = '600 34px Georgia, serif'; ctx.fillStyle = '#1E1A16'; ctx.textAlign = 'left';
    ctx.fillText('LookMap', PAD, PAD + 30);

    // veredito (herói)
    ctx.font = 'italic 700 92px Georgia, serif'; ctx.fillStyle = vColor; ctx.textAlign = 'left';
    ctx.fillText(bv.label, PAD, PAD + 175);

    // número buy score
    ctx.font = 'italic 700 64px Georgia, serif'; ctx.fillStyle = vColor;
    ctx.fillText(String(buy), PAD, PAD + 270);
    ctx.font = '500 30px -apple-system, sans-serif'; ctx.fillStyle = '#8A8580';
    const numW = ctx.measureText(String(buy)).width;
    ctx.fillText('/100  BUY SCORE', PAD + (buy >= 100 ? 110 : 80), PAD + 270);

    // linha divisória
    ctx.strokeStyle = '#ECE8E2'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(PAD, PAD + 320); ctx.lineTo(W - PAD, PAD + 320); ctx.stroke();

    // conclusão
    let y = PAD + 385;
    y = wrap(conclusion, PAD, y, W - PAD * 2, 46, '400 34px -apple-system, sans-serif', '#5A5450', 'left');

    // certificação (selo verde)
    if (certs.length) {
      y += 55;
      ctx.fillStyle = '#E1F5EE'; roundRect(ctx, PAD, y - 32, W - PAD * 2, 64, 12); ctx.fill();
      ctx.font = '500 28px -apple-system, sans-serif'; ctx.fillStyle = '#0F6E56'; ctx.textAlign = 'left';
      ctx.fillText('✓ Certificação ' + certs.join(', ') + ' — origem verificada', PAD + 24, y + 8);
      y += 50;
    }

    // calor (se inverno)
    if (showWarmth && warmthInfo) {
      y += 55;
      ctx.fillStyle = '#FFF4ED'; roundRect(ctx, PAD, y - 32, W - PAD * 2, 96, 12); ctx.fill();
      ctx.font = '500 28px -apple-system, sans-serif'; ctx.fillStyle = '#9A3412'; ctx.textAlign = 'left';
      ctx.fillText('🔥 Calor: ' + warmthInfo.label + '  ' + Math.round(warmth / 10) + '/10', PAD + 24, y + 4);
      ctx.font = '400 26px -apple-system, sans-serif'; ctx.fillStyle = '#B45309';
      ctx.fillText(warmthInfo.txt, PAD + 24, y + 42);
      y += 80;
    }

    // travel
    y += 55;
    ctx.fillStyle = '#F8F4FF'; roundRect(ctx, PAD, y - 32, W - PAD * 2, 100, 12); ctx.fill();
    ctx.font = '500 28px -apple-system, sans-serif'; ctx.fillStyle = '#6B21A8'; ctx.textAlign = 'left';
    ctx.fillText('✈️ Travel Score: ' + travelTen + '/10', PAD + 24, y + 4);
    wrap(travel, PAD + 24, y + 42, W - PAD * 2 - 48, 34, '400 26px -apple-system, sans-serif', '#7E22CE', 'left');

    // rodapé
    ctx.font = '400 26px -apple-system, sans-serif'; ctx.fillStyle = '#B0ABA4'; ctx.textAlign = 'center';
    ctx.fillText('Analisado com LookPilot · LookMap', W / 2, H - 60);

    // download
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'lookmap-analise.png';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, 'image/png');
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

})();
