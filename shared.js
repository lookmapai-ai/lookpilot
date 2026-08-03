// shared.js — fonte única de verdade para toda a lógica partilhada
// Carregado antes de content.js e popup.js

// ─── URL Classification ───────────────────────────────────────────
const URL_PRODUCT_SIGNALS = [
  // Any .html with a product-style code at the end (Zara: -p07969224.html, -l1152.html)
  url => /-[a-z]?\d{3,}\.html/.test(url),
  url => url.includes('.html') && /[pl]\d{3,}/.test(url),
  url => /\/p\d+/.test(url),
  url => /-p0\d{4,}/.test(url),
  url => /-\d{6,}\.html/.test(url),
  url => /\/[a-z0-9-]+-\d{6,}/.test(url),
  url => /\/product\//.test(url),
  url => /\/produto\//.test(url),
  url => /\/item\//.test(url),
  url => /productId=/.test(url),
  url => /itemId=/.test(url),
  url => /\/[a-z0-9-]+_\d{5,}/.test(url),
  url => /\/p\/[a-z]/.test(url),
  url => /\/\d{7,}(\/|$)/.test(url),
];

const URL_LISTING_SIGNALS = [
  url => /^\/(pt|en|es|fr|de|it)?\/?$/.test(new URL(url).pathname),
  url => /\/(woman|man|kids|baby|home|beauty|accessories|lingerie|sale|new-in|novidades)\/?$/.test(url),
  url => /\/(collection|colecao|category|categoria|search|pesquisa)/.test(url),
  url => /[?&](q|query|search|cat|category)=/.test(url),
  url => /\/(cart|checkout|bag|cesto|wishlist|account|conta|login)/.test(url),
  url => /\/(lookbook|campaign|video|news|stores|lojas|magazine)/.test(url),
];

const FASHION_DOMAINS = [
  'zara.com','mango.com','shop.mango.com','mangooutlet.com',
  'hm.com','massimodutti.com','pullandbear.com','bershka.com',
  'stradivarius.com','uniqlo.com','shein.com','primark.com',
  'reserved.com','weekday.com','cos.com','arket.com','stories.com',
  'monki.com','asos.com','net-a-porter.com','farfetch.com',
  'zalando.com','zalando.pt','aboutyou.com',
];

function classifyUrl(href) {
  try {
    const u = new URL(href);
    const domain = u.hostname.replace('www.','');
    const path = u.pathname + u.search;
    const full = path;
    const isFashion = FASHION_DOMAINS.some(d => domain.includes(d));
    const isListing = URL_LISTING_SIGNALS.some(fn => { try { return fn(href); } catch(e){ return false; } });
    const isProduct = !isListing && URL_PRODUCT_SIGNALS.some(fn => { try { return fn(full); } catch(e){ return false; } });
    return { isFashion, isProduct, isListing };
  } catch(e) {
    return { isFashion: false, isProduct: false, isListing: false };
  }
}

