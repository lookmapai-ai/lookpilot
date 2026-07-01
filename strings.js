// ─── Language detection ───────────────────────────────────────────
const LP_LANG = (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('pt')) ? 'pt' : 'en';

// ─── UI string dictionary ─────────────────────────────────────────
const UI = {
  pt: {
    // Onboarding
    onboard_title:  'Seu copiloto de compras de moda',
    onboard_desc:   'Antes de comprar, eu respondo: essa peça vale o preço? Vai durar? É boa para viajar?',
    onboard_step1:  'Abra a página de uma peça numa loja online',
    onboard_step2:  'Apareço automaticamente com scores de qualidade, conforto, versatilidade e viagem',
    onboard_step3:  'Sem resultado automático? Insira a composição manualmente aqui',
    onboard_btn:    'Vamos analisar!',

    // Product-ready screen
    ready_title:    'Quer analisar essa peça?',
    ready_desc:     'Olho a composição e digo se vale o preço, se dura e se é boa para viajar.',
    ready_cta:      'Analisar esta peça',
    ready_manual:   'Inserir composição manualmente',
    ready_history:  'Ver histórico',
    result_edit:    'Composição diferente? Editar manualmente',

    // Wrong context
    wc_listing_title: 'Qual peça você quer analisar?',
    wc_listing_desc:  'Você está vendo a coleção — clique numa peça específica e analiso na hora.',
    wc_other_title:   'Abra uma página de produto',
    wc_other_desc:    'Navegue até uma peça específica numa loja de moda e analiso se vale a compra.',
    wc_manual:        'Inserir composição manualmente',

    // Main app header
    header_title: 'LookPilot',
    header_sub:   'Devo comprar essa peça? · LookMap',
    scan_btn:     'Escanear página',

    // Tabs
    tab_analyze:  'Analisar',
    tab_history:  'Histórico',

    // Analyze tab
    fibers_label:  'Fibras comuns',
    analyze_btn:   'Devo comprar essa peça?',
    analyzing_btn: 'A analisar…',
    total_label:   'Total',

    // History
    history_label: 'Análises recentes',
    history_empty: 'Você ainda não analisou nenhuma peça.<br>Comece pela aba Analisar!',

    // Scan states
    scanning:        'A analisar a peça...',
    scan_error:      'Não consegui ler essa página. Recarregue a página e tente de novo, ou insira a composição manualmente abaixo.',
    scan_not_found:  'Composição não encontrada nessa página.<br>Insira manualmente abaixo.',
    scan_no_access:  'Essa página não permite análise. Tente numa página de produto de loja.',

    // Result labels
    quality:      '🧵 Qualidade',
    durability:   '💪 Durabilidade',
    comfort:      '😌 Conforto',
    versatility:  '🔄 Versatilidade',
    maintenance:  '🧺 Manutenção',
    cost_benefit: '💰 Custo-benefício',
    travel_label: '✈️ Travel Score',
    blend_label:  'A mistura:',
    fiber_unknown:'Fibra não reconhecida',

    // Card
    card_share:     'Partilhar',
    card_waitlist:  'Lista de espera ↗',
    card_not_found: 'Composição não encontrada nessa página.\nUse o popup para inserir manualmente.',
  },

  en: {
    // Onboarding
    onboard_title:  'Your fashion shopping co-pilot',
    onboard_desc:   'Before you buy, I answer: is this piece worth the price? Will it last? Is it good for travel?',
    onboard_step1:  'Open a product page on any fashion store',
    onboard_step2:  'I automatically show quality, comfort, versatility and travel scores',
    onboard_step3:  'No automatic result? Enter the composition manually here',
    onboard_btn:    "Let's analyse!",

    // Product-ready screen
    ready_title:    'Want to analyse this piece?',
    ready_desc:     "I check the composition and tell you if it's worth the price, if it'll last, and if it's good for travel.",
    ready_cta:      'Analyse this piece',
    ready_manual:   'Enter composition manually',
    ready_history:  'View history',
    result_edit:    'Different composition? Edit manually',

    // Wrong context
    wc_listing_title: 'Which piece do you want to analyse?',
    wc_listing_desc:  "You're browsing the collection — click on a specific piece and I'll analyse it right away.",
    wc_other_title:   'Open a product page',
    wc_other_desc:    "Navigate to a specific piece on a fashion store and I'll tell you if it's worth buying.",
    wc_manual:        'Enter composition manually',

    // Main app header
    header_title: 'LookPilot',
    header_sub:   'Should I buy this piece? · LookMap',
    scan_btn:     'Scan page',

    // Tabs
    tab_analyze:  'Analyse',
    tab_history:  'History',

    // Analyze tab
    fibers_label:  'Common fibres',
    analyze_btn:   'Should I buy this piece?',
    analyzing_btn: 'Analysing…',
    total_label:   'Total',

    // History
    history_label: 'Recent analyses',
    history_empty: "You haven't analysed any piece yet.<br>Start in the Analyse tab!",

    // Scan states
    scanning:        'Analysing piece...',
    scan_error:      "Couldn't read this page. Reload the page and try again, or enter the composition manually below.",
    scan_not_found:  'Composition not found on this page.<br>Enter it manually below.',
    scan_no_access:  'This page does not allow analysis. Try on a fashion store product page.',

    // Result labels
    quality:      '🧵 Quality',
    durability:   '💪 Durability',
    comfort:      '😌 Comfort',
    versatility:  '🔄 Versatility',
    maintenance:  '🧺 Care',
    cost_benefit: '💰 Value for money',
    travel_label: '✈️ Travel Score',
    blend_label:  'The blend:',
    fiber_unknown:'Unknown fibre',

    // Card
    card_share:     'Share',
    card_waitlist:  'Join waitlist ↗',
    card_not_found: 'Composition not found on this page.\nUse the popup to enter it manually.',
  }
};

function t(key) {
  const lang = LP_LANG;
  return (UI[lang] && UI[lang][key]) || UI['pt'][key] || key;
}
