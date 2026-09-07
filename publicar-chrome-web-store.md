# Submeter o LookPilot à Chrome Web Store

Tudo o que o formulário pede, pronto a copiar. Cada bloco tem o título do
campo tal como aparece no painel do Google.

> **Regra que vale para tudo aqui:** o que está escrito tem de bater com o
> que a extensão faz. Declaração errada não é rejeição — é remoção depois de
> publicada. Verifiquei cada afirmação abaixo contra o código.

---

## 1 · Ficha da loja

**Nome**
```
LookPilot — a etiqueta, lida por você
```

**Descrição curta** (132 caracteres no máximo)
```
Lê a composição da etiqueta em qualquer loja online e diz, em segundos, se a peça vale mesmo a pena.
```

**Categoria:** Compras
**Idioma:** Português (Portugal)

**Descrição completa**
```
Toda peça de roupa esconde a resposta nas letras miúdas. O LookPilot lê essa parte por você.

Abra qualquer loja online, clique no ícone, e em segundos aparece um cartão com:

• A composição real, fibra a fibra — 100% linho ou 94% sintético, sem marketing pelo meio.
• Uma nota de 0 a 100 e um veredito direto, de "não vale a pena" a "pode comprar sem medo".
• O porquê da nota, em português normal: se amarrota na mala, se faz bolinhas, se abafa no calor, se dura.

COMO A NOTA É FEITA

Cada fibra tem ficha própria, com fontes técnicas por trás de cada número — respirabilidade, resistência, tendência a fazer bolinhas, facilidade de lavar. É dado, não opinião.

Peças técnicas são tratadas como peças técnicas: um casaco de montanha é lido pela coluna de água e pelo poder de expansão da pena que a loja publica, não pela fibra do tecido de fora. Um casaco acolchoado avisa que a etiqueta descreve só o casco, e não o recheio que aquece.

QUANDO NÃO DÁ PARA LER, ELE DIZ QUE NÃO DEU

Há páginas que não publicam composição nenhuma. Nesses casos o LookPilot diz que não conseguiu ler, e oferece digitar a etiqueta à mão. Um número inventado seria pior do que nenhum.

PRIVACIDADE

A análise acontece toda dentro do seu navegador. Não há conta, não há login, e a extensão não envia para lado nenhum o que lê. As peças que você salva ficam guardadas no seu próprio navegador.

Detalhes em lookpilotapp.com/privacidade.html
```

**URL da política de privacidade**
```
https://www.lookpilotapp.com/privacidade.html
```

---

## 2 · Finalidade única

O Google pede uma frase. Extensões que fazem várias coisas sem relação são
recusadas; esta faz uma só.

```
Ler a composição têxtil declarada na página de um produto de vestuário e apresentar ao utilizador uma avaliação da qualidade dessa peça.
```

---

## 3 · Justificação das permissões

Um campo por permissão. O avaliador lê isto para decidir se o pedido é
proporcional ao que a extensão faz.

**activeTab**
```
A extensão lê o texto da página de produto para encontrar a composição da etiqueta. Este acesso é usado apenas na aba onde o utilizador clicou no ícone, e apenas nesse momento.
```

**storage**
```
Guarda localmente a última peça analisada, para que o utilizador possa voltar a vê-la ao abrir a extensão, e as peças que ele escolhe salvar. Nenhum destes dados sai do navegador.
```

**scripting**
```
Necessária para executar, na página de produto, o código que localiza e lê a composição da etiqueta.
```

**tabs**
```
Usada para identificar a aba activa quando o utilizador clica no ícone, e para abrir a página de análise detalhada num novo separador.
```

**Acesso a todos os sites (host permission)**
```
A extensão destina-se a funcionar em qualquer loja de roupa online. As lojas são muitas, mudam de domínio e variam por país, pelo que não é possível manter uma lista fixa de endereços sem deixar o utilizador sem resposta precisamente na loja onde ele está.

O acesso é usado exclusivamente para ler o texto visível da página de produto quando o utilizador clica no ícone da extensão. A extensão não observa a navegação, não lê outras abas, não regista o histórico e não executa nada sem essa acção deliberada.

O conteúdo lido é processado inteiramente no dispositivo: a tabela de fibras que produz a nota está incluída na própria extensão, e o código não contém qualquer chamada de rede para envio de dados.
```

---

## 4 · Utilização de dados

O formulário pede para marcar as categorias de dados **recolhidos**. Na
definição do Google, recolher significa transmitir para fora do dispositivo.

