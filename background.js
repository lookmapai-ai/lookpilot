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

// Sem default_popup no manifest: clicar no ícone NUNCA abre popup — dispara
// sempre action.onClicked, que escaneia direto na página. O card é a única
// superfície. updateTab só cuida da dica (tooltip) do ícone.
function updateTab(tabId, url) {
  if (!url || url.startsWith('chrome://') || url.startsWith('about:') || url.startsWith('chrome-extension://')) {
    chrome.action.setTitle({ title: 'LookPilot', tabId });
    return;
  }
  const { isFashion, isProduct, isListing } = classifyUrl(url);
  if (isFashion && isProduct)      chrome.action.setTitle({ title: 'Analisar esta peça · LookPilot', tabId });
  else if (isFashion && isListing) chrome.action.setTitle({ title: 'Abra uma peça e clique para analisar', tabId });
  else                             chrome.action.setTitle({ title: 'LookPilot · analisar a peça desta página', tabId });
}

// Clique no ícone: escaneia direto na página. Uma caixa, um clique.
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

// Atualiza a dica das abas já abertas quando a extensão instala/atualiza ou o
// service worker acorda.
function revisarAbasAbertas() {
  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) if (tab.id != null && tab.url) updateTab(tab.id, tab.url);
  });
}
chrome.runtime.onInstalled.addListener(revisarAbasAbertas);
chrome.runtime.onStartup.addListener(revisarAbasAbertas);
revisarAbasAbertas();

// Entrada manual: quando o scan não acha a composição, o card oferece "inserir
// manualmente". Como não há mais popup no clique, isso abre o popup.html numa
// janelinha própria (o único lugar onde o popup ainda aparece, e só a pedido).
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === 'openManual') {
    chrome.windows.create({ url: 'popup.html?manual=1', type: 'popup', width: 360, height: 580 });
  }
});
