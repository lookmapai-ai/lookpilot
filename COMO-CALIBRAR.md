# Como calibrar os scores da extensão

A extensão tem **uma fonte única de verdade**: o ficheiro `fibers.json`.
Todos os scores que aparecem no card são *derivados* dele. Nunca edite os
scores diretamente no código — edite a base e reconstrua.

## Fluxo de trabalho

1. **Abra `fibers.json`** num editor de texto.

2. **Encontre a fibra ou material** que quer ajustar. Ex: para o algodão,
   procure `"algodao"`. Para o couro, procure `"couro"` dentro de
   `materiais_calcados_bolsas`.

3. **Edite as propriedades técnicas** (todas de 0 a 10). Exemplo:
   ```json
   "propriedades": {
     "durabilidade": 6,        ← mude este número
     "facilidade_manutencao": 8,
     ...
   }
   ```
   Lembre-se da escala: **10 = melhor desempenho naquela propriedade**.
   "bolinhas": 10 significa NÃO forma bolinhas. "amassa": 10 significa NÃO amassa.

4. **Reconstrua.** No terminal, dentro da pasta da extensão:
   ```
   python3 build.py
   ```
   O script converte as propriedades nos scores do card, reescreve o código,
   valida a sintaxe e incrementa a versão.

5. **Recarregue no Chrome** em `chrome://extensions` (botão recarregar).

## Como as propriedades viram os scores do card

| Score do card | Fórmula (propriedades da base) |
|---|---|
| Qualidade | conforto 25% + durabilidade 30% + resistência 25% + sustentabilidade 20% |
| Conforto | conforto 60% + respirabilidade 40% |
| Durabilidade | durabilidade 50% + resistência 30% + (não bolinhas) 20% |
| Manutenção | facilidade_manutencao (pura) |
| Travel Score | travel_score da secção `viagem` |
| Custo-benefício | calculado de qualidade + durabilidade + manutenção |

Se quiser mudar **como** os scores são calculados (não os valores das fibras),
edite as funções `derive_fiber_scores` e `derive_material_scores` em `build.py`.

## Adicionar uma fibra nova

Copie um bloco de fibra existente em `fibers.json`, mude o `id`, o `nome` e as
propriedades. Depois adicione os sinónimos da etiqueta no dicionário
`LABEL_KEYS` dentro de `build.py` (ex: `'tergal': ['tergal','terylene']`).
Reconstrua.

## Certificações

O bónus de certificação (GOTS, OCS, OEKO-TEX, GRS, RCS, Fair Trade) é detetado
automaticamente no texto da página e soma pontos à qualidade. A lógica está em
`certificationBonus()` no `shared.js`.

## Regras técnicas

- Nunca classifique uma fibra como "boa" ou "ruim" — os scores são por propriedade.
- As fontes de cada fibra estão no campo `fontes[]` — mantenha a rastreabilidade.
- Propriedades ancoradas em normas: moisture regain (ASTM D1909), tenacidade
  (ASTM D3822), abrasão (ISO 12947), pilling (ISO 12945), vincos (AATCC 66).
