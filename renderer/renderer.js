console.log("Renderer starting...");

class VisualEngine {
  constructor(canvas) {
    console.log("Creating VisualEngine...");
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.width = canvas.width;
    this.height = canvas.height;

    this.time = 0;
    this.mode = "kaleidoscope";
    this.colorMode = "chromatic";
    this.hudVisible = false;
    this.frameCount = 0;
    this.fps = 0;

    // Enhanced color palettes with HSL-based gradients
    this.colorPalettes = {
      chromatic: [
        { h: 330, s: 100, l: 50 },  // hot pink
        { h: 20, s: 100, l: 55 },   // orange
        { h: 45, s: 100, l: 55 },   // yellow
        { h: 270, s: 100, l: 55 },  // purple
        { h: 210, s: 100, l: 55 },  // blue
      ],
      neon: [
        { h: 120, s: 100, l: 50 },  // neon green
        { h: 300, s: 100, l: 50 },  // neon pink
        { h: 180, s: 100, l: 50 },  // cyan
        { h: 60, s: 100, l: 50 },   // lime
        { h: 0, s: 100, l: 50 },    // red
      ],
      aurora: [
        { h: 200, s: 80, l: 45 },   // deep blue
        { h: 180, s: 100, l: 55 },  // cyan
        { h: 120, s: 90, l: 50 },   // emerald
        { h: 280, s: 85, l: 60 },   // violet
        { h: 320, s: 80, l: 55 },   // magenta
      ],
      sunset: [
        { h: 10, s: 100, l: 55 },   // red-orange
        { h: 30, s: 100, l: 60 },   // orange
        { h: 50, s: 100, l: 70 },   // yellow
        { h: 280, s: 90, l: 65 },   // lavender
        { h: 250, s: 100, l: 60 },  // deep purple
      ],
      ocean: [
        { h: 200, s: 100, l: 40 },  // deep ocean blue
        { h: 190, s: 95, l: 50 },   // turquoise
        { h: 160, s: 90, l: 55 },   // sea green
        { h: 180, s: 100, l: 60 },  // cyan
        { h: 210, s: 100, l: 65 },  // sky blue
      ],
    };

    console.log("VisualEngine ready. Canvas size:", this.width, "x", this.height);
  }

  // Convert HSL to RGB string
  hslToRgb(h, s, l) {
    s /= 100;
    l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    const r = Math.round(255 * f(0));
    const g = Math.round(255 * f(8));
    const b = Math.round(255 * f(4));
    return `rgb(${r}, ${g}, ${b})`;
  }

  // Get gradient color at position 0-1
  getGradientColor(palette, position, angle = 0) {
    const idx = Math.floor(position * (palette.length - 1));
    const nextIdx = Math.min(idx + 1, palette.length - 1);
    const localPos = position * (palette.length - 1) - idx;

    const curr = palette[idx];
    const next = palette[nextIdx];

    const h = curr.h + (next.h - curr.h) * localPos;
    const s = curr.s + (next.s - curr.s) * localPos;
    const l = curr.l + (next.l - curr.l) * localPos;

    return this.hslToRgb(h, s, l);
  }

  setup() {
    console.log("Setting up event handlers...");
    this.setupResizing();
    this.setupKeyboard();
    window.engine.onToggleHud((_event, _args) => {
      this.hudVisible = !this.hudVisible;
    });
    console.log("Setup complete. Starting animation loop...");
  }

