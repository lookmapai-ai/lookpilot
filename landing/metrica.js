/* ------------------------------------------------------------------
   Instrumento de retenção — anônimo e local.

   Responde UMA pergunta: as pessoas voltam e salvam uma segunda peça?
   É ela que decide se a tese do histórico (comparar antes da próxima
   compra) se sustenta — e, portanto, se vale construir conta e backend.

   O que NÃO guarda, de propósito: nada sobre o que a pessoa viu. Nem
   peça, nem loja, nem URL, nem score. Só contagens e datas. Isso mantém
   o instrumento honesto com a marca e fora do alcance do RGPD (não há
   dado pessoal).

   Hoje os números ficam no navegador de quem usa. Para lê-los:
     · diagnostico.html — a pessoa abre e diz o que vê (serve os primeiros
       utilizadores, que é a fase atual)
     · depois: descomentar enviar() e apontar para um endpoint
   ------------------------------------------------------------------ */
(function () {
  'use strict';

  var CHAVE = 'lookpilot-jornada';
  var GAP_SESSAO = 30 * 60 * 1000;   // 30 min sem atividade = nova sessão

  function ler() {
    try { return JSON.parse(localStorage.getItem(CHAVE)) || null; } catch (e) { return null; }
  }
  function gravar(j) {
    try { localStorage.setItem(CHAVE, JSON.stringify(j)); } catch (e) {}
  }
  function nova() {
    return {
      inicio: Date.now(),   // primeira vez que usou
      ultima: 0,            // último toque (para fechar a sessão)
      sessoes: 0,           // quantas vezes voltou (1 = só a primeira)
      analises: 0,          // análises vistas
      salvas: 0,            // peças salvas (o número que importa)
      pico: 0               // maior nº de peças no histórico ao mesmo tempo
    };
  }

  var j = ler() || nova();

  // Sessão: conta como nova se passaram 30 min do último toque.
  var agora = Date.now();
  if (!j.ultima || agora - j.ultima > GAP_SESSAO) j.sessoes++;
  j.ultima = agora;
  gravar(j);

  window.metrica = {
    // 'analise' = viu um relatório; 'salvou' = guardou a peça
    registar: function (evento, extra) {
      var d = ler() || nova();
      if (evento === 'analise') d.analises++;
      if (evento === 'salvou')  d.salvas++;
      if (extra && typeof extra.noHistorico === 'number') {
        d.pico = Math.max(d.pico || 0, extra.noHistorico);
      }
      d.ultima = Date.now();
      gravar(d);
      // enviar(d);   // <- quando houver endpoint
    },

    ler: ler,

    // Resposta curta à pergunta que importa.
    veredito: function () {
      var d = ler();
      if (!d) return 'sem dados';
      if (d.salvas >= 2) return 'tese sustenta — salvou 2+ peças';
      if (d.salvas === 1 && d.sessoes > 1) return 'voltou, mas só salvou 1';
      if (d.sessoes > 1) return 'voltou sem salvar';
      return 'só usou uma vez';
    }
  };

  // Para quando publicar. Payload anônimo: sem identificador, sem nada sobre
  // as peças. Um beacon por evento, que não atrasa a página.
  // function enviar(d) {
  //   navigator.sendBeacon('/api/jornada', JSON.stringify({
  //     sessoes: d.sessoes, analises: d.analises, salvas: d.salvas,
  //     dias: Math.round((Date.now() - d.inicio) / 86400000)
  //   }));
  // }
})();
