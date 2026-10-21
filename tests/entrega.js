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

// ── O PACOTE DA LOJA ────────────────────────────────────────────────
// O zip de cima serve o botão "Baixar extensão": abre numa pasta, porque
// quem instala à mão escolhe uma PASTA. A Chrome Web Store quer o contrário
// — "place the manifest file in the root directory, not in a folder" — e
// recusa o pacote inteiro se o manifest estiver dentro de lookpilot/.
// São duas exigências opostas sobre o mesmo código, por isso são dois zips.
console.log('\n── Pacote da Chrome Web Store ──────────────────────────\n');

const ZIP_LOJA = path.join(raiz, 'dist', 'lookpilot-loja.zip');
const manifestRepo = JSON.parse(fs.readFileSync(path.join(raiz, 'manifest.json'), 'utf8'));

// Nome e descrição do manifest SÃO a ficha da loja: depois do primeiro envio
// o painel não deixa editá-los ("you won't be able to edit the metadata of
// your manifest in the developer dashboard"). Errar aqui custa uma versão
// nova e uma revisão nova.
checa('o nome cabe no limite da loja (75 caracteres)', () => {
  const n = manifestRepo.name || '';
  if (!n) throw new Error('manifest sem "name"');
  if (n.length > 75) throw new Error(`"name" tem ${n.length} caracteres; o máximo é 75`);
});

checa('a descrição cabe no limite da loja (132 caracteres)', () => {
  const d = manifestRepo.description || '';
  if (!d) throw new Error('manifest sem "description"');
  if (d.length > 132) throw new Error(`"description" tem ${d.length} caracteres; o máximo é 132`);
});

// O guia é copiado à mão para dentro do formulário. Se ele anunciar um nome
// que o manifest não tem, a ficha publicada contradiz o guia — e ninguém
// percebe até a extensão estar na loja com o nome errado.
checa('o guia de submissão anuncia o nome e a descrição que vão no pacote', () => {
  const guia = fs.readFileSync(path.join(raiz, 'publicar-chrome-web-store.md'), 'utf8');
  // o guia tem o rótulo numa linha, a cerca abaixo e o texto a seguir:
  //   **Nome**
  //   ```
  //   LookPilot ...
  const linhas = guia.split('\n');
  const bloco = rotulo => {
    const i = linhas.indexOf('**' + rotulo + '**');
    const j = i >= 0 ? i : linhas.findIndex(l => l.startsWith('**' + rotulo));
    if (j < 0 || linhas[j + 1] !== '```') {
      throw new Error(`não achei o bloco "${rotulo}" em publicar-chrome-web-store.md`);
    }
    return linhas[j + 2].trim();
  };
  const nomeGuia = bloco('Nome');
  if (nomeGuia !== manifestRepo.name) {
    throw new Error(`o guia diz "${nomeGuia}" e o manifest diz "${manifestRepo.name}".\n` +
      '      Quem sobe para a loja é o manifest: o nome do painel vem de lá.');
  }
  const descGuia = bloco('Descrição curta');
  if (descGuia !== manifestRepo.description) {
    throw new Error(`a descrição curta do guia não é a do manifest.\n` +
      `      guia:     ${descGuia}\n      manifest: ${manifestRepo.description}`);
  }
});

