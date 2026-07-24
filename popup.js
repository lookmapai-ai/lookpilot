// --- i18n ---
function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const val = t(key);
    if (val) el.textContent = val;
  });
}

// --- LookMap URL builder ---
// Mantenha em sincronia com LOOKMAP_DEV/LOOKMAP_BASE_URL no content.js.
const LOOKMAP_DEV = true;
const LOOKMAP_BASE_URL = LOOKMAP_DEV
  ? 'http://localhost:8777/analise.html'
  : 'https://lookmap.ai/analise';

function buildAnaliseURLFromStorage(last) {
  const s = last.scores;
  const params = new URLSearchParams();
  params.set('score',         last.buyScore || s?.overall || 0);
  params.set('verdict',       last.verdictLabel || '');
  if (s) {
    params.set('qualidade',     Math.round(s.quality     || 0));
    params.set('durabilidade',  Math.round(s.durability  || 0));
    params.set('conforto',      Math.round(s.comfort     || 0));
    params.set('versatilidade', Math.round(s.versatility || 0));
    params.set('manutencao',    Math.round(s.maintenance || 0));
    params.set('custo',         Math.round(s.costBenefit || 0));
    params.set('viagem',        Math.round(s.travel      || 0));
  }
  const fibersParam = (last.fibers || []).map(f => `${f.name}:${f.pct || 0}`).join(',');
  if (fibersParam) params.set('fibras', fibersParam);
  if (last.url) params.set('origem', last.url);
  // Metadados do produto + confiança (para o hero da landing)
  const m = last.meta || {};
  if (m.nome)   params.set('nome',   String(m.nome).slice(0, 120));
  if (m.imagem) params.set('imagem', m.imagem);
  if (m.galeria && m.galeria.length > 1) params.set('galeria', m.galeria.join('|'));
  if (m.preco)  params.set('preco',  m.preco);
  if (m.moeda)  params.set('moeda',  m.moeda);
  if (m.loja)   params.set('loja',   m.loja);
  if (last.confianca != null) params.set('confianca', Math.round(last.confianca));
  return `${LOOKMAP_BASE_URL}?${params.toString()}`;
}

// --- Screen management ---
const SCREENS = ['wrong-context', 'onboarding', 'product-ready', 'app'];

function showOnly(id) {
  SCREENS.forEach(s => {
    const el = document.getElementById(s);
    if (el) el.style.display = (s === id) ? 'block' : 'none';
  });
}

// --- Context detection ---
function checkContext() {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const tab = tabs[0];
    if (!tab || !tab.url ||
        tab.url.startsWith('chrome://') || tab.url.startsWith('about:') ||
        tab.url.startsWith('chrome-extension://') || tab.url.startsWith('file://')) {
      showWrongContext('other');
      return;
    }
    // Se já existe resultado para esta URL, o card já está visível na página —
    // a popup não duplica: abre directamente a análise completa no lookmap.ai
    chrome.storage.local.get('fqa-last-result', data => {
      const last = data['fqa-last-result'];
      if (last && last.url === tab.url && last.fibers && last.scores) {
        // Card já está visível na página — fecha o popup sem abrir nada
        window.close();
      } else {
        showProductReady();
      }
    });
  });
}

function showProductReady() {
  showOnly('product-ready');
}

function showWrongContext(reason) {
  const title = document.getElementById('wc-title');
  const desc  = document.getElementById('wc-desc');
  const icon  = document.getElementById('wc-icon');
  if (reason === 'listing') {
    if (title) title.textContent = t('wc_listing_title');
    if (desc)  desc.textContent  = t('wc_listing_desc');
  } else {
    if (title) title.textContent = t('wc_other_title');
    if (desc)  desc.textContent  = t('wc_other_desc');
  }
  showOnly('wrong-context');
}

// --- Onboarding ---
function isFirstRun() { return !localStorage.getItem('fqa-seen'); }
function markSeen()   { localStorage.setItem('fqa-seen', '1'); }

function initApp() {
  if (isFirstRun()) {
    showOnly('onboarding');
  } else {
    showOnly('product-ready');
    showProductReady();
  }
}

document.getElementById('onboard-start').addEventListener('click', () => {
  markSeen();
  showProductReady();
});

// --- Fiber database ---
const TYPE_BADGE = { natural: 'badge-nat', semi: 'badge-semi', synthetic: 'badge-syn' };
const TYPE_LABEL = { natural: 'Natural', semi: 'Semi-sint.', synthetic: 'Sintética' };

let fibers = [];

// Só existe a aba de análise (o histórico vive agora na landing lookmap.ai).
function switchTab() {
  document.getElementById('tab-analyze').style.display = 'block';
}

