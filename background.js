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
    ].some(Boolean);
    const isProduct = !nonProduct && [
      /-[a-z]?\d{3,}\.html/.test(path),
      path.includes('.html') && /[pl]\d{3,}/.test(path),
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

function updateTab(tabId, url) {
  if (!url || url.startsWith('chrome://') || url.startsWith('about:') || url.startsWith('chrome-extension://')) {
    chrome.action.setBadgeText({ text: '', tabId });
    chrome.action.setTitle({ title: 'LookPilot', tabId });
    return;
  }

  const { isFashion, isProduct, isListing } = classifyUrl(url);

  if (isFashion && isProduct) {
    chrome.action.setBadgeText({ text: '', tabId });
    chrome.action.setTitle({ title: '✓ Analisar este produto', tabId });
  } else if (isFashion && isListing) {
    chrome.action.setBadgeText({ text: '·', tabId });
    chrome.action.setBadgeBackgroundColor({ color: '#aaaaaa', tabId });
    chrome.action.setTitle({ title: 'Clique numa peça específica', tabId });
  } else {
    chrome.action.setBadgeText({ text: '', tabId });
    chrome.action.setTitle({ title: 'LookPilot', tabId });
  }
}

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

// Badge control from content script
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.action === 'setBadge') {
    const tabId = sender.tab?.id;
    if (!tabId) return;
    chrome.action.setBadgeText({ text: msg.text || '', tabId });
    if (msg.color) chrome.action.setBadgeBackgroundColor({ color: msg.color, tabId });
  }
});