// ─── Fiber Database ───────────────────────────────────────────────
// FIBER_DB gerado da base técnica fibers.json — NÃO editar à mão
// FIBER_DB gerado da base técnica fibers.json — NÃO editar à mão
const FIBER_DB = {
  "algodão": { quality:66, comfort:90, durability:62, maintenance:80, travel:72, type:'natural', label:"Algodão", tip:"Confortável e versátil mas amassa e seca devagar. Leve peças que disfarçam vincos.", p:{ bol:7, ama:3, sec:3, cal:4, res:9, pes:5, sus:5 }, s:{ verao:9, inverno:3, cabine:0 } },
  "algodao": { quality:66, comfort:90, durability:62, maintenance:80, travel:72, type:'natural', label:"Algodão", tip:"Confortável e versátil mas amassa e seca devagar. Leve peças que disfarçam vincos.", p:{ bol:7, ama:3, sec:3, cal:4, res:9, pes:5, sus:5 }, s:{ verao:9, inverno:3, cabine:0 } },
  "cotton": { quality:66, comfort:90, durability:62, maintenance:80, travel:72, type:'natural', label:"Algodão", tip:"Confortável e versátil mas amassa e seca devagar. Leve peças que disfarçam vincos.", p:{ bol:7, ama:3, sec:3, cal:4, res:9, pes:5, sus:5 }, s:{ verao:9, inverno:3, cabine:0 } },
  "coton": { quality:66, comfort:90, durability:62, maintenance:80, travel:72, type:'natural', label:"Algodão", tip:"Confortável e versátil mas amassa e seca devagar. Leve peças que disfarçam vincos.", p:{ bol:7, ama:3, sec:3, cal:4, res:9, pes:5, sus:5 }, s:{ verao:9, inverno:3, cabine:0 } },
  "poliéster": { quality:65, comfort:36, durability:80, maintenance:90, travel:90, type:'synthetic', label:"Poliéster", tip:"Excelente para viagem — não amassa, seca rápido, leve. Limitação é a baixa respirabilidade em calor.", p:{ bol:4, ama:8, sec:9, cal:5, res:3, pes:7, sus:3 }, s:{ verao:3, inverno:6, cabine:1 } },
  "poliester": { quality:65, comfort:36, durability:80, maintenance:90, travel:90, type:'synthetic', label:"Poliéster", tip:"Excelente para viagem — não amassa, seca rápido, leve. Limitação é a baixa respirabilidade em calor.", p:{ bol:4, ama:8, sec:9, cal:5, res:3, pes:7, sus:3 }, s:{ verao:3, inverno:6, cabine:1 } },
  "polyester": { quality:65, comfort:36, durability:80, maintenance:90, travel:90, type:'synthetic', label:"Poliéster", tip:"Excelente para viagem — não amassa, seca rápido, leve. Limitação é a baixa respirabilidade em calor.", p:{ bol:4, ama:8, sec:9, cal:5, res:3, pes:7, sus:3 }, s:{ verao:3, inverno:6, cabine:1 } },
  "lã": { quality:72, comfort:82, durability:66, maintenance:48, travel:72, type:'natural', label:"Lã", tip:"Não amassa e regula odor (pode usar várias vezes sem lavar), mas é volumosa e seca devagar. Merino é a melhor para viagem.", p:{ bol:5, ama:8, sec:3, cal:9, res:8, pes:5, sus:6 }, s:{ verao:2, inverno:9, cabine:0 } },
  "la ": { quality:72, comfort:82, durability:66, maintenance:48, travel:72, type:'natural', label:"Lã", tip:"Não amassa e regula odor (pode usar várias vezes sem lavar), mas é volumosa e seca devagar. Merino é a melhor para viagem.", p:{ bol:5, ama:8, sec:3, cal:9, res:8, pes:5, sus:6 }, s:{ verao:2, inverno:9, cabine:0 } },
  "lã ": { quality:72, comfort:82, durability:66, maintenance:48, travel:72, type:'natural', label:"Lã", tip:"Não amassa e regula odor (pode usar várias vezes sem lavar), mas é volumosa e seca devagar. Merino é a melhor para viagem.", p:{ bol:5, ama:8, sec:3, cal:9, res:8, pes:5, sus:6 }, s:{ verao:2, inverno:9, cabine:0 } },
  "wool": { quality:72, comfort:82, durability:66, maintenance:48, travel:72, type:'natural', label:"Lã", tip:"Não amassa e regula odor (pode usar várias vezes sem lavar), mas é volumosa e seca devagar. Merino é a melhor para viagem.", p:{ bol:5, ama:8, sec:3, cal:9, res:8, pes:5, sus:6 }, s:{ verao:2, inverno:9, cabine:0 } },
  "laine": { quality:72, comfort:82, durability:66, maintenance:48, travel:72, type:'natural', label:"Lã", tip:"Não amassa e regula odor (pode usar várias vezes sem lavar), mas é volumosa e seca devagar. Merino é a melhor para viagem.", p:{ bol:5, ama:8, sec:3, cal:9, res:8, pes:5, sus:6 }, s:{ verao:2, inverno:9, cabine:0 } },
  "lyocell": { quality:79, comfort:86, durability:70, maintenance:70, travel:70, type:'semi', label:"Lyocell (TENCEL™)", tip:"Leve, versátil e regula humidade, mas amassa moderado — leve dobrada ou num rolo. Seca mais devagar que sintéticos.", p:{ bol:7, ama:5, sec:5, cal:4, res:8, pes:5, sus:9 }, s:{ verao:8, inverno:4, cabine:1 } },
  "liocel": { quality:79, comfort:86, durability:70, maintenance:70, travel:70, type:'semi', label:"Lyocell (TENCEL™)", tip:"Leve, versátil e regula humidade, mas amassa moderado — leve dobrada ou num rolo. Seca mais devagar que sintéticos.", p:{ bol:7, ama:5, sec:5, cal:4, res:8, pes:5, sus:9 }, s:{ verao:8, inverno:4, cabine:1 } },
  "tencel": { quality:79, comfort:86, durability:70, maintenance:70, travel:70, type:'semi', label:"Lyocell (TENCEL™)", tip:"Leve, versátil e regula humidade, mas amassa moderado — leve dobrada ou num rolo. Seca mais devagar que sintéticos.", p:{ bol:7, ama:5, sec:5, cal:4, res:8, pes:5, sus:9 }, s:{ verao:8, inverno:4, cabine:1 } },
  "viscose": { quality:44, comfort:80, durability:36, maintenance:40, travel:50, type:'semi', label:"Viscose (Rayon)", tip:"Caimento bonito e leve, mas amassa, encolhe e é frágil húmida. Cuidado na lavagem em viagem.", p:{ bol:6, ama:4, sec:5, cal:3, res:8, pes:4, sus:4 }, s:{ verao:8, inverno:3, cabine:1 } },
  "rayon": { quality:44, comfort:80, durability:36, maintenance:40, travel:50, type:'semi', label:"Viscose (Rayon)", tip:"Caimento bonito e leve, mas amassa, encolhe e é frágil húmida. Cuidado na lavagem em viagem.", p:{ bol:6, ama:4, sec:5, cal:3, res:8, pes:4, sus:4 }, s:{ verao:8, inverno:3, cabine:1 } },
  "raiom": { quality:44, comfort:80, durability:36, maintenance:40, travel:50, type:'semi', label:"Viscose (Rayon)", tip:"Caimento bonito e leve, mas amassa, encolhe e é frágil húmida. Cuidado na lavagem em viagem.", p:{ bol:6, ama:4, sec:5, cal:3, res:8, pes:4, sus:4 }, s:{ verao:8, inverno:3, cabine:1 } },
  "linho": { quality:78, comfort:82, durability:80, maintenance:50, travel:75, type:'natural', label:"Linho", tip:"Fresco, leve, durável e seca rápido — mas amassa muito. Aceite os vincos como estética ou leve a vapor.", p:{ bol:8, ama:1, sec:7, cal:3, res:10, pes:4, sus:8 }, s:{ verao:10, inverno:2, cabine:1 } },
  "linen": { quality:78, comfort:82, durability:80, maintenance:50, travel:75, type:'natural', label:"Linho", tip:"Fresco, leve, durável e seca rápido — mas amassa muito. Aceite os vincos como estética ou leve a vapor.", p:{ bol:8, ama:1, sec:7, cal:3, res:10, pes:4, sus:8 }, s:{ verao:10, inverno:2, cabine:1 } },
  "lin ": { quality:78, comfort:82, durability:80, maintenance:50, travel:75, type:'natural', label:"Linho", tip:"Fresco, leve, durável e seca rápido — mas amassa muito. Aceite os vincos como estética ou leve a vapor.", p:{ bol:8, ama:1, sec:7, cal:3, res:10, pes:4, sus:8 }, s:{ verao:10, inverno:2, cabine:1 } },
  "seda": { quality:60, comfort:88, durability:49, maintenance:20, travel:52, type:'natural', label:"Seda", tip:"Leve e elegante, mas delicada: mancha com suor, exige lavagem à mão. Mais para ocasiões que uso intenso.", p:{ bol:7, ama:5, sec:5, cal:6, res:7, pes:3, sus:5 }, s:{ verao:7, inverno:5, cabine:1 } },
  "silk": { quality:60, comfort:88, durability:49, maintenance:20, travel:52, type:'natural', label:"Seda", tip:"Leve e elegante, mas delicada: mancha com suor, exige lavagem à mão. Mais para ocasiões que uso intenso.", p:{ bol:7, ama:5, sec:5, cal:6, res:7, pes:3, sus:5 }, s:{ verao:7, inverno:5, cabine:1 } },
  "soie": { quality:60, comfort:88, durability:49, maintenance:20, travel:52, type:'natural', label:"Seda", tip:"Leve e elegante, mas delicada: mancha com suor, exige lavagem à mão. Mais para ocasiões que uso intenso.", p:{ bol:7, ama:5, sec:5, cal:6, res:7, pes:3, sus:5 }, s:{ verao:7, inverno:5, cabine:1 } },
  "caxemira": { quality:82, comfort:94, durability:50, maintenance:35, travel:72, type:'natural', label:"Caxemira", tip:"Leve, quente e compacta — ótima para viagem fria. Delicada: evite atrito que cause pilling.", p:{ bol:4, ama:7, sec:3, cal:10, res:8, pes:2, sus:4 }, s:{ verao:1, inverno:10, cabine:1 } },
  "cashmere": { quality:82, comfort:94, durability:50, maintenance:35, travel:72, type:'natural', label:"Caxemira", tip:"Leve, quente e compacta — ótima para viagem fria. Delicada: evite atrito que cause pilling.", p:{ bol:4, ama:7, sec:3, cal:10, res:8, pes:2, sus:4 }, s:{ verao:1, inverno:10, cabine:1 } },
  "cachemire": { quality:82, comfort:94, durability:50, maintenance:35, travel:72, type:'natural', label:"Caxemira", tip:"Leve, quente e compacta — ótima para viagem fria. Delicada: evite atrito que cause pilling.", p:{ bol:4, ama:7, sec:3, cal:10, res:8, pes:2, sus:4 }, s:{ verao:1, inverno:10, cabine:1 } },
  "mohair": { quality:74, comfort:78, durability:58, maintenance:35, travel:68, type:'natural', label:"Mohair", tip:"Brilho e calor com pouco peso, mas solta pelos e faz pilling. Delicada — lavagem cuidada." },
  "alpaca": { quality:80, comfort:90, durability:62, maintenance:40, travel:74, type:'natural', label:"Alpaca", tip:"Mais quente e leve que a lã, hipoalergénica e sem pilling fácil. Delicada na lavagem." },
  "lambswool": { quality:74, comfort:86, durability:64, maintenance:45, travel:72, type:'natural', label:"Lã de Cordeiro", tip:"Primeira tosquia do cordeiro — macia, quente e elástica. Mais delicada que lã comum." },
  "lã de cordeiro": { quality:74, comfort:86, durability:64, maintenance:45, travel:72, type:'natural', label:"Lã de Cordeiro", tip:"Primeira tosquia do cordeiro — macia, quente e elástica. Mais delicada que lã comum." },
  "angorá": { quality:70, comfort:90, durability:42, maintenance:25, travel:62, type:'natural', label:"Angorá", tip:"Extremamente macia e quente, mas solta muito pelo e é frágil. Peça de ocasião, não de uso intenso." },
  "modal": { quality:62, comfort:86, durability:54, maintenance:70, travel:70, type:'semi', label:"Modal", tip:"Macio, resistente a lavagens e versátil; amassa moderado. Ótimo para básicos de viagem.", p:{ bol:7, ama:6, sec:5, cal:3, res:8, pes:4, sus:6 }, s:{ verao:8, inverno:3, cabine:1 } },
  "poliamida": { quality:73, comfort:52, durability:87, maintenance:80, travel:80, type:'synthetic', label:"Poliamida (Nylon)", tip:"Muito resistente, leve, seca rápido e não amassa. Limitação é respirabilidade em calor.", p:{ bol:6, ama:8, sec:8, cal:5, res:4, pes:6, sus:3 }, s:{ verao:4, inverno:6, cabine:1 } },
  "polyamide": { quality:73, comfort:52, durability:87, maintenance:80, travel:80, type:'synthetic', label:"Poliamida (Nylon)", tip:"Muito resistente, leve, seca rápido e não amassa. Limitação é respirabilidade em calor.", p:{ bol:6, ama:8, sec:8, cal:5, res:4, pes:6, sus:3 }, s:{ verao:4, inverno:6, cabine:1 } },
  "nylon": { quality:73, comfort:52, durability:87, maintenance:80, travel:80, type:'synthetic', label:"Poliamida (Nylon)", tip:"Muito resistente, leve, seca rápido e não amassa. Limitação é respirabilidade em calor.", p:{ bol:6, ama:8, sec:8, cal:5, res:4, pes:6, sus:3 }, s:{ verao:4, inverno:6, cabine:1 } },
  "nailon": { quality:73, comfort:52, durability:87, maintenance:80, travel:80, type:'synthetic', label:"Poliamida (Nylon)", tip:"Muito resistente, leve, seca rápido e não amassa. Limitação é respirabilidade em calor.", p:{ bol:6, ama:8, sec:8, cal:5, res:4, pes:6, sus:3 }, s:{ verao:4, inverno:6, cabine:1 } },
  "elastano": { quality:46, comfort:48, durability:52, maintenance:60, travel:70, type:'synthetic', label:"Elastano (Lycra/Spandex)", tip:"Em pequena %, dá conforto e ajuste a peças de viagem. Sozinho não se usa.", p:{ bol:6, ama:8, sec:8, cal:4, res:3, pes:5, sus:2 }, s:{ verao:4, inverno:5, cabine:1 } },
  "elastane": { quality:46, comfort:48, durability:52, maintenance:60, travel:70, type:'synthetic', label:"Elastano (Lycra/Spandex)", tip:"Em pequena %, dá conforto e ajuste a peças de viagem. Sozinho não se usa.", p:{ bol:6, ama:8, sec:8, cal:4, res:3, pes:5, sus:2 }, s:{ verao:4, inverno:5, cabine:1 } },
  "spandex": { quality:46, comfort:48, durability:52, maintenance:60, travel:70, type:'synthetic', label:"Elastano (Lycra/Spandex)", tip:"Em pequena %, dá conforto e ajuste a peças de viagem. Sozinho não se usa.", p:{ bol:6, ama:8, sec:8, cal:4, res:3, pes:5, sus:2 }, s:{ verao:4, inverno:5, cabine:1 } },
  "lycra": { quality:46, comfort:48, durability:52, maintenance:60, travel:70, type:'synthetic', label:"Elastano (Lycra/Spandex)", tip:"Em pequena %, dá conforto e ajuste a peças de viagem. Sozinho não se usa.", p:{ bol:6, ama:8, sec:8, cal:4, res:3, pes:5, sus:2 }, s:{ verao:4, inverno:5, cabine:1 } },
  "elastam": { quality:46, comfort:48, durability:52, maintenance:60, travel:70, type:'synthetic', label:"Elastano (Lycra/Spandex)", tip:"Em pequena %, dá conforto e ajuste a peças de viagem. Sozinho não se usa.", p:{ bol:6, ama:8, sec:8, cal:4, res:3, pes:5, sus:2 }, s:{ verao:4, inverno:5, cabine:1 } },
  "acrílico": { quality:38, comfort:42, durability:36, maintenance:70, travel:50, type:'synthetic', label:"Acrílico", tip:"Leve, quente e seca rápido, mas bola rápido e pode abafar. Alternativa econômica à lã.", p:{ bol:2, ama:7, sec:8, cal:7, res:3, pes:5, sus:2 }, s:{ verao:2, inverno:7, cabine:1 } },
  "acrilico": { quality:38, comfort:42, durability:36, maintenance:70, travel:50, type:'synthetic', label:"Acrílico", tip:"Leve, quente e seca rápido, mas bola rápido e pode abafar. Alternativa econômica à lã.", p:{ bol:2, ama:7, sec:8, cal:7, res:3, pes:5, sus:2 }, s:{ verao:2, inverno:7, cabine:1 } },
  "acrylic": { quality:38, comfort:42, durability:36, maintenance:70, travel:50, type:'synthetic', label:"Acrílico", tip:"Leve, quente e seca rápido, mas bola rápido e pode abafar. Alternativa econômica à lã.", p:{ bol:2, ama:7, sec:8, cal:7, res:3, pes:5, sus:2 }, s:{ verao:2, inverno:7, cabine:1 } },
  "acryl": { quality:38, comfort:42, durability:36, maintenance:70, travel:50, type:'synthetic', label:"Acrílico", tip:"Leve, quente e seca rápido, mas bola rápido e pode abafar. Alternativa econômica à lã.", p:{ bol:2, ama:7, sec:8, cal:7, res:3, pes:5, sus:2 }, s:{ verao:2, inverno:7, cabine:1 } },
  "algodão orgânico": { quality:70, comfort:90, durability:62, maintenance:80, travel:60, type:'natural', label:"Algodão Orgânico", tip:"Mesmo comportamento do algodão comum em viagem; vantagem é ambiental, não funcional.", p:{ bol:7, ama:3, sec:3, cal:4, res:9, pes:5, sus:7 }, s:{ verao:9, inverno:3, cabine:0 } },
  "algodao organico": { quality:70, comfort:90, durability:62, maintenance:80, travel:60, type:'natural', label:"Algodão Orgânico", tip:"Mesmo comportamento do algodão comum em viagem; vantagem é ambiental, não funcional.", p:{ bol:7, ama:3, sec:3, cal:4, res:9, pes:5, sus:7 }, s:{ verao:9, inverno:3, cabine:0 } },
  "organic cotton": { quality:70, comfort:90, durability:62, maintenance:80, travel:60, type:'natural', label:"Algodão Orgânico", tip:"Mesmo comportamento do algodão comum em viagem; vantagem é ambiental, não funcional.", p:{ bol:7, ama:3, sec:3, cal:4, res:9, pes:5, sus:7 }, s:{ verao:9, inverno:3, cabine:0 } },
  "poliéster reciclado": { quality:70, comfort:36, durability:80, maintenance:90, travel:90, type:'synthetic', label:"Poliéster Reciclado (rPET)", tip:"Mesmas vantagens de viagem do poliéster virgem, com menor pegada de produção.", p:{ bol:4, ama:8, sec:9, cal:5, res:3, pes:7, sus:5 }, s:{ verao:3, inverno:6, cabine:1 } },
  "poliester reciclado": { quality:70, comfort:36, durability:80, maintenance:90, travel:90, type:'synthetic', label:"Poliéster Reciclado (rPET)", tip:"Mesmas vantagens de viagem do poliéster virgem, com menor pegada de produção.", p:{ bol:4, ama:8, sec:9, cal:5, res:3, pes:7, sus:5 }, s:{ verao:3, inverno:6, cabine:1 } },
  "recycled polyester": { quality:70, comfort:36, durability:80, maintenance:90, travel:90, type:'synthetic', label:"Poliéster Reciclado (rPET)", tip:"Mesmas vantagens de viagem do poliéster virgem, com menor pegada de produção.", p:{ bol:4, ama:8, sec:9, cal:5, res:3, pes:7, sus:5 }, s:{ verao:3, inverno:6, cabine:1 } },
  "rpet": { quality:70, comfort:36, durability:80, maintenance:90, travel:90, type:'synthetic', label:"Poliéster Reciclado (rPET)", tip:"Mesmas vantagens de viagem do poliéster virgem, com menor pegada de produção.", p:{ bol:4, ama:8, sec:9, cal:5, res:3, pes:7, sus:5 }, s:{ verao:3, inverno:6, cabine:1 } },
  "merino": { quality:80, comfort:92, durability:68, maintenance:62, travel:90, type:'natural', label:"Lã Merino", tip:"A melhor fibra natural para viagem: regula temperatura, resiste a odor (lava menos), leve e não amassa.", p:{ bol:6, ama:8, sec:4, cal:9, res:9, pes:4, sus:6 }, s:{ verao:5, inverno:9, cabine:1 } },
  "lã merino": { quality:80, comfort:92, durability:68, maintenance:62, travel:90, type:'natural', label:"Lã Merino", tip:"A melhor fibra natural para viagem: regula temperatura, resiste a odor (lava menos), leve e não amassa.", p:{ bol:6, ama:8, sec:4, cal:9, res:9, pes:4, sus:6 }, s:{ verao:5, inverno:9, cabine:1 } },
  "merino wool": { quality:80, comfort:92, durability:68, maintenance:62, travel:90, type:'natural', label:"Lã Merino", tip:"A melhor fibra natural para viagem: regula temperatura, resiste a odor (lava menos), leve e não amassa.", p:{ bol:6, ama:8, sec:4, cal:9, res:9, pes:4, sus:6 }, s:{ verao:5, inverno:9, cabine:1 } },
  "cânhamo": { quality:82, comfort:72, durability:88, maintenance:60, travel:70, type:'natural', label:"Cânhamo", tip:"Muito durável, fresco e antibacteriano, mas amassa. Similar ao linho em viagem.", p:{ bol:8, ama:2, sec:6, cal:3, res:9, pes:5, sus:9 }, s:{ verao:9, inverno:3, cabine:1 } },
  "canhamo": { quality:82, comfort:72, durability:88, maintenance:60, travel:70, type:'natural', label:"Cânhamo", tip:"Muito durável, fresco e antibacteriano, mas amassa. Similar ao linho em viagem.", p:{ bol:8, ama:2, sec:6, cal:3, res:9, pes:5, sus:9 }, s:{ verao:9, inverno:3, cabine:1 } },
  "hemp": { quality:82, comfort:72, durability:88, maintenance:60, travel:70, type:'natural', label:"Cânhamo", tip:"Muito durável, fresco e antibacteriano, mas amassa. Similar ao linho em viagem.", p:{ bol:8, ama:2, sec:6, cal:3, res:9, pes:5, sus:9 }, s:{ verao:9, inverno:3, cabine:1 } },
  "chanvre": { quality:82, comfort:72, durability:88, maintenance:60, travel:70, type:'natural', label:"Cânhamo", tip:"Muito durável, fresco e antibacteriano, mas amassa. Similar ao linho em viagem.", p:{ bol:8, ama:2, sec:6, cal:3, res:9, pes:5, sus:9 }, s:{ verao:9, inverno:3, cabine:1 } },
  "rami": { quality:70, comfort:72, durability:75, maintenance:50, travel:68, type:'natural', label:"Rami", tip:"Fresco, leve e resistente a mofo — bom para clima quente. Amassa como linho.", p:{ bol:8, ama:2, sec:7, cal:2, res:9, pes:4, sus:7 }, s:{ verao:9, inverno:2, cabine:1 } },
  "ramie": { quality:70, comfort:72, durability:75, maintenance:50, travel:68, type:'natural', label:"Rami", tip:"Fresco, leve e resistente a mofo — bom para clima quente. Amassa como linho.", p:{ bol:8, ama:2, sec:7, cal:2, res:9, pes:4, sus:7 }, s:{ verao:9, inverno:2, cabine:1 } },
  "poliamida reciclada": { quality:77, comfort:52, durability:87, maintenance:80, travel:80, type:'synthetic', label:"Poliamida reciclada (ECONYL)", tip:"Mesmas vantagens da poliamida virgem, com menor pegada. Ótimo em moda praia de viagem.", p:{ bol:6, ama:8, sec:8, cal:5, res:4, pes:6, sus:5 }, s:{ verao:4, inverno:6, cabine:1 } },
  "econyl": { quality:77, comfort:52, durability:87, maintenance:80, travel:80, type:'synthetic', label:"Poliamida reciclada (ECONYL)", tip:"Mesmas vantagens da poliamida virgem, com menor pegada. Ótimo em moda praia de viagem.", p:{ bol:6, ama:8, sec:8, cal:5, res:4, pes:6, sus:5 }, s:{ verao:4, inverno:6, cabine:1 } },
  "recycled nylon": { quality:77, comfort:52, durability:87, maintenance:80, travel:80, type:'synthetic', label:"Poliamida reciclada (ECONYL)", tip:"Mesmas vantagens da poliamida virgem, com menor pegada. Ótimo em moda praia de viagem.", p:{ bol:6, ama:8, sec:8, cal:5, res:4, pes:6, sus:5 }, s:{ verao:4, inverno:6, cabine:1 } },
};