// --- Product ready CTA ---
document.getElementById('analyze-cta').addEventListener('click', () => {
  showOnly('app');
  switchTab();
  triggerScan();
});

// --- Wrong context: force manual ---
document.getElementById('force-open').addEventListener('click', () => {
  showOnly('app');
  switchTab();
  showManualSection();
});

// --- Edit manual button (after scan result) ---
document.getElementById('edit-manual-btn').addEventListener('click', () => {
  document.getElementById('edit-manual-wrap').style.display = 'none';
  showManualSection();
});

function showManualSection() {
  document.getElementById('scanning-state').style.display = 'none';
  document.getElementById('manual-section').style.display = 'block';
}

// --- Pills & fiber input ---
document.querySelectorAll('.pill[data-fiber]').forEach(el => {
  el.addEventListener('click', () => addFiber(el.dataset.fiber, 0));
});

document.getElementById('add-btn').addEventListener('click', () => addFiber());
document.getElementById('new-fiber').addEventListener('keydown', e => { if (e.key === 'Enter') addFiber(); });
document.getElementById('new-pct').addEventListener('keydown',   e => { if (e.key === 'Enter') addFiber(); });

function getFiberData(name) { return getFiber(name); }

function addFiber(name, pct) {
  const n = name !== undefined ? name : document.getElementById('new-fiber').value.trim();
  const p = pct  !== undefined ? pct  : parseInt(document.getElementById('new-pct').value) || 0;
  if (!n) return;
  fibers.push({ name: n, pct: p });
  if (name === undefined) {
    document.getElementById('new-fiber').value = '';
    document.getElementById('new-pct').value   = '';
    document.getElementById('new-fiber').focus();
  }
  renderFibers();
}

function removeFiber(i) { fibers.splice(i, 1); renderFibers(); }

function renderFibers() {
  const list  = document.getElementById('fiber-list');
  const total = fibers.reduce((s, f) => s + (f.pct || 0), 0);
  const wrap  = document.getElementById('total-wrap');
  const hint  = document.getElementById('total-hint');
  const btn   = document.getElementById('analyze-btn');

  wrap.style.display = fibers.length ? '' : 'none';
  document.getElementById('total-val').textContent = total + '%';
  const fill = document.getElementById('progress-fill');
  fill.style.width      = Math.min(total, 100) + '%';
  fill.style.background = total === 100 ? '#16a34a' : total > 100 ? '#dc2626' : '#d97706';

  if (total > 100) {
    hint.style.display = ''; hint.style.color = '#dc2626';
    hint.textContent = `A mais ${total - 100}% — confira os valores.`;
    btn.disabled = true;
  } else if (total > 0 && total < 100) {
    hint.style.display = ''; hint.style.color = '#86868B';
    hint.textContent = `Faltam ${100 - total}% para completar a composição.`;
    btn.disabled = false;
  } else { hint.style.display = 'none'; btn.disabled = false; }

  list.innerHTML = fibers.map((f, i) => `
    <div class="fiber-tag">
      <span class="fiber-tag-name">${f.name}</span>
      <input type="number" value="${f.pct || ''}" placeholder="%" min="0" max="100"
        class="fiber-tag-pct-input${f.pct > 100 ? ' error' : ''}"
        data-index="${i}" aria-label="Percentagem de ${f.name}">
      <button class="fiber-tag-remove" data-remove="${i}" aria-label="Remover ${f.name}">×</button>
    </div>
  `).join('');

  list.querySelectorAll('input[data-index]').forEach(el => {
    el.addEventListener('change', () => { fibers[el.dataset.index].pct = parseInt(el.value) || 0; renderFibers(); });
  });
  list.querySelectorAll('[data-remove]').forEach(el => {
    el.addEventListener('click', () => removeFiber(parseInt(el.dataset.remove)));
  });
}

// --- Scoring ---
function scoreSection(fibList, txt) { return calcScores(fibList, txt); }
function toTen(v) { return Math.round(v / 10); }

// --- Manual analyze ---
document.getElementById('analyze-btn').addEventListener('click', analyze);

function analyze() {
  if (!fibers.length) return;
  const btn = document.getElementById('analyze-btn');
  btn.disabled = true;
  btn.textContent = t('analyzing_btn');
  const details = fibers.map(f => ({ ...f, data: getFiberData(f.name) }));
  const s = scoreSection(details);
  const v = verdict(s);
  btn.disabled = false;
  btn.textContent = t('analyze_btn');
  renderResult(details, s, false);
}