if (!fs.existsSync(ZIP_LOJA)) {
  // estado de execução, não defeito: o pacote da loja não é versionado,
  // justamente para nunca subir um zip velho sem ninguém reparar.
  avisos++;
  avisa('o pacote da loja ainda não foi gerado',
    'dist/lookpilot-loja.zip não existe. Gere-o imediatamente antes de enviar:\n' +
    '      cd landing && ./empacotar.sh');
} else {
  const mLoja = fs.statSync(ZIP_LOJA).mtimeMs;
  const listaLoja = execSync(`unzip -Z1 "${ZIP_LOJA}"`, { encoding: 'utf8' }).trim().split('\n');

  checa('o manifest.json está na RAIZ do zip (sem pasta por cima)', () => {
    if (!listaLoja.includes('manifest.json')) {
      const pastas = [...new Set(listaLoja.map(l => l.split('/')[0]))].join(', ');
      throw new Error('o zip da loja não tem manifest.json na raiz — achei: ' + pastas +
        '\n      A Chrome Web Store recusa o pacote inteiro com "Manifest file is missing or unreadable".' +
        '\n      Rode: cd landing && ./empacotar.sh');
    }
    const comPasta = listaLoja.filter(l => l.includes('/'));
    if (comPasta.length) throw new Error(`o zip da loja tem arquivos dentro de pasta: ${comPasta.join(', ')}`);
  });

  checa('o zip da loja tem os arquivos necessários e nada mais', () => {
    const dentro = new Set(listaLoja);
    const faltam = NECESSARIOS.filter(f => !dentro.has(f));
    if (faltam.length) throw new Error(`faltam no zip da loja: ${faltam.join(', ')}`);
    const sobram = listaLoja.filter(f => !NECESSARIOS.includes(f));
    if (sobram.length) throw new Error(`entrou lixo no zip da loja: ${sobram.join(', ')}`);
  });

  checa('o zip da loja está mais novo que o código da extensão', () => {
    const velhos = NECESSARIOS.filter(f => {
      const pf = path.join(raiz, f);
      return fs.existsSync(pf) && fs.statSync(pf).mtimeMs > mLoja;
    });
    if (velhos.length) {
      throw new Error(`o pacote da loja é ANTERIOR a: ${velhos.join(', ')}\n` +
        '      Subiria para revisão uma versão velha. Rode: cd landing && ./empacotar.sh');
    }
  });

  checa('o zip da loja bate com os arquivos do repositório', () => {
    const crypto = require('crypto');
    const md5 = b => crypto.createHash('md5').update(b).digest('hex');
    const diferentes = NECESSARIOS.filter(f => {
      const local = fs.readFileSync(path.join(raiz, f));
      const dentro = execSync(`unzip -p "${ZIP_LOJA}" "${f}"`, { maxBuffer: 1 << 24 });
      return md5(local) !== md5(dentro);
    });
    if (diferentes.length) {
      throw new Error(`o conteúdo difere do repositório em: ${diferentes.join(', ')}\n` +
        '      Rode: cd landing && ./empacotar.sh');
    }
  });

  checa('a versão empacotada é a versão do repositório', () => {
    const dentro = JSON.parse(execSync(`unzip -p "${ZIP_LOJA}" manifest.json`, { encoding: 'utf8' }));
    if (dentro.version !== manifestRepo.version) {
      throw new Error(`o zip leva a versão ${dentro.version} e o repositório está na ${manifestRepo.version}`);
    }
  });

  checa('os dois zips levam exatamente o mesmo código', () => {
    if (!fs.existsSync(ZIP)) return;   // já reclamado acima
    const crypto = require('crypto');
    const md5 = b => crypto.createHash('md5').update(b).digest('hex');
    const pastaDl = execSync(`unzip -Z1 "${ZIP}"`, { encoding: 'utf8' }).trim().split('\n')[0].split('/')[0];
    const diferentes = NECESSARIOS.filter(f => {
      const a = execSync(`unzip -p "${ZIP}" "${pastaDl}/${f}"`, { maxBuffer: 1 << 24 });
      const b = execSync(`unzip -p "${ZIP_LOJA}" "${f}"`, { maxBuffer: 1 << 24 });
      return md5(a) !== md5(b);
    });
    if (diferentes.length) {
      throw new Error(`quem baixa da landing e quem instala da loja recebem código diferente em: ${diferentes.join(', ')}`);
    }
  });
}

// ── UMA SÓ CÓPIA DA EXTENSÃO ────────────────────────────────────────
// Havia uma segunda cópia completa versionada em landing/lookpilot/, parada
// a 18 de Setembro, que nada gerava nem actualizava. Ninguém a carregava de
// propósito — mas estava ali, com um manifest válido, à espera de ser
// escolhida por engano em "Carregar sem compactação". Custou meia tarde de
// suspeita quando uma correcção parecia não pegar.
console.log('\n── Uma só cópia da extensão ────────────────────────────\n');

checa('não há segunda cópia da extensão no repositório', () => {
  const achados = [];
  (function procura(dir) {
    for (const nome of fs.readdirSync(dir)) {
      if (nome === '.git' || nome === 'node_modules' || nome === 'dist') continue;
      const p = path.join(dir, nome);
      if (!fs.statSync(p).isDirectory()) continue;
      if (fs.existsSync(path.join(p, 'manifest.json'))) {
        try {
          const m = JSON.parse(fs.readFileSync(path.join(p, 'manifest.json'), 'utf8'));
          if (m.content_scripts || m.background) achados.push(path.relative(raiz, p));
        } catch (e) {}
      }
      procura(p);
    }
  })(raiz);
  if (achados.length) {
    throw new Error('cópia da extensão em: ' + achados.join(', ') +
      '\n      Uma pasta com manifest válido pode ser carregada no Chrome por engano' +
      '\n      e servir código velho — a correcção parece não funcionar.');
  }
  return true;
});

console.log('\n── Entrega pela landing ────────────────────────────────\n');

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