function getFiber(name) {
  const key = name?.toLowerCase?.().trim();
  if (!key) return null;

  // Detecta qualificadores orgânico/reciclado e direciona pra variante sustentável
  const hasOrganic  = /org[aâ]nic|organic|gots|ocs/.test(key);
  const hasRecycled = /recicl|recycled|grs|rcs|econyl|rpet/.test(key);

  // Match direto primeiro
  if (FIBER_DB[key]) {
    // Mas se for algodão e tiver "orgânico", usa a variante
    if (hasOrganic && /algod[aã]o|cotton/.test(key) && FIBER_DB['algodão orgânico']) return FIBER_DB['algodão orgânico'];
    if (hasRecycled && /poli[eé]ster|polyester/.test(key) && FIBER_DB['poliéster reciclado']) return FIBER_DB['poliéster reciclado'];
    if (hasRecycled && /poliamida|nylon/.test(key) && FIBER_DB['poliamida reciclada']) return FIBER_DB['poliamida reciclada'];
    return FIBER_DB[key];
  }

  // Match parcial: encontra a fibra base dentro da string da etiqueta
  // Ex: "algodão de cultivo orgânico certificado ocs" -> algodão orgânico
  if (/algod[aã]o|cotton/.test(key)) return FIBER_DB[hasOrganic ? 'algodão orgânico' : 'algodão'] || null;
  if (/poli[eé]ster|polyester/.test(key)) return FIBER_DB[hasRecycled ? 'poliéster reciclado' : 'poliéster'] || null;
  if (/poliamida|nylon/.test(key)) return FIBER_DB[hasRecycled ? 'poliamida reciclada' : 'poliamida'] || null;

  // Procura qualquer chave do FIBER_DB contida na string
  const found = Object.keys(FIBER_DB).find(k => key.includes(k));
  return found ? FIBER_DB[found] : null;
}

// Bónus de sustentabilidade por certificação detectada no texto
function certificationBonus(pageText) {
  const t = (pageText || '').toLowerCase();
  const certs = [];
  if (/\bgots\b/.test(t)) certs.push('GOTS');
  if (/\bocs\b/.test(t)) certs.push('OCS');
  if (/oeko-?tex/.test(t)) certs.push('OEKO-TEX');
  if (/\bgrs\b/.test(t)) certs.push('GRS');
  if (/\brcs\b/.test(t)) certs.push('RCS');
  if (/fair-?trade/.test(t)) certs.push('Fair Trade');
  if (/european flax|flax fibre|flax fiber|masters of flax|european flax-linen/.test(t)) certs.push('European Flax');
  if (/bluesign/.test(t)) certs.push('bluesign');
  if (/\bbci\b|better cotton/.test(t)) certs.push('BCI');
  if (/\brws\b|responsible wool/.test(t)) certs.push('RWS');
  if (/\brds\b|responsible down/.test(t)) certs.push('RDS');
  if (/\brms\b|responsible mohair/.test(t)) certs.push('RMS');
  if (/woolmark/.test(t)) certs.push('Woolmark');
  if (/mulesing[- ]?free|sem mulesing/.test(t)) certs.push('Mulesing-free');
  return certs;
}


// ─── Modificadores de qualidade dentro da mesma fibra ─────────────
// Ex: algodão Pima/Supima/Egípcio/penteado tem qualidade superior ao comum
const QUALITY_MODIFIERS = {
  algodao: [
    { labels:['supima'],                       nome:'Algodão Supima',     bonus:{quality:12,durability:10,comfort:8}, explica:'Supima é algodão de fibra extra-longa dos EUA — só 1% do algodão mundial. Mais resistente, macio e quase não bola.' },
    { labels:['egípcio','egipcio','egyptian'], nome:'Algodão Egípcio',    bonus:{quality:12,durability:9,comfort:9},  explica:'Algodão Egípcio tem a fibra mais longa do mundo — extremamente macio e durável.' },
    { labels:['pima'],                          nome:'Algodão Pima',       bonus:{quality:10,durability:8,comfort:8},  explica:'Pima é algodão de fibra longa — mais forte, sedoso e durável, resiste melhor a bolinhas.' },
    { labels:['penteado','combed','peinado'],   nome:'Algodão penteado',   bonus:{quality:6,durability:5,comfort:6},   explica:'Algodão penteado tem as fibras curtas removidas — mais liso, forte e não pila como o comum.' },
    { labels:['mercerizado','mercerized'],      nome:'Algodão mercerizado',bonus:{quality:5,durability:4,comfort:3},   explica:'A mercerização dá brilho acetinado, mais força e melhor fixação da cor.' },
  ],
};

// Deteta modificador de qualidade no texto da página para a fibra dominante
function detectQualityModifier(mainFiberName, pageText) {
  const txt = (pageText || '').toLowerCase();
  const n = (mainFiberName || '').toLowerCase();
  let key = null;
  if (/algod|cotton/.test(n)) key = 'algodao';
  if (!key || !QUALITY_MODIFIERS[key]) return null;
  for (const mod of QUALITY_MODIFIERS[key]) {
    if (mod.labels.some(l => txt.includes(l))) return mod;
  }
  return null;
}

