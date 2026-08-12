# meus dados
meu nome é Andeil
Tenho 52 anos
# Damas

Jogo de **damas brasileiras** para duas pessoas no mesmo navegador.

## Como jogar

Abra o arquivo `index.html` no navegador (ou sirva a pasta com um servidor local):

```bash
python3 -m http.server 5500
```

Depois acesse [http://localhost:5500](http://localhost:5500).

## Regras

- Tabuleiro 8×8, 12 peças por lado
- Pretas começam
- Captura é obrigatória; se houver várias opções, vale a que captura mais peças
- Peões andam em diagonal para frente; capturam para frente e para trás
- Ao chegar na última fileira, a peça vira **dama** (coroada)
- A dama “voa”: anda e captura em qualquer distância na diagonal

## Controles

- Clique em uma peça e depois na casa de destino
- **Nova partida** reinicia o tabuleiro
- **Desfazer** volta a jogada anterior
- `Esc` cancela a seleção

## Estrutura

```
index.html      # página do jogo
css/style.css   # visual
js/rules.js     # regras e movimentos
js/main.js      # interface e turnos
```
