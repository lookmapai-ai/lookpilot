// Category detection and material databases
// Injected by content.js and used by popup.js

const CATEGORY_SIGNALS = {
  shoes: {
    label: 'Calçados', icon: '👟',
    urlKeywords: ['sapato','sapatos','shoes','shoe','sandalia','sandalias','sandal','sandalia-plana','sandalia-salto','bota','botas','boot','tenis','sneaker','scarpin','mocassim','loafer','calçado','footwear','espardrille','espadrilha','mule','chinelo','slipper','sapatilha','sabrina','sabrinas','ballerina','flat','salto','heel','wedge','oxford','ankle','bailarina'],
    titleKeywords: ['sapato','sandália','bota','tênis','sneaker','loafer','scarpin','mocassim','chinelo','sapatilha','sabrina','sabrinas','bailarina','espadrille','salto'],
    pageKeywords: ['gáspea','gaspea','cabedal','sola','palmilha','solado','upper','sole','insole','salto','entressola','sbs'],
  },
  bags: {
    label: 'Bolsas e carteiras', icon: '👜',
    urlKeywords: ['bolsa','bolsas','bag','bags','carteira','carteiras','wallet','mochila','backpack','clutch','tote','pochete','crossbody','handbag','purse','sacola'],
    titleKeywords: ['bolsa','carteira','mochila','clutch','tote','pochete','sacola'],
    pageKeywords: ['forro','alça','zíper','compartimento','bolso interno','lining','strap'],
  },
  clothing: {
    label: 'Roupas', icon: '👗',
    urlKeywords: [], titleKeywords: [], pageKeywords: [],
  },
};