// ─── Scoring Engine ───────────────────────────────────────────────
function calcScores(fibers, pageText, certText, titleText) {
  if (!fibers?.length) return null;
  const txt = (pageText || '').toLowerCase();
  // certText permite detetar certificações que estão fora da zona de composição
  const certs = typeof certificationBonus === 'function' ? certificationBonus(certText || pageText) : [];

  // pageText é a zona de COMPOSIÇÃO — específica de propósito (Materiais e
  // Cuidados, geralmente), mas por isso mesmo não inclui o título do
  // produto. Achado com uma peça chamada "Casaco acolchoado de trekking...":
  // a palavra "casaco" só existia no título, nunca chegava perto da
  // etiqueta de composição, e por isso isBulkyGarment nunca disparava — a
  // peça nunca era reconhecida como casaco. Todo sinal de TIPO/CONSTRUÇÃO
  // da peça (casaco, malha, tecido grosso, especificação técnica, marca)
  // precisa olhar os dois, não só a zona estreita de composição.
  const textoAmplo = (pageText || '') + ' ' + (titleText || '');

  // Se a página indica orgânico/reciclado certificado, promove a fibra base à variante sustentável
  // Usa certText (texto completo) se disponível — certificações podem estar fora da zona de composição
  const certScope = ((certText || pageText) || '').toLowerCase();
  const pageOrganic  = /org[aâ]nic|organic|\bgots\b|\bocs\b/.test(certScope);
  const pageRecycled = /recicl|recycled|\bgrs\b|\brcs\b|econyl|rpet/.test(certScope);
  fibers = fibers.map(f => {
    const n = (f.name || '').toLowerCase();
    if (pageOrganic && /algod[aã]o|cotton/.test(n) && FIBER_DB['algodão orgânico']) {
      return { ...f, data: FIBER_DB['algodão orgânico'], name: 'algodão orgânico' };
    }
    if (pageRecycled && /poli[eé]ster|polyester/.test(n) && FIBER_DB['poliéster reciclado']) {
      return { ...f, data: FIBER_DB['poliéster reciclado'], name: 'poliéster reciclado' };
    }
    if (pageRecycled && /poliamida|nylon/.test(n) && FIBER_DB['poliamida reciclada']) {
      return { ...f, data: FIBER_DB['poliamida reciclada'], name: 'poliamida reciclada' };
    }
    return f;
  });

  const total = fibers.reduce((s, f) => s + (f.pct || 0), 0) || 100;
  const certBonus = Math.min(8, certs.length * 4);

  // Especificação técnica (impermeável, corta-vento, membrana, rating tipo
  // "10k") é sinal real de engenharia da peça — não vem da fibra, vem da
  // descrição do produto. Um poliéster "qualquer" e um poliéster com
  // membrana impermeável 10k são peças objetivamente diferentes, mas o
  // sistema baseado só em fibra não enxergava essa diferença. Bônus modesto
  // (mesma ordem de grandeza do de certificação) — a especificação já se
  // prova sozinha no card via techSpecNota, isto só ajusta a nota.
  const hasTechSpec = /imperme[aá]vel|waterproof|corta-?vento|windproof|\bwind[- ]?resistant\b|membrana|\bdwr\b|water[- ]?repellent|à prova de (água|chuva)|\b\d{1,2}(?:[.,]?000)?\s?k\/\d{1,2}(?:[.,]?000)?\s?k\b|\b\d{1,2}(?:[.,]?000)?\s?k\b(?=.{0,40}(imperme|water|chuva))/i.test(textoAmplo);
  const techBonus = hasTechSpec ? 6 : 0;

  // Nome comercial de tecnologia da marca (HEATTECH, AIRism...). Primeira
  // versão disto tratava como marketing puro e não somava nada — pesquisa
  // depois mostrou que é engenharia real: HEATTECH junta viscose (absorve
  // umidade do corpo) com acrílico ultrafino (prende esse calor perto da
  // pele) — mecanismo comprovado, não só nome bonito. Mas o que ele melhora
  // é ESPECIFICAMENTE conforto térmico, não qualidade de construção nem
  // durabilidade (uma peça 57% acrílico + 28% viscose ainda bola fácil e é
  // frágil, o HEATTECH não resolve isso). Por isso o bônus vai só pro
  // conforto — pra esse tipo de peça (roupa térmica), "esquenta de verdade"
  // é o motivo real de compra, então precisa contar na nota, não só no
  // texto.
  const BRAND_TECH = [
    { re: /heattech/i, nome: 'HEATTECH' },
    { re: /\bairism\b/i, nome: 'AIRism' },
  ];
  const brandTech = (BRAND_TECH.find((b) => b.re.test(textoAmplo)) || {}).nome || null;

  // Temperatura mínima suportada (peças técnicas de inverno) — verificado
  // com peças reais: Oysho ("certificado para resistir a temperaturas de
  // -10°C") e Decathlon ("mantêm o calor até -20°C") anunciam isto como
  // especificação própria, não vem da fibra. Só considera grau NEGATIVO —
  // não tem como confundir com temperatura de lavagem (nunca é negativa).
  // Informativo por ora, como brandTech: não entra na nota, só no texto.
  let temperaturaMin = null;
  { const TEMP_RE = /-\s?(\d{1,2})\s?°\s?c\b/gi; let tm;
    while ((tm = TEMP_RE.exec(pageText || '')) !== null) {
      const v = -parseInt(tm[1], 10);
      if (temperaturaMin === null || v < temperaturaMin) temperaturaMin = v;
    }
  }

  // Modificador de qualidade (Pima, Supima, penteado...) na fibra dominante
  const domFiber = [...fibers].sort((a,b)=>(b.pct||0)-(a.pct||0))[0];
  const qmod = typeof detectQualityModifier === 'function' ? detectQualityModifier(domFiber?.name, pageText) : null;
  if (qmod && domFiber) {
    domFiber.data = { ...domFiber.data };
    for (const k in qmod.bonus) {
      if (domFiber.data[k] != null) domFiber.data[k] = Math.min(100, domFiber.data[k] + qmod.bonus[k]);
    }
    domFiber.qualityModifier = qmod;
  }
  const avg = key => Math.round(fibers.reduce((s, f) => s + ((f.data?.[key] || 0) * (f.pct / total)), 0));

  const quality     = avg('quality');
  const comfortBonus = brandTech ? 8 : 0;
  const comfort     = Math.min(100, avg('comfort') + comfortBonus);
  const durability  = avg('durability');
  const maintenance = avg('maintenance');
  const travelRaw   = avg('travel');
  const natPct      = fibers.filter(f => f.data?.type === 'natural').reduce((s, f) => s + f.pct, 0);
  const synPct      = fibers.filter(f => f.data?.type === 'synthetic').reduce((s, f) => s + f.pct, 0);
  // Versatilidade: base por fibra + cor/padrão (aproximação da lógica LookMap)
  // Para deteção de cor/padrão usa titleText (título + cor) se disponível,
  // para evitar falsos positivos de boilerplates de composição (ex: "ornamentos e estampados")
  const colorInfo = typeof detectColorPattern === 'function' ? detectColorPattern(titleText || pageText) : { mod: 0, note: '' };
  const versatilityBase = 50 + natPct * 0.3 + quality * 0.2;
  const versatility = Math.max(20, Math.min(100, Math.round(versatilityBase + colorInfo.mod)));
  const costBenefit = Math.round(quality * 0.5 + durability * 0.3 + maintenance * 0.2);
  const elastano    = fibers.find(f => ['elastano','spandex','lycra'].includes(f.name?.toLowerCase?.()));
  const travelMaterial = Math.min(100, Math.round(travelRaw + (elastano ? Math.min(8, (elastano.pct || 0) * 0.4) : 0)));
  // Packability precisa de saber se é malha — calcula isKnit antes do travel
  const isKnitEarly = /tricot|tric[ôo]|knit|malha|jersey|jacquard|knitwear|croch[eê]|crochet|sweater|camisola|pullover|pul[oô]ver|cardigan|cardig[aã]|gola alta|tur(t|l)eneck|jumper|camisaco/i.test(textoAmplo);
  // Peças estruturadas/volumosas ocupam muito espaço na mala, seja qual for a fibra
  const isBulkyGarment = /casaco|sobretudo|parka|trench|blaz[eê]r|jaqueta|jacket|coat|overcoat|puffer|acolchoad|quilted|gabardine|trincheira/i.test(textoAmplo);
  const packability = typeof packabilityScore === 'function' ? packabilityScore(fibers, isKnitEarly, isBulkyGarment) : 65;
  const warmth = typeof warmthScore === 'function' ? warmthScore(fibers) : null;
  // Travel Score: para peças de inverno (calor alto), o calor é um trunfo —
  // mas só conta se a peça também for compacta (merino leve > lã grossa).
  let travel;
  if (warmth != null && warmth >= 60) {
    // warmthAsset: o calor só vale a pleno se a peça packa bem (calor por espaço)
    const warmthAsset = Math.round(warmth * Math.min(1, packability / 65));
    travel = Math.round(travelMaterial * 0.35 + packability * 0.25 + versatility * 0.10 + warmthAsset * 0.30);
  } else {
    // peça de meia-estação / verão: material + volume + versatilidade
    travel = Math.round(travelMaterial * 0.55 + packability * 0.30 + versatility * 0.15);
  }
  travel = Math.max(0, Math.min(100, travel));
  const qualityFinal = Math.min(100, quality + certBonus + techBonus);
  const durabilityFinal = Math.min(100, durability + (hasTechSpec ? 4 : 0));
  const overall     = Math.min(100, Math.round(qualityFinal * 0.25 + comfort * 0.15 + durabilityFinal * 0.20 + versatility * 0.15 + costBenefit * 0.15 + maintenance * 0.10) + (certBonus > 0 ? 2 : 0));

  const isKnit = /tricot|tric[ôo]|knit|malha|jersey|jacquard|knitwear|croch[eê]|crochet|sweater|camisola|pullover|pul[oô]ver|cardigan|cardig[aã]|gola alta|tur(t|l)eneck|jumper|camisaco/i.test(textoAmplo);
  // Tecido grosso e estruturado (sarja, gabardine, ganga/denim, canvas, brim,
  // corte "carpinteiro"/workwear) amarrota muito menos que o algodão fino
  // médio do banco — o mesmo raciocínio do isKnit, só que pro lado oposto do
  // espectro (tecido plano mas GROSSO, em vez de malha). Sem isto, uma
  // bermuda "carpinteiro" (na prática quase jeans) herdava o amassa:3 médio
  // do algodão fino, quando quem já viu a peça sabe que ela não amarrota.
  const isHeavyWoven = /sarja|gabardine|ganga\b|denim|canvas|\bbrim\b|carpinteiro|workwear|twill|cargo|caqui pesad[oa]|drill/i.test(textoAmplo);
  // Semente de variação: primeiro tipo de peça encontrado no texto → frases variam entre tipos de peça
  const garmentWords = (pageText || '').toLowerCase().match(/camisa|t-?shirt|camiseta|vestido|cal[çc]a|saia|blusa|top|casaco|blaz[eê]r|jaqueta|short|macac[ãa]o|sobretudo|cardigan|camisola|sweater|polo/);
  const productSeed = garmentWords ? garmentWords[0] : '';
  return { quality: qualityFinal, comfort, durability: durabilityFinal, maintenance, versatility, costBenefit, travel, travelMaterial, packability, warmth, overall, natPct, synPct, certs, fibers, qualityModifier: qmod, isKnit, isHeavyWoven, isBulkyGarment, hasTechSpec, brandTech, temperaturaMin, productSeed, colorInfo };
}

// ─── Buy Score: o score principal do copiloto ─────────────────────
// Pesos dinâmicos por tipo de peça. Cada tipo valoriza fatores diferentes.
// A arquitetura aceita dados futuros (gramatura, acabamento, marca, preço)
// sem quebrar — fatores ausentes simplesmente não entram na média.
//
// `comfort` entrou aqui depois de ficar claro que a nota de compra nunca o
// olhava — uma peça podia ter conforto 82 (texto e selo de viagem elogiando
// "não abafa", "corpo respira") e mesmo assim tirar nota baixa, porque o
// número final era média de OUTRAS seis coisas. O peso varia por tipo:
// pesa mais onde a peça se usa direto na pele o dia inteiro (roupa íntima,
// camiseta, esportiva), menos onde importa mais estrutura/acabamento
// (blazer, casaco, bolsa).
const BUY_WEIGHTS = {
  // fator:            qual  durab versat manut custo travel comf
  clothing:       { quality:0.19, durability:0.15, versatility:0.15, maintenance:0.10, costBenefit:0.13, travel:0.13, comfort:0.15 },
  camiseta:       { quality:0.16, durability:0.12, versatility:0.18, maintenance:0.12, costBenefit:0.12, travel:0.12, comfort:0.18 },
  camisa:         { quality:0.20, durability:0.15, versatility:0.17, maintenance:0.11, costBenefit:0.10, travel:0.13, comfort:0.14 },
  blazer:         { quality:0.25, durability:0.20, versatility:0.16, maintenance:0.07, costBenefit:0.11, travel:0.11, comfort:0.10 },
  calca:          { quality:0.19, durability:0.22, versatility:0.16, maintenance:0.09, costBenefit:0.11, travel:0.10, comfort:0.13 },
  vestido:        { quality:0.21, durability:0.13, versatility:0.17, maintenance:0.09, costBenefit:0.13, travel:0.13, comfort:0.14 },
  casaco:         { quality:0.25, durability:0.23, versatility:0.11, maintenance:0.07, costBenefit:0.11, travel:0.13, comfort:0.10 },
  roupa_esportiva:{ quality:0.15, durability:0.19, versatility:0.10, maintenance:0.15, costBenefit:0.10, travel:0.15, comfort:0.16 },
  roupa_intima:   { quality:0.16, durability:0.12, versatility:0.08, maintenance:0.20, costBenefit:0.12, travel:0.12, comfort:0.20 },
  // malha/camisola: lava-se raramente (lã é antiodor), manutenção pesa menos;
  // qualidade e durabilidade (pilling, manter a forma) pesam mais
  malha:          { quality:0.21, durability:0.18, versatility:0.15, maintenance:0.04, costBenefit:0.13, travel:0.13, comfort:0.16 },
  // calçados e bolsas valorizam durabilidade e qualidade do material.
  // Conforto pesa em calçado (você caminha nele o dia todo); em bolsa é
  // secundário — o campo existe mas mede o material, não o uso.
  shoes:          { quality:0.23, durability:0.26, versatility:0.10, maintenance:0.09, costBenefit:0.09, travel:0.09, comfort:0.14 },
  bags:           { quality:0.28, durability:0.31, versatility:0.09, maintenance:0.09, costBenefit:0.08, travel:0.09, comfort:0.06 },
};

function buyScore(scores, garmentType) {
  if (!scores) return null;
  const w = BUY_WEIGHTS[garmentType] || BUY_WEIGHTS.clothing;
  const factors = {
    quality: scores.quality, durability: scores.durability,
    versatility: scores.versatility, maintenance: scores.maintenance,
    costBenefit: scores.costBenefit, travel: scores.travel,
    comfort: scores.comfort,
  };
  let sum = 0, wsum = 0;
  for (const k in w) {
    if (factors[k] != null) { sum += factors[k] * w[k]; wsum += w[k]; }
  }
  const bruto = wsum > 0 ? sum / wsum : scores.overall;
  return escalaCompra(bruto);
}

