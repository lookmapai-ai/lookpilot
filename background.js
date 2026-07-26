const FASHION_DOMAINS = [
  'zara.com','mango.com','shop.mango.com','hm.com','massimodutti.com','pullandbear.com',
  'bershka.com','stradivarius.com','uniqlo.com','shein.com','primark.com',
  'reserved.com','weekday.com','cos.com','arket.com','stories.com','monki.com',
  'asos.com','net-a-porter.com','farfetch.com','zalando.com','zalando.pt','aboutyou.com',
  'mangooutlet.com','shopify.com','zara.com'
];

const PRODUCT_PATTERNS = [
  /\/p\d+/i,
  /-p0\d{5,}/i,
  /\/product\/[^/?#]+/i,
  /\/produto\/[^/?#]+/i,
  /\/item\/[^/?#]+/i,
  /\/pd\/[^/?#]+/i,
  /[?&]productId=/i,
  /[?&]itemId=/i,
  /\/[a-z0-9-]+-p\d{5,}/i,
];

const LISTING_PATTERNS = [
  /^\/[a-z]{2}\/[a-z]{2}\/?$/i,          // /pt/pt/ root
  /\/(woman|man|kids|baby|home|beauty|accessories|lingerie|sale|new-in|novidades)\/?$/i,
  /\/(collection|colecao|category|categoria|search|pesquisa)\//i,
  /[?&](q|query|search|cat|category)=/i,
  /\/(cart|checkout|bag|cesto|wishlist|favoritos|account|conta|login)\/?/i,
];

function classifyUrl(url) {
  try {
    const u = new URL(url);
    const domain = u.hostname.replace('www.', '');
    const path = u.pathname + u.search;
    const isFashion = FASHION_DOMAINS.some(d => domain.includes(d));
    const nonProduct = [
      /^\/(pt|en|es|fr|de|it)?\/?$/.test(u.pathname),
      /\/(woman|man|kids|baby|home|beauty|accessories|lingerie|sale|new-in|novidades)\/?$/.test(path),
      /\/(collection|colecao|category|categoria|search|pesquisa)/.test(path),
      /[?&](q|query|search|cat|category)=/.test(path),
      /\/(cart|checkout|bag|cesto|wishlist|account|conta|login)/.test(path),
      /\/(lookbook|campaign|video|news|stores|lojas|magazine)/.test(path),
      // Zara/afins marcam LISTAGEM com "-l<dígitos>.html" (ex: -l1050.html) e
      // PRODUTO com "-p<dígitos>.html". Sem isto, a listagem era lida como
      // produto e o clique escaneava direto numa página sem peça única.
      /-l\d{3,}\.html?(\?|$)/.test(path),
    ].some(Boolean);
    const isProduct = !nonProduct && [
      /-p?\d{3,}\.html/.test(path),
      path.includes('.html') && /p\d{3,}/.test(path),
      /\/p\d+/.test(path),
      /-p0\d{4,}/.test(path),
      /-\d{6,}\.html/.test(path),
      /\/[a-z0-9-]+-\d{6,}/.test(path),
      /\/product\//.test(path),
      /\/produto\//.test(path),
      /\/item\//.test(path),
      /productId=/.test(path),
      /itemId=/.test(path),
      /\/p\/[a-z]/.test(path),
      /\/\d{7,}(\/|$)/.test(path),
    ].some(Boolean);
    return { isFashion, isProduct, isListing: nonProduct };
  } catch(e) {
    return { isFashion: false, isProduct: false, isListing: false };
  }
}

// Numa página de produto, clicar no ícone deve escanear DIRETO — sem abrir um
// popup só para conter o botão "Analisar" (as "duas caixas"). O Chrome decide
// isso pela presença do default_popup: com popup '' o clique dispara
// action.onClicked; com popup.html ele abre o popup. Então trocamos o popup
// por aba: produto (e onboarding já feito) -> sem popup, escaneia; resto ->
// popup, que aí tem o que dizer (onboarding, página errada, entrada manual).
function definePopup(tabId, produto) {
  chrome.storage.local.get('fqa-onboarded', (d) => {
    const escaneiaDireto = produto && d['fqa-onboarded'];
    chrome.action.setPopup({ tabId, popup: escaneiaDireto ? '' : 'popup.html' });
  });
}

function updateTab(tabId, url) {
  if (!url || url.startsWith('chrome://') || url.startsWith('about:') || url.startsWith('chrome-extension://')) {
    chrome.action.setBadgeText({ text: '', tabId });
    chrome.action.setTitle({ title: 'LookPilot', tabId });
    chrome.action.setPopup({ tabId, popup: 'popup.html' });
    return;
  }

  const { isFashion, isProduct, isListing } = classifyUrl(url);
  chrome.action.setBadgeText({ text: '', tabId });

  if (isFashion && isProduct) {
    chrome.action.setTitle({ title: 'Analisar esta peça · LookPilot', tabId });
  } else if (isFashion && isListing) {
    chrome.action.setTitle({ title: 'Clique numa peça específica', tabId });
  } else {
    chrome.action.setTitle({ title: 'LookPilot', tabId });
  }
  definePopup(tabId, isFashion && isProduct);
}

// Clique no ícone quando NÃO há popup (página de produto): escaneia direto.
// O card na página vira a única superfície — uma caixa, um clique.
chrome.action.onClicked.addListener((tab) => {
  if (!tab.id) return;
  const enviar = () => chrome.tabs.sendMessage(tab.id, { action: 'scanPage' }, () => void chrome.runtime.lastError);
  chrome.tabs.sendMessage(tab.id, { action: 'ping' }, (resp) => {
    if (chrome.runtime.lastError) {
      // content script ainda não injetado (aba aberta antes da extensão):
      // injeta e reenvia
      chrome.scripting.executeScript(
        { target: { tabId: tab.id }, files: ['strings.js', 'shared.js', 'categories.js', 'content.js'] },
        () => { if (!chrome.runtime.lastError) enviar(); }
      );
    } else {
      enviar();
    }
  });
});

// Re-evaluate on every navigation
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url || changeInfo.status === 'complete') {
    updateTab(tabId, tab.url || changeInfo.url);
  }
});

chrome.tabs.onActivated.addListener(({ tabId }) => {
  chrome.tabs.get(tabId, tab => {
    if (tab.url) updateTab(tabId, tab.url);
  });
});

// Reavalia as abas já abertas quando a extensão instala/atualiza ou o service
// worker acorda — senão uma aba de produto aberta antes disso manteria o popup
// (o comportamento por-aba não sobrevive ao reinício do service worker).
function revisarAbasAbertas() {
  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) if (tab.id != null && tab.url) updateTab(tab.id, tab.url);
  });
}
chrome.runtime.onInstalled.addListener(revisarAbasAbertas);
chrome.runtime.onStartup.addListener(revisarAbasAbertas);
revisarAbasAbertas();

// Badge control from content script
// (Removido o handler de 'setBadge': o ícone não recebe mais carimbo. O
// content.js já não envia a mensagem — o estado da análise vive no card.)