**Marcar:**
- [x] **Conteúdo de sítios Web** — a extensão lê o texto da página do produto.

**Não marcar** (a extensão não lida com nada disto):
informação de identificação pessoal · estado de saúde · informação financeira ·
autenticação · comunicações pessoais · localização · histórico de navegação ·
atividade do utilizador

**As três declarações finais, todas verdadeiras aqui:**
- [x] Não vendo nem transfiro dados a terceiros, fora dos casos de utilização aprovados
- [x] Não uso nem transfiro dados para fins não relacionados com a função única da extensão
- [x] Não uso nem transfiro dados para determinar solvabilidade ou conceder empréstimos

**A ressalva a declarar, se houver campo para observações:**
```
O conteúdo lido não é enviado para nenhum servidor da extensão. Quando o utilizador escolhe abrir a análise detalhada, os dados da peça (nome, composição e nota) são passados no endereço da página lookpilotapp.com, pertencente ao mesmo autor, e por isso constam dos registos técnicos do serviço de alojamento. Não são guardados em base de dados nem associados a qualquer identidade.
```

---

## 5 · Imagens

| O quê | Tamanho | Obrigatório |
|---|---|---|
| Captura de ecrã | 1280×800 ou 640×400 | sim, pelo menos uma |
| Ícone da loja | 128×128 | já existe (`icon128.png`) |
| Mosaico pequeno | 440×280 | opcional, mas ajuda na descoberta |

**Sugestão para a primeira captura:** o cartão do LookPilot aberto sobre uma
página de produto real, com a nota e o veredito visíveis. É a única imagem
que explica o produto sem uma linha de texto.

Vale mostrar também o caso honesto — o cartão a dizer que não conseguiu ler a
composição — mas nunca como primeira imagem.

---

## 6 · Antes de carregar o zip

```bash
node tests/run.js
```

Tem de dar tudo verde. O último teste confirma que o zip corresponde ao
código do repositório — se estiver desactualizado, quem instalar recebe uma
versão velha.

O ficheiro a carregar é `landing/lookpilot-extensao.zip`.

---

## Testar com conhecidos ANTES de ficar público

O plano era testar com pessoas conhecidas antes de publicar. Não é preciso
escolher entre as duas coisas — e há um caminho melhor do que mandar o zip.

**O problema do zip:** instalar uma extensão descompactada obriga a ligar o
Modo de programador no Chrome e a escolher uma pasta. São três passos e um
aviso assustador do navegador. Para quem não é técnico, é aqui que a maior
parte desiste — e o retorno que interessa nem chega a existir.

**O caminho melhor:** submeter à Chrome Web Store com visibilidade
**Não listada** (ou com lista de testadores). A extensão passa pela revisão
do Google e fica instalável por link directo, num clique, sem Modo de
programador — mas não aparece em pesquisas nem no catálogo. Ninguém a
encontra por acaso.

Ordem que faz sentido:

1. Submeter como Não listada. A revisão começa a correr, e é ela a parte lenta.
2. Quando for aprovada, mandar o link aos conhecidos. Instalam num clique.
3. Recolher o retorno, corrigir o que aparecer, publicar versões novas — cada
   actualização é revista, mas normalmente muito mais depressa que a primeira.
4. Mudar para **Pública** quando estiveres à vontade. É um botão no painel,
   sem nova submissão do zero.

O risco que te preocupava — sair em público com defeito — fica coberto: nos
passos 1 a 3 ninguém encontra a extensão sem o link.

**O que falta para o retorno ser útil:** hoje o único canal é o botão
"Avisar que essa loja não funciona", que abre um email. Numa amostra pequena
chega, mas só apanha um tipo de problema: loja que não lê. Não apanha o
defeito que mais nos custou este ano — o texto que está errado sem parecer
errado. Vale pedir aos testadores, por escrito, que mandem print sempre que
uma frase soar estranha, mesmo que a nota pareça certa.

---

## Uma decisão que fica para depois

Hoje os dados da peça viajam no endereço da página de análise. É por isso que
a declaração de utilização de dados precisa da ressalva acima, em vez de ser
simplesmente "não recolhe dados".

Dá para eliminar isso: a extensão passaria os dados à página por
armazenamento partilhado em vez de os pôr no endereço. A declaração ficaria
mais limpa e a revisão mais rápida.

Não é trabalho para esta semana — é mudança de arquitectura, com risco de
regressão, e o comportamento actual é legítimo desde que declarado. Fica
registado para quando houver folga.