// Material databases per category
const MATERIALS = {
  clothing: {},  // usa FIBER_DB do shared.js
  shoes: {
    "couro": { quality:80, durability:90, comfort:76, maintenance:50, travel:70, label:"Couro / Pele genuína", tip:"Durável e elegante mas pesado e sensível à chuva. Trate antes de viajar para clima úmido." },
    "couro genuíno": { quality:80, durability:90, comfort:76, maintenance:50, travel:70, label:"Couro / Pele genuína", tip:"Durável e elegante mas pesado e sensível à chuva. Trate antes de viajar para clima úmido." },
    "couro legítimo": { quality:80, durability:90, comfort:76, maintenance:50, travel:70, label:"Couro / Pele genuína", tip:"Durável e elegante mas pesado e sensível à chuva. Trate antes de viajar para clima úmido." },
    "couro natural": { quality:80, durability:90, comfort:76, maintenance:50, travel:70, label:"Couro / Pele genuína", tip:"Durável e elegante mas pesado e sensível à chuva. Trate antes de viajar para clima úmido." },
    "pele": { quality:80, durability:90, comfort:76, maintenance:50, travel:70, label:"Couro / Pele genuína", tip:"Durável e elegante mas pesado e sensível à chuva. Trate antes de viajar para clima úmido." },
    "pele bovina": { quality:80, durability:90, comfort:76, maintenance:50, travel:70, label:"Couro / Pele genuína", tip:"Durável e elegante mas pesado e sensível à chuva. Trate antes de viajar para clima úmido." },
    "pele ovina": { quality:80, durability:90, comfort:76, maintenance:50, travel:70, label:"Couro / Pele genuína", tip:"Durável e elegante mas pesado e sensível à chuva. Trate antes de viajar para clima úmido." },
    "pele suína": { quality:80, durability:90, comfort:76, maintenance:50, travel:70, label:"Couro / Pele genuína", tip:"Durável e elegante mas pesado e sensível à chuva. Trate antes de viajar para clima úmido." },
    "pele natural": { quality:80, durability:90, comfort:76, maintenance:50, travel:70, label:"Couro / Pele genuína", tip:"Durável e elegante mas pesado e sensível à chuva. Trate antes de viajar para clima úmido." },
    "pele genuína": { quality:80, durability:90, comfort:76, maintenance:50, travel:70, label:"Couro / Pele genuína", tip:"Durável e elegante mas pesado e sensível à chuva. Trate antes de viajar para clima úmido." },
    "leather": { quality:80, durability:90, comfort:76, maintenance:50, travel:70, label:"Couro / Pele genuína", tip:"Durável e elegante mas pesado e sensível à chuva. Trate antes de viajar para clima úmido." },
    "cuir": { quality:80, durability:90, comfort:76, maintenance:50, travel:70, label:"Couro / Pele genuína", tip:"Durável e elegante mas pesado e sensível à chuva. Trate antes de viajar para clima úmido." },
    "full grain": { quality:80, durability:90, comfort:76, maintenance:50, travel:70, label:"Couro / Pele genuína", tip:"Durável e elegante mas pesado e sensível à chuva. Trate antes de viajar para clima úmido." },
    "top grain": { quality:80, durability:90, comfort:76, maintenance:50, travel:70, label:"Couro / Pele genuína", tip:"Durável e elegante mas pesado e sensível à chuva. Trate antes de viajar para clima úmido." },
    "piel": { quality:80, durability:90, comfort:76, maintenance:50, travel:70, label:"Couro / Pele genuína", tip:"Durável e elegante mas pesado e sensível à chuva. Trate antes de viajar para clima úmido." },
    "piel vacuno": { quality:80, durability:90, comfort:76, maintenance:50, travel:70, label:"Couro / Pele genuína", tip:"Durável e elegante mas pesado e sensível à chuva. Trate antes de viajar para clima úmido." },
    "cuero": { quality:80, durability:90, comfort:76, maintenance:50, travel:70, label:"Couro / Pele genuína", tip:"Durável e elegante mas pesado e sensível à chuva. Trate antes de viajar para clima úmido." },
    "pelle": { quality:80, durability:90, comfort:76, maintenance:50, travel:70, label:"Couro / Pele genuína", tip:"Durável e elegante mas pesado e sensível à chuva. Trate antes de viajar para clima úmido." },
    "cuoio": { quality:80, durability:90, comfort:76, maintenance:50, travel:70, label:"Couro / Pele genuína", tip:"Durável e elegante mas pesado e sensível à chuva. Trate antes de viajar para clima úmido." },
    "pleine fleur": { quality:80, durability:90, comfort:76, maintenance:50, travel:70, label:"Couro / Pele genuína", tip:"Durável e elegante mas pesado e sensível à chuva. Trate antes de viajar para clima úmido." },
    "plena flor": { quality:80, durability:90, comfort:76, maintenance:50, travel:70, label:"Couro / Pele genuína", tip:"Durável e elegante mas pesado e sensível à chuva. Trate antes de viajar para clima úmido." },
    "couro sintético": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "couro sintetico": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "sintético": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "sintetico": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "pu": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "synthetic leather": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "faux leather": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "vegan leather": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "poliuretano": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "pele sintética": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "pele sintetica": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "piel sintética": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "piel sintetica": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "polipiel": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "simil piel": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "símil piel": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "similpiel": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "ecopiel": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "eco piel": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "eco-pele": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "ecopele": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "eco pele": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "couro ecológico": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "couro ecologico": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "eco-leather": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "eco leather": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "pu leather": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "leatherette": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "simili cuir": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "similicuir": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "simili-cuir": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "cuir vegan": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "cuir végétal synthétique": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "cuir synthétique": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "cuir synthetique": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "similpelle": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "ecopelle": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "efeito pele": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "efeito couro": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "aspect cuir": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "effet cuir": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "leather-look": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "leather look": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "camurça": { quality:62, durability:60, comfort:80, maintenance:30, travel:40, label:"Camurça / Suede", tip:"Bonita e confortável mas frágil: chuva e manchas arruínam. Evite para viagem em clima úmido." },
    "camurca": { quality:62, durability:60, comfort:80, maintenance:30, travel:40, label:"Camurça / Suede", tip:"Bonita e confortável mas frágil: chuva e manchas arruínam. Evite para viagem em clima úmido." },
    "suede": { quality:62, durability:60, comfort:80, maintenance:30, travel:40, label:"Camurça / Suede", tip:"Bonita e confortável mas frágil: chuva e manchas arruínam. Evite para viagem em clima úmido." },
    "nubuck": { quality:62, durability:60, comfort:80, maintenance:30, travel:40, label:"Camurça / Suede", tip:"Bonita e confortável mas frágil: chuva e manchas arruínam. Evite para viagem em clima úmido." },
    "nobuck": { quality:62, durability:60, comfort:80, maintenance:30, travel:40, label:"Camurça / Suede", tip:"Bonita e confortável mas frágil: chuva e manchas arruínam. Evite para viagem em clima úmido." },
    "serraje": { quality:62, durability:60, comfort:80, maintenance:30, travel:40, label:"Camurça / Suede", tip:"Bonita e confortável mas frágil: chuva e manchas arruínam. Evite para viagem em clima úmido." },
    "croûte de cuir": { quality:62, durability:60, comfort:80, maintenance:30, travel:40, label:"Camurça / Suede", tip:"Bonita e confortável mas frágil: chuva e manchas arruínam. Evite para viagem em clima úmido." },
    "croute de cuir": { quality:62, durability:60, comfort:80, maintenance:30, travel:40, label:"Camurça / Suede", tip:"Bonita e confortável mas frágil: chuva e manchas arruínam. Evite para viagem em clima úmido." },
    "raspa": { quality:62, durability:60, comfort:80, maintenance:30, travel:40, label:"Camurça / Suede", tip:"Bonita e confortável mas frágil: chuva e manchas arruínam. Evite para viagem em clima úmido." },
    "split leather": { quality:62, durability:60, comfort:80, maintenance:30, travel:40, label:"Camurça / Suede", tip:"Bonita e confortável mas frágil: chuva e manchas arruínam. Evite para viagem em clima úmido." },
    "daim": { quality:62, durability:60, comfort:80, maintenance:30, travel:40, label:"Camurça / Suede", tip:"Bonita e confortável mas frágil: chuva e manchas arruínam. Evite para viagem em clima úmido." },
    "lona": { quality:70, durability:70, comfort:74, maintenance:80, travel:80, label:"Lona / Canvas", tip:"Leve, lavável e versátil — ótimo para bolsas e tênis casuais de viagem. Não impermeável." },
    "canvas": { quality:70, durability:70, comfort:74, maintenance:80, travel:80, label:"Lona / Canvas", tip:"Leve, lavável e versátil — ótimo para bolsas e tênis casuais de viagem. Não impermeável." },
    "têxtil": { quality:70, durability:70, comfort:74, maintenance:80, travel:80, label:"Lona / Canvas", tip:"Leve, lavável e versátil — ótimo para bolsas e tênis casuais de viagem. Não impermeável." },
    "textil": { quality:70, durability:70, comfort:74, maintenance:80, travel:80, label:"Lona / Canvas", tip:"Leve, lavável e versátil — ótimo para bolsas e tênis casuais de viagem. Não impermeável." },
    "tecido": { quality:70, durability:70, comfort:74, maintenance:80, travel:80, label:"Lona / Canvas", tip:"Leve, lavável e versátil — ótimo para bolsas e tênis casuais de viagem. Não impermeável." },
    "toile": { quality:70, durability:70, comfort:74, maintenance:80, travel:80, label:"Lona / Canvas", tip:"Leve, lavável e versátil — ótimo para bolsas e tênis casuais de viagem. Não impermeável." },
    "mesh": { quality:70, durability:70, comfort:74, maintenance:80, travel:80, label:"Lona / Canvas", tip:"Leve, lavável e versátil — ótimo para bolsas e tênis casuais de viagem. Não impermeável." },
    "malha": { quality:70, durability:70, comfort:74, maintenance:80, travel:80, label:"Lona / Canvas", tip:"Leve, lavável e versátil — ótimo para bolsas e tênis casuais de viagem. Não impermeável." },
    "knit": { quality:70, durability:70, comfort:74, maintenance:80, travel:80, label:"Lona / Canvas", tip:"Leve, lavável e versátil — ótimo para bolsas e tênis casuais de viagem. Não impermeável." },
    "nylon balístico": { quality:76, durability:94, comfort:52, maintenance:90, travel:100, label:"Nylon balístico", tip:"O melhor material para malas de viagem: leve, quase indestrutível, resiste água e limpa fácil." },
    "ballistic": { quality:76, durability:94, comfort:52, maintenance:90, travel:100, label:"Nylon balístico", tip:"O melhor material para malas de viagem: leve, quase indestrutível, resiste água e limpa fácil." },
    "cordura": { quality:76, durability:94, comfort:52, maintenance:90, travel:100, label:"Nylon balístico", tip:"O melhor material para malas de viagem: leve, quase indestrutível, resiste água e limpa fácil." },
    "borracha": { quality:73, durability:80, comfort:46, maintenance:90, travel:80, label:"Borracha (solas)", tip:"Sola durável e impermeável; ideal para caminhar muito em viagem. Mais pesada que EVA." },
    "rubber": { quality:73, durability:80, comfort:46, maintenance:90, travel:80, label:"Borracha (solas)", tip:"Sola durável e impermeável; ideal para caminhar muito em viagem. Mais pesada que EVA." },
    "caoutchouc": { quality:73, durability:80, comfort:46, maintenance:90, travel:80, label:"Borracha (solas)", tip:"Sola durável e impermeável; ideal para caminhar muito em viagem. Mais pesada que EVA." },
    "sbs": { quality:73, durability:80, comfort:46, maintenance:90, travel:80, label:"Borracha (solas)", tip:"Sola durável e impermeável; ideal para caminhar muito em viagem. Mais pesada que EVA." },
    "sbr": { quality:73, durability:80, comfort:46, maintenance:90, travel:80, label:"Borracha (solas)", tip:"Sola durável e impermeável; ideal para caminhar muito em viagem. Mais pesada que EVA." },
    "goma": { quality:73, durability:80, comfort:46, maintenance:90, travel:80, label:"Borracha (solas)", tip:"Sola durável e impermeável; ideal para caminhar muito em viagem. Mais pesada que EVA." },
    "caucho": { quality:73, durability:80, comfort:46, maintenance:90, travel:80, label:"Borracha (solas)", tip:"Sola durável e impermeável; ideal para caminhar muito em viagem. Mais pesada que EVA." },
    "eva": { quality:58, durability:50, comfort:66, maintenance:80, travel:90, label:"EVA (entressolas)", tip:"Ultra-leve e confortável para caminhar — ideal em viagem. Perde amortecimento com uso intenso." },
    "etileno": { quality:58, durability:50, comfort:66, maintenance:80, travel:90, label:"EVA (entressolas)", tip:"Ultra-leve e confortável para caminhar — ideal em viagem. Perde amortecimento com uso intenso." },
    "couro vegetal": { quality:51, durability:44, comfort:40, maintenance:80, travel:60, label:"Couro vegetal (cactus/maçã/cogumelo)", tip:"Quase sempre é tecido com plástico (PU) por cima: respira pouco e racha antes do couro. Mais sustentável só na parte vegetal." },
    "cactus": { quality:51, durability:44, comfort:40, maintenance:80, travel:60, label:"Couro vegetal (cactus/maçã/cogumelo)", tip:"Quase sempre é tecido com plástico (PU) por cima: respira pouco e racha antes do couro. Mais sustentável só na parte vegetal." },
    "piñatex": { quality:51, durability:44, comfort:40, maintenance:80, travel:60, label:"Couro vegetal (cactus/maçã/cogumelo)", tip:"Quase sempre é tecido com plástico (PU) por cima: respira pouco e racha antes do couro. Mais sustentável só na parte vegetal." },
    "pinatex": { quality:51, durability:44, comfort:40, maintenance:80, travel:60, label:"Couro vegetal (cactus/maçã/cogumelo)", tip:"Quase sempre é tecido com plástico (PU) por cima: respira pouco e racha antes do couro. Mais sustentável só na parte vegetal." },
    "mylo": { quality:51, durability:44, comfort:40, maintenance:80, travel:60, label:"Couro vegetal (cactus/maçã/cogumelo)", tip:"Quase sempre é tecido com plástico (PU) por cima: respira pouco e racha antes do couro. Mais sustentável só na parte vegetal." },
    "desserto": { quality:51, durability:44, comfort:40, maintenance:80, travel:60, label:"Couro vegetal (cactus/maçã/cogumelo)", tip:"Quase sempre é tecido com plástico (PU) por cima: respira pouco e racha antes do couro. Mais sustentável só na parte vegetal." },
    "maçã": { quality:51, durability:44, comfort:40, maintenance:80, travel:60, label:"Couro vegetal (cactus/maçã/cogumelo)", tip:"Quase sempre é tecido com plástico (PU) por cima: respira pouco e racha antes do couro. Mais sustentável só na parte vegetal." },
    "apple leather": { quality:51, durability:44, comfort:40, maintenance:80, travel:60, label:"Couro vegetal (cactus/maçã/cogumelo)", tip:"Quase sempre é tecido com plástico (PU) por cima: respira pouco e racha antes do couro. Mais sustentável só na parte vegetal." },
    "appleskin": { quality:51, durability:44, comfort:40, maintenance:80, travel:60, label:"Couro vegetal (cactus/maçã/cogumelo)", tip:"Quase sempre é tecido com plástico (PU) por cima: respira pouco e racha antes do couro. Mais sustentável só na parte vegetal." },
    "vegea": { quality:51, durability:44, comfort:40, maintenance:80, travel:60, label:"Couro vegetal (cactus/maçã/cogumelo)", tip:"Quase sempre é tecido com plástico (PU) por cima: respira pouco e racha antes do couro. Mais sustentável só na parte vegetal." },
    "bonded leather": { quality:31, durability:24, comfort:32, maintenance:70, travel:40, label:"Couro reconstituído (bonded)", tip:"Apesar do nome, não é couro: são aparas coladas com plástico por cima. Descasca e racha mais cedo que o couro sintético comum." },
    "couro reconstituído": { quality:31, durability:24, comfort:32, maintenance:70, travel:40, label:"Couro reconstituído (bonded)", tip:"Apesar do nome, não é couro: são aparas coladas com plástico por cima. Descasca e racha mais cedo que o couro sintético comum." },
    "couro reconstituido": { quality:31, durability:24, comfort:32, maintenance:70, travel:40, label:"Couro reconstituído (bonded)", tip:"Apesar do nome, não é couro: são aparas coladas com plástico por cima. Descasca e racha mais cedo que o couro sintético comum." },
    "cuero regenerado": { quality:31, durability:24, comfort:32, maintenance:70, travel:40, label:"Couro reconstituído (bonded)", tip:"Apesar do nome, não é couro: são aparas coladas com plástico por cima. Descasca e racha mais cedo que o couro sintético comum." },
    "cuero reconstituido": { quality:31, durability:24, comfort:32, maintenance:70, travel:40, label:"Couro reconstituído (bonded)", tip:"Apesar do nome, não é couro: são aparas coladas com plástico por cima. Descasca e racha mais cedo que o couro sintético comum." },
    "cuir reconstitué": { quality:31, durability:24, comfort:32, maintenance:70, travel:40, label:"Couro reconstituído (bonded)", tip:"Apesar do nome, não é couro: são aparas coladas com plástico por cima. Descasca e racha mais cedo que o couro sintético comum." },
    "cuir reconstitue": { quality:31, durability:24, comfort:32, maintenance:70, travel:40, label:"Couro reconstituído (bonded)", tip:"Apesar do nome, não é couro: são aparas coladas com plástico por cima. Descasca e racha mais cedo que o couro sintético comum." },
    "recycled leather": { quality:31, durability:24, comfort:32, maintenance:70, travel:40, label:"Couro reconstituído (bonded)", tip:"Apesar do nome, não é couro: são aparas coladas com plástico por cima. Descasca e racha mais cedo que o couro sintético comum." },
    "couro regenerado": { quality:31, durability:24, comfort:32, maintenance:70, travel:40, label:"Couro reconstituído (bonded)", tip:"Apesar do nome, não é couro: são aparas coladas com plástico por cima. Descasca e racha mais cedo que o couro sintético comum." },
    "pvc": { quality:32, durability:38, comfort:22, maintenance:90, travel:50, label:"PVC / Vinil", tip:"Impermeável e fácil de limpar, mas não respira e com o tempo endurece e racha." },
    "vinil": { quality:32, durability:38, comfort:22, maintenance:90, travel:50, label:"PVC / Vinil", tip:"Impermeável e fácil de limpar, mas não respira e com o tempo endurece e racha." },
    "vinyl": { quality:32, durability:38, comfort:22, maintenance:90, travel:50, label:"PVC / Vinil", tip:"Impermeável e fácil de limpar, mas não respira e com o tempo endurece e racha." },
    "policloreto de vinilo": { quality:32, durability:38, comfort:22, maintenance:90, travel:50, label:"PVC / Vinil", tip:"Impermeável e fácil de limpar, mas não respira e com o tempo endurece e racha." },
    "policloreto de vinila": { quality:32, durability:38, comfort:22, maintenance:90, travel:50, label:"PVC / Vinil", tip:"Impermeável e fácil de limpar, mas não respira e com o tempo endurece e racha." },
  },
  bags: {
    "couro": { quality:80, durability:90, comfort:76, maintenance:50, travel:70, label:"Couro / Pele genuína", tip:"Durável e elegante mas pesado e sensível à chuva. Trate antes de viajar para clima úmido." },
    "couro genuíno": { quality:80, durability:90, comfort:76, maintenance:50, travel:70, label:"Couro / Pele genuína", tip:"Durável e elegante mas pesado e sensível à chuva. Trate antes de viajar para clima úmido." },
    "couro legítimo": { quality:80, durability:90, comfort:76, maintenance:50, travel:70, label:"Couro / Pele genuína", tip:"Durável e elegante mas pesado e sensível à chuva. Trate antes de viajar para clima úmido." },
    "couro natural": { quality:80, durability:90, comfort:76, maintenance:50, travel:70, label:"Couro / Pele genuína", tip:"Durável e elegante mas pesado e sensível à chuva. Trate antes de viajar para clima úmido." },
    "pele": { quality:80, durability:90, comfort:76, maintenance:50, travel:70, label:"Couro / Pele genuína", tip:"Durável e elegante mas pesado e sensível à chuva. Trate antes de viajar para clima úmido." },
    "pele bovina": { quality:80, durability:90, comfort:76, maintenance:50, travel:70, label:"Couro / Pele genuína", tip:"Durável e elegante mas pesado e sensível à chuva. Trate antes de viajar para clima úmido." },
    "pele ovina": { quality:80, durability:90, comfort:76, maintenance:50, travel:70, label:"Couro / Pele genuína", tip:"Durável e elegante mas pesado e sensível à chuva. Trate antes de viajar para clima úmido." },
    "pele suína": { quality:80, durability:90, comfort:76, maintenance:50, travel:70, label:"Couro / Pele genuína", tip:"Durável e elegante mas pesado e sensível à chuva. Trate antes de viajar para clima úmido." },
    "pele natural": { quality:80, durability:90, comfort:76, maintenance:50, travel:70, label:"Couro / Pele genuína", tip:"Durável e elegante mas pesado e sensível à chuva. Trate antes de viajar para clima úmido." },
    "pele genuína": { quality:80, durability:90, comfort:76, maintenance:50, travel:70, label:"Couro / Pele genuína", tip:"Durável e elegante mas pesado e sensível à chuva. Trate antes de viajar para clima úmido." },
    "leather": { quality:80, durability:90, comfort:76, maintenance:50, travel:70, label:"Couro / Pele genuína", tip:"Durável e elegante mas pesado e sensível à chuva. Trate antes de viajar para clima úmido." },
    "cuir": { quality:80, durability:90, comfort:76, maintenance:50, travel:70, label:"Couro / Pele genuína", tip:"Durável e elegante mas pesado e sensível à chuva. Trate antes de viajar para clima úmido." },
    "full grain": { quality:80, durability:90, comfort:76, maintenance:50, travel:70, label:"Couro / Pele genuína", tip:"Durável e elegante mas pesado e sensível à chuva. Trate antes de viajar para clima úmido." },
    "top grain": { quality:80, durability:90, comfort:76, maintenance:50, travel:70, label:"Couro / Pele genuína", tip:"Durável e elegante mas pesado e sensível à chuva. Trate antes de viajar para clima úmido." },
    "piel": { quality:80, durability:90, comfort:76, maintenance:50, travel:70, label:"Couro / Pele genuína", tip:"Durável e elegante mas pesado e sensível à chuva. Trate antes de viajar para clima úmido." },
    "piel vacuno": { quality:80, durability:90, comfort:76, maintenance:50, travel:70, label:"Couro / Pele genuína", tip:"Durável e elegante mas pesado e sensível à chuva. Trate antes de viajar para clima úmido." },
    "cuero": { quality:80, durability:90, comfort:76, maintenance:50, travel:70, label:"Couro / Pele genuína", tip:"Durável e elegante mas pesado e sensível à chuva. Trate antes de viajar para clima úmido." },
    "pelle": { quality:80, durability:90, comfort:76, maintenance:50, travel:70, label:"Couro / Pele genuína", tip:"Durável e elegante mas pesado e sensível à chuva. Trate antes de viajar para clima úmido." },
    "cuoio": { quality:80, durability:90, comfort:76, maintenance:50, travel:70, label:"Couro / Pele genuína", tip:"Durável e elegante mas pesado e sensível à chuva. Trate antes de viajar para clima úmido." },
    "pleine fleur": { quality:80, durability:90, comfort:76, maintenance:50, travel:70, label:"Couro / Pele genuína", tip:"Durável e elegante mas pesado e sensível à chuva. Trate antes de viajar para clima úmido." },
    "plena flor": { quality:80, durability:90, comfort:76, maintenance:50, travel:70, label:"Couro / Pele genuína", tip:"Durável e elegante mas pesado e sensível à chuva. Trate antes de viajar para clima úmido." },
    "couro sintético": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "couro sintetico": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "sintético": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "sintetico": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "pu": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "synthetic leather": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "faux leather": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "vegan leather": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "poliuretano": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "pele sintética": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "pele sintetica": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "piel sintética": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "piel sintetica": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "polipiel": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "simil piel": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "símil piel": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "similpiel": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "ecopiel": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "eco piel": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "eco-pele": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "ecopele": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "eco pele": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "couro ecológico": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "couro ecologico": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "eco-leather": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "eco leather": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "pu leather": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "leatherette": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "simili cuir": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "similicuir": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "simili-cuir": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "cuir vegan": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "cuir végétal synthétique": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "cuir synthétique": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "cuir synthetique": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "similpelle": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "ecopelle": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "efeito pele": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "efeito couro": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "aspect cuir": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "effet cuir": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "leather-look": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "leather look": { quality:44, durability:44, comfort:38, maintenance:80, travel:60, label:"Couro sintético (PU)", tip:"Leve, resiste à água e fácil de limpar, mas racha com uso intenso e não respira." },
    "camurça": { quality:62, durability:60, comfort:80, maintenance:30, travel:40, label:"Camurça / Suede", tip:"Bonita e confortável mas frágil: chuva e manchas arruínam. Evite para viagem em clima úmido." },
    "camurca": { quality:62, durability:60, comfort:80, maintenance:30, travel:40, label:"Camurça / Suede", tip:"Bonita e confortável mas frágil: chuva e manchas arruínam. Evite para viagem em clima úmido." },
    "suede": { quality:62, durability:60, comfort:80, maintenance:30, travel:40, label:"Camurça / Suede", tip:"Bonita e confortável mas frágil: chuva e manchas arruínam. Evite para viagem em clima úmido." },
    "nubuck": { quality:62, durability:60, comfort:80, maintenance:30, travel:40, label:"Camurça / Suede", tip:"Bonita e confortável mas frágil: chuva e manchas arruínam. Evite para viagem em clima úmido." },
    "nobuck": { quality:62, durability:60, comfort:80, maintenance:30, travel:40, label:"Camurça / Suede", tip:"Bonita e confortável mas frágil: chuva e manchas arruínam. Evite para viagem em clima úmido." },
    "serraje": { quality:62, durability:60, comfort:80, maintenance:30, travel:40, label:"Camurça / Suede", tip:"Bonita e confortável mas frágil: chuva e manchas arruínam. Evite para viagem em clima úmido." },
    "croûte de cuir": { quality:62, durability:60, comfort:80, maintenance:30, travel:40, label:"Camurça / Suede", tip:"Bonita e confortável mas frágil: chuva e manchas arruínam. Evite para viagem em clima úmido." },
    "croute de cuir": { quality:62, durability:60, comfort:80, maintenance:30, travel:40, label:"Camurça / Suede", tip:"Bonita e confortável mas frágil: chuva e manchas arruínam. Evite para viagem em clima úmido." },
    "raspa": { quality:62, durability:60, comfort:80, maintenance:30, travel:40, label:"Camurça / Suede", tip:"Bonita e confortável mas frágil: chuva e manchas arruínam. Evite para viagem em clima úmido." },
    "split leather": { quality:62, durability:60, comfort:80, maintenance:30, travel:40, label:"Camurça / Suede", tip:"Bonita e confortável mas frágil: chuva e manchas arruínam. Evite para viagem em clima úmido." },
    "daim": { quality:62, durability:60, comfort:80, maintenance:30, travel:40, label:"Camurça / Suede", tip:"Bonita e confortável mas frágil: chuva e manchas arruínam. Evite para viagem em clima úmido." },
    "lona": { quality:70, durability:70, comfort:74, maintenance:80, travel:80, label:"Lona / Canvas", tip:"Leve, lavável e versátil — ótimo para bolsas e tênis casuais de viagem. Não impermeável." },
    "canvas": { quality:70, durability:70, comfort:74, maintenance:80, travel:80, label:"Lona / Canvas", tip:"Leve, lavável e versátil — ótimo para bolsas e tênis casuais de viagem. Não impermeável." },
    "têxtil": { quality:70, durability:70, comfort:74, maintenance:80, travel:80, label:"Lona / Canvas", tip:"Leve, lavável e versátil — ótimo para bolsas e tênis casuais de viagem. Não impermeável." },
    "textil": { quality:70, durability:70, comfort:74, maintenance:80, travel:80, label:"Lona / Canvas", tip:"Leve, lavável e versátil — ótimo para bolsas e tênis casuais de viagem. Não impermeável." },
    "tecido": { quality:70, durability:70, comfort:74, maintenance:80, travel:80, label:"Lona / Canvas", tip:"Leve, lavável e versátil — ótimo para bolsas e tênis casuais de viagem. Não impermeável." },
    "toile": { quality:70, durability:70, comfort:74, maintenance:80, travel:80, label:"Lona / Canvas", tip:"Leve, lavável e versátil — ótimo para bolsas e tênis casuais de viagem. Não impermeável." },
    "mesh": { quality:70, durability:70, comfort:74, maintenance:80, travel:80, label:"Lona / Canvas", tip:"Leve, lavável e versátil — ótimo para bolsas e tênis casuais de viagem. Não impermeável." },
    "malha": { quality:70, durability:70, comfort:74, maintenance:80, travel:80, label:"Lona / Canvas", tip:"Leve, lavável e versátil — ótimo para bolsas e tênis casuais de viagem. Não impermeável." },
    "knit": { quality:70, durability:70, comfort:74, maintenance:80, travel:80, label:"Lona / Canvas", tip:"Leve, lavável e versátil — ótimo para bolsas e tênis casuais de viagem. Não impermeável." },
    "nylon balístico": { quality:76, durability:94, comfort:52, maintenance:90, travel:100, label:"Nylon balístico", tip:"O melhor material para malas de viagem: leve, quase indestrutível, resiste água e limpa fácil." },
    "ballistic": { quality:76, durability:94, comfort:52, maintenance:90, travel:100, label:"Nylon balístico", tip:"O melhor material para malas de viagem: leve, quase indestrutível, resiste água e limpa fácil." },
    "cordura": { quality:76, durability:94, comfort:52, maintenance:90, travel:100, label:"Nylon balístico", tip:"O melhor material para malas de viagem: leve, quase indestrutível, resiste água e limpa fácil." },
    "borracha": { quality:73, durability:80, comfort:46, maintenance:90, travel:80, label:"Borracha (solas)", tip:"Sola durável e impermeável; ideal para caminhar muito em viagem. Mais pesada que EVA." },
    "rubber": { quality:73, durability:80, comfort:46, maintenance:90, travel:80, label:"Borracha (solas)", tip:"Sola durável e impermeável; ideal para caminhar muito em viagem. Mais pesada que EVA." },
    "caoutchouc": { quality:73, durability:80, comfort:46, maintenance:90, travel:80, label:"Borracha (solas)", tip:"Sola durável e impermeável; ideal para caminhar muito em viagem. Mais pesada que EVA." },
    "sbs": { quality:73, durability:80, comfort:46, maintenance:90, travel:80, label:"Borracha (solas)", tip:"Sola durável e impermeável; ideal para caminhar muito em viagem. Mais pesada que EVA." },
    "sbr": { quality:73, durability:80, comfort:46, maintenance:90, travel:80, label:"Borracha (solas)", tip:"Sola durável e impermeável; ideal para caminhar muito em viagem. Mais pesada que EVA." },
    "goma": { quality:73, durability:80, comfort:46, maintenance:90, travel:80, label:"Borracha (solas)", tip:"Sola durável e impermeável; ideal para caminhar muito em viagem. Mais pesada que EVA." },
    "caucho": { quality:73, durability:80, comfort:46, maintenance:90, travel:80, label:"Borracha (solas)", tip:"Sola durável e impermeável; ideal para caminhar muito em viagem. Mais pesada que EVA." },
    "eva": { quality:58, durability:50, comfort:66, maintenance:80, travel:90, label:"EVA (entressolas)", tip:"Ultra-leve e confortável para caminhar — ideal em viagem. Perde amortecimento com uso intenso." },
    "etileno": { quality:58, durability:50, comfort:66, maintenance:80, travel:90, label:"EVA (entressolas)", tip:"Ultra-leve e confortável para caminhar — ideal em viagem. Perde amortecimento com uso intenso." },
    "couro vegetal": { quality:51, durability:44, comfort:40, maintenance:80, travel:60, label:"Couro vegetal (cactus/maçã/cogumelo)", tip:"Quase sempre é tecido com plástico (PU) por cima: respira pouco e racha antes do couro. Mais sustentável só na parte vegetal." },
    "cactus": { quality:51, durability:44, comfort:40, maintenance:80, travel:60, label:"Couro vegetal (cactus/maçã/cogumelo)", tip:"Quase sempre é tecido com plástico (PU) por cima: respira pouco e racha antes do couro. Mais sustentável só na parte vegetal." },
    "piñatex": { quality:51, durability:44, comfort:40, maintenance:80, travel:60, label:"Couro vegetal (cactus/maçã/cogumelo)", tip:"Quase sempre é tecido com plástico (PU) por cima: respira pouco e racha antes do couro. Mais sustentável só na parte vegetal." },
    "pinatex": { quality:51, durability:44, comfort:40, maintenance:80, travel:60, label:"Couro vegetal (cactus/maçã/cogumelo)", tip:"Quase sempre é tecido com plástico (PU) por cima: respira pouco e racha antes do couro. Mais sustentável só na parte vegetal." },
    "mylo": { quality:51, durability:44, comfort:40, maintenance:80, travel:60, label:"Couro vegetal (cactus/maçã/cogumelo)", tip:"Quase sempre é tecido com plástico (PU) por cima: respira pouco e racha antes do couro. Mais sustentável só na parte vegetal." },
    "desserto": { quality:51, durability:44, comfort:40, maintenance:80, travel:60, label:"Couro vegetal (cactus/maçã/cogumelo)", tip:"Quase sempre é tecido com plástico (PU) por cima: respira pouco e racha antes do couro. Mais sustentável só na parte vegetal." },
    "maçã": { quality:51, durability:44, comfort:40, maintenance:80, travel:60, label:"Couro vegetal (cactus/maçã/cogumelo)", tip:"Quase sempre é tecido com plástico (PU) por cima: respira pouco e racha antes do couro. Mais sustentável só na parte vegetal." },
    "apple leather": { quality:51, durability:44, comfort:40, maintenance:80, travel:60, label:"Couro vegetal (cactus/maçã/cogumelo)", tip:"Quase sempre é tecido com plástico (PU) por cima: respira pouco e racha antes do couro. Mais sustentável só na parte vegetal." },
    "appleskin": { quality:51, durability:44, comfort:40, maintenance:80, travel:60, label:"Couro vegetal (cactus/maçã/cogumelo)", tip:"Quase sempre é tecido com plástico (PU) por cima: respira pouco e racha antes do couro. Mais sustentável só na parte vegetal." },
    "vegea": { quality:51, durability:44, comfort:40, maintenance:80, travel:60, label:"Couro vegetal (cactus/maçã/cogumelo)", tip:"Quase sempre é tecido com plástico (PU) por cima: respira pouco e racha antes do couro. Mais sustentável só na parte vegetal." },
    "bonded leather": { quality:31, durability:24, comfort:32, maintenance:70, travel:40, label:"Couro reconstituído (bonded)", tip:"Apesar do nome, não é couro: são aparas coladas com plástico por cima. Descasca e racha mais cedo que o couro sintético comum." },
    "couro reconstituído": { quality:31, durability:24, comfort:32, maintenance:70, travel:40, label:"Couro reconstituído (bonded)", tip:"Apesar do nome, não é couro: são aparas coladas com plástico por cima. Descasca e racha mais cedo que o couro sintético comum." },
    "couro reconstituido": { quality:31, durability:24, comfort:32, maintenance:70, travel:40, label:"Couro reconstituído (bonded)", tip:"Apesar do nome, não é couro: são aparas coladas com plástico por cima. Descasca e racha mais cedo que o couro sintético comum." },
    "cuero regenerado": { quality:31, durability:24, comfort:32, maintenance:70, travel:40, label:"Couro reconstituído (bonded)", tip:"Apesar do nome, não é couro: são aparas coladas com plástico por cima. Descasca e racha mais cedo que o couro sintético comum." },
    "cuero reconstituido": { quality:31, durability:24, comfort:32, maintenance:70, travel:40, label:"Couro reconstituído (bonded)", tip:"Apesar do nome, não é couro: são aparas coladas com plástico por cima. Descasca e racha mais cedo que o couro sintético comum." },
    "cuir reconstitué": { quality:31, durability:24, comfort:32, maintenance:70, travel:40, label:"Couro reconstituído (bonded)", tip:"Apesar do nome, não é couro: são aparas coladas com plástico por cima. Descasca e racha mais cedo que o couro sintético comum." },
    "cuir reconstitue": { quality:31, durability:24, comfort:32, maintenance:70, travel:40, label:"Couro reconstituído (bonded)", tip:"Apesar do nome, não é couro: são aparas coladas com plástico por cima. Descasca e racha mais cedo que o couro sintético comum." },
    "recycled leather": { quality:31, durability:24, comfort:32, maintenance:70, travel:40, label:"Couro reconstituído (bonded)", tip:"Apesar do nome, não é couro: são aparas coladas com plástico por cima. Descasca e racha mais cedo que o couro sintético comum." },
    "couro regenerado": { quality:31, durability:24, comfort:32, maintenance:70, travel:40, label:"Couro reconstituído (bonded)", tip:"Apesar do nome, não é couro: são aparas coladas com plástico por cima. Descasca e racha mais cedo que o couro sintético comum." },
    "pvc": { quality:32, durability:38, comfort:22, maintenance:90, travel:50, label:"PVC / Vinil", tip:"Impermeável e fácil de limpar, mas não respira e com o tempo endurece e racha." },
    "vinil": { quality:32, durability:38, comfort:22, maintenance:90, travel:50, label:"PVC / Vinil", tip:"Impermeável e fácil de limpar, mas não respira e com o tempo endurece e racha." },
    "vinyl": { quality:32, durability:38, comfort:22, maintenance:90, travel:50, label:"PVC / Vinil", tip:"Impermeável e fácil de limpar, mas não respira e com o tempo endurece e racha." },
    "policloreto de vinilo": { quality:32, durability:38, comfort:22, maintenance:90, travel:50, label:"PVC / Vinil", tip:"Impermeável e fácil de limpar, mas não respira e com o tempo endurece e racha." },
    "policloreto de vinila": { quality:32, durability:38, comfort:22, maintenance:90, travel:50, label:"PVC / Vinil", tip:"Impermeável e fácil de limpar, mas não respira e com o tempo endurece e racha." },
  },
};


