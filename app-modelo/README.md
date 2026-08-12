# App modelo

App para um **atelier de roupas femininas**: a cliente visualiza como ficaria com um modelo de roupa a partir de fotos.

## Objetivo

Preparar e visualizar modelos de roupa sobre a imagem da cliente. Há dois modos:

1. **Manual (Canvas)** — sobrepor a roupa e ajustar posição, tamanho, rotação e cor
2. **IA (OpenAI)** — enviar as duas fotos para o modelo de imagem gerar a cliente vestida

## Fluxo do app

1. Capturar ou enviar a **foto da cliente**
2. Capturar ou enviar a **foto da roupa**
3. Ajustar no Canvas **ou** clicar em **Vestir com IA**
4. Visualizar / baixar o resultado

## Stack

| Parte | Tecnologia |
|-------|------------|
| Interface | HTML + CSS + JavaScript |
| Overlay manual | Canvas 2D |
| Prova com IA | OpenAI Images Edit (`gpt-image-1`) |
| Servidor local | Node.js (`server.js`) |

## Como rodar

1. Copie o exemplo de ambiente e cole sua chave:

```bash
cd app-modelo
cp .env.example .env
```

Edite `.env` e substitua `sk-sua-chave-aqui` pela sua chave OpenAI.

2. Instale e inicie:

```bash
npm install
npm start
```

3. Abra [http://127.0.0.1:5501](http://127.0.0.1:5501).

## Estrutura

```
app-modelo/
  index.html
  css/style.css
  js/main.js
  server.js          # serve o app + /api/try-on
  .env.example
  package.json
  README.md
```

A chave fica só no `.env` (não vá para o git). O navegador chama o servidor local; o servidor fala com a OpenAI.

Na etapa **Resultado**, use o chat para pedir ajustes (cor, comprimento, caimento etc.). Cada mensagem gera uma nova imagem.