  setupResizing() {
    window.addEventListener("resize", () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      this.width = this.canvas.width;
      this.height = this.canvas.height;
    });
  }

  setupKeyboard() {
    document.addEventListener("keydown", (e) => {
      if (e.key === "1") this.mode = "kaleidoscope";
      if (e.key === "2") this.mode = "orbits";
      if (e.key === "3") this.mode = "waves";
      if (e.key === "4") this.mode = "fractals";
      if (e.key === "5") this.mode = "spirals";
      if (e.key.toLowerCase() === "c") this.colorMode = "chromatic";
      if (e.key.toLowerCase() === "n") this.colorMode = "neon";
      if (e.key.toLowerCase() === "a") this.colorMode = "aurora";
      if (e.key.toLowerCase() === "s") this.colorMode = "sunset";
      if (e.key.toLowerCase() === "o") this.colorMode = "ocean";
      console.log("Mode:", this.mode, "Color:", this.colorMode);
    });
  }

  drawKaleidoscope() {
    const { ctx, width, height, time } = this;
    const palette = this.colorPalettes[this.colorMode];
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = Math.min(width, height) / 2;

    // Deep background with subtle glow
    ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
    ctx.fillRect(0, 0, width, height);

    const segments = 6;
    const segmentPhase = time * 0.002;

    for (let seg = 0; seg < segments; seg++) {
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate((seg / segments) * Math.PI * 2 + segmentPhase);

      // Gradient color based on segment position
      const colorPos = (seg / segments + time * 0.0005) % 1;
      ctx.strokeStyle = this.getGradientColor(palette, colorPos);
      ctx.lineWidth = 2.5;
      ctx.globalAlpha = 0.85;
      ctx.shadowColor = this.getGradientColor(palette, colorPos);
      ctx.shadowBlur = 8;

      for (let i = 0; i < 5; i++) {
        const radiusBase = scale * 0.15 + i * scale * 0.12;
        const radiusPulse = Math.sin(time * 0.008 + i * 0.3) * 25;
        const radius = radiusBase + radiusPulse;

        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI / 2.2 + Math.sin(time * 0.005 + seg) * 0.3);
        ctx.stroke();
      }

      // Add inner glow segments
      ctx.globalAlpha = 0.3;
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        const innerRadius = scale * 0.1 + i * scale * 0.08;
        ctx.beginPath();
        ctx.arc(0, 0, innerRadius, 0, Math.PI / 1.8);
        ctx.stroke();
      }

      ctx.restore();
    }

    ctx.globalAlpha = 1;
    ctx.shadowColor = "transparent";
  }

  drawOrbits() {
    const { ctx, width, height, time } = this;
    const palette = this.colorPalettes[this.colorMode];
    const centerX = width / 2;
    const centerY = height / 2;

    ctx.fillStyle = "rgba(0, 0, 0, 0.06)";
    ctx.fillRect(0, 0, width, height);

    for (let orbit = 0; orbit < 5; orbit++) {
      const baseRadius = 80 + orbit * 70;
      const radiusPulse = Math.sin(time * 0.008 + orbit * 0.5) * 35;
      const radius = baseRadius + radiusPulse;
      const angle = time * (0.002 + orbit * 0.0005);

      // Gradient orbit color
      const orbitColor = this.getGradientColor(palette, orbit / 5 + time * 0.0003);
      ctx.strokeStyle = orbitColor;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.6;
      ctx.shadowColor = orbitColor;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Inner orbit glow
      ctx.globalAlpha = 0.25;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.95, 0, Math.PI * 2);
      ctx.stroke();

      // Orbiting particle
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      ctx.globalAlpha = 1;
      ctx.fillStyle = orbitColor;
      ctx.shadowColor = orbitColor;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();

      // Particle glow
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = orbitColor;
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, Math.PI * 2);
      ctx.fill();

      // Trailing arc
      ctx.globalAlpha = 0.2;
      ctx.strokeStyle = orbitColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, angle - 0.4, angle + 0.1);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
    ctx.shadowColor = "transparent";
  }

  drawWaves() {
    const { ctx, width, height, time } = this;
    const palette = this.colorPalettes[this.colorMode];

    ctx.fillStyle = "rgba(0, 0, 0, 0.07)";
    ctx.fillRect(0, 0, width, height);

    for (let w = 0; w < 5; w++) {
      const waveColor = this.getGradientColor(palette, w / 5 + time * 0.0004);
      ctx.strokeStyle = waveColor;
      ctx.lineWidth = 2.5;
      ctx.globalAlpha = 0.85 - w * 0.12;
      ctx.shadowColor = waveColor;
      ctx.shadowBlur = 8;

      const amplitude = 45 + w * 25 + Math.sin(time * 0.01 + w * 0.3) * 22;
      const frequency = 0.007 + w * 0.0025;
      const yOffset = (height / 6) * (w + 1.2);
      const phaseShift = time * 0.015 + w * 0.5;

      ctx.beginPath();
      for (let x = 0; x < width; x += 4) {
        const y = yOffset + Math.sin(x * frequency + phaseShift) * amplitude;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Add filled wave area for depth
      ctx.globalAlpha = 0.15 - w * 0.02;
      ctx.fillStyle = waveColor;
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    ctx.shadowColor = "transparent";
  }

  drawFractals() {
    const { ctx, width, height, time } = this;
    const palette = this.colorPalettes[this.colorMode];

    ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
    ctx.fillRect(0, 0, width, height);

    const scale = 0.7 + Math.sin(time * 0.005) * 0.3;
    this.drawFractal(width / 2, height / 2, Math.min(width, height) * 0.3 * scale, time * 0.001, palette, 0);
  }

  drawFractal(x, y, size, angle, palette, depth) {
    if (size < 2 || depth > 7) return;

    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Gradient color based on depth
    const colorPos = (depth / 7 + this.time * 0.0005) % 1;
    const fractalColor = this.getGradientColor(palette, colorPos);

    ctx.fillStyle = fractalColor;
    ctx.globalAlpha = 0.65 - depth * 0.075;
    ctx.shadowColor = fractalColor;
    ctx.shadowBlur = 4 + depth;

    ctx.fillRect(-size / 2, -size / 2, size, size);

    // Border glow
    ctx.globalAlpha = 0.3 - depth * 0.03;
    ctx.strokeStyle = fractalColor;
    ctx.lineWidth = 0.5;
    ctx.strokeRect(-size / 2, -size / 2, size, size);

    ctx.globalAlpha = 1;
    ctx.restore();

    const nextSize = size * 0.62;
    const offset = size * 0.48;

    for (let i = 0; i < 4; i++) {
      const ax = Math.cos((i / 4) * Math.PI * 2 + this.time * 0.001) * offset;
      const ay = Math.sin((i / 4) * Math.PI * 2 + this.time * 0.001) * offset;
      this.drawFractal(x + ax, y + ay, nextSize, angle + 0.42, palette, depth + 1);
    }
  }

  drawSpirals() {
    const { ctx, width, height, time } = this;
    const palette = this.colorPalettes[this.colorMode];
    const centerX = width / 2;
    const centerY = height / 2;

    ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
    ctx.fillRect(0, 0, width, height);

    for (let s = 0; s < 4; s++) {
      const spiralColor = this.getGradientColor(palette, (s / 4 + time * 0.0004) % 1);
      ctx.strokeStyle = spiralColor;
      ctx.lineWidth = 3.5;
      ctx.globalAlpha = 0.88;
      ctx.shadowColor = spiralColor;
      ctx.shadowBlur = 10;

      const startAngle = time * (0.002 + s * 0.0003);
      const tightness = 0.35 + Math.sin(time * 0.006 + s * 0.4) * 0.22;

      ctx.beginPath();
      let isFirst = true;
      for (let a = startAngle; a < startAngle + Math.PI * 8.5; a += 0.04) {
        const radius = (a - startAngle) * 14 * tightness;
        const x = centerX + Math.cos(a) * radius;
        const y = centerY + Math.sin(a) * radius;
        if (isFirst) {
          ctx.moveTo(x, y);
          isFirst = false;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // Inner glow spiral
      ctx.globalAlpha = 0.3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      isFirst = true;
      for (let a = startAngle; a < startAngle + Math.PI * 8; a += 0.08) {
        const radius = (a - startAngle) * 14 * tightness * 0.7;
        const x = centerX + Math.cos(a) * radius;
        const y = centerY + Math.sin(a) * radius;
        if (isFirst) {
          ctx.moveTo(x, y);
          isFirst = false;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
    ctx.shadowColor = "transparent";
  }

  drawFrame() {
    const modes = {
      kaleidoscope: () => this.drawKaleidoscope(),
      orbits: () => this.drawOrbits(),
      waves: () => this.drawWaves(),
      fractals: () => this.drawFractals(),
      spirals: () => this.drawSpirals(),
    };

    const draw = modes[this.mode] || modes.kaleidoscope;
    try {
      draw.call(this);
    } catch (err) {
      console.error("Drawing error:", err);
    }
  }

  drawHUD() {
    const { ctx, width, fps } = this;
    ctx.font = "14px 'Consolas', monospace";
    ctx.fillStyle = "#32d74b";
    ctx.textBaseline = "top";
    ctx.globalAlpha = 0.7;

    const info = [
      `Mode: ${this.mode} [1-5] | Color: ${this.colorMode} [C/N/A/S/O]`,
      `${fps.toFixed(0)} fps`,
      `Press Ctrl+Shift+H to hide | Ctrl+Q to quit`,
    ];

    info.forEach((text, i) => {
      ctx.fillText(text, 12, 12 + i * 20);
    });

    ctx.globalAlpha = 1;
  }

  animate = () => {
    try {
      this.time++;
      this.frameCount++;

      this.fpsUpdateTime = (this.fpsUpdateTime || 0) + 1000 / 60;
      if (this.fpsUpdateTime >= 1000) {
        this.fps = this.frameCount;
        this.frameCount = 0;
        this.fpsUpdateTime = 0;
      }

      this.drawFrame();

      if (this.hudVisible) {
        this.drawHUD();
      }
    } catch (err) {
      console.error("Animation error:", err);
    }

    requestAnimationFrame(this.animate);
  };
}

console.log("Creating engine instance...");
const canvas = document.getElementById("scope");
console.log("Canvas element:", canvas);

if (!canvas) {
  console.error("FATAL: Canvas element not found!");
  document.body.innerHTML = "<h1 style='color:red;'>ERROR: Canvas not found</h1>";
} else {
  try {
    const engine = new VisualEngine(canvas);
    engine.setup();
    engine.animate();
    console.log("✓ Engine started successfully");
  } catch (err) {
    console.error("FATAL ENGINE ERROR:", err);
    document.body.innerHTML = "<h1 style='color:red;'>ERROR: " + err.message + "</h1>";
  }
}