// ─── Escala da nota ──────────────────────────────────────────────
// A média ponderada acima comprime: para dar 100 a peça precisaria de 100 em
// TODAS as dimensões ao mesmo tempo, e nenhuma fibra é boa em tudo (a caxemira
// é confortável mas exigente; o poliéster é prático mas desconfortável). Medido
// sobre 1100 combinações fibra×tipo, o valor bruto vivia entre 46 e 83 — ou
// seja, os 17 pontos do topo eram inalcançáveis e 62% das peças caíam todas na
// mesma faixa de veredito. A nota dizia "/100" e operava em meia escala.
//
// Estas âncoras esticam a faixa útil para 0–100. São ligeiramente mais largas
// do que o observado (40 e 85) para nada ficar preso no extremo. Os limites do
// buyVerdict continuam iguais — com esta escala eles passam a repartir bem:
// ~13% não vale, 11% pense bem, 30% considerar, 29% vale a pena, 17% tranquila.
const BUY_ESCALA_MIN = 40;
const BUY_ESCALA_MAX = 85;
function escalaCompra(bruto) {
  const v = (bruto - BUY_ESCALA_MIN) / (BUY_ESCALA_MAX - BUY_ESCALA_MIN) * 100;
  return Math.max(0, Math.min(100, Math.round(v)));
}

// Veredito grande para o header — 3 níveis claros
function buyVerdict(buy) {
  const en = typeof LP_LANG !== 'undefined' && LP_LANG === 'en';
  if (buy >= 80) return { emoji:'🟢', label: en ? 'Good buy'          : 'Pode comprar tranquila', color:'#166534', bg:'#e7f6ec' };
  if (buy >= 70) return { emoji:'🟢', label: en ? 'Worth it'          : 'Vale a pena',            color:'#166534', bg:'#e7f6ec' };
  if (buy >= 55) return { emoji:'🟡', label: en ? 'Worth considering' : 'Vale considerar',         color:'#B45309', bg:'#fdf6e3' };
  if (buy >= 45) return { emoji:'🟡', label: en ? 'Think twice'       : 'Pense bem',               color:'#B45309', bg:'#fdf6e3' };
  return                { emoji:'🔴', label: en ? "Not worth it"      : 'Não vale a pena',         color:'#C0392B', bg:'#fdecea' };
}

// ─── Confidence Score: arquitetura preparada (fase futura) ────────
// Já calcula; a UI mostra-o só quando ativarmos a fase do Confidence.
function confidenceScore(data) {
  let conf = 0;
  const have = [];
  const missing = [];
  if (data.hasComposition) { conf += 40; have.push('composição'); } else missing.push('composição');
  if (data.hasGarmentType) { conf += 20; have.push('tipo de peça'); } else missing.push('tipo de peça');
  if (data.hasCertification){ conf += 10; have.push('certificação'); }
  if (data.hasWeight)      { conf += 15; have.push('gramatura'); } else missing.push('gramatura');
  if (data.hasFinish)      { conf += 10; have.push('acabamento'); } else missing.push('acabamento');
  if (data.hasBrand)       { conf += 5;  have.push('marca'); }
  return { score: Math.min(100, conf), have, missing };
}

function toTen(v) { return Math.round((v || 0) / 10); }

function verdict(scores) {
  const en = typeof LP_LANG !== 'undefined' && LP_LANG === 'en';
  if (!scores) return { label: '—', color: '#6E6E73' };
  if (scores.overall >= 80) return { label: en ? 'Good buy ✓'         : 'Boa compra ✓',       color: '#166534' };
  if (scores.overall >= 65) return { label: en ? 'Decent buy'         : 'Compra ok',          color: '#B45309' };
  if (scores.overall >= 50) return { label: en ? 'Buy with caution'   : 'Compra com cautela', color: '#B45309' };
  return                            { label: en ? 'Better skip it'     : 'Melhor evitar',      color: '#C0392B' };
}

function scoreColor(v) { return v >= 75 ? '#16a34a' : v >= 55 ? '#d97706' : '#dc2626'; }

function conclusionText(scores, fibers, garmentType) {
  const en = typeof LP_LANG !== 'undefined' && LP_LANG === 'en';
  const isCasaco = garmentType === 'casaco';
  const sorted  = [...(fibers || [])].sort((a, b) => (b.pct || 0) - (a.pct || 0));
  const main    = sorted[0];
  const second  = sorted[1];
  const mainName  = main?.data?.label  || main?.name  || (en ? 'this piece' : 'essa peça');
  const secName   = second?.data?.label || second?.name || '';
  const mainPct   = main?.pct  || 0;
  const secPct    = second?.pct || 0;
  const s = scores;
  const certs = s?.certs || [];
  const certNote = certs.length
    ? (en ? ` Has ${certs.join(', ')} certification, so the origin is verified.` : ` Tem certificação ${certs.join(', ')}, então a origem é verificada.`)
    : '';

  // Identifica o papel de cada fibra na peça
  const mainIsSynthetic = main?.data?.type === 'synthetic';
  const secIsFragile    = second && ['viscose','rayon','raiom'].includes((second.name||'').toLowerCase());
  const secIsSynthetic  = second?.data?.type === 'synthetic';
  const mainIsNatural   = main?.data?.type === 'natural';
  const heavyBlend      = secPct >= 40; // mistura pesada — a segunda fibra conta muito
  const lightBlend      = secPct > 0 && secPct < 20; // mistura leve — a segunda é secundária

  // Constrói a explicação honesta do raciocínio
  let why = '';

  if (en) {
    // ── English branch ──────────────────────────────────────────────
    const certNoteEn = certs.length ? ` Has ${certs.join(', ')} certification, so the origin is verified.` : '';
    const secNameLow = (second?.name||'').toLowerCase();

    if (mainIsSynthetic && certs.length && s.overall >= 70) {
      why = `Certified ${certs.join('/')} ${mainName} scores well for durability and easy care.${certNoteEn} Less breathable than natural fibres, but holds its shape with regular use.`;
    }
    else if (secIsFragile && heavyBlend) {
      why = `${mainName} brings comfort and drape, but the ${secPct}% ${secNameLow} is the weak point — a delicate fibre that loses strength when wet and needs careful washing.`;
    }
    else if (secIsFragile && mainIsNatural && secPct >= 20) {
      const certPart = certs.length ? ` ${certs.join(', ')} certification confirms the origin — but doesn't change the durability.` : '';
      why = `${mainName} at ${mainPct}% is the strength here — comfortable and well-sourced.${certPart} The ${secPct}% ${secNameLow} pulls the score down: it's a delicate fibre that loses strength when wet and wrinkles easily. That's why the score doesn't reach 80.`;
    }
    else if (mainIsSynthetic && (s.overall >= 60 || (s.isKnit && s.overall >= 50))) {
      const isVirgin = !certs.length;
      const isKnitwear = s.isKnit;
      const mainLower = (main?.name || '').toLowerCase();
      const pills = ['acrílico','acrilico','acrylic'].includes(mainLower);
      if (isVirgin && isKnitwear) {
        why = `${mainName} at ${mainPct}% keeps you warm and is easy to care for${pills ? ', but tends to pill over time' : ''}. No recycled certification — the least sustainable option — but functional for a winter piece.`;
      } else if (isVirgin && isCasaco) {
        // a coat isn't worn on warm days by design — "not for warm days" made
        // no sense as a caveat here; the real trade-off is breathability indoors
        why = `${mainName} at ${mainPct}% is durable and low-maintenance, but doesn't breathe well — can feel stuffy the moment you step somewhere heated. No recycled certification either.`;
      } else if (isVirgin) {
        why = `${mainName} at ${mainPct}% is durable and low-maintenance, but has two downsides: poor breathability (gets hot) and no recycled certification. Good for practical use, not for warm days.`;
      } else if (isKnitwear) {
        why = `${mainName} at ${mainPct}% keeps you warm and is easy to maintain.${certNoteEn}${pills ? ' Tends to pill with wear.' : ''}`;
      } else {
        why = `${mainName} at ${mainPct}% is durable and easy to maintain.${certNoteEn} The trade-off is breathability — can feel warmer than natural fibres.`;
      }
    }
    else if (secIsSynthetic && lightBlend && mainIsNatural) {
      why = `${mainName} at ${mainPct}% is the real base of this piece — the synthetic is just structural support.${certNoteEn}`;
    }
    else if (s.overall >= 65) {
      const traits = FIBER_TRAITS_EN[(main?.name || '').toLowerCase()] || null;
      const pctTxt = mainPct < 100 ? ' at '+mainPct+'%' : '';
      if (s.overall >= 80) {
        const phrase = traits ? pickTrait(traits.strong, fibers, s.productSeed) : null;
        why = phrase
          ? `${mainName}${pctTxt}: ${phrase}.${certNoteEn} Worth the investment with regular use.`
          : `${mainName}${mainPct < 100 ? pctTxt : ' pure'} is a solid foundation for this piece.${certNoteEn} Worth the investment with regular use.`;
      } else {
        const phrase = traits ? pickTrait(traits.mid, fibers, s.productSeed) : null;
        why = phrase
          ? `${mainName}${pctTxt}: ${phrase}.${certNoteEn}`
          : `${mainName}${pctTxt} works well day to day.${certNoteEn} Good value for money.`;
      }
    }
    else if (s.overall >= 50) {
      const traits = FIBER_TRAITS_EN[(main?.name || '').toLowerCase()] || null;
      const pctTxt = mainPct < 100 ? ' at '+mainPct+'%' : '';
      const phrase = traits ? pickTrait(traits.mid, fibers, s.productSeed) : null;
      if (phrase) {
        why = `${mainName}${pctTxt}: ${phrase}.${certNoteEn}`;
      } else {
        why = `${mainName}${pctTxt} works for casual wear${secIsFragile && secPct > 0 ? `, but the ${secPct}% ${secNameLow} reduces durability` : ''}.${certNoteEn} Worth checking if the price makes sense for that.`;
      }
    }
    else {
      why = `This composition tends to wear out quickly. You can likely find better quality at this price point.`;
    }
    if (s?.qualityModifier?.explica_en || s?.qualityModifier?.explica) {
      why = `${s.qualityModifier.explica_en || s.qualityModifier.explica} ${why}`;
    }
    if (s?.colorInfo?.note && s.colorInfo.isPrint) {
      why = `${why} For styling, note: ${s.colorInfo.note}.`;
    }
  } else {
    // ── Portuguese branch ────────────────────────────────────────────

  // Caso: sintético certificado com boa nota — explicar porquê
  if (mainIsSynthetic && certs.length && s.overall >= 70) {
    why = `${mainName} certificado ${certs.join('/')} pontua bem pela durabilidade e facilidade de cuidado.${certNote} Respira menos que fibras naturais, mas aguenta o uso sem perder a forma.`;
  }

  // Caso: mistura com fibra frágil pesada (ex: 50% viscose)
  else if (secIsFragile && heavyBlend) {
    why = `${mainName} traz conforto e caimento, mas os ${secPct}% de ${(second.name||'').toLowerCase()} são o ponto fraco — fibra delicada que perde resistência quando molhada e exige cuidado na lavagem.`;
  }

  // Caso: natural dominante + fibra frágil em dose média (20–39%)
  else if (secIsFragile && mainIsNatural && secPct >= 20) {
    const certPart = certs.length ? ` Certificação ${certs.join(', ')} confirma a origem — mas não muda a resistência da peça.` : '';
    why = `${mainName} em ${mainPct}% é o ponto forte — confortável e de boa origem.${certPart} Os ${secPct}% de ${(second.name||'').toLowerCase()} puxam a nota para baixo: é uma fibra delicada que perde resistência quando molhada e amassa fácil. Por isso o score não chega aos 80.`;
  }

  // Caso: sintético com nota média-alta sem cert — honesto sobre os trade-offs
  else if (mainIsSynthetic && (s.overall >= 60 || (s.isKnit && s.overall >= 50))) {
    const isVirgin = !certs.length;
    const isKnitwear = s.isKnit;
    const mainLower = (main?.name || '').toLowerCase();
    const pills = ['acrílico','acrilico','acrylic'].includes(mainLower);
    if (isVirgin && isKnitwear) {
      why = `${mainName} em ${mainPct}% aquece bem e é fácil de cuidar${pills ? ', mas faz bolinhas com o tempo' : ''}. Sem certificação de reciclado, é a fibra menos sustentável — mas para uma peça de inverno, cumpre.`;
    } else if (isVirgin && isCasaco) {
      // casaco não é peça pra dia quente por definição — "não para os dias
      // quentes" não fazia sentido como ressalva aqui; o ponto real é não
      // respirar quando você entra num lugar aquecido
      why = `${mainName} em ${mainPct}% é resistente e fácil de cuidar, mas não respira bem — pode sufocar assim que você entra em algum lugar aquecido. Também não tem certificação de reciclado.`;
    } else if (isVirgin) {
      why = `${mainName} em ${mainPct}% é resistente e fácil de cuidar, mas tem dois poréns: não respira bem (esquenta mais) e, sem certificação de reciclado, é a fibra menos sustentável. Boa para uso prático, não para os dias quentes.`;
    } else if (isKnitwear) {
      why = `${mainName} em ${mainPct}% aquece e é fácil de manter.${certNote}${pills ? ' Só tende a fazer bolinhas com o uso.' : ''}`;
    } else {
      why = `${mainName} em ${mainPct}% é durável e fácil de manter.${certNote} O trade-off é a respirabilidade — pode esquentar mais que fibras naturais.`;
    }
  }

  // Caso: sintético leve como parceiro (ex: 3% elastano)
  else if (secIsSynthetic && lightBlend && mainIsNatural) {
    why = `${mainName} em ${mainPct}% é a base real da peça — o sintético serve apenas de estrutura.${certNote}`;
  }

  // Caso: natural puro ou com mistura simples — texto específico por fibra
  else if (s.overall >= 65) {
    const traits = FIBER_TRAITS[(main?.name || '').toLowerCase()] || null;
    const pctTxt = mainPct < 100 ? ' em '+mainPct+'%' : '';
    if (s.overall >= 80) {
      const phrase = traits ? pickTrait(traits.strong, fibers, s.productSeed) : null;
      why = phrase
        ? `${mainName}${pctTxt}: ${phrase}.${certNote} Vale o investimento com uso frequente.`
        : `${mainName}${mainPct < 100 ? pctTxt : ' puro'} é a base sólida dessa peça.${certNote} Vale o investimento com uso frequente.`;
    } else {
      const phrase = traits ? pickTrait(traits.mid, fibers, s.productSeed) : null;
      why = phrase
        ? `${mainName}${pctTxt}: ${phrase}.${certNote}`
        : `${mainName}${pctTxt} cumpre bem no dia a dia.${certNote} Bom custo-benefício.`;
    }
  }
  else if (s.overall >= 50) {
    const traits = FIBER_TRAITS[(main?.name || '').toLowerCase()] || null;
    const pctTxt = mainPct < 100 ? ' em '+mainPct+'%' : '';
    const phrase = traits ? pickTrait(traits.mid, fibers, s.productSeed) : null;
    if (phrase) {
      why = `${mainName}${pctTxt}: ${phrase}.${certNote}`;
    } else {
      why = `${mainName}${pctTxt} funciona para o casual${secIsFragile && secPct > 0 ? `, mas os ${secPct}% de ${(second.name||'').toLowerCase()} reduzem a durabilidade` : ''}.${certNote} Vale ver se o preço faz sentido para isso.`;
    }
  }
  else {
    why = `Essa composição tende a desgastar rápido. Por este valor é possível encontrar coisa melhor.`;
  }

  if (s?.qualityModifier?.explica) {
    why = `${s.qualityModifier.explica} ${why}`;
  }
  if (s?.colorInfo?.note && s.colorInfo.isPrint) {
    why = `${why} Para combinar, atenção: ${s.colorInfo.note}.`;
  }
  // Especificação técnica (impermeável, corta-vento, membrana...) some no
  // texto onde ela decide comprar ou não — sem isto a nota sobe sozinha, sem
  // explicação, e vira número mágico.
  if (s?.hasTechSpec) {
    why = en
      ? `${why} Has real technical specs listed (waterproof/windproof) — that's engineering, not just fibre.`
      : `${why} Tem especificação técnica de verdade na etiqueta (impermeável/corta-vento) — isso é engenharia da peça, não só a fibra.`;
  }
  // Nome comercial de tecnologia (HEATTECH, AIRism...) — mecanismo real
  // (viscose absorve umidade, acrílico ultrafino prende o calor), já contado
  // no conforto acima. Mas não muda qualidade nem durabilidade: a peça pode
  // esquentar bem e ainda assim bolar fácil, se a fibra for a mesma de sempre.
  if (s?.brandTech) {
    why = en
      ? `${why} "${s.brandTech}" is real engineering (already counted above) — but it doesn't fix durability or pilling, that's still down to the fibre.`
      : `${why} "${s.brandTech}" é engenharia real (já contada no conforto acima) — mas não resolve durabilidade nem bolinha, isso continua sendo a fibra mesmo.`;
  }
  // Temperatura suportada, quando a própria loja anuncia (Oysho/Decathlon) —
  // informativo, não muda a nota. Serve pra responder "até quantos graus"
  // sem inventar número que a fibra sozinha não sustentaria.
  if (s?.temperaturaMin != null) {
    why = en
      ? `${why} Rated by the store to hold up to ${s.temperaturaMin}°C.`
      : `${why} A própria loja certifica esta peça até ${s.temperaturaMin}°C.`;
  }

  } // end PT branch

  return why;
}

