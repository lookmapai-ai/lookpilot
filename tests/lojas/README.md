# Acervo de páginas reais

Texto real de páginas de produto, tal como a extensão o lê. Serve ao
`node tests/acervo.js`.

## Porque existe

Todo teste deste repositório foi escrito **depois** de alguém encontrar o
defeito numa peça real. Isso impede a volta do defeito, mas não encontra o
próximo — quem encontra continua a ser a pessoa, print a print.

E os defeitos que mais custaram não eram de lógica. Eram de **leitura de
página real**: um dois-pontos que apagava 7 das 8 zonas da etiqueta, um
acordeão fechado, um rótulo de zona em espanhol, um carrossel de
recomendados a emprestar tecnologia à peça errada. Esse tipo não se
descobre a pensar; só aparece batendo em página de verdade.

## Como acrescentar uma peça

Crie um `.txt` novo aqui. Nenhum código precisa de ser mexido.

```
loja: Decathlon
titulo: <o título exato do produto>
url: <link>
avaliacao: 4.8
avaliacoes: 182
capturado: 2026-08-03
nota_humana: <o julgamento de quem conhece a peça — ver abaixo>
---
<o texto da página, colado>
```

O texto deve incluir a descrição, a ficha técnica **e** a composição. Na
Decathlon a composição está dentro do painel "Especificações", que vem
fechado — é preciso abri-lo antes de copiar.

Vale a pena guardar o lixo da página junto (carrosséis de recomendados,
perguntas frequentes, avisos de entrega). É precisamente esse lixo que
provoca os defeitos mais difíceis.

## `nota_humana`

O campo mais valioso do ficheiro, e o único que não se pode automatizar:
o julgamento de quem já viu a peça. *"casaco de pena leve, aprovado pra
viagem sem discussão"*, *"armadilha: a lista de recomendados cita COOLMAX
e nada disso é desta peça"*.

O motor pode medir tudo menos isto.

## O que o `acervo.js` faz com estas peças

Passa cada uma pelo caminho completo (ler etiqueta → nota → texto) e aplica
**suspeitas**: regras que apontam um resultado que não se sustenta, sem que
ninguém saiba de antemão qual é o defeito. Por exemplo: soma de fibras
acima de 100%, peça muito bem avaliada a tirar nota de "não vale a pena",
título que diz casaco mas tipo detetado genérico.

É a diferença entre verificar o que já sabemos e procurar o que ainda não
sabemos.
