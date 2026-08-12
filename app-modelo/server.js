require("dotenv").config();

const path = require("path");
const express = require("express");
const multer = require("multer");
const OpenAI = require("openai");
const { toFile } = require("openai/uploads");

const PORT = process.env.PORT || 5501;
const apiKey = process.env.OPENAI_API_KEY;
const hasValidApiKey =
  Boolean(apiKey) &&
  apiKey.startsWith("sk-") &&
  !apiKey.includes("sua-chave-aqui");

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024, files: 2 },
});

app.use(express.static(__dirname));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    hasApiKey: hasValidApiKey,
  });
});

app.post(
  "/api/try-on",
  upload.fields([
    { name: "client", maxCount: 1 },
    { name: "garment", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      if (!hasValidApiKey) {
        return res.status(500).json({
          error:
            "OPENAI_API_KEY não configurada. Crie o arquivo .env em app-modelo com sua chave.",
        });
      }

      const clientFile = req.files?.client?.[0];
      const garmentFile = req.files?.garment?.[0];
      if (!clientFile || !garmentFile) {
        return res.status(400).json({
          error: "Envie as duas imagens: cliente e roupa.",
        });
      }

      const colorNote = (req.body.color || "").trim();
      const prompt = [
        "Edit the first image (the client) so she is wearing the garment from the second image.",
        "Do not change her face, facial features, skin tone, body shape, pose, hairstyle, or identity.",
        "Replace only the clothing, fitting the garment naturally to her body with realistic fabric folds, draping, and occlusion.",
        "Match lighting, shadows, and color temperature to the original photo.",
        "Do not change the background, camera angle, or framing.",
        "Do not add text, logos, or watermarks.",
        colorNote
          ? `If possible, render the garment in this color: ${colorNote}.`
          : "",
      ]
        .filter(Boolean)
        .join(" ");

      const client = new OpenAI({ apiKey });
      const result = await client.images.edit({
        model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1",
        image: [
          await toFile(clientFile.buffer, "client.png", {
            type: clientFile.mimetype || "image/png",
          }),
          await toFile(garmentFile.buffer, "garment.png", {
            type: garmentFile.mimetype || "image/png",
          }),
        ],
        prompt,
        size: "1024x1536",
        input_fidelity: "high",
      });

      const imageBase64 = result.data?.[0]?.b64_json;
      if (!imageBase64) {
        return res.status(502).json({
          error: "A API não retornou imagem. Tente novamente.",
        });
      }

      res.json({ imageBase64 });
    } catch (err) {
      console.error("try-on error:", err);
      const message =
        err?.error?.message ||
        err?.message ||
        "Falha ao gerar a prova virtual com IA.";
      res.status(500).json({ error: message });
    }
  }
);

app.post(
  "/api/edit",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "garment", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      if (!hasValidApiKey) {
        return res.status(500).json({
          error:
            "OPENAI_API_KEY não configurada. Crie o arquivo .env em app-modelo com sua chave.",
        });
      }

      const imageFile = req.files?.image?.[0];
      const garmentFile = req.files?.garment?.[0];
      const message = (req.body.message || "").trim();
      if (!imageFile || !message) {
        return res.status(400).json({
          error: "Envie a imagem atual e uma mensagem de alteração.",
        });
      }

      let history = [];
      try {
        history = JSON.parse(req.body.history || "[]");
        if (!Array.isArray(history)) history = [];
      } catch {
        history = [];
      }

      const recent = history
        .filter((item) => typeof item === "string" && item.trim())
        .slice(-6)
        .map((item, i) => `${i + 1}. ${item.trim()}`)
        .join("\n");

      const prompt = [
        "You are editing a virtual clothing try-on photo for a women's atelier.",
        "Apply the user's latest request to the provided image.",
        "Preserve the person's face, identity, body shape, pose, hairstyle, background, and camera framing unless the user explicitly asks to change them.",
        "Keep the result photorealistic and natural.",
        "Do not add text, logos, or watermarks.",
        recent ? `Previous user requests in this session:\n${recent}` : "",
        `Latest user request: ${message}`,
      ]
        .filter(Boolean)
        .join("\n\n");

      const images = [
        await toFile(imageFile.buffer, "current.png", {
          type: imageFile.mimetype || "image/png",
        }),
      ];

      if (garmentFile) {
        images.push(
          await toFile(garmentFile.buffer, "garment.png", {
            type: garmentFile.mimetype || "image/png",
          })
        );
      }

      const client = new OpenAI({ apiKey });
      const result = await client.images.edit({
        model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1",
        image: images,
        prompt,
        size: "1024x1536",
        input_fidelity: "high",
      });

      const imageBase64 = result.data?.[0]?.b64_json;
      if (!imageBase64) {
        return res.status(502).json({
          error: "A API não retornou imagem. Tente novamente.",
        });
      }

      res.json({
        imageBase64,
        reply: "Alteração aplicada. Pode pedir outro ajuste.",
      });
    } catch (err) {
      console.error("edit error:", err);
      const message =
        err?.error?.message ||
        err?.message ||
        "Falha ao aplicar a alteração com IA.";
      res.status(500).json({ error: message });
    }
  }
);

app.listen(PORT, "127.0.0.1", () => {
  console.log(`App modelo em http://127.0.0.1:${PORT}`);
  if (!hasValidApiKey) {
    console.warn("Aviso: defina OPENAI_API_KEY no arquivo .env");
  }
});