function travelText(scores, fibers) {
  const en = typeof LP_LANG !== 'undefined' && LP_LANG === 'en';
  const t = scores?.travel || 0;
  const sorted = fibers ? [...fibers].sort((a, b) => (b.pct || 0) - (a.pct || 0)) : [];
  const main   = sorted[0];
  const others = sorted.slice(1);

  const mainName = (main?.name || '').toLowerCase();
  const d = main?.data || {};

  // Fibras que naturalmente amassam (tecido plano)
  const WRINKLERS   = ['lyocell','liocel','tencel','linho','linen','seda','silk','viscose','rayon','algodão','algodao','cotton','rami','cânhamo','canhamo'];
  // Fibras que REDUZEM amarrotamento quando presentes como parceiras
  const ANTI_WRINKLE = ['poliéster','poliester','polyester','poliamida','polyamide','nylon','elastano','elastane','spandex','lycra'];

  const mainWrinkles = WRINKLERS.includes(mainName);
  // A segunda fibra atenua o amarrotamento?
  const hasAntiWrinkle = others.some(f => {
    const n = (f.name || '').toLowerCase();
    return ANTI_WRINKLE.some(k => n.includes(k));
  });
  const antiPct = others.filter(f => {
    const n = (f.name || '').toLowerCase();
    return ANTI_WRINKLE.some(k => n.includes(k));
  }).reduce((sum, f) => sum + (f.pct || 0), 0);

  // Se há parceiro anti-wrinkle significativo (>5%), o amarrotamento é reduzido
  const wrinkles = mainWrinkles && !(hasAntiWrinkle && antiPct >= 5);
  // isKnit/isHeavyWoven passados via scores (detetados no pageText em calcScores)
  const isKnit = scores?.isKnit || false;
  // sarja, ganga, canvas, corte "carpinteiro"... tecido grosso amarrota bem
  // menos que o algodão fino médio do banco — mesmo raciocínio da malha, do
  // outro lado do espectro de construção.
  const isHeavyWoven = scores?.isHeavyWoven || false;

  const dry  = d.type === 'synthetic';
  const isMerino = ['merino','lã merino'].includes(mainName);

  const pros = [], cons = [];
  const warmthEarly = scores?.warmth, packEarly = scores?.packability;
  const isWinterHero = warmthEarly != null && warmthEarly >= 70 && packEarly != null && packEarly >= 58;
  if (dry)    pros.push('seca rápido');
  const isWool = ['lã','wool','merino','lã merino','caxemira','cashmere'].includes(mainName);
  // Para herói de inverno (leve+quente), o trunfo principal é o calor-por-espaço;
  // não acumula com "regula temperatura" para a frase não ficar pesada
  if (isMerino && !isWinterHero) pros.push('regula a temperatura e não retém odor');
  else if (isWool && !isWinterHero) pros.push('não amassa e regula a temperatura');
  // "combina com tudo" só quando não é estampado (cor marcante não exclui — depende do estilo)
  const colorOk = !scores?.colorInfo || !scores.colorInfo.isPrint;
  if ((scores.versatility || 0) >= 75 && colorOk && !isMerino && !isWool) pros.push('combina com tudo');
  if ((scores.maintenance || 0) >= 80 && !wrinkles) pros.push('fácil de cuidar');

  // Só adiciona "amassa" se realmente amassa E não é malha nem tecido grosso
  if (wrinkles && !isKnit && !isHeavyWoven) cons.push('amassa com facilidade');
  if (wrinkles && isHeavyWoven) pros.push('tecido grosso, não amassa como o fino');
  // "demora a secar" só para fibras que de facto secam devagar (algodão, viscose).
  // Linho, cânhamo e rami são fibras bast que secam rápido — não entram aqui.
  const SLOW_DRY = ['algodão','algodao','cotton','coton','viscose','rayon','raiom','modal','lyocell','liocel','tencel'];
  if (!dry && SLOW_DRY.includes(mainName) && !hasAntiWrinkle) cons.push('demora a secar');
  // Linho e afins: o ponto forte é secar rápido apesar de amassar
  const FAST_DRY_NATURAL = ['linho','linen','lin ','cânhamo','canhamo','rami'];
  if (FAST_DRY_NATURAL.includes(mainName)) pros.push('seca rápido');

  // Volume na mala: menciona quando é notavelmente bom ou mau
  const pack = scores?.packability;
  const warmth = scores?.warmth;
  // Peça de inverno leve e quente: o trunfo da mala de inverno
  if (warmth != null && warmth >= 70 && pack != null && pack >= 58) {
    pros.push('aquece muito sem ocupar espaço');
  } else if (pack != null) {
    if (pack >= 85) pros.push('ocupa pouco espaço');
    else if (pack <= 48) cons.push('é volumosa na mala');
  }

  const join = arr => arr.length === 2 ? arr.join(' e ') : arr.join(', ');
  const prosTxt = pros.length ? join(pros) : '';
  const consTxt = cons.length ? join(cons) : '';

  const knitNote = isKnit && mainWrinkles && !hasAntiWrinkle
    ? (en ? ' Being a knit, it wrinkles less than a woven of the same fibre.' : ' Como é malha, amassa menos que um tecido plano da mesma fibra.') : '';

  const travelTrait = TRAVEL_TRAITS[mainName] || null;

  if (en) {
    const enPros = pros.map(p => p === 'seca rápido' ? 'quick-drying' : p === 'regula a temperatura e não retém odor' ? 'temperature-regulating and odour-resistant' : p === 'não amassa e regula a temperatura' ? 'wrinkle-resistant and temperature-regulating' : p === 'combina com tudo' ? 'versatile' : p === 'fácil de cuidar' ? 'easy care' : p === 'aquece muito sem ocupar espaço' ? 'very warm without taking up much space' : p === 'ocupa pouco espaço' ? 'packs small' : p);
    const enCons = cons.map(c => c === 'amassa com facilidade' ? 'wrinkles easily' : c === 'demora a secar' ? 'slow to dry' : c === 'é volumosa na mala' ? 'bulky in a bag' : c);
    const enProsTxt = enPros.length ? (enPros.length === 2 ? enPros.join(' and ') : enPros.join(', ')) : '';
    const enConsTxt = enCons.length ? (enCons.length === 2 ? enCons.join(' and ') : enCons.join(', ')) : '';
    if (t >= 82) return `Perfect for travel${enProsTxt ? ' — '+enProsTxt : ''}.${knitNote}`;
    if (t >= 70) {
      if (enCons.includes('wrinkles easily')) return `Great for travel, just wrinkles a little — pack it folded.${knitNote}`;
      if (enConsTxt) return `Great for travel, just ${enConsTxt}.${knitNote}`;
      if (enProsTxt) return `Great for travel: ${enProsTxt}.${knitNote}`;
      if (travelTrait) return `Good for travel — ${travelTrait}.${knitNote}`;
      return `Good for travel.${knitNote}`;
    }
    if (t >= 58) {
      if (enConsTxt) return `Manageable for travel, but ${enConsTxt}.${knitNote}`;
      if (travelTrait) return `Manageable for travel — ${travelTrait}.${knitNote}`;
      return `Manageable for travel with basic care.${knitNote}`;
    }
    if (t >= 45) return `Not ideal for travel${enConsTxt ? ': '+enConsTxt : ''}.${knitNote} Better for everyday use.`;
    return `Not worth packing${enConsTxt ? ' — '+enConsTxt : ''}. Too much work to keep looking good.`;
  }

  if (t >= 82) return `Para mala é perfeita${prosTxt ? ' — '+prosTxt : ''}.${knitNote}`;
  if (t >= 70) {
    if (cons.includes('amassa com facilidade')) return `Boa para viagem, só amassa um pouco — leve dobrada.${knitNote}`;
    if (consTxt) return `Boa para viagem, só ${consTxt}.${knitNote}`;
    if (prosTxt) return `Boa para viagem: ${prosTxt}.${knitNote}`;
    if (travelTrait) return `Boa para viagem — ${travelTrait}.${knitNote}`;
    return `Boa para viagem.${knitNote}`;
  }
  if (t >= 58) {
    if (consTxt) return `Dá para levar, mas ${consTxt}.${knitNote}`;
    if (travelTrait) return `Dá para levar — ${travelTrait}.${knitNote}`;
    return `Dá para levar com algum cuidado.${knitNote}`;
  }
  if (t >= 45) return `Para viagem não é a ideal${consTxt ? ': '+consTxt : ''}.${knitNote} Rende mais no dia a dia.`;
  return `Para mala não compensa${consTxt ? ' — '+consTxt : ''}. Dá demasiado trabalho para manter no jeito.`;
}

