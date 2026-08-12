(() => {
  const panels = {
    1: document.getElementById("panel-1"),
    2: document.getElementById("panel-2"),
    3: document.getElementById("panel-3"),
    4: document.getElementById("panel-4"),
  };
  const stepButtons = [...document.querySelectorAll(".step")];

  const cameraPreview = document.getElementById("camera-preview");
  const clientPreview = document.getElementById("client-preview");
  const clientPlaceholder = document.getElementById("client-placeholder");
  const garmentPreview = document.getElementById("garment-preview");
  const garmentPlaceholder = document.getElementById("garment-placeholder");
  const tryonCanvas = document.getElementById("tryon-canvas");
  const resultCanvas = document.getElementById("result-canvas");
  const tryonHint = document.getElementById("tryon-hint");
  const tryonCtx = tryonCanvas.getContext("2d");
  const resultCtx = resultCanvas.getContext("2d");

  const state = {
    step: 1,
    clientImage: null,
    garmentImage: null,
    aiResultImage: null,
    cameraStream: null,
    chatHistory: [],
    garment: {
      x: tryonCanvas.width / 2,
      y: tryonCanvas.height * 0.58,
      scale: 0.7,
      rotate: 0,
      color: null,
      opacity: 0.92,
    },
    dragging: false,
    dragOffset: { x: 0, y: 0 },
    tintCanvas: document.createElement("canvas"),
  };

  const aiLoading = document.getElementById("ai-loading");
  const aiStatus = document.getElementById("ai-status");
  const btnAiTryOn = document.getElementById("btn-ai-tryon");
  const loadingTitle = document.getElementById("loading-title");
  const loadingText = document.getElementById("loading-text");
  const chatMessages = document.getElementById("chat-messages");
  const chatForm = document.getElementById("chat-form");
  const chatInput = document.getElementById("chat-input");
  const btnChatSend = document.getElementById("btn-chat-send");

  const CHAT_WELCOME =
    "Pronto. Peça alterações, por exemplo: “deixe a roupa vermelha” ou “encurte a barra”.";

  function goToStep(step) {
    const next = Number(step);
    if (!panels[next]) return;

    stopCamera();
    state.step = next;

    Object.entries(panels).forEach(([key, panel]) => {
      const active = Number(key) === next;
      panel.hidden = !active;
      panel.classList.toggle("is-visible", active);
    });

    stepButtons.forEach((btn) => {
      btn.classList.toggle("is-active", Number(btn.dataset.step) === next);
    });

    if (next === 3) {
      drawTryOn(tryonCtx, tryonCanvas);
    }
    if (next === 4) {
      drawResult(resultCtx, resultCanvas);
    }
  }

  function showClientImage(src) {
    clientPreview.src = src;
    clientPreview.hidden = false;
    clientPlaceholder.hidden = true;
    cameraPreview.hidden = true;
  }

  function showGarmentImage(src) {
    garmentPreview.src = src;
    garmentPreview.hidden = false;
    garmentPlaceholder.hidden = true;
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  async function setClientFromSrc(src) {
    state.clientImage = await loadImage(src);
    showClientImage(src);
    drawTryOn(tryonCtx, tryonCanvas);
  }

  async function setGarmentFromSrc(src) {
    state.garmentImage = await loadImage(src);
    showGarmentImage(src);
    centerGarment();
    drawTryOn(tryonCtx, tryonCanvas);
  }

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function createClientDemo() {
    const c = document.createElement("canvas");
    c.width = 720;
    c.height = 960;
    const ctx = c.getContext("2d");

    const bg = ctx.createLinearGradient(0, 0, 0, c.height);
    bg.addColorStop(0, "#d7cfc4");
    bg.addColorStop(1, "#b7aea2");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, c.width, c.height);

    // silhouette
    ctx.fillStyle = "#6f645a";
    ctx.beginPath();
    ctx.ellipse(360, 220, 78, 92, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(250, 320);
    ctx.quadraticCurveTo(360, 290, 470, 320);
    ctx.lineTo(520, 880);
    ctx.lineTo(200, 880);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#8a7d72";
    ctx.fillRect(290, 430, 140, 220);

    ctx.fillStyle = "rgba(28,25,22,0.45)";
    ctx.font = "500 28px Cormorant Garamond, serif";
    ctx.fillText("Cliente (exemplo)", 40, 60);

    return c.toDataURL("image/png");
  }

  function createGarmentDemo() {
    const c = document.createElement("canvas");
    c.width = 520;
    c.height = 680;
    const ctx = c.getContext("2d");

    // transparent background intentionally left empty
    ctx.fillStyle = "#8b4d3b";
    ctx.beginPath();
    ctx.moveTo(160, 80);
    ctx.lineTo(360, 80);
    ctx.quadraticCurveTo(420, 120, 400, 180);
    ctx.lineTo(430, 560);
    ctx.quadraticCurveTo(260, 620, 90, 560);
    ctx.lineTo(120, 180);
    ctx.quadraticCurveTo(100, 120, 160, 80);
    ctx.closePath();
    ctx.fill();

    // neckline
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.moveTo(210, 80);
    ctx.quadraticCurveTo(260, 150, 310, 80);
    ctx.lineTo(360, 80);
    ctx.lineTo(160, 80);
    ctx.closePath();
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    // soft highlight
    ctx.strokeStyle = "rgba(255,248,244,0.35)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(200, 200);
    ctx.quadraticCurveTo(260, 260, 220, 420);
    ctx.stroke();

    return c.toDataURL("image/png");
  }

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      alert("Câmera não disponível neste navegador. Use \"Enviar arquivo\" ou \"Usar exemplo\".");
      return;
    }

    try {
      stopCamera();
      state.cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      cameraPreview.srcObject = state.cameraStream;
      cameraPreview.hidden = false;
      clientPreview.hidden = true;
      clientPlaceholder.hidden = true;
      document.getElementById("btn-capture").hidden = false;
      await cameraPreview.play();
    } catch (err) {
      console.error(err);
      alert("Não foi possível abrir a câmera. Verifique a permissão ou use um arquivo.");
    }
  }

  function stopCamera() {
    if (!state.cameraStream) return;
    state.cameraStream.getTracks().forEach((track) => track.stop());
    state.cameraStream = null;
    cameraPreview.srcObject = null;
    cameraPreview.hidden = true;
    document.getElementById("btn-capture").hidden = true;
  }

  async function capturePhoto() {
    if (!state.cameraStream) return;
    const c = document.createElement("canvas");
    c.width = cameraPreview.videoWidth || 720;
    c.height = cameraPreview.videoHeight || 960;
    c.getContext("2d").drawImage(cameraPreview, 0, 0, c.width, c.height);
    const src = c.toDataURL("image/png");
    stopCamera();
    await setClientFromSrc(src);
  }

  function setActiveSwatch(color) {
    const swatches = [...document.querySelectorAll(".swatch")];
    const hasPreset = swatches.some(
      (btn) => !btn.classList.contains("swatch-picker") && btn.dataset.color === color
    );

    swatches.forEach((btn) => {
      const isPicker = btn.classList.contains("swatch-picker");
      let active = false;
      if (color === null) {
        active = !isPicker && btn.dataset.color === "";
      } else if (hasPreset) {
        active = !isPicker && btn.dataset.color === color;
      } else {
        active = isPicker;
      }
      btn.classList.toggle("is-active", active);
    });
  }

  function applyGarmentColor(color) {
    state.garment.color = color || null;
    if (color) {
      document.getElementById("ctrl-color").value = color;
    }
    setActiveSwatch(state.garment.color);
    drawTryOn(tryonCtx, tryonCanvas);
  }

  function centerGarment() {
    state.garment.x = tryonCanvas.width / 2;
    state.garment.y = tryonCanvas.height * 0.58;
    state.garment.scale = 0.7;
    state.garment.rotate = 0;
    document.getElementById("ctrl-scale").value = 70;
    document.getElementById("ctrl-rotate").value = 0;
    document.getElementById("ctrl-opacity").value = 92;
    state.garment.opacity = 0.92;
    applyGarmentColor(null);
  }

  function getTintedGarment(img, color) {
    const c = state.tintCanvas;
    c.width = img.width;
    c.height = img.height;
    const tctx = c.getContext("2d");
    tctx.clearRect(0, 0, c.width, c.height);
    tctx.drawImage(img, 0, 0);
    tctx.globalCompositeOperation = "source-in";
    tctx.fillStyle = color;
    tctx.fillRect(0, 0, c.width, c.height);
    tctx.globalCompositeOperation = "source-over";
    return c;
  }

  function drawCoverImage(ctx, canvas, img) {
    const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    const x = (canvas.width - w) / 2;
    const y = (canvas.height - h) / 2;
    ctx.drawImage(img, x, y, w, h);
  }

  function drawTryOn(ctx, canvas) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#2a2622";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const ready = state.clientImage && state.garmentImage;
    tryonHint.hidden = ready;

    if (!state.clientImage) {
      ctx.fillStyle = "#d7cfc4";
      ctx.font = "28px Outfit, sans-serif";
      ctx.fillText("Sem foto da cliente", 40, 80);
      return;
    }

    drawCoverImage(ctx, canvas, state.clientImage);

    if (!state.garmentImage) return;

    const g = state.garment;
    const gw = state.garmentImage.width * g.scale;
    const gh = state.garmentImage.height * g.scale;

    const garmentSource = g.color
      ? getTintedGarment(state.garmentImage, g.color)
      : state.garmentImage;

    ctx.save();
    ctx.translate(g.x, g.y);
    ctx.rotate((g.rotate * Math.PI) / 180);
    ctx.globalAlpha = g.opacity;
    ctx.drawImage(garmentSource, -gw / 2, -gh / 2, gw, gh);
    ctx.restore();
  }

  function drawResult(ctx, canvas) {
    if (state.aiResultImage) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#2a2622";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drawCoverImage(ctx, canvas, state.aiResultImage);
      return;
    }
    drawTryOn(ctx, canvas);
  }

  function imageToBlob(img, mime = "image/png") {
    const c = document.createElement("canvas");
    c.width = img.naturalWidth || img.width;
    c.height = img.naturalHeight || img.height;
    c.getContext("2d").drawImage(img, 0, 0);
    return new Promise((resolve) => {
      c.toBlob((blob) => resolve(blob), mime);
    });
  }

  function setAiBusy(
    busy,
    message = "",
    isError = false,
    titles = { title: "Vestindo com IA…", text: "Isso pode levar alguns segundos." }
  ) {
    aiLoading.hidden = !busy;
    btnAiTryOn.disabled = busy;
    btnChatSend.disabled = busy;
    chatInput.disabled = busy;
    if (busy) {
      loadingTitle.textContent = titles.title;
      loadingText.textContent = titles.text;
    }
    if (!message) {
      aiStatus.hidden = true;
      aiStatus.textContent = "";
      aiStatus.classList.remove("is-error");
      return;
    }
    aiStatus.hidden = false;
    aiStatus.textContent = message;
    aiStatus.classList.toggle("is-error", isError);
  }

  function resetChat() {
    state.chatHistory = [];
    chatMessages.innerHTML = "";
    appendChatMessage(CHAT_WELCOME, "bot");
  }

  function appendChatMessage(text, role) {
    const bubble = document.createElement("div");
    bubble.className = `chat-bubble chat-${role}`;
    bubble.textContent = text;
    chatMessages.appendChild(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  async function getCurrentResultBlob() {
    if (state.aiResultImage) {
      return imageToBlob(state.aiResultImage);
    }
    drawResult(resultCtx, resultCanvas);
    return new Promise((resolve) => {
      resultCanvas.toBlob((blob) => resolve(blob), "image/png");
    });
  }

  async function runChatEdit(message) {
    if (!state.clientImage && !state.aiResultImage) {
      appendChatMessage("Primeiro gere um resultado (cliente + roupa).", "error");
      return;
    }

    appendChatMessage(message, "user");
    chatInput.value = "";
    setAiBusy(true, "", false, {
      title: "Aplicando alteração…",
      text: "A IA está ajustando a imagem.",
    });

    try {
      const form = new FormData();
      form.append("image", await getCurrentResultBlob(), "current.png");
      form.append("message", message);
      form.append("history", JSON.stringify(state.chatHistory));
      if (state.garmentImage) {
        form.append("garment", await imageToBlob(state.garmentImage), "garment.png");
      }

      const response = await fetch("/api/edit", {
        method: "POST",
        body: form,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Falha ao aplicar a alteração.");
      }

      state.chatHistory.push(message);
      state.aiResultImage = await loadImage(
        `data:image/png;base64,${data.imageBase64}`
      );
      drawResult(resultCtx, resultCanvas);
      appendChatMessage(data.reply || "Alteração aplicada.", "bot");
      setAiBusy(false);
    } catch (err) {
      console.error(err);
      appendChatMessage(err.message || "Erro ao editar com IA.", "error");
      setAiBusy(false);
    }
  }

  async function runAiTryOn() {
    if (!state.clientImage || !state.garmentImage) {
      setAiBusy(false, "Adicione a foto da cliente e da roupa antes.", true);
      return;
    }

    setAiBusy(true, "", false, {
      title: "Vestindo com IA…",
      text: "Isso pode levar alguns segundos.",
    });

    try {
      const form = new FormData();
      form.append("client", await imageToBlob(state.clientImage), "client.png");
      form.append("garment", await imageToBlob(state.garmentImage), "garment.png");
      if (state.garment.color) {
        form.append("color", state.garment.color);
      }

      const response = await fetch("/api/try-on", {
        method: "POST",
        body: form,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Falha na prova virtual com IA.");
      }

      state.aiResultImage = await loadImage(
        `data:image/png;base64,${data.imageBase64}`
      );
      resetChat();
      setAiBusy(false, "Prova gerada com IA.");
      goToStep(4);
    } catch (err) {
      console.error(err);
      setAiBusy(false, err.message || "Erro ao vestir com IA.", true);
    }
  }

  function canvasPoint(event, canvas) {
    const rect = canvas.getBoundingClientRect();
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function onPointerDown(event) {
    if (!state.garmentImage || state.step !== 3) return;
    event.preventDefault();
    const p = canvasPoint(event, tryonCanvas);
    state.dragging = true;
    state.dragOffset.x = p.x - state.garment.x;
    state.dragOffset.y = p.y - state.garment.y;
  }

  function onPointerMove(event) {
    if (!state.dragging) return;
    event.preventDefault();
    const p = canvasPoint(event, tryonCanvas);
    state.garment.x = p.x - state.dragOffset.x;
    state.garment.y = p.y - state.garment.y;
    drawTryOn(tryonCtx, tryonCanvas);
  }

  function onPointerUp() {
    state.dragging = false;
  }

  function restart() {
    stopCamera();
    state.clientImage = null;
    state.garmentImage = null;
    state.aiResultImage = null;
    clientPreview.hidden = true;
    clientPreview.removeAttribute("src");
    clientPlaceholder.hidden = false;
    garmentPreview.hidden = true;
    garmentPreview.removeAttribute("src");
    garmentPlaceholder.hidden = false;
    setAiBusy(false);
    resetChat();
    centerGarment();
    goToStep(1);
  }

  // Navigation
  stepButtons.forEach((btn) => {
    btn.addEventListener("click", () => goToStep(btn.dataset.step));
  });
  document.querySelectorAll("[data-goto]").forEach((btn) => {
    btn.addEventListener("click", () => goToStep(btn.dataset.goto));
  });

  // Client photo
  document.getElementById("btn-camera").addEventListener("click", startCamera);
  document.getElementById("btn-capture").addEventListener("click", capturePhoto);
  document.getElementById("client-file").addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    stopCamera();
    await setClientFromSrc(await fileToDataUrl(file));
  });
  document.getElementById("btn-client-demo").addEventListener("click", async () => {
    stopCamera();
    await setClientFromSrc(createClientDemo());
  });

  // Garment photo
  document.getElementById("garment-file").addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await setGarmentFromSrc(await fileToDataUrl(file));
  });
  document.getElementById("btn-garment-demo").addEventListener("click", async () => {
    await setGarmentFromSrc(createGarmentDemo());
  });

  // Controls
  document.getElementById("ctrl-scale").addEventListener("input", (e) => {
    state.garment.scale = Number(e.target.value) / 100;
    drawTryOn(tryonCtx, tryonCanvas);
  });
  document.getElementById("ctrl-rotate").addEventListener("input", (e) => {
    state.garment.rotate = Number(e.target.value);
    drawTryOn(tryonCtx, tryonCanvas);
  });
  document.getElementById("ctrl-opacity").addEventListener("input", (e) => {
    state.garment.opacity = Number(e.target.value) / 100;
    drawTryOn(tryonCtx, tryonCanvas);
  });

  document.querySelectorAll(".swatch[data-color]").forEach((btn) => {
    btn.addEventListener("click", () => {
      applyGarmentColor(btn.dataset.color || null);
    });
  });
  document.getElementById("ctrl-color").addEventListener("input", (e) => {
    applyGarmentColor(e.target.value);
  });

  document.getElementById("btn-reset-garment").addEventListener("click", () => {
    centerGarment();
    drawTryOn(tryonCtx, tryonCanvas);
  });
  btnAiTryOn.addEventListener("click", runAiTryOn);
  chatForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const message = chatInput.value.trim();
    if (!message || btnChatSend.disabled) return;
    runChatEdit(message);
  });

  // Drag garment
  tryonCanvas.addEventListener("mousedown", onPointerDown);
  tryonCanvas.addEventListener("mousemove", onPointerMove);
  window.addEventListener("mouseup", onPointerUp);
  tryonCanvas.addEventListener("touchstart", onPointerDown, { passive: false });
  tryonCanvas.addEventListener("touchmove", onPointerMove, { passive: false });
  window.addEventListener("touchend", onPointerUp);

  // Result actions
  document.getElementById("btn-download").addEventListener("click", () => {
    drawResult(resultCtx, resultCanvas);
    const link = document.createElement("a");
    link.download = "prova-virtual.png";
    link.href = resultCanvas.toDataURL("image/png");
    link.click();
  });
  document.getElementById("btn-restart").addEventListener("click", restart);

  // Start with empty canvas
  drawTryOn(tryonCtx, tryonCanvas);
})();
