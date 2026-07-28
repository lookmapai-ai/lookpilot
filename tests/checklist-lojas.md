# Checklist manual: lojas sem teste automatizado

Cobertura hoje (`tests/run.js`, seção "Lojas: formatos de composição"):
✓ testado — Zara, Mango, Mango Outlet, Uniqlo
✗ sem teste — todas as outras abaixo

Pra cada loja: abrir 2-3 produtos reais (peças diferentes, uma com mistura de
fibras se possível) e marcar o que aconteceu.

Em cada produto, checar:
- [ ] O card aparece (não fica preso em "analisando" nem cai no card de
      "não consegui ler a composição")
- [ ] A composição bate com a etiqueta real da página (abre a etiqueta você
      mesma e compara) — fibras certas, percentuais somando ~100%
- [ ] O tipo de peça foi identificado certo (camiseta/casaco/calça/etc,
      não "peça" genérico)
- [ ] O veredito faz sentido pro que você está vendo (não "Vale a pena" pra
      algo obviamente ruim, nem o contrário)

## Lojas pra checar

- [x] Renner — testada, card leu certo (trench coat, poliéster 81%)
- [x] Riachuelo — testada
- [ ] H&M — achado e corrigido um bug (rótulos grudando no nome da fibra:
      "materiaiscomposiçãoalgodão"). Testar de novo depois do próximo push
      pra confirmar que ficou certo.
- [ ] C&A
- [ ] Amaro
- [ ] Shein
- [ ] Farfetch
- [ ] Zalando
- [ ] Riachuelo
- [ ] Dafiti
- [ ] Shopee (moda)
- [ ] ASOS
- [ ] Nike (site direto)
- [ ] Adidas (site direto)

## O que fazer quando quebrar

1. Copiar a URL do produto.
2. Ver o texto exato da etiqueta na página (a extensão lê o texto — se o
   formato for esquisito, é aí que quebra: várias zonas de composição,
   sigla incomum, % sem "%", etc.)
3. Guardar os dois (URL + texto da etiqueta) — vira um caso de teste novo
   em `tests/run.js`, igual aos de Zara/Mango/Uniqlo.

Peças de amigas que usarem o botão "Avisar que essa loja não funciona" no
card também caem direto no seu e-mail com a URL — não precisa ficar de
olho, só checar a caixa de entrada depois do teste.