// ─── Versatilidade por cor e padrão (aproximação da lógica LookMap) ──
// A cor é o maior factor de combinação: neutros combinam com tudo,
// cores vivas limitam; liso multiplica looks, estampado restringe.
const NEUTRAL_COLORS = ['preto','black','branco','white','off-white','offwhite','cru','écru','ecru','bege','beige','creme','cream','crème','cinza','cinzento','gray','grey','grafite','antracite','charcoal','azul marinho','marinho','navy','caqui','khaki','camel','camelo','castanho','marrom','brown','chocolate','nude','taupe','areia','sand','pedra','stone','tostado'];
const BOLD_COLORS = ['vermelho','red','amarelo','yellow','laranja','orange','rosa','pink','fúcsia','fucsia','fuchsia','roxo','purple','lilás','lilas','lavanda','malva','verde limão','lima','lime','turquesa','turquoise','coral','magenta','cobalto','cobalt','esmeralda','emerald','mostarda','mustard'];
// Termos de estampado — usados com limite de palavra para evitar falsos positivos
// (ex: "check" em "checkout", "print" em "footprint", "padrão" em "padrão de qualidade")
const PRINT_WORDS = ['estampado','estampada','estampados','estampadas','estampa','floral','florais','listrado','listrada','listras','riscas','xadrez','tartan','vichy','animal print','leopardo','poá','bolinhas','geométrico','geometrico','tie-dye','paisley'];
// Termos em inglês que só contam como palavra isolada exata
const PRINT_WORDS_EN = ['printed','floral','striped','stripes','checked','plaid','polka','gingham','paisley','geometric'];