function renderResult(details, s, showEditLink = true) {
  const v = verdict(s);
  document.getElementById('result-area').innerHTML = `
    <div class="result-wrap">
      <div style="margin-bottom:12px;">
        <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:4px;">
          <span style="font-size:32px;font-weight:700;color:${v.color};line-height:1;">${s?.overall ?? ''}</span>
          <span style="font-size:13px;color:#86868B;font-weight:500;">/100</span>
          <span style="font-size:14px;font-weight:600;color:${v.color};">${v.label}</span>
        </div>
        <div style="font-size:12px;color:#6E6E73;line-height:1.6;">${conclusionText(s, details)}</div>
        ${s && s.qualityModifier ? `<div style="font-size:11px;color:#7a5c00;line-height:1.5;margin-top:8px;padding:8px 10px;background:#fdf6e3;border-radius:8px;"><span style="font-weight:600;">⭐ ${s.qualityModifier.nome}:</span> ${s.qualityModifier.explica}</div>` : ''}
        ${typeof blendText === 'function' && blendText(details) ? `<div style="font-size:11px;color:#6b5b95;line-height:1.5;margin-top:8px;padding:8px 10px;background:#f5f3fa;border-radius:8px;"><span style="font-weight:600;">${t('blend_label')}</span> ${blendText(details)}</div>` : ''}
      </div>

      ${s ? `
      <div style="margin-bottom:14px;">
        ${[
          [t('quality'),      toTen(s.quality)],
          [t('durability'),   toTen(s.durability)],
          [t('comfort'),      toTen(s.comfort)],
          [t('versatility'),  toTen(s.versatility)],
          [t('maintenance'),  toTen(s.maintenance)],
          [t('cost_benefit'), toTen(s.costBenefit)],
        ].map(([label, val]) => `
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;font-size:12px;">
            <span style="min-width:118px;color:#6E6E73;">${label}</span>
            ${scoreBar(val, 10)}
            <span style="min-width:18px;text-align:right;font-weight:600;color:#1D1D1F;">${val}</span>
          </div>
        `).join('')}
      </div>

      <div style="background:#f8f4ff;border-radius:10px;padding:10px 12px;margin-bottom:12px;">
        <div style="font-size:12px;font-weight:600;color:#6b21a8;margin-bottom:4px;">${t('travel_label')}: ${toTen(s.travel)}/10</div>
        <div style="font-size:12px;color:#7e22ce;line-height:1.5;">${travelText(s, details)}</div>
      </div>
      ` : ''}

      <div style="border-top:1px solid #F5F5F7;padding-top:10px;margin-top:2px;margin-bottom:4px;">
        ${details.map(d => `
          <div class="fiber-detail">
            <div>
              <div class="fiber-detail-name">${d.name}${d.pct ? ' · ' + d.pct + '%' : ''}</div>
              <div class="fiber-detail-tip">${d.data ? d.data.tip : t('fiber_unknown')}</div>
            </div>
            <span class="badge ${d.data ? TYPE_BADGE[d.data.type] : 'badge-unk'}">${d.data ? TYPE_LABEL[d.data.type] : '?'}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  document.getElementById('scanning-state').style.display = 'none';
  document.getElementById('edit-manual-wrap').style.display = showEditLink ? 'block' : 'none';
}

// --- Scan ---
function triggerScan() {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const tabId = tabs[0]?.id;
    if (tabId == null) return;

    const showError = (msgKey) => {
      document.getElementById('scanning-state').style.display = 'none';
      document.getElementById('manual-section').style.display = 'block';
      const hint = document.getElementById('total-hint');
      if (hint) { hint.style.display = ''; hint.style.color = '#6E6E73'; hint.textContent = t(msgKey); }
    };

    const send = () => {
      chrome.tabs.sendMessage(tabId, { action: 'scanPage' });
      setTimeout(() => window.close(), 80);
    };

    chrome.tabs.sendMessage(tabId, { action: 'ping' }, resp => {
      if (chrome.runtime.lastError || !resp) {
        if (chrome.scripting?.executeScript) {
          chrome.scripting.executeScript(
            { target: { tabId }, files: ['strings.js', 'shared.js', 'categories.js', 'content.js'] },
            () => {
              if (chrome.runtime.lastError) { showError('scan_no_access'); return; }
              setTimeout(send, 150);
            }
          );
        } else {
          send();
        }
      } else {
        send();
      }
    });
  });
}

// --- Fiber datalist ---
(function populateFiberDatalist() {
  const dl = document.getElementById('fiber-suggestions');
  if (!dl) return;
  const names = new Set([...document.querySelectorAll('.pill[data-fiber]')].map(p => p.dataset.fiber));
  if (typeof FIBER_DB !== 'undefined') {
    Object.values(FIBER_DB).forEach(f => { if (f.name) names.add(f.name); });
  }
  dl.innerHTML = [...names].sort().map(n => `<option value="${n}">`).join('');
})();

// --- Init ---
applyI18n();
checkContext();