// Detect category from page content
function detectCategory(pageText, pageUrl, pageTitle) {
  const url   = pageUrl.toLowerCase();
  const title = pageTitle.toLowerCase();
  const desc  = pageText.toLowerCase().slice(0, 2000);

  // Sinais inequívocos de calçado — estas palavras só aparecem em sapatos
  const strongShoeSignals = ['gáspea','gaspea','cabedal','palmilha','solado','entressola'];
  if (strongShoeSignals.filter(k => desc.includes(k)).length >= 1) return 'shoes';
  // Sinais em inglês: "upper" + "sole" (ou "outsole/insole") juntos = calçado de certeza
  const hasUpper = /\bupper\b\s*:|\bupper\b\s*\d/.test(desc);
  const hasSole  = /\b(out)?sole\b|\binsole\b/.test(desc);
  if (hasUpper && hasSole) return 'shoes';

  // Casa a palavra inteira, não como substring — evita "bag" dentro de "baggy",
  // "tote" dentro de "totep...", etc. Acentos contam como parte da palavra.
  const hasWord = (haystack, word) => {
    const esc = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|[^a-zà-ÿ])${esc}([^a-zà-ÿ]|$)`, 'i').test(haystack);
  };

  const scores = { shoes: 0, bags: 0 };
  for (const [cat, data] of [['shoes', CATEGORY_SIGNALS.shoes], ['bags', CATEGORY_SIGNALS.bags]]) {
    data.urlKeywords.forEach(k  => { if (hasWord(url, k))   scores[cat] += 3; });
    data.titleKeywords.forEach(k => { if (hasWord(title, k)) scores[cat] += 2; });
    if (scores[cat] > 0) data.pageKeywords.forEach(k => { if (hasWord(desc, k)) scores[cat] += 1; });
  }

  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return (best && best[1] >= 2) ? best[0] : 'clothing';
}


// Get material data for a given name and category
function getMaterialData(name, category) {
  const db = MATERIALS[category] || {};
  const norm = name.toLowerCase().trim();
  // Exact match
  if (db[norm]) return db[norm];
  // Partial match
  const key = Object.keys(db).find(k => norm.includes(k) || k.includes(norm));
  if (key) return db[key];
  // Fallback to clothing fibers
  return null;
}

// Category-specific scoring weights
const CATEGORY_WEIGHTS = {
  clothing:   { quality:0.25, comfort:0.20, durability:0.20, versatility:0.15, maintenance:0.10, costBenefit:0.10 },
  shoes:      { quality:0.30, comfort:0.25, durability:0.25, versatility:0.10, maintenance:0.05, costBenefit:0.05 },
  bags:       { quality:0.35, comfort:0.10, durability:0.35, versatility:0.10, maintenance:0.05, costBenefit:0.05 },
  accessories:{ quality:0.30, comfort:0.15, durability:0.25, versatility:0.15, maintenance:0.10, costBenefit:0.05 },
  lingerie:   { quality:0.20, comfort:0.35, durability:0.15, versatility:0.10, maintenance:0.15, costBenefit:0.05 },
  activewear: { quality:0.20, comfort:0.25, durability:0.20, versatility:0.15, maintenance:0.15, costBenefit:0.05 },
};

// Category-specific conclusion copy
function getCategoryConclusion(scores, category, mainMaterial) {
  const mat = mainMaterial || 'esse material';
  const o = scores.overall;
  if (category === 'shoes') {
    if (o >= 80) return `${mat} num calçado é garantia — confortável, resistente e envelhece bem. Compensa.`;
    if (o >= 65) return `${mat} aqui é uma boa escolha pro casual. Não espere anos, mas pelo preço certo vale.`;
    if (o >= 50) return `Material sintético que tende a rachar ou descascar com o tempo. Veja se o preço justifica.`;
    return `Esse material vai desgastar rápido num calçado. Dá pra achar coisa melhor.`;
  }
  if (category === 'bags') {
    if (o >= 80) return `${mat} numa bolsa é aquele tipo que dura e ganha personalidade com o uso. Boa escolha.`;
    if (o >= 65) return `Boa escolha pro uso frequente. Não invista muito se for tendência passageira.`;
    if (o >= 50) return `Material sintético que descasca com o tempo. Boa pra ocasião, não pra peça-chave.`;
    return `Esse material vai deteriorar rápido. O visual não acompanha o tempo.`;
  }
  if (o >= 80) return `${mat} segura bem a peça. Se você usa bastante, compensa de verdade.`;
  if (o >= 65) return `${mat} é uma boa escolha, com bom custo-benefício.`;
  if (o >= 50) return `Funciona pro casual, mas a durabilidade pode decepcionar. Veja o preço.`;
  return `Tende a desgastar rápido. Por esse valor dá pra achar coisa melhor.`;
}