function detectColorPattern(pageText) {
  const t = (pageText || '').toLowerCase();
  // Cor: procura primeiro junto a "cor:"/"color:" (mais fiável), senão no texto curto
  let colorScope = t;
  const m = t.match(/(?:cor|color|colour)\s*:?\s*([a-zà-ÿ\s-]{2,20})/);
  if (m) colorScope = m[1];
  let colorClass = 'mid';
  if (NEUTRAL_COLORS.some(c => colorScope.includes(c))) colorClass = 'neutral';
  else if (BOLD_COLORS.some(c => colorScope.includes(c))) colorClass = 'bold';
  // Estampado: limita a deteção aos primeiros 800 chars (título + descrição do produto)
  // para evitar falsos positivos de produtos relacionados listados mais abaixo na página
  const printScope = t.slice(0, 800);
  const wordHit = (w) => new RegExp('\\b' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i').test(printScope);
  const isPrint = PRINT_WORDS.some(wordHit) || PRINT_WORDS_EN.some(wordHit);
  // Modificador de versatilidade
  // Cor marcante não penaliza — depende do estilo de cada pessoa
  let mod = 0, note = '';
  if (colorClass === 'neutral' && !isPrint) { mod += 6; note = 'cor neutra e lisa, combina com tudo'; }
  else if (colorClass === 'neutral') { mod += 2; note = 'cor neutra'; }
  else if (colorClass === 'bold') { note = 'cor marcante — peça de destaque'; }
  if (isPrint) { mod -= 8; note = note ? note + ', estampado pede combinações pensadas' : 'estampado pede combinações pensadas'; }
  return { colorClass, isPrint, mod, note };
}

// ─── Packability (0-100): quão pouco espaço a peça ocupa na mala ──
// Fibras finas e leves dobram pequeno; malhas grossas e fibras volumosas ocupam mais.
const PACKABILITY = {
  'seda': 95, 'poliamida': 92, 'nylon': 92, 'viscose': 88, 'modal': 88,
  'lyocell': 85, 'tencel': 85, 'elastano': 85, 'poliéster': 82, 'acetato': 86,
  'linho': 74, 'algodão': 70, 'algodão orgânico': 70, 'cânhamo': 68, 'rami': 70,
  'merino': 74, 'lã merino': 74,           // merino fino dobra bem
  'caxemira': 64, 'alpaca': 58, 'lambswool': 54, 'lã de cordeiro': 54,
  'lã': 50, 'mohair': 50, 'angorá': 52, 'acrílico': 56,
};
function packabilityScore(fibers, isKnit, isBulky) {
  if (!fibers?.length) return null;
  let weighted = 0, knownPct = 0;
  fibers.forEach(f => {
    const n = (f.name || '').toLowerCase();
    if (PACKABILITY[n] != null) { weighted += PACKABILITY[n] * (f.pct || 0); knownPct += (f.pct || 0); }
  });
  if (knownPct < 40) return 65;            // desconhecida → assume médio
  let p = Math.round(weighted / knownPct);
  if (isKnit) p = Math.round(p * 0.82);    // malha é mais volumosa que a fibra sugere
  if (isBulky) p = Math.round(p * 0.55);   // casaco/blazer/parka ocupa muito espaço, seja a fibra que for
  return Math.max(0, Math.min(100, p));
}

// ─── Calor por fibra (0-100) — quão quente a fibra é ─────────────
// Usado para o indicador de calor em peças de inverno.
const WARMTH = {
  'angorá': 96, 'caxemira': 92, 'alpaca': 90, 'mohair': 88,
  'lã': 85, 'lambswool': 86, 'lã de cordeiro': 86, 'merino': 84, 'lã merino': 84,
  'acrílico': 70, 'poliéster': 55, 'poliamida': 50, 'fleece': 78, 'velo': 78,
  'algodão': 40, 'algodão orgânico': 40, 'modal': 42, 'viscose': 38, 'lyocell': 40,
  'seda': 45, 'linho': 18, 'cânhamo': 22, 'rami': 20, 'elastano': 30,
};
function warmthScore(fibers) {
  if (!fibers?.length) return null;
  const total = fibers.reduce((s, f) => s + (f.pct || 0), 0) || 100;
  let weighted = 0, knownPct = 0;
  fibers.forEach(f => {
    const n = (f.name || '').toLowerCase();
    if (WARMTH[n] != null) { weighted += WARMTH[n] * (f.pct || 0); knownPct += (f.pct || 0); }
  });
  if (knownPct < 40) return null;          // fibra desconhecida domina → não arrisca
  return Math.round(weighted / knownPct);  // média ponderada só das fibras conhecidas
}
function warmthLabel(w) {
  if (w == null) return null;
  const en = typeof LP_LANG !== 'undefined' && LP_LANG === 'en';
  if (w >= 82) return { label: en ? 'very warm'       : 'muito quente',   level: 'alto',  txt: en ? 'very warm — for serious cold'        : 'aquece muito — para frio a sério' };
  if (w >= 60) return { label: en ? 'warm'            : 'quente',         level: 'alto',  txt: en ? 'warms well in winter'                : 'aquece bem no inverno' };
  if (w >= 45) return { label: en ? 'moderate warmth' : 'calor moderado', level: 'médio', txt: en ? 'moderate warmth — good for mid-season': 'calor moderado — bom para meia-estação' };
  if (w >= 30) return { label: en ? 'light'           : 'leve',           level: 'baixo', txt: en ? 'light warmth — better for layering'  : 'calor leve — mais para sobreposição' };
  return { label: en ? 'cool' : 'fresca', level: 'baixo', txt: en ? 'cool fibre — not warm' : 'fibra fresca — não aquece' };
}

// ─── Traços específicos por fibra (para conclusões não-genéricas) ──
const FIBER_TRAITS = {
  'algodão':       { strong: ['respira bem e é confortável no corpo todo o dia','é macio, natural e veste-se bem em qualquer estação','é a base versátil que combina com tudo no guarda-roupa'], mid: ['respira bem e é fácil de usar, só amassa um pouco','macio e natural, pede só uma passagem a ferro de vez em quando','confortável e prático, amassa mas nada de grave'] },
  'algodão orgânico': { strong: ['respira bem, é macio e foi cultivado sem pesticidas','tem o conforto do algodão com cultivo mais limpo e responsável'], mid: ['macio e respirável, com cultivo mais limpo','algodão de origem mais consciente, confortável no dia a dia'] },
  'cotton':        { strong: ['respira bem e é confortável no corpo todo o dia','é macio, natural e veste-se bem em qualquer estação','é a base versátil que combina com tudo no guarda-roupa'], mid: ['respira bem e é fácil de usar, só amassa um pouco','macio e natural, pede só uma passagem a ferro de vez em quando','confortável e prático, amassa mas nada de grave'] },
  'linho':         { strong: ['é fresco, respira como nenhuma outra fibra e dura anos','é a fibra de verão por excelência — fresca e cada vez melhor com o tempo'], mid: ['fresquíssimo no calor, mas amassa — faz parte do charme','fresco e natural, o vinco é assinatura, não defeito'] },
  'linen':         { strong: ['é fresco, respira como nenhuma outra fibra e dura anos','é a fibra de verão por excelência — fresca e cada vez melhor com o tempo'], mid: ['fresquíssimo no calor, mas amassa — faz parte do charme','fresco e natural, o vinco é assinatura, não defeito'] },
  'lã':            { strong: ['aquece muito sem pesar, regula a temperatura e não amassa','é quente, durável e dispensa lavagens frequentes'], mid: ['quente e resistente, pede lavagem com cuidado','aquece bem, só exige um cuidado extra na lavagem'] },
  'lã merino':     { strong: ['aquece e regula a temperatura, não retém odor e é macia na pele'], mid: ['quente, macia e térmica, ótima para camadas'] },
  'merino':        { strong: ['aquece e regula a temperatura, não retém odor e é macia na pele'], mid: ['quente, macia e térmica, ótima para camadas'] },
  'seda':          { strong: ['tem caimento e brilho únicos, leve e elegante'], mid: ['luxuosa e leve, mas exige cuidado na lavagem'] },
  'silk':          { strong: ['tem caimento e brilho únicos, leve e elegante'], mid: ['luxuosa e leve, mas exige cuidado na lavagem'] },
  'caxemira':      { strong: ['é incrivelmente macia, quente e leve ao mesmo tempo'], mid: ['macia e quente, mas delicada — trata com carinho'] },
  'mohair':        { strong: ['tem brilho e calor com pouquíssimo peso'], mid: ['quente e brilhante, mas solta pelo e pede cuidado'] },
  'alpaca':        { strong: ['é mais quente e leve que a lã, e quase não faz bolinhas'], mid: ['macia e térmica, hipoalergénica — boa alternativa à lã'] },
  'lambswool':     { strong: ['é macia, quente e elástica — a lã na sua forma mais nobre'], mid: ['macia e quente, mais delicada que a lã comum'] },
  'lã de cordeiro':{ strong: ['é macia, quente e elástica — a lã na sua forma mais nobre'], mid: ['macia e quente, mais delicada que a lã comum'] },
  'angorá':        { strong: ['é das fibras mais macias e quentes que existem'], mid: ['ultra-macia, mas frágil e solta pelo — peça de ocasião'] },
  'lyocell':       { strong: ['é macio, respira bem e vem de processo sustentável'], mid: ['macio e fresco, com origem mais limpa que a viscose'] },
  'tencel':        { strong: ['é macio, respira bem e vem de processo sustentável'], mid: ['macio e fresco, com origem mais limpa que a viscose'] },
  'modal':         { strong: ['é sedoso, resistente e mantém a cor lavagem após lavagem'], mid: ['macio e durável, segura bem a cor'] },
  'cânhamo':       { strong: ['é resistente, fresco e fica melhor com o tempo'], mid: ['durável e fresco, amacia a cada lavagem'] },
  'viscose':       { strong: ['tem caimento fluido e toque macio'], mid: ['cai bem e é macia, mas perde resistência quando molhada'] },
  'poliamida':     { strong: ['é leve, resistente à abrasão e seca rápido'], mid: ['resistente e leve, mas não respira muito'] },
  'nylon':         { strong: ['é leve, resistente à abrasão e seca rápido'], mid: ['resistente e leve, mas não respira muito'] }
};

const FIBER_TRAITS_EN = {
  'algodão':            { strong: ['breathes well and stays comfortable all day','soft, natural and versatile for any season','the versatile base that works with everything in the wardrobe'], mid: ['breathes well and easy to wear, wrinkles a little','soft and natural, just needs a quick iron now and then','comfortable and practical, wrinkles but nothing serious'] },
  'algodão orgânico':   { strong: ['breathes well, soft and grown without pesticides','cotton comfort with a cleaner, more responsible production'], mid: ['soft and breathable, with cleaner cultivation','more consciously sourced cotton, comfortable day to day'] },
  'cotton':             { strong: ['breathes well and stays comfortable all day','soft, natural and versatile for any season','the versatile base that works with everything in the wardrobe'], mid: ['breathes well and easy to wear, wrinkles a little','soft and natural, just needs a quick iron now and then','comfortable and practical, wrinkles but nothing serious'] },
  'linho':              { strong: ['cool, breathes like no other fibre and lasts years','the summer fibre — cool and only gets better with time'], mid: ['incredibly cool in the heat, wrinkles — that\'s part of the charm','cool and natural, the creases are a feature, not a flaw'] },
  'linen':              { strong: ['cool, breathes like no other fibre and lasts years','the summer fibre — cool and only gets better with time'], mid: ['incredibly cool in the heat, wrinkles — that\'s part of the charm','cool and natural, the creases are a feature, not a flaw'] },
  'lã':                 { strong: ['very warm without weight, regulates temperature and doesn\'t wrinkle','warm, durable and needs washing less often'], mid: ['warm and resilient, needs careful washing','warms well, just needs a little extra care when washing'] },
  'lã merino':          { strong: ['warm, regulates temperature, odour-resistant and soft on skin'], mid: ['warm, soft and thermal, great for layering'] },
  'merino':             { strong: ['warm, regulates temperature, odour-resistant and soft on skin'], mid: ['warm, soft and thermal, great for layering'] },
  'seda':               { strong: ['unique drape and lustre, lightweight and elegant'], mid: ['luxurious and light, but needs careful washing'] },
  'silk':               { strong: ['unique drape and lustre, lightweight and elegant'], mid: ['luxurious and light, but needs careful washing'] },
  'caxemira':           { strong: ['incredibly soft, warm and lightweight at the same time'], mid: ['soft and warm, but delicate — treat it with care'] },
  'mohair':             { strong: ['lustre and warmth with very little weight'], mid: ['warm and lustrous, but sheds and needs careful handling'] },
  'alpaca':             { strong: ['warmer and lighter than wool, and almost no pilling'], mid: ['soft and thermal, hypoallergenic — a great wool alternative'] },
  'lambswool':          { strong: ['soft, warm and springy — wool at its finest'], mid: ['soft and warm, more delicate than regular wool'] },
  'lã de cordeiro':     { strong: ['soft, warm and springy — wool at its finest'], mid: ['soft and warm, more delicate than regular wool'] },
  'angorá':             { strong: ['one of the softest and warmest fibres that exists'], mid: ['ultra-soft, but fragile and sheds — an occasional wear piece'] },
  'lyocell':            { strong: ['soft, breathable and made through a sustainable process'], mid: ['soft and cool, with a cleaner origin than viscose'] },
  'tencel':             { strong: ['soft, breathable and made through a sustainable process'], mid: ['soft and cool, with a cleaner origin than viscose'] },
  'modal':              { strong: ['silky, resilient and holds its colour wash after wash'], mid: ['soft and durable, holds colour well'] },
  'cânhamo':            { strong: ['durable, cool and gets better over time'], mid: ['durable and cool, softens with each wash'] },
  'viscose':            { strong: ['fluid drape and soft touch'], mid: ['drapes well and soft, but loses strength when wet'] },
  'poliamida':          { strong: ['lightweight, abrasion-resistant and quick-drying'], mid: ['durable and light, but not very breathable'] },
  'nylon':              { strong: ['lightweight, abrasion-resistant and quick-drying'], mid: ['durable and light, but not very breathable'] }
};

// Seletor determinístico: a mesma peça mostra sempre a mesma frase, mas peças
// diferentes (composição ou tipo de peça diferente) variam. Aceita string ou array.
function pickTrait(variants, fibers, seedExtra) {
  if (!variants) return null;
  if (typeof variants === 'string') return variants;
  if (!Array.isArray(variants) || !variants.length) return null;
  let seed = 0;
  (fibers || []).forEach((f, i) => { seed += (f.pct || 0) * (i + 1) + (f.name || '').length; });
  // hash estilo djb2 sobre seedExtra (tipo de peça) para dispersar melhor entre tipos
  if (seedExtra) {
    let h = 5381;
    for (let i = 0; i < seedExtra.length; i++) h = ((h << 5) + h + seedExtra.charCodeAt(i)) >>> 0;
    seed += h;
  }
  return variants[seed % variants.length];
}

// ─── Traços de viagem específicos por fibra ───────────────────────
const TRAVEL_TRAITS = {
  'algodão':   'respira e veste bem, mas amassa um pouco e seca devagar',
  'cotton':    'respira e veste bem, mas amassa um pouco e seca devagar',
  'algodão orgânico': 'respira e veste bem, mas amassa um pouco e seca devagar',
  'modal':     'macio e leve, resiste bem às lavagens da viagem',
  'lyocell':   'leve e versátil, mas leve dobrada que amassa moderado',
  'tencel':    'leve e versátil, mas leve dobrada que amassa moderado',
  'viscose':   'cai bem mas é delicada — amassa e pede lavagem cuidadosa',
  'seda':      'elegante mas delicada — mais para ocasião que para uso intenso',
  'caxemira':  'quente, leve e compacta — ótima para destino frio',
  'lã':        'não amassa e regula temperatura, mas é volumosa na mala',
};

// ─── Explicação de misturas em linguagem natural ──────────────────
const BLEND_RULES = {
  elastano:   { ate:5,  baixo:"O toque de elastano deixa a peça confortável e com bom caimento, mas é ele que cede primeiro — com muitas lavagens pode perder a forma.", alto:"Tem elastano suficiente para um stretch agradável que volta ao lugar. Lave a frio para durar mais.", en_baixo:"The touch of elastane keeps it comfortable with good drape, but it's the first to give — may lose shape after many washes.", en_alto:"Enough elastane for a comfortable stretch that bounces back. Wash cold to make it last." },
  spandex:    { ate:5,  baixo:"O elastano dá conforto e ajuste, mas cede com o tempo — lave a frio para durar.", alto:"Stretch firme que recupera bem a forma.", en_baixo:"Elastane adds comfort and fit, but gives over time — wash cold to preserve it.", en_alto:"Firm stretch that recovers its shape well." },
  lycra:      { ate:5,  baixo:"O lycra dá aquele ajuste confortável; com calor e tempo tende a ceder antes do tecido.", alto:"Lycra garante stretch durável e bom retorno de forma.", en_baixo:"Lycra gives that comfortable fit; tends to give with heat and time before the fabric does.", en_alto:"Lycra ensures durable stretch and good shape recovery." },
  "poliéster":{ ate:15, baixo:"O pouco poliéster serve apenas para dar firmeza e segurar os vincos — não compromete o toque.", alto:"Bastante poliéster: aguenta bem e quase não amassa, mas respira menos. Pode esquentar no calor.", en_baixo:"The small amount of polyester just adds structure and holds the shape — doesn't compromise the feel.", en_alto:"Quite a lot of polyester: holds up well and barely wrinkles, but breathes less. Can feel warm." },
  poliester:  { ate:15, baixo:"Pouco poliéster, só para dar estrutura e reduzir vincos.", alto:"Muito poliéster: durável e sem amassar, mas respira menos.", en_baixo:"A little polyester, just for structure and to reduce wrinkling.", en_alto:"Quite a lot of polyester: durable and wrinkle-resistant, but breathes less." },
  poliamida:  { ate:15, baixo:"A poliamida reforça a resistência sem alterar o aspecto da peça.", alto:"A poliamida dá resistência e secagem rápida; respira menos do que fibra natural.", en_baixo:"Polyamide strengthens durability without changing how the piece looks.", en_alto:"Polyamide adds strength and quick drying; breathes less than natural fibre." },
  nylon:      { ate:15, baixo:"O nylon entra para reforçar e evitar desgaste.", alto:"O nylon dá resistência e seca rápido, com menos respirabilidade.", en_baixo:"Nylon is there to reinforce and prevent wear.", en_alto:"Nylon adds durability and dries fast, with less breathability." },
  viscose:    { ate:30, baixo:"A viscose traz um caimento fluido e leve.", alto:"A viscose dá um caimento bonito e macio, mas é mais delicada — cuidado na lavagem.", en_baixo:"Viscose brings fluid, lightweight drape.", en_alto:"Viscose gives beautiful, soft drape, but is more delicate — handle with care when washing." },
  acrílico:   { ate:100,baixo:"O acrílico imita a lã a menor custo, mas costuma fazer bolinhas.", alto:"O acrílico substitui a lã por menos, mas bola com facilidade e aquece menos.", en_baixo:"Acrylic mimics wool at a lower cost, but tends to pill.", en_alto:"Acrylic substitutes wool for less, but pills easily and is not as warm." },
  acrilico:   { ate:100,baixo:"O acrílico imita a lã a menor custo, mas faz bolinhas.", alto:"O acrílico substitui a lã por menos, mas bola e aquece menos.", en_baixo:"Acrylic mimics wool at a lower cost, but pills.", en_alto:"Acrylic substitutes wool for less, but pills and is not as warm." }
};

const BLEND_NOBLE = {
  "algodão|linho": { pt: "Algodão com linho é uma dupla muito respirável — ideal para calor (e sim, vai amassar um pouco, faz parte).", en: "Cotton and linen are a very breathable duo — ideal for heat (and yes, it will wrinkle a little, that's part of the deal)." },
  "lyocell|algodão": { pt: "O lyocell dá um toque sedoso ao algodão, com caimento melhor e mais resistência quando molha.", en: "Lyocell gives the cotton a silky feel, with better drape and more strength when wet." },
  "lã|caxemira": { pt: "A lã reforça a caxemira: fica mais durável, bola menos e mantém o agasalho.", en: "Wool reinforces the cashmere: more durable, less pilling, keeps its shape." },
  "seda|algodão": { pt: "A mistura deixa a seda mais prática e resistente — perde um pouco do brilho, ganha em facilidade.", en: "The blend makes silk more practical and durable — loses a little lustre, gains in ease." }
};

function blendText(fibers) {
  const en = typeof LP_LANG !== 'undefined' && LP_LANG === 'en';
  if (!fibers || fibers.length < 2) return '';
  const sorted = [...fibers].sort((a, b) => (b.pct || 0) - (a.pct || 0));
  const main = sorted[0];
  const second = sorted[1];
  const mainName = (main.data?.label || main.name || '').toLowerCase();
  const secName = (second.name || '').toLowerCase();

  const nobleKey = Object.keys(BLEND_NOBLE).find(k => {
    const [a, b] = k.split('|');
    return (mainName.includes(a) && secName.includes(b)) || (mainName.includes(b) && secName.includes(a));
  });
  if (nobleKey) return en ? BLEND_NOBLE[nobleKey].en : BLEND_NOBLE[nobleKey].pt;

  const ruleKey = Object.keys(BLEND_RULES).find(k => secName.includes(k));
  if (ruleKey) {
    const rule = BLEND_RULES[ruleKey];
    const pct = second.pct || 0;
    if (en) return pct <= rule.ate ? rule.en_baixo : rule.en_alto;
    return pct <= rule.ate ? rule.baixo : rule.alto;
  }
  return '';
}

function scoreBar(val, max = 10) {
  const pct = Math.round(val / max * 100);
  const color = pct >= 75 ? '#16a34a' : pct >= 55 ? '#d97706' : '#dc2626';
  return `<div style="flex:1;height:4px;background:#F5F5F7;border-radius:2px;overflow:hidden;"><div style="width:${pct}%;height:100%;background:${color};border-radius:2px;"></div></div>`;
}
