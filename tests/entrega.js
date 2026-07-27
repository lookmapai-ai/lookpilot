#!/usr/bin/env node
/* Testa a ENTREGA da extensão: o caminho entre o código no repositório e o
   arquivo que a pessoa baixa ao clicar em "Baixar extensão".
 *
 *   node tests/entrega.js
 *
 * Existe porque esse link já quebrou duas vezes, por causas diferentes e com
 * o MESMO sintoma ("o link não funciona"):
 *   1. o zip estava 2 dias velho — servia a extensão antiga, com popup e com
 *      o bug da composição, e nada indicava isso;
 *   2. o servidor local estava fora — o arquivo estava certo, ninguém servia.
 *
 * Por isso o teste separa dois tipos de problema:
 *   FALHA  = defeito no repositório (some ao corrigir e fica corrigido)
 *   AVISO  = estado de execução (ex.: servidor fora — é só levantar)
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const raiz = path.join(__dirname, '..');
const ZIP = path.join(raiz, 'landing', 'lookpilot-extensao.zip');
const PORTA = 8777;

let falhas = 0, avisos = 0, ok = 0;

function checa(nome, fn) {
  try {
    const r = fn();
    if (r === 'aviso') { avisos++; return; }
    console.log(`  ✓ ${nome}`);
    ok++;
  } catch (e) {
    console.log(`  ✗ ${nome}\n      ${e.message}`);
    falhas++;
  }
}
function avisa(nome, msg) {
  console.log(`  ! ${nome}\n      ${msg}`);
}

// arquivos que a extensão precisa em execução (espelha o empacotar.sh)
const NECESSARIOS = [
  'manifest.json', 'background.js', 'strings.js', 'shared.js', 'categories.js',
  'content.js', 'popup.html', 'popup.js', 'icon16.png', 'icon48.png', 'icon128.png'
];

console.log('\n── Entrega da extensão ─────────────────────────────────\n');

checa('o zip existe', () => {
  if (!fs.existsSync(ZIP)) {
    throw new Error('landing/lookpilot-extensao.zip não existe. Rode: cd landing && ./empacotar.sh');
  }
});

if (fs.existsSync(ZIP)) {
  const mZip = fs.statSync(ZIP).mtimeMs;

  checa('o zip está mais novo que o código da extensão', () => {
    const velhos = NECESSARIOS.filter(f => {
      const p = path.join(raiz, f);
      return fs.existsSync(p) && fs.statSync(p).mtimeMs > mZip;
    });
    if (velhos.length) {
      throw new Error(
        `o zip é ANTERIOR a: ${velhos.join(', ')}\n` +
        '      Quem baixar recebe uma versão velha. Rode: cd landing && ./empacotar.sh');
    }
  });

  const lista = execSync(`unzip -Z1 "${ZIP}"`, { encoding: 'utf8' }).trim().split('\n');

  checa('o zip abre numa pasta única (para "Carregar sem compactação")', () => {
    const raizes = new Set(lista.map(l => l.split('/')[0]));
    if (raizes.size !== 1) throw new Error(`esperava 1 pasta, achei: ${[...raizes].join(', ')}`);
  });

  const pasta = lista[0].split('/')[0];

  checa('o zip contém todos os arquivos necessários', () => {
    const dentro = new Set(lista.map(l => l.replace(pasta + '/', '')));
    const faltam = NECESSARIOS.filter(f => !dentro.has(f));
    if (faltam.length) throw new Error(`faltam no zip: ${faltam.join(', ')}`);
  });

  const manifest = JSON.parse(execSync(`unzip -p "${ZIP}" "${pasta}/manifest.json"`, { encoding: 'utf8' }));

  checa('o manifest empacotado é v3 e não referencia arquivo ausente', () => {
    if (manifest.manifest_version !== 3) throw new Error('manifest_version não é 3');
    const dentro = new Set(lista.map(l => l.replace(pasta + '/', '')));
    const refs = [
      ...(manifest.content_scripts || []).flatMap(s => s.js || []),
      manifest.background && manifest.background.service_worker,
      manifest.action && manifest.action.default_popup,
      ...Object.values((manifest.action && manifest.action.default_icon) || {}),
      ...Object.values(manifest.icons || {})
    ].filter(Boolean);
    const ausentes = refs.filter(r => !dentro.has(r));
    if (ausentes.length) throw new Error(`o manifest aponta para arquivos que não estão no zip: ${ausentes.join(', ')}`);
  });

  checa('o clique no ícone analisa direto (sem default_popup)', () => {
    if (manifest.action && manifest.action.default_popup) {
      throw new Error('default_popup voltou ao manifest — o clique abriria o popup em vez de analisar');
    }
    const bg = execSync(`unzip -p "${ZIP}" "${pasta}/background.js"`, { encoding: 'utf8' });
    if (!/action\.onClicked/.test(bg)) throw new Error('background.js empacotado não trata action.onClicked');
  });

  checa('os scripts empacotados têm sintaxe válida', () => {
    const js = NECESSARIOS.filter(f => f.endsWith('.js'));
    for (const f of js) {
      const tmp = path.join(require('os').tmpdir(), 'lp-' + f);
      fs.writeFileSync(tmp, execSync(`unzip -p "${ZIP}" "${pasta}/${f}"`));
      try { execSync(`node --check "${tmp}"`, { stdio: 'pipe' }); }
      catch (e) { throw new Error(`${f} tem erro de sintaxe dentro do zip`); }
      finally { fs.unlinkSync(tmp); }
    }
  });

  checa('o zip bate com os arquivos do repositório', () => {
    const crypto = require('crypto');
    const md5 = b => crypto.createHash('md5').update(b).digest('hex');
    const diferentes = NECESSARIOS.filter(f => {
      const local = fs.readFileSync(path.join(raiz, f));
      const dentro = execSync(`unzip -p "${ZIP}" "${pasta}/${f}"`, { maxBuffer: 1 << 24 });
      return md5(local) !== md5(dentro);
    });
    if (diferentes.length) {
      throw new Error(`o conteúdo difere do repositório em: ${diferentes.join(', ')}\n` +
        '      Rode: cd landing && ./empacotar.sh');
    }
  });
}

checa('a página aponta para o zip que existe', () => {
  const mkt = fs.readFileSync(path.join(raiz, 'landing', 'marketing.js'), 'utf8');
  const m = mkt.match(/DOWNLOAD_URL\s*=\s*'([^']*)'/);
  if (!m) throw new Error('não achei DOWNLOAD_URL em landing/marketing.js');
  if (!m[1]) throw new Error('DOWNLOAD_URL está vazio — o botão não baixa nada');
  const alvo = path.join(raiz, 'landing', m[1]);
  if (!fs.existsSync(alvo)) throw new Error(`DOWNLOAD_URL aponta para "${m[1]}", que não existe`);
});

checa('o botão de baixar existe na página gerada', () => {
  const idx = fs.readFileSync(path.join(raiz, 'landing', 'index.html'), 'utf8');
  if (!/data-on-click="onDownload"/.test(idx)) {
    throw new Error('index.html não tem botão ligado a onDownload — rode: cd landing && python3 build.py');
  }
});

// ── estado de execução: não é defeito do repositório ────────────────
console.log('');
try {
  execSync(`curl -sf -o /dev/null --max-time 3 http://localhost:${PORTA}/lookpilot-extensao.zip`);
  console.log(`  ✓ o servidor local está servindo o zip (porta ${PORTA})`);
  ok++;
} catch (e) {
  avisos++;
  avisa(`servidor local fora (porta ${PORTA})`,
    'O arquivo está certo, mas ninguém o serve — o link não abre.\n' +
    '      Rode: cd landing && ./servir.sh');
}

console.log('\n────────────────────────────────────────────────────────');
console.log(`${ok} ok · ${falhas} falha(s) · ${avisos} aviso(s)`);
if (falhas) console.log('\nFalha = defeito no repositório. Corrija antes de publicar.');
console.log('');
process.exit(falhas > 0 ? 1 : 0);
