/* ==========================================================================
   ВремяОбнимашки — декорации снов
   Комната, остров носков, гора подушек и лес книжных страниц.
   ========================================================================== */

(function () {
  "use strict";

  const VO = (window.VO = window.VO || {});
  const A = VO.Art;
  const { TAU, clamp, lerp } = A;

  const W = 1280;
  const H = 720;
  const GROUND = 600;

  // Детерминированные «случайные» звёзды, чтобы не мерцали при каждом кадре.
  const seeded = (n) => {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };

  const stars = Array.from({ length: 74 }, (_, i) => ({
    x: seeded(i + 1) * W,
    y: 48 + seeded(i + 51) * 360,
    r: 0.8 + seeded(i + 101) * 2.1,
    p: seeded(i + 151) * TAU,
  }));

  const dust = Array.from({ length: 40 }, (_, i) => ({
    x: seeded(i + 210) * W,
    y: 120 + seeded(i + 310) * 500,
    r: 0.8 + seeded(i + 410) * 2.2,
    p: seeded(i + 510) * TAU,
    s: 0.22 + seeded(i + 610) * 0.5,
  }));

  let grainPattern = null;
  let grainCanvas = null;

  function getGrain(ctx) {
    if (grainPattern) return grainPattern;
    grainCanvas = document.createElement("canvas");
    grainCanvas.width = 128;
    grainCanvas.height = 128;
    const g = grainCanvas.getContext("2d");
    const img = g.createImageData(128, 128);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 150 + Math.random() * 105;
      img.data[i] = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v;
      img.data[i + 3] = 26;
    }
    g.putImageData(img, 0, 0);
    grainPattern = ctx.createPattern(grainCanvas, "repeat");
    return grainPattern;
  }

  function drawGrain(ctx) {
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.globalCompositeOperation = "soft-light";
    ctx.fillStyle = getGrain(ctx);
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  function drawVignette(ctx, strength) {
    const s = strength == null ? 0.5 : strength;
    const g = ctx.createRadialGradient(W / 2, H * 0.44, H * 0.2, W / 2, H * 0.5, H * 0.78);
    g.addColorStop(0, "rgba(7,9,25,0)");
    g.addColorStop(0.72, `rgba(7,9,25,${0.10 * s})`);
    g.addColorStop(1, `rgba(7,9,25,${0.52 * s})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function drawDust(ctx, t, color) {
    ctx.save();
    ctx.fillStyle = color || "rgba(255, 242, 199, 0.55)";
    for (const d of dust) {
      const y = d.y + Math.sin(t * d.s + d.p) * 16;
      const x = d.x + Math.cos(t * d.s * 0.7 + d.p) * 12;
      ctx.globalAlpha = 0.18 + 0.3 * (0.5 + 0.5 * Math.sin(t * 1.3 + d.p));
      ctx.beginPath();
      ctx.arc(x, y, d.r, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawStars(ctx, t, maxY) {
    const limit = maxY || 430;
    for (const s of stars) {
      if (s.y > limit) continue;
      ctx.globalAlpha = 0.22 + 0.55 * (0.5 + 0.5 * Math.sin(t * 1.15 + s.p));
      ctx.fillStyle = "#fff2c8";
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawMoon(ctx, x, y, r, t) {
    const glowR = r * 2.35;
    const g = ctx.createRadialGradient(x, y, r * 0.35, x, y, glowR);
    g.addColorStop(0, "rgba(255, 239, 178, 0.35)");
    g.addColorStop(0.5, "rgba(255, 232, 169, 0.12)");
    g.addColorStop(1, "rgba(255, 232, 169, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, glowR, 0, TAU);
    ctx.fill();

    const moonGrad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r);
    moonGrad.addColorStop(0, "#fff9dd");
    moonGrad.addColorStop(0.65, "#ffecb2");
    moonGrad.addColorStop(1, "#f2cf86");
    ctx.fillStyle = moonGrad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();

    ctx.fillStyle = "rgba(205, 169, 112, 0.14)";
    ctx.beginPath();
    ctx.arc(x - r * 0.32, y + r * 0.1, r * 0.16, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + r * 0.22, y + r * 0.38, r * 0.1, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + r * 0.3, y - r * 0.28, r * 0.07, 0, TAU);
    ctx.fill();

    // Дремлющее лицо месяца.
    ctx.strokeStyle = "rgba(124, 91, 55, 0.48)";
    ctx.lineWidth = Math.max(1.4, r * 0.03);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(x - r * 0.22, y - r * 0.02, r * 0.09, 0.2, Math.PI - 0.2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + r * 0.26, y - r * 0.04, r * 0.065, 0.2, Math.PI - 0.2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + r * 0.04, y + r * 0.13, r * 0.11, 0.25, Math.PI - 0.35);
    ctx.stroke();
    if (r > 40) {
      ctx.fillStyle = "rgba(226, 149, 143, 0.22)";
      ctx.beginPath();
      ctx.arc(x - r * 0.34, y + r * 0.12, r * 0.12, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + r * 0.35, y + r * 0.1, r * 0.09, 0, TAU);
      ctx.fill();
    }
    void t;
  }

  function drawWall(ctx, top, bottom) {
    const g = ctx.createLinearGradient(0, 0, 0, GROUND);
    g.addColorStop(0, top);
    g.addColorStop(0.62, bottom);
    g.addColorStop(1, bottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, GROUND + 4);

    // Едва заметные полосы обоев.
    ctx.save();
    ctx.globalAlpha = 0.045;
    ctx.strokeStyle = "#fff7e0";
    ctx.lineWidth = 1.4;
    for (let x = 60; x < W; x += 96) {
      ctx.beginPath();
      ctx.moveTo(x, 70);
      ctx.lineTo(x, GROUND);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawFloor(ctx, colors, t, opts) {
    const o = opts || {};
    const y = GROUND;
    ctx.save();
    // Мягкая кромка ковра.
    ctx.beginPath();
    ctx.moveTo(0, y - 4);
    for (let x = 0; x <= W; x += 32) {
      ctx.lineTo(x, y - 4 + Math.sin(x * 0.018 + 0.6) * 2.2);
    }
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, y - 10, 0, H);
    g.addColorStop(0, colors[0]);
    g.addColorStop(0.55, colors[1]);
    g.addColorStop(1, colors[2]);
    ctx.fillStyle = g;
    ctx.fill();

    // Швы и стёжка.
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, y - 6, W, H - y + 6);
    ctx.clip();
    ctx.strokeStyle = "rgba(255, 249, 225, 0.22)";
    ctx.lineWidth = 1.3;
    for (let x = -100; x < W + 100; x += 78) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + 30, y + 54, x + 6, H);
      ctx.stroke();
    }
    for (let yy = y + 30; yy < H; yy += 44) {
      ctx.beginPath();
      ctx.moveTo(0, yy + Math.sin(yy) * 3);
      for (let x = 0; x <= W; x += 40) {
        ctx.lineTo(x, yy + Math.sin(x * 0.02 + yy) * 5);
      }
      ctx.stroke();
    }
    // Мелкий узор.
    if (o.pattern) {
      ctx.fillStyle = "rgba(255, 248, 220, 0.16)";
      for (let i = 0; i < 34; i++) {
        const px = seeded(i + 701) * W;
        const py = y + 22 + seeded(i + 801) * (H - y - 30);
        if (i % 3 === 0) {
          A.starPath(ctx, px, py, 4, 1.8, 5, seeded(i) * TAU);
          ctx.fill();
        } else if (i % 3 === 1) {
          ctx.beginPath();
          ctx.arc(px, py, 2.2, 0, TAU);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.ellipse(px, py, 4, 2, seeded(i) * TAU, 0, TAU);
          ctx.fill();
        }
      }
    }
    ctx.restore();

    // Бахрома у ковра.
    ctx.strokeStyle = "rgba(255, 248, 223, 0.28)";
    ctx.lineWidth = 1.6;
    for (let x = 14; x < W; x += 19) {
      const yy = y - 3 + Math.sin(x * 0.018 + 0.6) * 2.2;
      ctx.beginPath();
      ctx.moveTo(x, yy + 2);
      ctx.quadraticCurveTo(x + 1.5, yy + 10, x - 1, yy + 15);
      ctx.stroke();
    }
    ctx.restore();
    void t;
  }

  // =======================================================================
  // СОН 1 — ОСТРОВ РАЗБРОСАННЫХ НОСКОВ
  // =======================================================================

  function drawSockRoom(ctx, t) {
    drawWall(ctx, "#202850", "#5b4e74");
    drawStars(ctx, t, 380);

    // Большое арочное окно слева.
    ctx.save();
    const wx = 86;
    const wy = 128;
    const ww = 196;
    const wh = 270;
    // рама
    ctx.fillStyle = "#2c3159";
    ctx.beginPath();
    ctx.moveTo(wx - 14, wy + 60);
    ctx.quadraticCurveTo(wx - 14, wy - 14, wx + ww / 2, wy - 20);
    ctx.quadraticCurveTo(wx + ww + 14, wy - 14, wx + ww + 14, wy + 60);
    ctx.lineTo(wx + ww + 14, wy + wh);
    ctx.lineTo(wx - 14, wy + wh);
    ctx.closePath();
    ctx.fill();
    // ночное небо в окне
    const sky = ctx.createLinearGradient(0, wy, 0, wy + wh);
    sky.addColorStop(0, "#111736");
    sky.addColorStop(0.65, "#2a3564");
    sky.addColorStop(1, "#5a5686");
    ctx.fillStyle = sky;
    ctx.beginPath();
    ctx.moveTo(wx, wy + 60);
    ctx.quadraticCurveTo(wx, wy, wx + ww / 2, wy - 4);
    ctx.quadraticCurveTo(wx + ww, wy, wx + ww, wy + 60);
    ctx.lineTo(wx + ww, wy + wh);
    ctx.lineTo(wx, wy + wh);
    ctx.closePath();
    ctx.fill();
    // звёзды в окне
    ctx.save();
    ctx.clip();
    for (let i = 0; i < 13; i++) {
      const sx = wx + seeded(i + 901) * ww;
      const sy = wy + seeded(i + 951) * wh * 0.75;
      ctx.globalAlpha = 0.35 + 0.5 * Math.sin(t * 1.6 + i);
      ctx.fillStyle = "#fff1c5";
      A.sparkle(ctx, sx, sy, 2.2, "#fff0b9", 1, t * 0.2);
    }
    drawMoon(ctx, wx + ww * 0.62, wy + 90, 44, t);
    // облака за окном
    A.drawCloud(ctx, wx + 50, wy + 230, 150, 60, "rgba(153, 168, 214, 0.35)", { shine: false });
    A.drawCloud(ctx, wx + 165, wy + 255, 120, 48, "rgba(190, 184, 220, 0.25)", { shine: false });
    ctx.restore();
    // переплёт
    ctx.strokeStyle = "#3d3e65";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(wx + ww / 2, wy + 4);
    ctx.lineTo(wx + ww / 2, wy + wh);
    ctx.moveTo(wx, wy + wh * 0.52);
    ctx.lineTo(wx + ww, wy + wh * 0.52);
    ctx.stroke();
    // подоконник
    ctx.fillStyle = "#4d466b";
    A.fillRR(ctx, wx - 25, wy + wh - 1, ww + 50, 18, 8, "#514a70");
    // шторы
    const curtain = (x, flip) => {
      ctx.save();
      ctx.translate(x, 0);
      if (flip) ctx.scale(-1, 1);
      const g = ctx.createLinearGradient(0, 0, 70, 0);
      g.addColorStop(0, "#7b5b81");
      g.addColorStop(1, "#5d4770");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, 102);
      ctx.bezierCurveTo(24, 150, 18, 260, 44, 372);
      ctx.quadraticCurveTo(20, 390, 4, 372);
      ctx.bezierCurveTo(-8, 280, 2, 178, -10, 110);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 234, 210, 0.12)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(12, 150);
      ctx.quadraticCurveTo(26, 230, 22, 320);
      ctx.stroke();
      // подхват
      ctx.fillStyle = "#e7bd83";
      A.fillRR(ctx, 8, 300, 28, 9, 4, "#e3b778");
      ctx.restore();
    };
    curtain(wx - 29, false);
    curtain(wx + ww + 29, true);
    ctx.restore();

    // Гирлянда из звёздочек.
    ctx.save();
    ctx.strokeStyle = "rgba(255, 229, 174, 0.2)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(290, 108);
    ctx.quadraticCurveTo(620, 170, 1110, 96);
    ctx.stroke();
    for (let i = 0; i < 12; i++) {
      const p = i / 11;
      const x = 300 + p * 800;
      const y = 108 + Math.sin(p * Math.PI) * 46 + Math.sin(t * 1.2 + i) * 2;
      const col = ["#ffd88c", "#ffb9c7", "#b6e0d2", "#c7c2ff"][i % 4];
      A.sparkle(ctx, x, y, 5.5, col, 0.75, t * 0.3 + i);
      ctx.strokeStyle = "rgba(255, 229, 174, 0.25)";
      ctx.beginPath();
      ctx.moveTo(x, y + 5);
      ctx.lineTo(x, y + 13);
      ctx.stroke();
    }
    ctx.restore();

    // Пол.
    drawFloor(ctx, ["#8ebf9e", "#6ba58b", "#4e826f"], t, { pattern: true });

    // Дальние облака у стены.
    A.drawCloud(ctx, 580, 430, 210, 76, "rgba(167, 170, 220, 0.15)", { shine: false });
    A.drawCloud(ctx, 380, 480, 170, 60, "rgba(183, 186, 229, 0.1)", { shine: false });

    // Большой ковёр-поляна.
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(640, 630, 470, 104, 0, 0, TAU);
    ctx.fillStyle = "rgba(255, 244, 206, 0.08)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 244, 206, 0.13)";
    ctx.lineWidth = 3;
    ctx.setLineDash([12, 10]);
    ctx.stroke();
    ctx.restore();
  }

  function drawBlanketRiver(ctx, t) {
    const x1 = 460;
    const x2 = 700;
    // Глубина.
    const depth = ctx.createLinearGradient(0, 570, 0, H);
    depth.addColorStop(0, "#171b38");
    depth.addColorStop(0.45, "#1e2c52");
    depth.addColorStop(1, "#0d1229");
    ctx.fillStyle = depth;
    ctx.beginPath();
    ctx.moveTo(x1, 588);
    ctx.lineTo(x2, 588);
    ctx.lineTo(x2, H);
    ctx.lineTo(x1, H);
    ctx.closePath();
    ctx.fill();
    for (let i = 0; i < 12; i++) {
      const sx = x1 + seeded(i + 1101) * (x2 - x1);
      const sy = 610 + seeded(i + 1151) * 95;
      ctx.globalAlpha = 0.2 + 0.3 * Math.sin(t * 1.5 + i);
      A.sparkle(ctx, sx, sy, 2.6, "#ffdf9a", 1, t * 0.4 + i);
    }
    ctx.globalAlpha = 1;

    // Одеяло-река.
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x1 - 4, 574);
    for (let y = 574; y <= H; y += 20) {
      ctx.lineTo(x1 + Math.sin(y * 0.04 + t * 1.4) * 8, y);
    }
    ctx.lineTo(x2 + Math.sin(H * 0.04 + t * 1.2) * 7, H);
    for (let y = H; y >= 574; y -= 20) {
      ctx.lineTo(x2 + Math.sin(y * 0.045 + 1.7 + t * 1.2) * 8, y);
    }
    ctx.closePath();
    const river = ctx.createLinearGradient(x1, 0, x2, H);
    river.addColorStop(0, "#406da4");
    river.addColorStop(0.35, "#5e94c8");
    river.addColorStop(0.62, "#3f6da5");
    river.addColorStop(1, "#2d4e7f");
    ctx.fillStyle = river;
    ctx.fill();

    ctx.clip();
    // Складки ткани.
    for (let i = 0; i < 9; i++) {
      const off = i * 31 + Math.sin(t * 0.8 + i) * 5;
      ctx.strokeStyle = i % 2 ? "rgba(183, 218, 249, 0.18)" : "rgba(32, 55, 101, 0.25)";
      ctx.lineWidth = i % 2 ? 9 : 15;
      ctx.beginPath();
      const xx = x1 + off;
      ctx.moveTo(xx, 574);
      ctx.bezierCurveTo(xx + 26, 630, xx - 24, 680, xx + 10, H);
      ctx.stroke();
    }
    // Волны-стежки.
    ctx.strokeStyle = "rgba(224, 242, 255, 0.35)";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    for (let row = 0; row < 7; row++) {
      const yy = 610 + row * 18;
      ctx.beginPath();
      for (let xx = x1; xx <= x2; xx += 10) {
        const py = yy + Math.sin(xx * 0.07 + t * 1.7 + row) * 3.4;
        if (xx === x1) ctx.moveTo(xx, py);
        else ctx.lineTo(xx, py);
      }
      ctx.stroke();
    }
    // Звёздочки на одеяле.
    for (let i = 0; i < 8; i++) {
      const sx = x1 + 18 + seeded(i + 1201) * (x2 - x1 - 36);
      const sy = 600 + seeded(i + 1251) * 100;
      ctx.globalAlpha = 0.25 + 0.25 * Math.sin(t * 1.1 + i);
      A.sparkle(ctx, sx, sy, 3.2, "#ffe6a3", 1, i);
    }
    ctx.restore();

    // Бахрома по берегам.
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineWidth = 2.2;
    for (const side of [x1 - 2, x2 + 2]) {
      ctx.strokeStyle = side === x1 - 2 ? "rgba(176, 214, 239, 0.55)" : "rgba(176, 214, 239, 0.45)";
      for (let y = 582; y < H; y += 12) {
        const wob = Math.sin(y * 0.05 + t * 1.5) * 5;
        ctx.beginPath();
        ctx.moveTo(side + wob, y);
        ctx.quadraticCurveTo(side + (side < 600 ? -10 : 10) + wob, y + 5, side + (side < 600 ? -7 : 7) + wob, y + 12);
        ctx.stroke();
      }
    }
    ctx.restore();

    // Табличка «река из одеяла» на берегу.
    ctx.save();
    ctx.translate(660, 570);
    ctx.rotate(-0.03);
    A.fillRR(ctx, -50, -15, 100, 25, 12, "rgba(255, 248, 229, 0.86)");
    ctx.fillStyle = "#55759b";
    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("река из одеяла", 0, -2);
    ctx.restore();
  }

  function drawBridge(ctx, progress, t) {
    if (progress <= 0) return;
    const p = clamp(progress, 0, 1);
    const width = 265 * A.easeOut(p);
    const x = 452 + (265 - width) / 2;
    const y = 585;
    ctx.save();
    A.glow(ctx, 585, y + 4, 150, "rgba(255, 212, 138, 0.28)", 0.7);
    // Мягкие дощечки-подушечки.
    const count = 7;
    for (let i = 0; i < count; i++) {
      const segW = width / count;
      const sx = x + i * segW;
      const arch = Math.sin((i / (count - 1)) * Math.PI) * 4;
      const g = ctx.createLinearGradient(0, y - 12, 0, y + 18);
      g.addColorStop(0, i % 2 ? "#ffd6df" : "#ffe3b9");
      g.addColorStop(1, i % 2 ? "#e7a6b8" : "#e8bb86");
      A.fillRR(ctx, sx + 1, y - 10 - arch, segW - 2, 24, 8, g);
      ctx.strokeStyle = "rgba(255, 245, 218, 0.6)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx + 5, y - 4 - arch);
      ctx.lineTo(sx + segW - 5, y - 4 - arch);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(255, 240, 201, 0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 3, y + 14);
    ctx.quadraticCurveTo(x + width / 2, y + 20, x + width - 3, y + 14);
    ctx.stroke();
    if (p > 0.95) {
      for (let i = 0; i < 3; i++) {
        A.sparkle(ctx, x + (i + 1) * (width / 4), y - 9 - Math.sin(t * 2 + i) * 4, 3, "#ffe9a8", 0.55 + 0.35 * Math.sin(t * 3 + i), t);
      }
    }
    ctx.restore();
  }

  function drawSockMountain(ctx, t) {
    ctx.save();
    // Тень.
    A.softShadow(ctx, 920, 604, 180, 25, 0.24);
    // Основа горы.
    const g = ctx.createLinearGradient(780, 350, 1030, 600);
    g.addColorStop(0, "#e7a7b2");
    g.addColorStop(0.45, "#cf8ba3");
    g.addColorStop(1, "#9d6686");
    ctx.beginPath();
    ctx.moveTo(748, 602);
    ctx.bezierCurveTo(772, 530, 784, 470, 806, 414);
    ctx.bezierCurveTo(819, 376, 828, 358, 850, 354);
    ctx.lineTo(1010, 354);
    ctx.bezierCurveTo(1035, 359, 1048, 420, 1064, 602);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = "rgba(105, 54, 79, 0.18)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.save();
    ctx.clip();
    // Полосы носков.
    const stripeCols = ["#f3c4c0", "#cfe0d3", "#f5d99d", "#b9a6d8", "#f0b4c0"];
    for (let i = 0; i < 7; i++) {
      ctx.strokeStyle = stripeCols[i % stripeCols.length];
      ctx.globalAlpha = 0.39;
      ctx.lineWidth = 18 + (i % 3) * 8;
      ctx.beginPath();
      const yy = 380 + i * 34;
      ctx.moveTo(790, yy + 18);
      ctx.bezierCurveTo(860, yy - 8, 950, yy + 16, 1060, yy - 4);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // Вертикальные складки.
    ctx.strokeStyle = "rgba(107, 61, 88, 0.13)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 9; i++) {
      const xx = 790 + i * 31;
      ctx.beginPath();
      ctx.moveTo(xx, 370 + Math.sin(i) * 8);
      ctx.quadraticCurveTo(xx + 14, 470, xx - 7, 600);
      ctx.stroke();
    }
    // Крупные свёрнутые носки.
    for (let i = 0; i < 5; i++) {
      const cx = 795 + seeded(i + 1301) * 235;
      const cy = 445 + seeded(i + 1351) * 135;
      const rr = 14 + seeded(i + 1401) * 9;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(seeded(i + 1451) * TAU);
      const cc = ["#f8d6cc", "#f4c7d2", "#d9e6d8", "#f6dfad", "#cbbce4"][i % 5];
      ctx.fillStyle = cc;
      ctx.beginPath();
      ctx.ellipse(0, 0, rr * 1.35, rr, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = "rgba(112, 69, 88, 0.3)";
      ctx.lineWidth = 1.3;
      for (let k = 0; k < 3; k++) {
        ctx.beginPath();
        ctx.arc(0, 0, rr * (0.4 + k * 0.22), 0.2 + k, 4.3 + k);
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.restore();

    // Верхняя подушка.
    ctx.save();
    ctx.translate(930, 352);
    A.fillRR(ctx, -82, -13, 164, 31, 15, "rgba(255, 234, 227, 0.95)");
    A.fillRR(ctx, -78, -10, 156, 8, 4, "rgba(255,255,255,0.55)");
    ctx.strokeStyle = "rgba(139, 84, 104, 0.25)";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 4]);
    A.rr(ctx, -70, -3, 140, 16, 8);
    ctx.stroke();
    ctx.setLineDash([]);
    // кисточки
    ctx.strokeStyle = "#f3c5c9";
    ctx.lineWidth = 2;
    for (let i = 0; i < 9; i++) {
      const x = -78 + i * 19;
      ctx.beginPath();
      ctx.moveTo(x, 16);
      ctx.quadraticCurveTo(x - 2, 25, x + 1, 33);
      ctx.stroke();
    }
    ctx.restore();

    // Средняя полочка-носок.
    ctx.save();
    A.softShadow(ctx, 832, 474, 52, 8, 0.13);
    const gg = ctx.createLinearGradient(0, 452, 0, 482);
    gg.addColorStop(0, "#ffe1d8");
    gg.addColorStop(1, "#e7aebc");
    A.fillRR(ctx, 788, 455, 94, 23, 11, gg);
    A.fillRR(ctx, 795, 458, 80, 6, 3, "rgba(255,255,255,0.5)");
    ctx.strokeStyle = "rgba(123, 74, 93, 0.25)";
    ctx.setLineDash([4, 3]);
    A.rr(ctx, 796, 463, 78, 10, 5);
    ctx.stroke();
    ctx.setLineDash([]);
    // свисающая бахрома
    ctx.strokeStyle = "rgba(255, 232, 222, 0.8)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      const x = 792 + i * 12;
      ctx.beginPath();
      ctx.moveTo(x, 478);
      ctx.quadraticCurveTo(x + Math.sin(t * 1.2 + i) * 2, 486, x + 1, 494);
      ctx.stroke();
    }
    ctx.restore();

    // Маленькая нашивка-сердечко.
    ctx.save();
    ctx.translate(970, 520);
    A.heart(ctx, 0, 0, 12, "rgba(255, 234, 219, 0.8)", 0.9, -0.08);
    ctx.strokeStyle = "rgba(140, 80, 103, 0.3)";
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, TAU);
    ctx.stroke();
    ctx.restore();

    // Немного носков у подножия.
    for (let i = 0; i < 3; i++) {
      const x = 760 + i * 30;
      const y = 590 - (i % 2) * 6;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-0.2 + i * 0.13);
      ctx.fillStyle = ["#c7b4e2", "#f4c3bf", "#bcd8c9"][i];
      ctx.beginPath();
      ctx.ellipse(0, 0, 22, 13, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.beginPath();
      ctx.ellipse(-4, -3, 12, 4, -0.15, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  function drawWardrobe(ctx, t, open) {
    const x = 1138;
    const y = 292;
    const w = 132;
    const h = 308;
    const o = clamp(open || 0, 0, 1);
    ctx.save();
    A.softShadow(ctx, x + w / 2, 604, 100, 18, 0.3);

    // Башенки замка.
    const wood = ctx.createLinearGradient(x, y, x + w, y + h);
    wood.addColorStop(0, "#a97158");
    wood.addColorStop(0.5, "#8e5949");
    wood.addColorStop(1, "#6f433c");
    A.fillRR(ctx, x + 6, y + 18, w - 12, h - 18, 18, wood);
    // зубцы
    ctx.fillStyle = "#7b4a42";
    for (let i = 0; i < 3; i++) {
      A.fillRR(ctx, x + 14 + i * 40, y + 4, 22, 26, 7, "#855147");
    }
    // боковые башенки
    A.fillRR(ctx, x - 12, y + 42, 28, 96, 13, "#7c4a42");
    A.fillRR(ctx, x + w - 16, y + 42, 28, 96, 13, "#7c4a42");
    ctx.fillStyle = "#d7a76d";
    ctx.beginPath();
    ctx.moveTo(x - 18, y + 42);
    ctx.lineTo(x + 2, y + 15);
    ctx.lineTo(x + 22, y + 42);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + w - 22, y + 42);
    ctx.lineTo(x + w + 2, y + 15);
    ctx.lineTo(x + w + 26, y + 42);
    ctx.closePath();
    ctx.fill();
    // флажок
    ctx.strokeStyle = "#e2b477";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y + 4);
    ctx.lineTo(x + w / 2, y - 30);
    ctx.stroke();
    ctx.fillStyle = "#f0b6c0";
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y - 29);
    ctx.quadraticCurveTo(x + w / 2 + 26, y - 24, x + w / 2 + 14, y - 12);
    ctx.lineTo(x + w / 2, y - 15);
    ctx.closePath();
    ctx.fill();

    // Дверцы.
    const innerX = x + 13;
    const innerY = y + 34;
    const innerW = w - 26;
    const innerH = h - 48;
    A.fillRR(ctx, innerX, innerY, innerW, innerH, 15, "#5f3938");
    // Тёплый свет из щели, когда открыто.
    if (o > 0) {
      const lg = ctx.createRadialGradient(x + w / 2, innerY + innerH * 0.45, 6, x + w / 2, innerY + innerH * 0.45, innerW);
      lg.addColorStop(0, `rgba(255, 226, 153, ${0.55 * o})`);
      lg.addColorStop(1, "rgba(255, 202, 112, 0)");
      ctx.fillStyle = lg;
      ctx.fillRect(innerX - 20, innerY - 20, innerW + 40, innerH + 30);
    }
    const doorW = innerW / 2 - 2;
    const drawDoor = (dx, flip, isRight) => {
      ctx.save();
      if (flip && o > 0) {
        // Левая дверца распахивается.
        const pivotX = dx;
        ctx.translate(pivotX, innerY);
        ctx.transform(1 - o * 0.55, 0, -o * 0.22, 1, 0, 0);
        ctx.translate(-pivotX, -innerY);
      }
      const dg = ctx.createLinearGradient(dx, 0, dx + doorW, 0);
      dg.addColorStop(0, isRight ? "#986052" : "#9f6958");
      dg.addColorStop(1, isRight ? "#7d4c45" : "#875348");
      A.fillRR(ctx, dx, innerY, doorW, innerH, 10, dg);
      // филёнка
      ctx.strokeStyle = "rgba(244, 199, 141, 0.25)";
      ctx.lineWidth = 1.6;
      A.rr(ctx, dx + 8, innerY + 12, doorW - 16, innerH * 0.36, 8);
      ctx.stroke();
      A.rr(ctx, dx + 8, innerY + innerH * 0.48, doorW - 16, innerH * 0.4, 8);
      ctx.stroke();
      ctx.fillStyle = "rgba(254, 220, 154, 0.4)";
      A.starPath(ctx, dx + doorW / 2, innerY + 33, 8, 3.5, 5, 0.2);
      ctx.fill();
      // ручка
      ctx.fillStyle = "#e7ba70";
      ctx.beginPath();
      ctx.arc(dx + (isRight ? 11 : doorW - 11), innerY + innerH * 0.56, 3.6, 0, TAU);
      ctx.fill();
      ctx.restore();
    };
    drawDoor(innerX, true, false);
    drawDoor(innerX + doorW + 2, false, true);

    // Замочная скважина.
    if (o < 0.2) {
      ctx.fillStyle = "#e4b56a";
      ctx.beginPath();
      ctx.arc(innerX + innerW - 26, innerY + innerH * 0.55, 5.4, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#513331";
      ctx.beginPath();
      ctx.arc(innerX + innerW - 26, innerY + innerH * 0.55 - 1, 2.1, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(innerX + innerW - 27.5, innerY + innerH * 0.55 + 1);
      ctx.lineTo(innerX + innerW - 24.5, innerY + innerH * 0.55 + 1);
      ctx.lineTo(innerX + innerW - 25.5, innerY + innerH * 0.55 + 6);
      ctx.lineTo(innerX + innerW - 26.5, innerY + innerH * 0.55 + 6);
      ctx.closePath();
      ctx.fill();
    }

    // Ножки.
    A.fillRR(ctx, x + 15, y + h - 5, 22, 15, 6, "#5b3735");
    A.fillRR(ctx, x + w - 37, y + h - 5, 22, 15, 6, "#5b3735");
    // Звёздный блик.
    ctx.globalAlpha = 0.35 + 0.15 * Math.sin(t * 1.3);
    A.sparkle(ctx, x + 15, y + 27, 5, "#ffe3a2", 1, t);
    ctx.restore();
  }

  function drawButterflyDrawing(ctx, t, active, intensity) {
    const x = 710;
    const y = 302;
    const a = clamp(intensity == null ? (active ? 1 : 0) : intensity, 0, 1);
    ctx.save();
    ctx.translate(x, y);
    if (a > 0.05) {
      A.glow(ctx, 0, 0, 105, "rgba(255, 218, 128, 0.33)", a);
      A.glow(ctx, 0, 0, 58, "rgba(255, 237, 168, 0.28)", a);
    }
    const flap = 0.72 + Math.abs(Math.sin(t * 2.7)) * 0.28;
    const outline = a > 0.05 ? "rgba(255, 219, 132, 0.95)" : "rgba(255, 238, 202, 0.32)";
    ctx.strokeStyle = outline;
    ctx.lineWidth = a > 0.05 ? 2.2 : 1.6;
    ctx.lineCap = "round";
    // Крылья
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.scale(side * flap, 1);
      const grad = ctx.createRadialGradient(-22, -15, 4, -24, -10, 58);
      grad.addColorStop(0, a > 0.05 ? "rgba(255, 239, 180, 0.85)" : "rgba(255, 245, 215, 0.06)");
      grad.addColorStop(0.55, a > 0.05 ? "rgba(255, 190, 202, 0.58)" : "rgba(255, 245, 215, 0.035)");
      grad.addColorStop(1, "rgba(255, 240, 190, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(-4, 0);
      ctx.bezierCurveTo(-35, -58, -86, -55, -82, -14);
      ctx.bezierCurveTo(-79, 18, -38, 24, -6, 7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-6, 8);
      ctx.bezierCurveTo(-40, 12, -62, 48, -38, 57);
      ctx.bezierCurveTo(-18, 62, -7, 34, -2, 16);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // прожилки
      ctx.globalAlpha = a > 0.05 ? 0.55 : 0.18;
      ctx.beginPath();
      ctx.moveTo(-8, 2);
      ctx.quadraticCurveTo(-44, -40, -68, -22);
      ctx.moveTo(-8, 4);
      ctx.quadraticCurveTo(-38, -10, -61, -2);
      ctx.moveTo(-8, 10);
      ctx.quadraticCurveTo(-36, 38, -40, 46);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.restore();
    }
    // Тело.
    ctx.fillStyle = a > 0.05 ? "#ffdf9b" : "rgba(255, 240, 205, 0.35)";
    ctx.beginPath();
    ctx.ellipse(0, 2, 4.5, 22, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -22, 6, 0, TAU);
    ctx.fill();
    // Усики.
    ctx.beginPath();
    ctx.moveTo(-2, -27);
    ctx.quadraticCurveTo(-18, -48, -23, -43);
    ctx.moveTo(2, -27);
    ctx.quadraticCurveTo(18, -48, 23, -43);
    ctx.stroke();
    // Глазки.
    ctx.fillStyle = "rgba(100, 72, 62, 0.65)";
    ctx.beginPath();
    ctx.arc(-2.5, -23, 1.1, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(2.5, -23, 1.1, 0, TAU);
    ctx.fill();
    if (a > 0.2) {
      for (let i = 0; i < 5; i++) {
        const aa = t * 1.3 + i * 1.4;
        A.sparkle(ctx, Math.cos(aa) * (38 + i * 8), Math.sin(aa) * (22 + i * 4), 2.4, "#fff4bd", a * 0.7, aa);
      }
    }
    ctx.restore();

    // Пунктир к платформе.
    if (a > 0.12) {
      ctx.save();
      ctx.strokeStyle = `rgba(255, 231, 164, ${0.28 * a})`;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 7]);
      ctx.lineDashOffset = -t * 16;
      ctx.beginPath();
      ctx.moveTo(x, y + 52);
      ctx.quadraticCurveTo(760, 390, 742, 466);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawButterflyPlatform(ctx, t, active, x, y, alpha) {
    const a = clamp(alpha == null ? (active ? 1 : 0.18) : alpha, 0, 1);
    ctx.save();
    ctx.globalAlpha = a;
    A.glow(ctx, x, y, 92, "rgba(255, 226, 143, 0.32)", a);
    // Светящиеся крылья-платформа.
    const flap = 1 + Math.sin(t * 2) * 0.025;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(flap, 1);
    const g = ctx.createLinearGradient(0, -30, 0, 30);
    g.addColorStop(0, "rgba(255, 247, 210, 0.98)");
    g.addColorStop(0.5, "rgba(255, 219, 156, 0.9)");
    g.addColorStop(1, "rgba(239, 177, 146, 0.75)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-78, 0);
    ctx.bezierCurveTo(-62, -28, -18, -22, 0, -8);
    ctx.bezierCurveTo(18, -22, 62, -28, 78, 0);
    ctx.bezierCurveTo(58, 21, 18, 17, 0, 8);
    ctx.bezierCurveTo(-18, 17, -58, 21, -78, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 251, 226, 0.9)";
    ctx.lineWidth = 2;
    ctx.stroke();
    // Прожилки.
    ctx.strokeStyle = "rgba(199, 133, 100, 0.28)";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(-58, -2);
    ctx.quadraticCurveTo(-34, -10, -12, -3);
    ctx.moveTo(58, -2);
    ctx.quadraticCurveTo(34, -10, 12, -3);
    ctx.stroke();
    ctx.restore();
    // Светящаяся кромка.
    ctx.strokeStyle = `rgba(255, 247, 201, ${0.65 * a})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x - 78, y);
    ctx.quadraticCurveTo(x, y + 13, x + 78, y);
    ctx.stroke();
    if (a > 0.7) {
      for (let i = 0; i < 4; i++) {
        A.sparkle(ctx, x - 60 + i * 40, y - 10 - Math.sin(t * 3 + i) * 5, 2.4, "#fff4c3", a * 0.8, t + i);
      }
    }
    ctx.restore();
  }

  function drawMagicDoor(ctx, t, visible, open) {
    const v = clamp(visible || 0, 0, 1);
    if (v <= 0.01) return;
    const o = clamp(open || 0, 0, 1);
    const x = 1000;
    const base = 601;
    const w = 120;
    const h = 255;
    ctx.save();
    ctx.globalAlpha = v;
    const cx = x + w / 2;
    const top = base - h;
    // Свечение портала.
    A.glow(ctx, cx, base - 100, 150 + o * 45, "rgba(255, 222, 139, 0.5)", 0.72);
    A.glow(ctx, cx, base - 100, 90, "rgba(198, 166, 255, 0.35)", 0.7);
    // Арка.
    ctx.beginPath();
    ctx.moveTo(x, base);
    ctx.lineTo(x, top + 62);
    ctx.quadraticCurveTo(x, top, cx, top);
    ctx.quadraticCurveTo(x + w, top, x + w, top + 62);
    ctx.lineTo(x + w, base);
    ctx.closePath();
    // Внутренность — звёздный вихрь.
    const g = ctx.createLinearGradient(0, top, 0, base);
    g.addColorStop(0, "rgba(255, 238, 177, 0.96)");
    g.addColorStop(0.4, "rgba(185, 152, 242, 0.92)");
    g.addColorStop(1, "rgba(83, 73, 151, 0.95)");
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    ctx.clip();
    for (let i = 0; i < 12; i++) {
      const a = t * 0.55 + i * 2.1;
      const rr = 24 + (i % 5) * 13;
      const sx = cx + Math.cos(a) * rr * 0.55;
      const sy = base - 100 + Math.sin(a * 1.3) * 74;
      A.sparkle(ctx, sx, sy, 2.2 + (i % 3), "#fff4c4", 0.4 + 0.3 * Math.sin(t + i), a);
    }
    // Радужные полосы.
    ctx.strokeStyle = "rgba(255, 242, 200, 0.25)";
    ctx.lineWidth = 3;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(cx, base - 40, 30 + i * 22, Math.PI * 1.08, Math.PI * 1.75);
      ctx.stroke();
    }
    ctx.restore();
    // Рама.
    ctx.strokeStyle = "#f3d69a";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(x, base);
    ctx.lineTo(x, top + 62);
    ctx.quadraticCurveTo(x, top, cx, top);
    ctx.quadraticCurveTo(x + w, top, x + w, top + 62);
    ctx.lineTo(x + w, base);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255, 250, 220, 0.85)";
    ctx.lineWidth = 2;
    ctx.stroke();
    // Звёзды на раме.
    for (let i = 0; i < 6; i++) {
      const a = Math.PI + (i / 5) * Math.PI;
      const sx = cx + Math.cos(a) * (w / 2);
      const sy = base - h / 2 + Math.sin(a) * (h / 2 - 10) + 20;
      A.sparkle(ctx, sx, sy, 3.4, "#fff3ba", 0.8, t + i);
    }
    // Ступенька.
    A.fillRR(ctx, x - 14, base - 4, w + 28, 12, 6, "rgba(255, 230, 184, 0.55)");
    // Надпись.
    ctx.globalAlpha = v * (0.65 + 0.2 * Math.sin(t * 1.6));
    ctx.fillStyle = "#fff2c9";
    ctx.font = '700 10px "Segoe UI", sans-serif';
    ctx.textAlign = "center";
    ctx.fillText("ВОЛШЕБНАЯ ДВЕРЬ", cx, top - 14);
    if (o > 0.1) {
      ctx.globalAlpha = v;
      A.glow(ctx, cx, base - 100, 190, "rgba(255, 240, 176, 0.3)", o);
    }
    ctx.restore();
  }

  function drawBearCloud(ctx, t, visible) {
    const v = clamp(visible || 0, 0, 1);
    if (v <= 0) return;
    const bob = Math.sin(t * 1.3) * 5;
    ctx.save();
    ctx.globalAlpha = v;
    A.drawCloud(ctx, 1178, 246 + bob, 156, 64, "rgba(255, 247, 230, 0.88)", { shadow: true });
    // Мишка сидит на облаке.
    A.drawToyBear(ctx, 1178, 251 + bob, 0.72, t);
    // Мини-звёзды.
    for (let i = 0; i < 4; i++) {
      const a = t * 0.9 + i * 1.6;
      A.sparkle(ctx, 1178 + Math.cos(a) * (58 + i * 8), 246 + bob + Math.sin(a) * 26, 2.5, "#ffe9a7", 0.6, a);
    }
    ctx.restore();
  }

  function drawSockKeySpot(ctx, t) {
    // Гнёздышко-подушечка, где лежит ключ.
    ctx.save();
    A.softShadow(ctx, 916, 355, 40, 7, 0.15);
    A.fillRR(ctx, 882, 342, 68, 17, 8, "rgba(255, 242, 223, 0.8)");
    A.fillRR(ctx, 888, 344, 56, 5, 3, "rgba(255,255,255,0.45)");
    ctx.restore();
    void t;
  }

  // =======================================================================
  // СОН 2 — ГОРА ГИГАНТСКИХ ПОДУШЕК
  // =======================================================================

  function drawPillowRoom(ctx, t) {
    drawWall(ctx, "#211d46", "#5e3f63");
    drawStars(ctx, t, 340);

    // Огромное круглое окно-иллюминатор.
    ctx.save();
    const cx = 210;
    const cy = 214;
    const r = 112;
    ctx.fillStyle = "#3b355f";
    ctx.beginPath();
    ctx.arc(cx, cy, r + 18, 0, TAU);
    ctx.fill();
    const sky = ctx.createLinearGradient(0, cy - r, 0, cy + r);
    sky.addColorStop(0, "#121a3e");
    sky.addColorStop(0.7, "#394379");
    sky.addColorStop(1, "#7a5f81");
    ctx.fillStyle = sky;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, TAU);
    ctx.fill();
    ctx.save();
    ctx.clip();
    drawMoon(ctx, cx + 34, cy - 20, 54, t);
    A.drawCloud(ctx, cx - 20, cy + 50, 170, 62, "rgba(169, 172, 214, 0.35)", { shine: false });
    A.drawCloud(ctx, cx + 70, cy + 82, 120, 42, "rgba(190, 181, 214, 0.26)", { shine: false });
    ctx.restore();
    ctx.strokeStyle = "#4d4674";
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 5, 0, TAU);
    ctx.stroke();
    ctx.restore();

    // Гирлянда из облачков и звёзд.
    ctx.save();
    ctx.strokeStyle = "rgba(255, 224, 193, 0.22)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(340, 100);
    ctx.quadraticCurveTo(740, 176, 1130, 96);
    ctx.stroke();
    for (let i = 0; i < 8; i++) {
      const p = i / 7;
      const x = 360 + p * 740;
      const y = 104 + Math.sin(p * Math.PI) * 40 + Math.sin(t * 1.4 + i) * 2;
      A.drawCloud(ctx, x, y, 42, 22, "rgba(255, 232, 226, 0.45)", { shine: false });
      A.sparkle(ctx, x + 16, y - 13, 3, ["#ffd88c", "#ffb9c7", "#c7c2ff"][i % 3], 0.7, t + i);
    }
    ctx.restore();

    // Дальние подушки-горы.
    const pillows = [
      { x: 380, y: 560, w: 330, h: 210, c: "#c78ca6" },
      { x: 690, y: 560, w: 280, h: 165, c: "#dba7ae" },
      { x: 980, y: 560, w: 300, h: 190, c: "#b98bb2" },
    ];
    for (const p of pillows) {
      ctx.save();
      ctx.globalAlpha = 0.25;
      A.fillRR(ctx, p.x - p.w / 2, p.y - p.h, p.w, p.h + 60, 90, p.c);
      ctx.strokeStyle = "rgba(255, 235, 225, 0.22)";
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 9]);
      ctx.beginPath();
      ctx.ellipse(p.x, p.y - p.h + 26, p.w * 0.34, 26, 0, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }

    drawFloor(ctx, ["#e2bfa6", "#c99691", "#986b78"], t, { pattern: true });

    // Одеяло-пол.
    ctx.save();
    ctx.strokeStyle = "rgba(255, 238, 216, 0.22)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(-30 + i * 280, 596);
      ctx.quadraticCurveTo(180 + i * 240, 650, 330 + i * 260, 720);
      ctx.stroke();
    }
    ctx.restore();

    // Декоративные подушки на полу.
    const deco = [
      { x: 120, y: 586, w: 100, h: 50, c: "#e8b3aa", rot: -0.1 },
      { x: 1060, y: 585, w: 118, h: 52, c: "#c9b1dd", rot: 0.08 },
    ];
    for (const d of deco) {
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(d.rot);
      A.softShadow(ctx, 0, 18, d.w * 0.48, 7, 0.14);
      A.fillRR(ctx, -d.w / 2, -d.h / 2, d.w, d.h, d.h / 2, d.c);
      A.fillRR(ctx, -d.w / 2 + 10, -d.h / 2 + 7, d.w - 20, 9, 5, "rgba(255,255,255,0.32)");
      ctx.strokeStyle = "rgba(115, 71, 92, 0.2)";
      ctx.setLineDash([5, 4]);
      A.rr(ctx, -d.w / 2 + 9, -d.h / 2 + 7, d.w - 18, d.h - 14, 12);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawPillowLedge(ctx, t) {
    // Огромная подушка-полка.
    ctx.save();
    A.softShadow(ctx, 805, 604, 135, 18, 0.24);
    // Мягкие свисающие уголки, под полкой можно проползти.
    A.fillRR(ctx, 704, 462, 28, 46, 14, "rgba(203, 143, 158, 0.85)");
    A.fillRR(ctx, 888, 462, 28, 52, 14, "rgba(193, 133, 150, 0.85)");
    // основная подушка
    const g = ctx.createLinearGradient(0, 418, 0, 468);
    g.addColorStop(0, "#ffd9cb");
    g.addColorStop(0.55, "#f0b6b7");
    g.addColorStop(1, "#d394a6");
    A.fillRR(ctx, 690, 428, 242, 44, 22, g);
    A.fillRR(ctx, 700, 431, 220, 11, 6, "rgba(255,255,255,0.48)");
    ctx.strokeStyle = "rgba(126, 71, 92, 0.25)";
    ctx.setLineDash([7, 5]);
    A.rr(ctx, 702, 438, 216, 24, 12);
    ctx.stroke();
    ctx.setLineDash([]);
    // бахрома
    ctx.strokeStyle = "rgba(255, 231, 220, 0.8)";
    ctx.lineWidth = 2.3;
    for (let i = 0; i < 19; i++) {
      const x = 696 + i * 12;
      ctx.beginPath();
      ctx.moveTo(x, 468);
      ctx.quadraticCurveTo(x + Math.sin(t * 1.1 + i) * 2, 480, x + 1, 491);
      ctx.stroke();
    }
    // пуговицы
    ctx.fillStyle = "rgba(255, 247, 223, 0.7)";
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(745 + i * 66, 451, 3.1, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawPillowTunnel(ctx, t, occupied) {
    const x = 776;
    const y = 536;
    const w = 248;
    const h = 64;
    ctx.save();
    // Тёмный уютный проход.
    ctx.beginPath();
    ctx.moveTo(x, 600);
    ctx.lineTo(x, y + 30);
    ctx.quadraticCurveTo(x + 22, y, x + 60, y);
    ctx.lineTo(x + w - 30, y);
    ctx.quadraticCurveTo(x + w, y + 16, x + w, 600);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, y, 0, 600);
    g.addColorStop(0, "rgba(36, 27, 53, 0.92)");
    g.addColorStop(1, "rgba(78, 48, 71, 0.88)");
    ctx.fillStyle = g;
    ctx.fill();
    // Мягкий ободок из подушек.
    ctx.strokeStyle = "rgba(255, 200, 180, 0.45)";
    ctx.lineWidth = 7;
    ctx.stroke();
    // Гирька-подвеска «норка».
    ctx.save();
    ctx.translate(x + 88, 523);
    ctx.strokeStyle = "rgba(255, 226, 201, 0.5)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, -19);
    ctx.lineTo(0, 0);
    ctx.stroke();
    A.fillRR(ctx, -51, 0, 102, 23, 11, "rgba(255, 243, 222, 0.92)");
    ctx.fillStyle = "#9d6471";
    ctx.font = '700 10px "Comic Sans MS", "Segoe UI", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("норка для Алисы", 0, 1);
    ctx.restore();
    // Светлячки в норке.
    for (let i = 0; i < 4; i++) {
      const fx = x + 30 + ((t * 18 + i * 54) % (w - 50));
      const fy = y + 22 + Math.sin(t * 2 + i) * 11;
      A.drawFirefly(ctx, fx, fy, t + i, 0.58);
    }
    if (occupied) {
      A.glow(ctx, x + 90, 575, 70, "rgba(255, 219, 140, 0.2)", 0.7);
    }
    ctx.restore();
  }

  function drawCloudShelf(ctx, t, bridgeProgress) {
    // Ступеньки-облака.
    const steps = [
      { x: 1046, y: 552, w: 98, h: 36 },
      { x: 1070, y: 492, w: 96, h: 38 },
    ];
    for (const s of steps) {
      A.drawCloud(ctx, s.x, s.y, s.w, s.h + 18, "rgba(255, 242, 233, 0.9)", { shadow: true });
      A.fillRR(ctx, s.x - 34, s.y - 4, 68, 9, 4, "rgba(255, 255, 255, 0.4)");
    }
    // Большое облако-полка.
    A.drawCloud(ctx, 1150, 442, 214, 82, "rgba(255, 244, 234, 0.96)", { shadow: true });
    // Подушка на облаке.
    A.fillRR(ctx, 1074, 421, 162, 24, 12, "#e9b7c8");
    A.fillRR(ctx, 1082, 424, 146, 7, 4, "rgba(255,255,255,0.5)");
    ctx.strokeStyle = "rgba(116, 69, 91, 0.2)";
    ctx.setLineDash([5, 4]);
    A.rr(ctx, 1084, 428, 142, 12, 6);
    ctx.stroke();
    ctx.setLineDash([]);

    // Перила из гирлянды.
    ctx.strokeStyle = "rgba(255, 225, 199, 0.3)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(1070, 397);
    ctx.quadraticCurveTo(1140, 380, 1215, 400);
    ctx.stroke();
    for (let i = 0; i < 4; i++) {
      const x = 1092 + i * 34;
      const y = 392 + Math.sin((i / 3) * Math.PI) * -4;
      A.sparkle(ctx, x, y, 2.6, "#ffe1a1", 0.6, t + i);
    }

    // Мостик.
    if (bridgeProgress > 0) {
      const p = A.easeOut(clamp(bridgeProgress, 0, 1));
      const x = 920;
      const y = 437;
      const width = 150 * p;
      const g = ctx.createLinearGradient(0, y - 9, 0, y + 15);
      g.addColorStop(0, "#ffe0c9");
      g.addColorStop(1, "#dda5a8");
      A.fillRR(ctx, x, y, width, 22, 10, g);
      A.fillRR(ctx, x + 4, y + 3, Math.max(0, width - 8), 5, 3, "rgba(255,255,255,0.4)");
      ctx.strokeStyle = "rgba(126, 76, 93, 0.22)";
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(x + 7, y + 11);
      ctx.lineTo(x + Math.max(8, width - 7), y + 11);
      ctx.stroke();
      ctx.setLineDash([]);
      for (let i = 0; i < 4; i++) {
        A.sparkle(ctx, x + 20 + i * 32, y - 8 - Math.sin(t * 2 + i) * 4, 2.5, "#ffe5ac", 0.7, t + i);
      }
    }
    // Перильца-облачка у моста.
    A.drawCloud(ctx, 930, 430, 54, 24, "rgba(255, 240, 231, 0.42)", { shine: false });
  }

  function drawStarButton(ctx, t, pressed) {
    const x = 1000;
    const y = 545;
    const bob = pressed ? 0 : Math.sin(t * 2) * 2;
    ctx.save();
    ctx.translate(x, y + bob);
    // подушка-основание
    A.softShadow(ctx, 0, 16, 38, 7, 0.18);
    A.fillRR(ctx, -34, 6, 68, 18, 9, "#d9a9bb");
    // звезда
    if (!pressed) {
      A.glow(ctx, 0, -8, 48, "rgba(255, 225, 137, 0.55)", 0.8);
      ctx.save();
      ctx.translate(0, -8);
      const g = ctx.createLinearGradient(0, -26, 0, 20);
      g.addColorStop(0, "#fff5c8");
      g.addColorStop(1, "#ffc85f");
      ctx.fillStyle = g;
      A.starPath(ctx, 0, 0, 27, 12, 5, Math.sin(t) * 0.06);
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 252, 228, 0.9)";
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.fillStyle = "rgba(158, 102, 38, 0.75)";
      ctx.font = '700 8px "Segoe UI", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("ENTER", 0, 1);
      ctx.restore();
      for (let i = 0; i < 4; i++) {
        const a = t * 1.2 + i * 1.7;
        A.sparkle(ctx, Math.cos(a) * 38, -8 + Math.sin(a) * 25, 2.2, "#fff0b1", 0.8, a);
      }
    } else {
      ctx.fillStyle = "#d9a86c";
      A.starPath(ctx, 0, -4, 24, 10, 5, 0);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPillowBridgeStep(ctx, x, y, w, h) {
    // Шаг из большой подушки.
    ctx.save();
    A.softShadow(ctx, x + w / 2, 604, w * 0.52, 11, 0.2);
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, "#ffd9cd");
    g.addColorStop(0.5, "#efb5b7");
    g.addColorStop(1, "#cb8fa4");
    A.fillRR(ctx, x, y, w, h, 16, g);
    A.fillRR(ctx, x + 8, y + 6, w - 16, 8, 4, "rgba(255,255,255,0.45)");
    ctx.strokeStyle = "rgba(122, 71, 92, 0.24)";
    ctx.setLineDash([5, 4]);
    A.rr(ctx, x + 8, y + 12, w - 16, h - 22, 10);
    ctx.stroke();
    ctx.setLineDash([]);
    // полоски
    ctx.save();
    ctx.beginPath();
    A.rr(ctx, x, y, w, h, 16);
    ctx.clip();
    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = "#fff3df";
    ctx.lineWidth = 11;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(x - 10 + i * 32, y + h);
      ctx.lineTo(x + 20 + i * 32, y);
      ctx.stroke();
    }
    ctx.restore();
    ctx.restore();
  }

  function drawBunnyCloud(ctx, t, visible) {
    const v = clamp(visible || 0, 0, 1);
    if (v <= 0) return;
    ctx.save();
    ctx.globalAlpha = v;
    const bob = Math.sin(t * 1.4) * 3;
    A.glow(ctx, 1200, 350, 78, "rgba(255, 225, 160, 0.25)", 0.6);
    A.drawToyBunny(ctx, 1200, 423 + bob, 0.86, t);
    // пузырь сна
    ctx.strokeStyle = "rgba(255, 239, 198, 0.25)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.arc(1200, 374 + bob, 62, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
    for (let i = 0; i < 5; i++) {
      const a = t * 0.9 + i * 1.25;
      A.sparkle(ctx, 1200 + Math.cos(a) * 72, 365 + Math.sin(a) * 46, 2.2, "#ffe7ae", 0.55, a);
    }
    ctx.restore();
  }

  function drawDoorPillow(ctx, t, visible, open) {
    const v = clamp(visible || 0, 0, 1);
    if (v <= 0) return;
    ctx.save();
    ctx.globalAlpha = v;
    const cx = 1128;
    const base = 424;
    A.glow(ctx, cx, base - 95, 135 + (open || 0) * 30, "rgba(255, 222, 157, 0.5)", 0.7);
    ctx.beginPath();
    ctx.moveTo(cx - 52, base);
    ctx.lineTo(cx - 52, base - 170);
    ctx.quadraticCurveTo(cx - 52, base - 215, cx, base - 218);
    ctx.quadraticCurveTo(cx + 52, base - 215, cx + 52, base - 170);
    ctx.lineTo(cx + 52, base);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, base - 220, 0, base);
    g.addColorStop(0, "rgba(255, 242, 196, 0.96)");
    g.addColorStop(0.5, "rgba(196, 166, 244, 0.92)");
    g.addColorStop(1, "rgba(119, 89, 152, 0.94)");
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    ctx.clip();
    for (let i = 0; i < 10; i++) {
      const a = t * 0.5 + i * 1.8;
      A.sparkle(ctx, cx + Math.cos(a) * 32, base - 100 + Math.sin(a) * 66, 2.2, "#fff3c6", 0.5, a);
    }
    ctx.restore();
    ctx.strokeStyle = "#f3d59a";
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.strokeStyle = "rgba(255, 250, 220, 0.8)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    A.fillRR(ctx, cx - 62, base - 4, 124, 10, 5, "rgba(255, 231, 195, 0.55)");
    ctx.fillStyle = "rgba(255, 242, 204, 0.8)";
    ctx.font = '700 9px "Segoe UI", sans-serif';
    ctx.textAlign = "center";
    ctx.fillText("ВОЛШЕБНАЯ ДВЕРЬ", cx, base - 231);
    ctx.restore();
  }

  // =======================================================================
  // СОН 3 — ЛЕС КНИЖНЫХ СТРАНИЦ
  // =======================================================================

  const BOOK_TITLES = ["Сказки", "Сны", "Стихи", "Азбука", "Приключения", "Обнимашки"];

  function drawBookForest(ctx, t) {
    const sky = ctx.createLinearGradient(0, 0, 0, GROUND);
    sky.addColorStop(0, "#162c3a");
    sky.addColorStop(0.45, "#31554f");
    sky.addColorStop(0.8, "#7b7557");
    sky.addColorStop(1, "#b08a5d");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, GROUND + 4);
    drawStars(ctx, t, 300);

    // Луна в листве.
    drawMoon(ctx, 1030, 148, 58, t);

    // Дальние книжные стволы.
    const books = [
      { x: 44, y: 60, w: 96, h: 540, c: "#4b6f67", title: "СОН" },
      { x: 176, y: 120, w: 70, h: 480, c: "#7d5d70", title: "СКАЗКИ" },
      { x: 1046, y: 80, w: 84, h: 520, c: "#6b5b84", title: "ТИХО" },
      { x: 1168, y: 130, w: 82, h: 470, c: "#55756b", title: "ДОМ" },
    ];
    for (const b of books) {
      ctx.save();
      const g = ctx.createLinearGradient(b.x, 0, b.x + b.w, 0);
      g.addColorStop(0, b.c);
      g.addColorStop(0.5, "rgba(255,255,255,0.1)");
      g.addColorStop(1, b.c);
      A.fillRR(ctx, b.x, b.y, b.w, b.h, 12, b.c);
      ctx.fillStyle = "rgba(255, 246, 215, 0.06)";
      ctx.fillRect(b.x + 8, b.y, b.w - 16, b.h);
      // корешок
      ctx.strokeStyle = "rgba(255, 230, 180, 0.18)";
      ctx.lineWidth = 2;
      ctx.strokeRect(b.x + 12, b.y + 20, b.w - 24, b.h - 40);
      // название
      ctx.save();
      ctx.translate(b.x + b.w / 2, b.y + b.h * 0.38);
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = "rgba(255, 235, 182, 0.55)";
      ctx.font = '700 12px "Segoe UI", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(b.title, 0, 0);
      ctx.restore();
      // страницы сверху
      ctx.strokeStyle = "rgba(255, 246, 216, 0.25)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(b.x + b.w - 1, b.y + 20 + i * 4);
        ctx.lineTo(b.x + b.w + 6, b.y + 18 + i * 4);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Ветви-закладки.
    ctx.save();
    ctx.strokeStyle = "rgba(255, 219, 157, 0.18)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(140, 250);
    ctx.bezierCurveTo(260, 170, 360, 230, 470, 160);
    ctx.moveTo(1160, 300);
    ctx.bezierCurveTo(1080, 210, 1000, 260, 920, 180);
    ctx.stroke();
    for (let i = 0; i < 14; i++) {
      const x = 130 + i * 75;
      const y = 190 + Math.sin(i * 1.7) * 55;
      ctx.save();
      ctx.translate(x, y + Math.sin(t * 1.1 + i) * 3);
      ctx.rotate(Math.sin(i) * 0.8);
      ctx.fillStyle = i % 2 ? "rgba(255, 232, 178, 0.22)" : "rgba(197, 225, 190, 0.18)";
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.quadraticCurveTo(12, -6, 0, 11);
      ctx.quadraticCurveTo(-11, -5, 0, -10);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();

    // Парящие буквы.
    const letters = ["А", "Б", "С", "О", "Н", "♡"];
    for (let i = 0; i < letters.length; i++) {
      const x = 160 + ((i * 191 + t * 8) % 970);
      const y = 200 + Math.sin(t * 0.7 + i * 1.4) * 44 + (i % 3) * 58;
      ctx.save();
      ctx.globalAlpha = 0.15 + 0.12 * Math.sin(t * 1.4 + i);
      ctx.fillStyle = "#ffe8b4";
      ctx.font = `${20 + (i % 3) * 7}px "Comic Sans MS", "Segoe UI", sans-serif`;
      ctx.fillText(letters[i], x, y);
      ctx.restore();
    }

    // Пол — огромные страницы.
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, GROUND - 5);
    for (let x = 0; x <= W; x += 30) {
      ctx.lineTo(x, GROUND - 5 + Math.sin(x * 0.013) * 3);
    }
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    const floor = ctx.createLinearGradient(0, GROUND, 0, H);
    floor.addColorStop(0, "#dcc49b");
    floor.addColorStop(0.55, "#b9946b");
    floor.addColorStop(1, "#7f6048");
    ctx.fillStyle = floor;
    ctx.fill();
    ctx.clip();
    // линии строк
    ctx.strokeStyle = "rgba(84, 62, 48, 0.13)";
    ctx.lineWidth = 1.2;
    for (let y = GROUND + 24; y < H; y += 23) {
      ctx.beginPath();
      for (let x = 0; x <= W; x += 40) {
        ctx.lineTo(x, y + Math.sin(x * 0.015 + y) * 2);
      }
      ctx.stroke();
    }
    // тени от страниц
    ctx.strokeStyle = "rgba(255, 246, 217, 0.18)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(120 + i * 210, GROUND);
      ctx.quadraticCurveTo(180 + i * 210, 650, 150 + i * 210, H);
      ctx.stroke();
    }
    ctx.restore();

    // Листья-страницы на полу.
    for (let i = 0; i < 7; i++) {
      const x = 60 + seeded(i + 1501) * 1160;
      const y = 620 + seeded(i + 1551) * 70;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(seeded(i + 1601) * TAU);
      ctx.fillStyle = "rgba(255, 244, 210, 0.18)";
      ctx.beginPath();
      ctx.ellipse(0, 0, 12, 5, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  const shapeColorHex = {
    red: "#e56e72",
    yellow: "#f2c14e",
    blue: "#5d9fd6",
    green: "#72b78a",
    purple: "#a687d4",
    orange: "#ed9558",
  };

  const shapeColorRus = {
    red: "красный",
    yellow: "жёлтый",
    blue: "синий",
    green: "зелёный",
    purple: "фиолетовый",
    orange: "оранжевый",
  };

  const shapeRus = {
    circle: "круг",
    triangle: "треугольник",
    square: "квадрат",
    star: "звезда",
    heart: "сердечко",
    diamond: "ромб",
  };

  function drawShapePad(ctx, pad, t, state) {
    const { x, y, w, shape, color } = pad;
    const s = state || {};
    const active = s.active;
    const correct = s.correct;
    const fill = shapeColorHex[color] || "#e0a0a0";
    const bob = Math.sin(t * 1.4 + x * 0.01) * 1.2;
    ctx.save();
    ctx.translate(x, y + bob);
    // тень и коврик
    A.softShadow(ctx, 0, 8, w * 0.52, 8, 0.18);
    ctx.beginPath();
    ctx.ellipse(0, 0, w * 0.54, 20, 0, 0, TAU);
    ctx.fillStyle = "rgba(255, 246, 222, 0.2)";
    ctx.fill();
    ctx.strokeStyle = correct ? "rgba(255, 234, 157, 0.9)" : "rgba(255, 246, 222, 0.26)";
    ctx.lineWidth = correct ? 3 : 1.5;
    ctx.stroke();
    // цветной ободок
    ctx.beginPath();
    ctx.ellipse(0, -2, w * 0.47, 17, 0, 0, TAU);
    ctx.fillStyle = `${fill}33`;
    ctx.fill();
    ctx.strokeStyle = `${fill}aa`;
    ctx.lineWidth = 2;
    ctx.stroke();
    if (active) {
      A.glow(ctx, 0, -25, 55, `${fill}77`, 0.7);
    }
    // фигура
    ctx.save();
    ctx.translate(0, -27);
    const size = 22 + (correct ? 2 : 0);
    ctx.fillStyle = active || correct ? fill : `${fill}cc`;
    A.shapePath(ctx, shape, 0, 0, size);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 248, 226, 0.75)";
    ctx.lineWidth = 2;
    ctx.stroke();
    // блик
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = "#fff";
    A.shapePath(ctx, shape, -4, -6, size * 0.35);
    ctx.fill();
    ctx.restore();
    // подпись цвета
    ctx.fillStyle = "rgba(255, 246, 224, 0.72)";
    ctx.font = '700 9px "Segoe UI", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(shapeColorRus[color] || "", 0, 1);
    // указатели при правильном выборе
    if (correct) {
      A.sparkle(ctx, -w * 0.38, -42, 4, "#ffe8a2", 0.9, t);
      A.sparkle(ctx, w * 0.38, -40, 3, "#ffe8a2", 0.7, t + 1);
    }
    ctx.restore();
  }

  function drawStoryBook(ctx, t, specs, round, openAmount) {
    // specs: [{player:'ilya',shape,color}, ...]
    ctx.save();
    ctx.translate(640, 296);
    ctx.rotate(-0.015);
    const bob = Math.sin(t * 1.2) * 2;
    ctx.translate(0, bob);
    A.glow(ctx, 0, 20, 190, "rgba(255, 224, 152, 0.18)", 0.7);
    // книга
    ctx.fillStyle = "#6f4c42";
    ctx.beginPath();
    ctx.moveTo(-170, 42);
    ctx.quadraticCurveTo(-120, -8, 0, 0);
    ctx.quadraticCurveTo(120, -8, 170, 42);
    ctx.quadraticCurveTo(120, 92, 0, 84);
    ctx.quadraticCurveTo(-120, 92, -170, 42);
    ctx.closePath();
    ctx.fill();
    // страницы
    const pg = ctx.createLinearGradient(0, -10, 0, 100);
    pg.addColorStop(0, "#fff9e9");
    pg.addColorStop(1, "#f1dcba");
    ctx.fillStyle = pg;
    ctx.beginPath();
    ctx.moveTo(-156, 38);
    ctx.quadraticCurveTo(-100, 0, 0, 8);
    ctx.quadraticCurveTo(100, 0, 156, 38);
    ctx.quadraticCurveTo(100, 78, 0, 72);
    ctx.quadraticCurveTo(-100, 78, -156, 38);
    ctx.closePath();
    ctx.fill();
    // корешок
    ctx.strokeStyle = "rgba(132, 91, 68, 0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 8);
    ctx.lineTo(0, 72);
    ctx.stroke();
    // строки текста
    ctx.strokeStyle = "rgba(121, 95, 72, 0.16)";
    ctx.lineWidth = 1;
    for (let side of [-1, 1]) {
      for (let i = 0; i < 4; i++) {
        const y = 22 + i * 9;
        ctx.beginPath();
        ctx.moveTo(side * 16, y);
        ctx.quadraticCurveTo(side * 70, y - 4, side * 132, y + 1);
        ctx.stroke();
      }
    }
    // подсказки на страницах
    if (specs && specs.length) {
      for (let i = 0; i < specs.length; i++) {
        const spec = specs[i];
        const side = i === 0 ? -1 : 1;
        const sx = side * 76;
        const sy = 38;
        ctx.save();
        ctx.translate(sx, sy);
        const col = shapeColorHex[spec.color] || "#e5a1a1";
        A.glow(ctx, 0, 0, 42, `${col}44`, 0.8);
        ctx.fillStyle = `${col}22`;
        ctx.beginPath();
        ctx.arc(0, 0, 28, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = `${col}99`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = col;
        A.shapePath(ctx, spec.shape, 0, -2, 17);
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 250, 228, 0.8)";
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.fillStyle = "#7d5b4d";
        ctx.font = '700 8px "Segoe UI", sans-serif';
        ctx.textAlign = "center";
        ctx.fillText(i === 0 ? "ИЛЮША" : "АЛИСА", 0, 23);
        ctx.restore();
      }
    }
    // закладка
    ctx.fillStyle = "#e58fa6";
    ctx.beginPath();
    ctx.moveTo(118, -3);
    ctx.lineTo(136, -11);
    ctx.lineTo(134, 18);
    ctx.lineTo(121, 10);
    ctx.closePath();
    ctx.fill();
    // звёзды
    for (let i = 0; i < 3; i++) {
      A.sparkle(ctx, -150 + i * 150, -18 - Math.sin(t * 2 + i) * 4, 2.8, "#ffe6a1", 0.6, t + i);
    }
    ctx.restore();
  }

  function drawLanterns(ctx, t, lit) {
    const xs = [430, 640, 850];
    ctx.save();
    ctx.strokeStyle = "rgba(255, 226, 177, 0.18)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(350, 86);
    ctx.quadraticCurveTo(640, 132, 930, 86);
    ctx.stroke();
    for (let i = 0; i < 3; i++) {
      const x = xs[i];
      const y = 216 + Math.sin((i / 2) * Math.PI) * 10;
      const on = i < lit;
      const sway = Math.sin(t * 1.1 + i) * 0.03;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(sway);
      ctx.strokeStyle = "rgba(255, 229, 184, 0.4)";
      ctx.beginPath();
      ctx.moveTo(0, -132);
      ctx.lineTo(0, -25);
      ctx.stroke();
      if (on) A.glow(ctx, 0, 14, 56, "rgba(255, 219, 134, 0.52)", 0.85);
      // бумажный фонарик
      const g = ctx.createLinearGradient(0, -12, 0, 44);
      g.addColorStop(0, on ? "#ffe7ac" : "#d9c9c8");
      g.addColorStop(0.6, on ? "#f7c277" : "#baa6ae");
      g.addColorStop(1, on ? "#e99b5f" : "#8f7e8f");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(0, 14, 18, 23, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = on ? "rgba(255, 246, 205, 0.8)" : "rgba(230, 220, 224, 0.25)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // рёбра
      ctx.strokeStyle = on ? "rgba(142, 89, 50, 0.3)" : "rgba(105, 90, 104, 0.25)";
      ctx.lineWidth = 1;
      for (let k = -1; k <= 1; k++) {
        ctx.beginPath();
        ctx.ellipse(0, 14, Math.abs(k) * 9 + 2, 21, 0, 0, TAU);
        ctx.stroke();
      }
      // верхняя крышечка и кисточка
      A.fillRR(ctx, -7, -15, 14, 5, 2.5, on ? "#d5a15c" : "#8f7c8a");
      A.fillRR(ctx, -6, 35, 12, 5, 2.5, on ? "#d5a15c" : "#8f7c8a");
      ctx.strokeStyle = on ? "#e6b878" : "#a28f9b";
      ctx.beginPath();
      ctx.moveTo(0, 40);
      ctx.lineTo(0, 48);
      ctx.stroke();
      ctx.fillStyle = on ? "#fff0bc" : "#b8a7b1";
      ctx.beginPath();
      ctx.arc(0, 50, 2.1, 0, TAU);
      ctx.fill();
      if (on) {
        for (let k = 0; k < 3; k++) {
          const a = t * 1.4 + k * 2.1;
          A.sparkle(ctx, Math.cos(a) * 30, 14 + Math.sin(a) * 26, 2, "#fff0b5", 0.7, a);
        }
      }
      ctx.restore();
    }
    ctx.restore();
  }

  function drawBookPortal(ctx, t, visible, open) {
    const v = clamp(visible || 0, 0, 1);
    if (v <= 0) return;
    const cx = 640;
    const base = 600;
    const h = 250;
    const w = 130;
    ctx.save();
    ctx.globalAlpha = v;
    A.glow(ctx, cx, base - 100, 170 + (open || 0) * 40, "rgba(255, 227, 155, 0.5)", 0.75);
    // страницы-створки
    for (let side of [-1, 1]) {
      ctx.save();
      ctx.translate(cx, base);
      ctx.scale(side, 1);
      const g = ctx.createLinearGradient(0, -h, 0, 0);
      g.addColorStop(0, "rgba(255, 249, 225, 0.96)");
      g.addColorStop(0.6, "rgba(224, 205, 240, 0.92)");
      g.addColorStop(1, "rgba(128, 109, 164, 0.92)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -h + 55);
      ctx.quadraticCurveTo(0, -h, 34, -h);
      ctx.lineTo(w / 2, -h + 8);
      ctx.lineTo(w / 2, -8);
      ctx.quadraticCurveTo(w / 4, 4, 0, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 238, 186, 0.55)";
      ctx.lineWidth = 1.4;
      // линии текста
      for (let i = 0; i < 7; i++) {
        ctx.beginPath();
        ctx.moveTo(10, -h + 34 + i * 24);
        ctx.quadraticCurveTo(30, -h + 30 + i * 24, 48, -h + 38 + i * 24);
        ctx.stroke();
      }
      ctx.restore();
    }
    // внутренний свет
    ctx.beginPath();
    ctx.moveTo(cx - w / 2 + 6, base);
    ctx.lineTo(cx - w / 2 + 6, base - h + 64);
    ctx.quadraticCurveTo(cx - w / 2 + 6, base - h + 10, cx, base - h + 10);
    ctx.quadraticCurveTo(cx + w / 2 - 6, base - h + 10, cx + w / 2 - 6, base - h + 64);
    ctx.lineTo(cx + w / 2 - 6, base);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, base - h, 0, base);
    g.addColorStop(0, "rgba(255, 248, 217, 0.96)");
    g.addColorStop(0.5, "rgba(255, 209, 142, 0.9)");
    g.addColorStop(1, "rgba(139, 103, 160, 0.92)");
    ctx.fillStyle = g;
    ctx.fill();
    // звёзды
    ctx.save();
    ctx.clip();
    for (let i = 0; i < 12; i++) {
      const a = t * 0.5 + i * 1.9;
      A.sparkle(ctx, cx + Math.cos(a) * 38, base - 100 + Math.sin(a) * 70, 2.2, "#fff7ce", 0.5, a);
    }
    ctx.restore();
    A.fillRR(ctx, cx - 70, base - 4, 140, 11, 5, "rgba(255, 235, 194, 0.5)");
    ctx.restore();
  }

  function drawElephantCloud(ctx, t, visible) {
    const v = clamp(visible || 0, 0, 1);
    if (v <= 0) return;
    ctx.save();
    ctx.globalAlpha = v;
    const bob = Math.sin(t * 1.5) * 4;
    A.drawCloud(ctx, 640, 280 + bob, 160, 68, "rgba(255, 247, 230, 0.9)", { shadow: true });
    A.drawToyElephant(ctx, 640, 285 + bob, 0.72, t);
    for (let i = 0; i < 5; i++) {
      const a = t + i * 1.3;
      A.sparkle(ctx, 640 + Math.cos(a) * 80, 270 + bob + Math.sin(a) * 42, 2.4, "#ffe7a8", 0.55, a);
    }
    ctx.restore();
  }

  // =======================================================================
  // СОН 2 — ОСТРОВ ПОТЕРЯННЫХ ДЕТАЛЕК ЛЕГО
  // =======================================================================

  const LEGO = {
    red: "#f1717b",
    coral: "#f59a82",
    orange: "#f5ad5f",
    yellow: "#f7d35f",
    lime: "#b8df6f",
    green: "#79cd9d",
    cyan: "#77d2d0",
    blue: "#62b4e8",
    navy: "#4f7fc0",
    purple: "#ad9be0",
    pink: "#f3a9c4",
    cream: "#fff0d4",
  };

  function legoStud(ctx, cx, cy, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 1.5, r, r * 0.62, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.28)";
    ctx.beginPath();
    ctx.ellipse(cx - r * 0.18, cy - r * 0.12, r * 0.68, r * 0.4, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "rgba(58, 48, 82, 0.16)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 1, r, r * 0.62, 0, 0, TAU);
    ctx.stroke();
  }

  function legoBrick(ctx, x, y, w, h, color, studs, opts) {
    const o = opts || {};
    const n = studs == null ? Math.max(1, Math.round(w / 34)) : studs;
    ctx.save();
    // Боковая грань.
    A.fillRR(ctx, x + 4, y + 5, w, h, 4, "rgba(62, 48, 84, 0.2)");
    // Сама деталька.
    A.fillRR(ctx, x, y, w, h, 4, color);
    // Верхний блик и нижняя тень.
    ctx.fillStyle = "rgba(255,255,255,0.27)";
    ctx.fillRect(x + 3, y + 3, Math.max(0, w - 6), 3);
    ctx.fillStyle = "rgba(52, 39, 77, 0.13)";
    ctx.fillRect(x + 3, y + h - 5, Math.max(0, w - 6), 4);
    ctx.strokeStyle = "rgba(63, 49, 85, 0.18)";
    ctx.lineWidth = 1.2;
    A.rr(ctx, x, y, w, h, 4);
    ctx.stroke();
    // Штырьки сверху.
    if (o.noStuds !== true) {
      for (let i = 0; i < n; i++) {
        const cx = x + (w / n) * (i + 0.5);
        legoStud(ctx, cx, y - 1, Math.min(6.5, w / n * 0.25), color);
      }
    }
    // Декоративная полоска-блик.
    if (o.shine !== false) {
      ctx.strokeStyle = "rgba(255,255,255,0.23)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(x + 7, y + 7);
      ctx.lineTo(x + Math.min(w - 7, 40), y + 7);
      ctx.stroke();
    }
    ctx.restore();
  }

  function legoBaseplate(ctx, x, y, w, colorA, colorB) {
    const g = ctx.createLinearGradient(0, y, 0, 720);
    g.addColorStop(0, colorA);
    g.addColorStop(0.45, colorB);
    g.addColorStop(1, "rgba(76, 73, 125, 0.96)");
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, 720 - y);
    // Верхний торец.
    ctx.fillStyle = "rgba(255,255,255,0.28)";
    ctx.fillRect(x, y, w, 5);
    ctx.fillStyle = "rgba(42, 38, 76, 0.2)";
    ctx.fillRect(x, y + 7, w, 4);
    // Штырьки по всей поверхности.
    for (let row = 0; row < 4; row++) {
      const yy = y + 17 + row * 28;
      const off = row % 2 ? 13 : 0;
      for (let xx = x + 18 + off; xx < x + w - 8; xx += 28) {
        legoStud(ctx, xx, yy, 6.4 - row * 0.5, "rgba(255, 250, 228, 0.2)");
      }
    }
    // Блик на кромке.
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 10, y + 1.5);
    ctx.lineTo(x + w - 10, y + 1.5);
    ctx.stroke();
  }

  function drawLegoTower(ctx, t, x, baseY, width, levels, palette, tilt) {
    ctx.save();
    let y = baseY;
    for (let i = 0; i < levels; i++) {
      const w = width - i * 6;
      const h = 29;
      const bx = x + (width - w) / 2 + Math.sin(i * 1.3 + x) * 2;
      y -= h;
      const color = palette[i % palette.length];
      if (tilt && i === levels - 1) {
        ctx.save();
        ctx.translate(bx + w / 2, y + h / 2);
        ctx.rotate(0.09);
        legoBrick(ctx, -w / 2, -h / 2, w, h, color, Math.max(2, Math.round(w / 32)));
        ctx.restore();
      } else {
        legoBrick(ctx, bx, y, w, h, color, Math.max(2, Math.round(w / 32)));
      }
    }
    // Недостроенная вершина: торчащие штырьки.
    const topW = width - (levels - 1) * 6;
    const topX = x + (width - topW) / 2;
    for (let i = 0; i < Math.max(2, Math.round(topW / 30)); i++) {
      legoStud(ctx, topX + (topW / Math.max(2, Math.round(topW / 30))) * (i + 0.5), y - 4, 6, palette[(levels + i) % palette.length]);
    }
    ctx.restore();
  }

  function drawLegoIsland(ctx, t) {
    // Небо.
    const sky = ctx.createLinearGradient(0, 0, 0, GROUND);
    sky.addColorStop(0, "#5cc5e5");
    sky.addColorStop(0.5, "#a7e1ee");
    sky.addColorStop(0.84, "#ffe3c7");
    sky.addColorStop(1, "#ffd0a9");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, GROUND);

    // Тёплое солнышко.
    const sx = 1090;
    const sy = 122;
    A.glow(ctx, sx, sy, 150, "rgba(255, 225, 153, 0.42)", 0.9);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * TAU + t * 0.04;
      ctx.strokeStyle = "rgba(255, 237, 171, 0.2)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(sx + Math.cos(a) * 83, sy + Math.sin(a) * 83);
      ctx.lineTo(sx + Math.cos(a) * 112, sy + Math.sin(a) * 112);
      ctx.stroke();
    }
    const sunG = ctx.createRadialGradient(sx - 20, sy - 25, 8, sx, sy, 70);
    sunG.addColorStop(0, "#fff9dd");
    sunG.addColorStop(0.7, "#ffe8a3");
    sunG.addColorStop(1, "#f6c66f");
    ctx.fillStyle = sunG;
    ctx.beginPath();
    ctx.arc(sx, sy, 68, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "rgba(162, 112, 56, 0.35)";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(sx - 22, sy - 7, 8, 0.25, Math.PI - 0.25);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(sx + 23, sy - 7, 8, 0.25, Math.PI - 0.25);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(sx, sy + 14, 16, 0.25, Math.PI - 0.3);
    ctx.stroke();

    // Облака.
    A.drawCloud(ctx, 250, 130, 260, 74, "rgba(255, 251, 240, 0.75)", { shine: false });
    A.drawCloud(ctx, 690, 90, 210, 62, "rgba(255, 251, 240, 0.65)", { shine: false });
    A.drawCloud(ctx, 480, 195, 160, 48, "rgba(255, 251, 240, 0.42)", { shine: false });

    // Дальние лего-башни.
    drawLegoTower(ctx, t, 24, 600, 110, 8, [LEGO.coral, LEGO.yellow, LEGO.blue, LEGO.green], true);
    drawLegoTower(ctx, t, 146, 600, 78, 4, [LEGO.purple, LEGO.cyan, LEGO.orange], false);
    drawLegoTower(ctx, t, 1168, 600, 112, 9, [LEGO.blue, LEGO.pink, LEGO.yellow, LEGO.green], true);
    drawLegoTower(ctx, t, 1012, 600, 64, 3, [LEGO.orange, LEGO.purple], false);

    // Базовая пластина слева и справа от пропасти.
    legoBaseplate(ctx, 0, GROUND, 380, "#90d9a7", "#64b98e");
    legoBaseplate(ctx, 620, GROUND, 660, "#86d4c2", "#57b7ad");

    // Пара приподнятых круглых штырьков-ступенек.
    for (const stud of [
      { x: 92, y: 596, r: 14, c: LEGO.yellow },
      { x: 704, y: 596, r: 12, c: LEGO.pink },
      { x: 1210, y: 596, r: 13, c: LEGO.green },
    ]) {
      ctx.save();
      A.softShadow(ctx, stud.x, stud.y + 4, stud.r * 1.2, 6, 0.16);
      A.fillRR(ctx, stud.x - stud.r, stud.y - 8, stud.r * 2, 13, 6, stud.c);
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.beginPath();
      ctx.ellipse(stud.x, stud.y - 9, stud.r * 0.75, 4, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    // Рассыпанные детальки.
    const loose = [
      { x: 300, y: 590, w: 34, h: 18, c: LEGO.red, rot: 0.2 },
      { x: 660, y: 588, w: 30, h: 16, c: LEGO.yellow, rot: -0.3 },
      { x: 980, y: 590, w: 38, h: 18, c: LEGO.blue, rot: 0.15 },
    ];
    for (const b of loose) {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.rot);
      legoBrick(ctx, -b.w / 2, -b.h / 2, b.w, b.h, b.c, 2);
      ctx.restore();
    }

    // Немного лего-искр в воздухе.
    for (let i = 0; i < 14; i++) {
      const x = 60 + seeded(i + 4100) * 1160;
      const y = 90 + seeded(i + 4200) * 320 + Math.sin(t * 0.8 + i) * 8;
      A.sparkle(ctx, x, y, 2.2 + (i % 3), ["#fff2b5", "#ffc5d7", "#c8f0ff"][i % 3], 0.38 + 0.25 * Math.sin(t + i), t + i);
    }
  }

  function drawLegoChasm(ctx, t, showBottomBrick) {
    const x1 = 380;
    const x2 = 620;
    const top = 588;
    // Тёмная глубина.
    const depth = ctx.createLinearGradient(0, top, 0, 720);
    depth.addColorStop(0, "#3b3766");
    depth.addColorStop(0.55, "#26264f");
    depth.addColorStop(1, "#141735");
    ctx.fillStyle = depth;
    ctx.fillRect(x1, top, x2 - x1, 720 - top);
    // Кирпичные стенки.
    for (const side of [0, 1]) {
      const wallX = side === 0 ? x1 : x2 - 26;
      ctx.fillStyle = side === 0 ? "rgba(122, 103, 158, 0.85)" : "rgba(104, 94, 150, 0.8)";
      for (let row = 0; row < 6; row++) {
        const yy = top + 6 + row * 22;
        const wide = side === 0 ? 26 : 26;
        A.fillRR(ctx, wallX, yy, wide, 19, 2, side === 0 ? (row % 2 ? "#6e5e91" : "#7c689e") : row % 2 ? "#64588a" : "#746697");
        ctx.strokeStyle = "rgba(255, 228, 190, 0.11)";
        ctx.lineWidth = 1;
        ctx.strokeRect(wallX + 2, yy + 2, wide - 4, 15);
      }
    }
    // Край пластины.
    ctx.fillStyle = "rgba(255, 246, 220, 0.4)";
    ctx.fillRect(x1 - 2, top - 3, 12, 5);
    ctx.fillRect(x2 - 10, top - 3, 12, 5);
    // Мягкое свечение снизу.
    A.glow(ctx, 500, 680, 90, "rgba(130, 219, 255, 0.14)", 0.8);
    if (showBottomBrick) {
      ctx.save();
      A.softShadow(ctx, 500, 708, 115, 12, 0.25);
      legoBrick(ctx, 390, 682, 220, 28, LEGO.blue, 6);
      ctx.restore();
      for (let i = 0; i < 4; i++) {
        A.sparkle(ctx, 430 + i * 45, 674 - Math.sin(t * 1.2 + i) * 4, 2.1, "#d9f5ff", 0.5, t + i);
      }
    }
    // Перильца-штырьки по краям.
    for (let i = 0; i < 6; i++) {
      legoStud(ctx, x1 + 8 + i * 42, top + 1, 5, "rgba(255, 240, 200, 0.35)");
      legoStud(ctx, x2 - 8 - i * 42, top + 1, 5, "rgba(255, 240, 200, 0.3)");
    }
  }

  function drawLegoBridge(ctx, t, progress) {
    if (progress <= 0) return;
    const p = A.clamp(progress, 0, 1);
    const w = 244 * A.easeOut(p);
    const x = 500 - w / 2;
    const y = 585;
    ctx.save();
    A.glow(ctx, 500, y + 5, 150, "rgba(130, 218, 255, 0.24)", 0.7);
    legoBrick(ctx, x, y - 5, w, 20, LEGO.blue, Math.max(2, Math.round(w / 34)));
    // Боковые защёлки.
    ctx.fillStyle = "rgba(255, 246, 205, 0.7)";
    ctx.beginPath();
    ctx.arc(x + 8, y + 12, 3, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + w - 8, y + 12, 3, 0, TAU);
    ctx.fill();
    if (p > 0.85) {
      for (let i = 0; i < 4; i++) {
        A.sparkle(ctx, 420 + i * 55, y - 16 - Math.sin(t * 2 + i) * 4, 2.4, "#e3f8ff", 0.55 + 0.25 * Math.sin(t * 3 + i), t + i);
      }
    }
    ctx.restore();
  }

  function drawSoapBubble(ctx, x, y, r, t, hueShift) {
    if (r <= 0) return;
    const hue = hueShift || 0;
    ctx.save();
    A.glow(ctx, x, y, r * 1.5, "rgba(196, 241, 255, 0.14)", 0.8);
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.05, x, y, r);
    g.addColorStop(0, "rgba(255, 255, 255, 0.08)");
    g.addColorStop(0.62, "rgba(208, 244, 255, 0.13)");
    g.addColorStop(0.88, "rgba(255, 195, 236, 0.2)");
    g.addColorStop(1, "rgba(154, 226, 255, 0.42)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();

    // Радужный ободок.
    const rim = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
    rim.addColorStop(0, "rgba(255, 171, 208, 0.85)");
    rim.addColorStop(0.28, "rgba(255, 224, 147, 0.9)");
    rim.addColorStop(0.52, "rgba(166, 239, 201, 0.85)");
    rim.addColorStop(0.76, "rgba(144, 221, 255, 0.95)");
    rim.addColorStop(1, "rgba(206, 168, 255, 0.85)");
    ctx.strokeStyle = rim;
    ctx.lineWidth = Math.max(1.4, r * 0.035);
    ctx.beginPath();
    ctx.arc(x, y, r - 1, 0, TAU);
    ctx.stroke();

    // Внутренние переливы.
    ctx.globalAlpha = 0.32;
    ctx.strokeStyle = "rgba(255, 230, 164, 0.8)";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.83, 2.7 + Math.sin(t * 0.6) * 0.1, 4.3);
    ctx.stroke();
    ctx.strokeStyle = "rgba(180, 170, 255, 0.75)";
    ctx.beginPath();
    ctx.arc(x, y, r * 0.92, 5.1, 6.14);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Блик.
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = Math.max(1.2, r * 0.045);
    ctx.beginPath();
    ctx.arc(x - r * 0.2, y - r * 0.23, r * 0.55, 3.45, 4.55);
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.beginPath();
    ctx.ellipse(x - r * 0.42, y - r * 0.42, r * 0.12, r * 0.06, -0.7, 0, TAU);
    ctx.fill();

    // Мыльные искорки.
    for (let i = 0; i < 4; i++) {
      const a = t * 0.9 + i * 1.6;
      A.sparkle(ctx, x + Math.cos(a) * r * 0.78, y + Math.sin(a) * r * 0.72, 1.8 + (i % 2), ["#ffffff", "#ffe2ac", "#c7ecff"][i % 3], 0.5 + 0.3 * Math.sin(t * 2 + i), a);
    }
    ctx.restore();
    void hue;
  }

  function drawBubbleJar(ctx, x, y, t) {
    const bob = Math.sin(t * 2) * 2;
    ctx.save();
    ctx.translate(x, y + bob);
    A.glow(ctx, 0, -12, 55, "rgba(184, 239, 255, 0.4)", 0.8);
    // Баночка.
    A.fillRR(ctx, -17, -32, 34, 42, 9, "rgba(218, 250, 255, 0.55)");
    A.fillRR(ctx, -13, -16, 26, 22, 8, "rgba(239, 160, 204, 0.72)");
    ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
    ctx.lineWidth = 1.4;
    A.rr(ctx, -17, -32, 34, 42, 9);
    ctx.stroke();
    A.fillRR(ctx, -11, -39, 22, 9, 4, "#f39ab9");
    A.fillRR(ctx, -8, -42, 16, 5, 2.5, "#ffd3e1");
    // Палочка для пузырей.
    ctx.strokeStyle = "#ffe9b7";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(12, -35);
    ctx.lineTo(22, -53);
    ctx.stroke();
    ctx.strokeStyle = "rgba(178, 235, 255, 0.9)";
    ctx.beginPath();
    ctx.arc(24, -56, 5, 0, TAU);
    ctx.stroke();
    // Пузырьки.
    for (let i = 0; i < 4; i++) {
      const a = t * 0.8 + i * 1.5;
      const bx = 18 + Math.cos(a) * (12 + i * 3);
      const by = -48 + Math.sin(a * 1.2) * (10 + i * 2);
      drawSoapBubble(ctx, bx, by, 4 + (i % 2) * 2.2, t + i);
    }
    // Блики на стекле.
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-12, -26);
    ctx.quadraticCurveTo(-15, -16, -11, -5);
    ctx.stroke();
    ctx.restore();
  }



  function drawLegoTrain(ctx, t, opts) {
    const o = opts || {};
    const repaired = !!o.repaired;
    const wheelOnRoof = !!o.wheelOnRoof;
    const x = 1020;
    const base = 600;
    ctx.save();
    A.softShadow(ctx, 1140, 603, 150, 18, 0.24);

    // Рельсы.
    ctx.strokeStyle = "rgba(86, 74, 103, 0.4)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(992, 598);
    ctx.lineTo(1276, 598);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255, 237, 190, 0.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(992, 594);
    ctx.lineTo(1276, 594);
    ctx.stroke();
    for (let i = 0; i < 9; i++) {
      ctx.strokeStyle = "rgba(95, 77, 107, 0.22)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(1000 + i * 32, 596);
      ctx.lineTo(1008 + i * 32, 610);
      ctx.stroke();
    }

    // Колёса.
    const wheels = [
      { x: 1064, y: 570, r: 24 },
      { x: 1132, y: 570, r: 24 },
      { x: 1214, y: 570, r: 24 },
    ];
    for (const w of wheels) {
      if (!repaired && w.x === 1064) {
        // Пустое место вместо потерянного колеса.
        ctx.fillStyle = "rgba(49, 43, 73, 0.55)";
        ctx.beginPath();
        ctx.arc(w.x, w.y, w.r - 3, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 236, 199, 0.26)";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(w.x, w.y, w.r + 2, 0, TAU);
        ctx.stroke();
        ctx.setLineDash([]);
        A.sparkle(ctx, w.x + 24, w.y - 24, 2.4, "#fff0b1", 0.7, t);
      } else {
        A.drawWheel(ctx, w.x, w.y, w.r / 23, repaired ? t * 2.2 : 0.2, "#eab34f", false);
      }
    }

    // Основание.
    legoBrick(ctx, 1020, 520, 240, 62, LEGO.navy, 7);
    legoBrick(ctx, 1034, 498, 196, 27, LEGO.blue, 6);

    // Передний котёл.
    A.fillRR(ctx, 1036, 392, 146, 126, 38, LEGO.red);
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    A.fillRR(ctx, 1044, 400, 126, 18, 9, "rgba(255,255,255,0.22)");
    ctx.fillStyle = "rgba(86, 42, 67, 0.16)";
    A.fillRR(ctx, 1042, 492, 132, 16, 8, "rgba(86, 42, 67, 0.16)");
    // Штырьки на котле.
    for (let i = 0; i < 4; i++) {
      legoStud(ctx, 1063 + i * 32, 393, 6.5, LEGO.red);
    }
    // Доброе лицо поезда.
    ctx.fillStyle = "#fff8e7";
    ctx.beginPath();
    ctx.ellipse(1069, 444, 9, 11, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(1106, 444, 9, 11, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#42374f";
    ctx.beginPath();
    ctx.arc(1071, 445, 4.2, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(1108, 445, 4.2, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(1069.5, 443, 1.4, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(1106.5, 443, 1.4, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "rgba(104, 52, 64, 0.7)";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(1088, 466, 15, 0.18, Math.PI - 0.18);
    ctx.stroke();
    ctx.fillStyle = "rgba(255, 196, 174, 0.35)";
    ctx.beginPath();
    ctx.ellipse(1053, 464, 7, 4, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(1122, 464, 7, 4, 0, 0, TAU);
    ctx.fill();
    // Фара.
    A.glow(ctx, 1038, 472, 22, "rgba(255, 237, 157, 0.55)", 0.8);
    ctx.fillStyle = "#ffeaa2";
    ctx.beginPath();
    ctx.arc(1039, 472, 8, 0, TAU);
    ctx.fill();

    // Кабина.
    A.fillRR(ctx, 1172, 350, 88, 172, 14, LEGO.yellow);
    ctx.fillStyle = "rgba(255,255,255,0.26)";
    A.fillRR(ctx, 1180, 358, 72, 14, 7, "rgba(255,255,255,0.26)");
    A.fillRR(ctx, 1185, 384, 58, 48, 10, "rgba(186, 236, 250, 0.75)");
    ctx.strokeStyle = "rgba(75, 67, 102, 0.35)";
    ctx.lineWidth = 2;
    A.rr(ctx, 1185, 384, 58, 48, 10);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(1187, 388);
    ctx.lineTo(1214, 427);
    ctx.stroke();
    // Дверца кабины.
    A.fillRR(ctx, 1191, 450, 48, 56, 8, "#e0b64f");
    ctx.fillStyle = "rgba(255, 246, 205, 0.55)";
    ctx.beginPath();
    ctx.arc(1229, 480, 3, 0, TAU);
    ctx.fill();

    // Крыша.
    legoBrick(ctx, 900, 330, 361, 22, LEGO.navy, 9, { noStuds: true });
    A.fillRR(ctx, 907, 333, 347, 6, 3, "rgba(255,255,255,0.28)");
    // Труба.
    A.fillRR(ctx, 1064, 286, 31, 54, 7, LEGO.navy);
    A.fillRR(ctx, 1059, 279, 41, 12, 5, "#3d3f70");
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    A.fillRR(ctx, 1069, 292, 8, 38, 4, "rgba(255,255,255,0.25)");

    // Дым.
    if (repaired) {
      for (let i = 0; i < 4; i++) {
        const age = ((t * 0.35 + i * 0.25) % 1);
        const sx = 1080 + Math.sin(t * 2 + i) * 12 + age * 34;
        const sy = 274 - age * 76;
        A.drawCloud(ctx, sx, sy, 30 + age * 26, 18 + age * 14, `rgba(255, 250, 241, ${0.55 * (1 - age)})`, { shine: false });
      }
      A.glow(ctx, 1080, 290, 44, "rgba(255, 228, 166, 0.25)", 0.7);
    }

    // Потерянное колесо на крыше.
    if (wheelOnRoof) {
      const bob = Math.sin(t * 2) * 3;
      A.glow(ctx, 1132, 290 + bob, 48, "rgba(255, 226, 141, 0.55)", 0.8);
      A.drawWheel(ctx, 1132, 288 + bob, 1.05, t * 0.5, "#f5c557", false);
      for (let i = 0; i < 4; i++) {
        A.sparkle(ctx, 1100 + i * 22, 260 + Math.sin(t * 2 + i) * 12, 2.3, "#fff1b6", 0.7, t + i);
      }
    }
    // Колесо на месте после ремонта.
    if (repaired) {
      A.drawWheel(ctx, 1091, 555, 0.78, t * 2.4, "#f5c557", false);
    }

    // Лего-штырьки на крыше.
    for (let i = 0; i < 10; i++) {
      legoStud(ctx, 917 + i * 34, 329, 5.5, LEGO.navy);
    }
    // Надпись.
    ctx.save();
    ctx.globalAlpha = 0.82;
    ctx.fillStyle = "#fff2c4";
    ctx.font = '700 11px "Comic Sans MS", "Segoe UI", sans-serif';
    ctx.textAlign = "center";
    ctx.fillText("ЛЕГО-ПОЕЗД", 1138, 512);
    ctx.restore();
    ctx.restore();
  }

  function drawSleepyCloud(ctx, t, cloud, bubbleActive) {
    const state = cloud.state || "sleepy";
    const x = cloud.x;
    const y = cloud.y;
    const wrapped = state === "wrapped";
    const pink = state === "turning" || state === "trampoline";
    ctx.save();
    if (!pink) {
      // Седая сонная тучка.
      A.drawCloud(ctx, x, y, 190, 84, "rgba(171, 180, 204, 0.96)", { shadow: true });
      ctx.fillStyle = "rgba(108, 110, 145, 0.22)";
      ctx.beginPath();
      ctx.ellipse(x - 18, y + 12, 48, 18, -0.15, 0, TAU);
      ctx.fill();
      // Лицо.
      ctx.strokeStyle = "#5d607e";
      ctx.lineWidth = 2.2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(x - 30, y - 7, 10, 0.15, Math.PI - 0.15);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x + 28, y - 7, 10, 0.15, Math.PI - 0.15);
      ctx.stroke();
      if (wrapped) {
        ctx.fillStyle = "#565a78";
        ctx.beginPath();
        ctx.arc(x - 29, y - 6, 4.5, 0, TAU);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 29, y - 6, 4.5, 0, TAU);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x, y + 18, 9, 12, 0, 0, TAU);
        ctx.fill();
      } else {
        ctx.fillStyle = "rgba(68, 66, 96, 0.62)";
        ctx.beginPath();
        ctx.ellipse(x, y + 17, 17, 11 + Math.sin(t * 1.4) * 2, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = "rgba(255, 173, 170, 0.25)";
        ctx.beginPath();
        ctx.ellipse(x - 42, y + 10, 10, 6, 0, 0, TAU);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + 46, y + 10, 10, 6, 0, 0, TAU);
        ctx.fill();
      }
      // Ночной колпак.
      ctx.fillStyle = "#8d84c0";
      ctx.beginPath();
      ctx.moveTo(x + 5, y - 38);
      ctx.quadraticCurveTo(x + 22, y - 72, x + 48, y - 57);
      ctx.quadraticCurveTo(x + 25, y - 52, x + 24, y - 32);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#fff0c2";
      ctx.beginPath();
      ctx.arc(x + 48, y - 57, 4, 0, TAU);
      ctx.fill();
      // Z-z-z.
      ctx.fillStyle = "rgba(94, 105, 147, 0.5)";
      ctx.font = '700 18px "Comic Sans MS", "Segoe UI", sans-serif';
      for (let i = 0; i < 3; i++) {
        const a = 0.45 - i * 0.11;
        ctx.globalAlpha = a + 0.1 * Math.sin(t * 1.7 + i);
        ctx.fillText("z", x + 82 + i * 14, y - 34 - i * 18 - ((t * 9 + i * 12) % 18));
      }
      ctx.globalAlpha = 1;
    } else {
      // Розовая тучка-батут.
      A.glow(ctx, x, y + 14, 120, "rgba(255, 196, 219, 0.35)", 0.8);
      A.drawCloud(ctx, x, y + 22, 194, 82, "rgba(255, 195, 215, 0.97)", { shadow: true });
      // Мягкая площадка.
      const pad = ctx.createLinearGradient(0, y - 8, 0, y + 18);
      pad.addColorStop(0, "#ffe0e9");
      pad.addColorStop(0.6, "#ffc2d5");
      pad.addColorStop(1, "#e996b4");
      A.fillRR(ctx, x - 72, y - 6, 144, 22, 11, pad);
      A.fillRR(ctx, x - 62, y - 3, 124, 6, 3, "rgba(255,255,255,0.5)");
      ctx.strokeStyle = "rgba(255,255,255,0.55)";
      ctx.setLineDash([5, 4]);
      A.rr(ctx, x - 65, y + 1, 130, 10, 5);
      ctx.stroke();
      ctx.setLineDash([]);
      // Лицо.
      ctx.strokeStyle = "#96657b";
      ctx.lineWidth = 2.2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(x - 28, y + 27, 8, Math.PI + 0.3, TAU - 0.3);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x + 28, y + 27, 8, Math.PI + 0.3, TAU - 0.3);
      ctx.stroke();
      ctx.strokeStyle = "#b06a84";
      ctx.beginPath();
      ctx.arc(x, y + 37, 13, 0.2, Math.PI - 0.2);
      ctx.stroke();
      ctx.fillStyle = "rgba(230, 123, 151, 0.42)";
      ctx.beginPath();
      ctx.ellipse(x - 43, y + 36, 9, 5, 0, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x + 45, y + 36, 9, 5, 0, 0, TAU);
      ctx.fill();
      // Пружинка-подсказка.
      ctx.strokeStyle = "rgba(255, 245, 220, 0.65)";
      ctx.lineWidth = 2;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(x + i * 18, y + 63);
        ctx.lineTo(x + i * 18, y + 53);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + i * 18 - 4, y + 56);
        ctx.lineTo(x + i * 18, y + 51);
        ctx.lineTo(x + i * 18 + 4, y + 56);
        ctx.stroke();
      }
      if (state === "trampoline") {
        for (let i = 0; i < 4; i++) {
          A.sparkle(ctx, x - 55 + i * 36, y - 20 + Math.sin(t * 2 + i) * 5, 2.2, "#fff0b5", 0.6, t + i);
        }
      }
    }
    if (bubbleActive) {
      drawSoapBubble(ctx, x, y, 94, t, 1);
    }
    ctx.restore();
  }

  function drawLegoDoor(ctx, t, visible, open) {
    const v = clamp(visible || 0, 0, 1);
    if (v <= 0.01) return;
    const x = 650;
    const base = 600;
    const w = 120;
    const top = 345;
    const o = clamp(open || 0, 0, 1);
    ctx.save();
    ctx.globalAlpha = v;
    const cx = x + w / 2;
    A.glow(ctx, cx, base - 110, 150 + o * 30, "rgba(189, 240, 255, 0.4)", 0.8);
    A.glow(ctx, cx, base - 110, 90, "rgba(255, 220, 154, 0.38)", 0.8);
    // Проём.
    ctx.beginPath();
    ctx.moveTo(x + 14, base);
    ctx.lineTo(x + 14, top + 68);
    ctx.quadraticCurveTo(x + 14, top + 18, cx, top + 18);
    ctx.quadraticCurveTo(x + w - 14, top + 18, x + w - 14, top + 68);
    ctx.lineTo(x + w - 14, base);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, top, 0, base);
    g.addColorStop(0, "rgba(255, 248, 216, 0.95)");
    g.addColorStop(0.45, "rgba(166, 230, 246, 0.9)");
    g.addColorStop(1, "rgba(177, 148, 226, 0.9)");
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    ctx.clip();
    for (let i = 0; i < 14; i++) {
      const a = t * 0.5 + i * 1.8;
      A.sparkle(ctx, cx + Math.cos(a) * (32 + (i % 4) * 9), base - 110 + Math.sin(a * 1.2) * 70, 2.2, i % 2 ? "#fff4c0" : "#d6f7ff", 0.45, a);
    }
    for (let i = 0; i < 5; i++) {
      drawSoapBubble(ctx, cx + Math.cos(t * 0.6 + i * 1.3) * (30 + i * 5), base - 150 + Math.sin(t * 0.9 + i) * 45, 8 + i * 2, t + i);
    }
    ctx.restore();
    // Кирпичная рама.
    const brickW = 18;
    for (let side of [0, 1]) {
      const bx = side === 0 ? x : x + w - brickW;
      for (let i = 0; i < 7; i++) {
        const col = [LEGO.blue, LEGO.yellow, LEGO.pink, LEGO.green][i % 4];
        legoBrick(ctx, bx, base - 28 - i * 31, brickW, 29, col, 1, { noStuds: i > 0 });
      }
    }
    // Арка из деталек.
    for (let i = 0; i < 5; i++) {
      const ang = Math.PI + (i / 4) * Math.PI;
      const ax = cx + Math.cos(ang) * 64;
      const ay = top + 68 + Math.sin(ang) * 54;
      ctx.save();
      ctx.translate(ax, ay);
      ctx.rotate(ang + Math.PI / 2);
      legoBrick(ctx, -17, -10, 34, 19, [LEGO.pink, LEGO.cream, LEGO.cyan][i % 3], 2);
      ctx.restore();
    }
    // Замок-сердечко.
    A.heart(ctx, cx, base - 92, 8, "#ffe7ad", 0.95, 0);
    // Надпись.
    ctx.globalAlpha = v * 0.9;
    ctx.fillStyle = "#fff7d7";
    ctx.font = '700 10px "Comic Sans MS", "Segoe UI", sans-serif';
    ctx.textAlign = "center";
    ctx.fillText("ВОЛШЕБНАЯ ДВЕРЬ", cx, top + 5);
    // Ступенька.
    A.fillRR(ctx, x - 4, base - 4, w + 8, 11, 5, "rgba(255, 232, 189, 0.5)");
    if (o > 0) {
      ctx.globalAlpha = v;
      A.glow(ctx, cx, base - 110, 180, "rgba(255, 242, 190, 0.28)", o);
    }
    ctx.restore();
  }

  function drawMiniTrain(ctx, x, y, s, t) {
    const scale = s || 1;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    A.softShadow(ctx, 0, 4, 55, 8, 0.18);
    // Колёса.
    A.drawWheel(ctx, -33, -7, 0.45, t, "#f0b84e", false);
    A.drawWheel(ctx, 0, -7, 0.45, t, "#f0b84e", false);
    A.drawWheel(ctx, 33, -7, 0.45, t, "#f0b84e", false);
    // Корпус.
    A.fillRR(ctx, -50, -39, 100, 28, 8, LEGO.navy);
    A.fillRR(ctx, -44, -52, 64, 18, 8, LEGO.red);
    A.fillRR(ctx, 22, -62, 27, 25, 6, LEGO.yellow);
    A.fillRR(ctx, -52, -64, 76, 11, 5, LEGO.navy);
    // Лицо.
    ctx.fillStyle = "#fff9e8";
    ctx.beginPath();
    ctx.arc(-29, -46, 4.5, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-13, -46, 4.5, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#40364e";
    ctx.beginPath();
    ctx.arc(-28, -46, 2.1, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-12, -46, 2.1, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "#855260";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(-21, -37, 6.5, 0.2, Math.PI - 0.2);
    ctx.stroke();
    // Труба и дым.
    A.fillRR(ctx, -18, -75, 11, 14, 3, LEGO.navy);
    for (let i = 0; i < 2; i++) {
      const a = (t * 0.5 + i * 0.4) % 1;
      A.drawCloud(ctx, -12 + a * 14, -82 - a * 22, 16 + a * 10, 10 + a * 6, `rgba(255, 250, 240, ${0.55 * (1 - a)})`, { shine: false });
    }
    ctx.restore();
  }

  function drawToyCar(ctx, x, y, s, t) {
    const scale = s || 1;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    A.softShadow(ctx, 0, 4, 48, 8, 0.2);
    // Колёса.
    A.drawWheel(ctx, -17, -6, 0.42, t, "#f2b84b", false);
    A.drawWheel(ctx, 17, -6, 0.42, t, "#f2b84b", false);
    // Кузов.
    A.fillRR(ctx, -31, -27, 62, 22, 8, "#e97878");
    A.fillRR(ctx, -20, -42, 35, 20, 7, "#f08d8d");
    A.fillRR(ctx, -16, -38, 26, 12, 4, "#bfe5f2");
    // Окошки.
    ctx.fillStyle = "rgba(255, 249, 224, 0.8)";
    A.fillRR(ctx, -12, -35, 8, 7, 2, "rgba(255, 249, 224, 0.8)");
    A.fillRR(ctx, 0, -35, 8, 7, 2, "rgba(255, 249, 224, 0.8)");
    // Фары и улыбка.
    ctx.fillStyle = "#ffe38a";
    ctx.beginPath();
    ctx.arc(28, -21, 3.5, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "#8c4b57";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(-8, -12, 6, 0.15, Math.PI - 0.15);
    ctx.stroke();
    ctx.restore();
  }

  // =======================================================================
  // СОН 4 — ПОЛЯНА ГИГАНТСКИХ КНИЖЕК-РАСКРАСОК
  // =======================================================================

  const COLORING_INK = "#55515c";
  const COLORING_PAPER = "#f8f5ea";
  const COLORING_PAPER_2 = "#ece8dc";

  function pencilHatch(ctx, x, y, w, h, alpha, gap) {
    ctx.save();
    ctx.strokeStyle = `rgba(82, 77, 90, ${alpha == null ? 0.16 : alpha})`;
    ctx.lineWidth = 1;
    const step = gap || 10;
    for (let i = -h; i < w; i += step) {
      ctx.beginPath();
      ctx.moveTo(x + i, y + h);
      ctx.lineTo(x + i + h, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawColoringWorld(ctx, t) {
    const paper = ctx.createLinearGradient(0, 0, 0, 720);
    paper.addColorStop(0, "#fbf8ef");
    paper.addColorStop(0.65, "#f4f0e4");
    paper.addColorStop(1, "#e6e1d4");
    ctx.fillStyle = paper;
    ctx.fillRect(0, 0, W, H);

    // Две огромные страницы раскрытой книги.
    ctx.fillStyle = "#f7f3e8";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(642, 0);
    ctx.lineTo(620, 720);
    ctx.lineTo(0, 720);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#f2eee2";
    ctx.beginPath();
    ctx.moveTo(642, 0);
    ctx.lineTo(W, 0);
    ctx.lineTo(W, 720);
    ctx.lineTo(664, 720);
    ctx.closePath();
    ctx.fill();

    // Корешок книги.
    const spine = ctx.createLinearGradient(610, 0, 674, 0);
    spine.addColorStop(0, "rgba(105, 96, 98, 0.14)");
    spine.addColorStop(0.5, "rgba(255, 250, 236, 0.15)");
    spine.addColorStop(1, "rgba(105, 96, 98, 0.2)");
    ctx.fillStyle = spine;
    ctx.fillRect(610, 0, 64, H);
    ctx.strokeStyle = "rgba(82, 77, 90, 0.26)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(614, 0);
    ctx.bezierCurveTo(600, 240, 628, 470, 612, H);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(670, 0);
    ctx.bezierCurveTo(684, 240, 656, 470, 672, H);
    ctx.stroke();

    // Линейки страниц.
    ctx.save();
    ctx.strokeStyle = "rgba(86, 81, 96, 0.09)";
    ctx.lineWidth = 1;
    for (let y = 105; y < 720; y += 34) {
      ctx.beginPath();
      ctx.moveTo(28, y);
      ctx.lineTo(590, y - 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(690, y - 2);
      ctx.lineTo(1250, y);
      ctx.stroke();
    }
    ctx.restore();

    // Загнутые уголки страниц.
    ctx.fillStyle = "#e9e4d6";
    ctx.strokeStyle = "rgba(82, 77, 90, 0.25)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(W - 96, 0);
    ctx.lineTo(W, 0);
    ctx.lineTo(W, 82);
    ctx.quadraticCurveTo(W - 42, 44, W - 96, 0);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(70, 0);
    ctx.quadraticCurveTo(22, 36, 0, 74);
    ctx.fill();
    ctx.stroke();

    // Дальний контурный лес.
    ctx.save();
    ctx.strokeStyle = "rgba(86, 81, 96, 0.28)";
    ctx.lineWidth = 1.4;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, 435);
    ctx.quadraticCurveTo(170, 380, 330, 425);
    ctx.quadraticCurveTo(500, 465, 650, 420);
    ctx.quadraticCurveTo(860, 365, 1030, 420);
    ctx.quadraticCurveTo(1170, 462, 1280, 422);
    ctx.stroke();
    ctx.setLineDash([]);
    for (const tx of [110, 190, 275]) {
      const th = 70 + (tx % 5) * 14;
      ctx.beginPath();
      ctx.moveTo(tx, 445);
      ctx.lineTo(tx, 445 - th);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(tx, 445 - th, 36, 0, TAU);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(tx - 25, 445 - th + 22, 24, 0, TAU);
      ctx.stroke();
    }
    // Домики-контуры.
    for (const hx of [350]) {
      ctx.strokeRect(hx, 452, 70, 48);
      ctx.beginPath();
      ctx.moveTo(hx - 8, 452);
      ctx.lineTo(hx + 35, 418);
      ctx.lineTo(hx + 78, 452);
      ctx.stroke();
      ctx.strokeRect(hx + 27, 470, 17, 30);
    }
    // Птички-галочки.
    for (let i = 0; i < 7; i++) {
      const bx = 760 + i * 58 + Math.sin(t * 0.2 + i) * 5;
      const by = 130 + (i % 3) * 38;
      ctx.beginPath();
      ctx.moveTo(bx - 8, by);
      ctx.quadraticCurveTo(bx - 3, by - 6, bx, by);
      ctx.quadraticCurveTo(bx + 3, by - 6, bx + 8, by);
      ctx.stroke();
    }
    ctx.restore();

    // Облака-контуры.
    ctx.save();
    ctx.strokeStyle = "rgba(86, 81, 96, 0.22)";
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 7]);
    for (const [cx, cy, rr] of [[250, 155, 45], [1010, 185, 38], [760, 240, 28]]) {
      ctx.beginPath();
      ctx.arc(cx, cy, rr, 0, TAU);
      ctx.arc(cx + rr * 0.85, cy - 8, rr * 0.6, 0, TAU);
      ctx.arc(cx + rr * 1.5, cy + 3, rr * 0.7, 0, TAU);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.restore();

    // Земля-страница.
    ctx.fillStyle = COLORING_PAPER;
    ctx.fillRect(0, GROUND, 430, 120);
    ctx.fillRect(760, GROUND, 520, 120);
    ctx.strokeStyle = "rgba(82, 77, 90, 0.3)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, GROUND);
    ctx.lineTo(430, GROUND);
    ctx.moveTo(760, GROUND);
    ctx.lineTo(W, GROUND);
    ctx.stroke();
    ctx.save();
    ctx.strokeStyle = "rgba(86, 81, 96, 0.12)";
    ctx.lineWidth = 1;
    for (let y = GROUND + 18; y < 720; y += 22) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(430, y);
      ctx.moveTo(760, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    ctx.restore();

    // Контурная трава и цветы.
    for (let i = 0; i < 26; i++) {
      const x = 20 + (i * 47) % 390;
      if (i % 3 === 0) continue;
      const hgt = 8 + (i % 4) * 4;
      ctx.strokeStyle = "rgba(82, 77, 90, 0.28)";
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(x, GROUND - 1);
      ctx.quadraticCurveTo(x - 4, GROUND - hgt * 0.6, x - 6, GROUND - hgt);
      ctx.moveTo(x, GROUND - 1);
      ctx.quadraticCurveTo(x + 4, GROUND - hgt * 0.7, x + 7, GROUND - hgt * 0.8);
      ctx.stroke();
    }
    for (let i = 0; i < 18; i++) {
      const x = 790 + (i * 53) % 460;
      const hgt = 9 + (i % 3) * 4;
      ctx.strokeStyle = "rgba(82, 77, 90, 0.28)";
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(x, GROUND - 1);
      ctx.quadraticCurveTo(x - 3, GROUND - hgt * 0.5, x - 6, GROUND - hgt);
      ctx.moveTo(x, GROUND - 1);
      ctx.quadraticCurveTo(x + 4, GROUND - hgt * 0.6, x + 6, GROUND - hgt * 0.9);
      ctx.stroke();
    }

    // Штриховка у краёв страниц.
    pencilHatch(ctx, 0, 0, 90, 150, 0.08, 12);
    pencilHatch(ctx, 1190, 0, 90, 140, 0.08, 12);
    pencilHatch(ctx, 0, 600, 80, 120, 0.1, 11);
    pencilHatch(ctx, 1200, 610, 80, 110, 0.1, 11);

    // Лёгкие карандашные искры.
    for (let i = 0; i < 12; i++) {
      const x = 100 + seeded(i + 7100) * 1080;
      const y = 90 + seeded(i + 7200) * 380 + Math.sin(t * 0.6 + i) * 6;
      ctx.strokeStyle = "rgba(82, 77, 90, 0.18)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - 3, y);
      ctx.lineTo(x + 3, y);
      ctx.moveTo(x, y - 3);
      ctx.lineTo(x, y + 3);
      ctx.stroke();
    }
  }

  function drawColoringLeftScenery(ctx, t, decor, glowTarget) {
    if (!decor || !decor.length) return;
    const lit = (d) => glowTarget && glowTarget.id === d.id;
    ctx.save();

    // Красная травка на левой поляне.
    const grass = decor.find((d) => d.kind === "grass");
    if (grass && grass.painted) {
      const gg = ctx.createLinearGradient(0, GROUND - 8, 0, GROUND + 55);
      gg.addColorStop(0, "rgba(255, 105, 110, 0.72)");
      gg.addColorStop(0.45, "rgba(255, 126, 120, 0.42)");
      gg.addColorStop(1, "rgba(255, 96, 105, 0.12)");
      ctx.fillStyle = gg;
      ctx.fillRect(0, GROUND - 8, 430, 66);
      for (let i = 0; i < 34; i++) {
        const x = 10 + i * 12.5;
        const h = 8 + (i % 4) * 4;
        const sway = Math.sin(t * 1.6 + i) * 2;
        ctx.strokeStyle = i % 2 ? "#ff8d86" : "#ffb08d";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(x, GROUND + 1);
        ctx.quadraticCurveTo(x + sway, GROUND - h * 0.6, x + sway * 1.4, GROUND - h);
        ctx.stroke();
      }
    }
    if (grass && lit(grass)) {
      A.glow(ctx, grass.focusX, grass.focusY, 120, "rgba(255, 226, 140, 0.35)", 0.7);
    }

    for (const d of decor) {
      if (d.kind === "tree" && d.painted) {
        const tx = d.x;
        const th = 70;
        ctx.fillStyle = "#9a7550";
        ctx.fillRect(tx - 5, d.y - th + 18, 10, 52);
        // Ветки.
        ctx.strokeStyle = "#8d6847";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(tx, d.y - th + 24);
        ctx.lineTo(tx - 20, d.y - th - 2);
        ctx.moveTo(tx, d.y - th + 30);
        ctx.lineTo(tx + 22, d.y - th + 2);
        ctx.stroke();
        ctx.fillStyle = "#6fc58b";
        ctx.beginPath();
        ctx.arc(tx, d.y - th, 35, 0, TAU);
        ctx.arc(tx - 26, d.y - th + 23, 24, 0, TAU);
        ctx.arc(tx + 25, d.y - th + 17, 26, 0, TAU);
        ctx.fill();
        ctx.fillStyle = "rgba(196, 245, 164, 0.55)";
        ctx.beginPath();
        ctx.arc(tx - 8, d.y - th - 10, 13, 0, TAU);
        ctx.fill();
      }
      if (d.kind === "house" && d.painted) {
        const hx = d.x;
        const hy = d.y;
        ctx.fillStyle = "#f4ca58";
        ctx.fillRect(hx, hy, 70, 48);
        ctx.fillStyle = "#e0a83e";
        ctx.beginPath();
        ctx.moveTo(hx - 8, hy);
        ctx.lineTo(hx + 35, hy - 34);
        ctx.lineTo(hx + 78, hy);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#fff2bd";
        ctx.fillRect(hx + 9, hy + 10, 14, 14);
        ctx.fillRect(hx + 47, hy + 10, 14, 14);
        ctx.fillStyle = "#a96b51";
        ctx.fillRect(hx + 27, hy + 27, 17, 21);
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.beginPath();
        ctx.arc(hx + 58, hy + 18, 3, 0, TAU);
        ctx.fill();
      }
      if (lit(d)) {
        const color = d.kind === "grass" ? "rgba(255, 226, 140, 0.35)" : d.painted ? "rgba(255, 244, 175, 0.3)" : "rgba(255, 238, 170, 0.28)";
        A.glow(ctx, d.focusX, d.focusY, d.kind === "grass" ? 110 : 62, color, 0.7);
      }
    }
    ctx.restore();
  }

  function drawColoringChasm(ctx, t) {
    const x1 = 430;
    const x2 = 760;
    const top = 588;
    const depth = ctx.createLinearGradient(0, top, 0, 720);
    depth.addColorStop(0, "#d8d3c5");
    depth.addColorStop(0.35, "#a8a39a");
    depth.addColorStop(1, "#5c5960");
    ctx.fillStyle = depth;
    ctx.fillRect(x1, top, x2 - x1, 720 - top);
    // Рваные края страницы.
    ctx.fillStyle = COLORING_PAPER;
    ctx.beginPath();
    ctx.moveTo(x1 - 8, top);
    for (let x = x1; x <= x2; x += 18) {
      ctx.lineTo(x, top + Math.sin(x * 0.09) * 7);
    }
    ctx.lineTo(x2 + 8, top);
    ctx.lineTo(x2 + 8, top - 10);
    ctx.lineTo(x1 - 8, top - 10);
    ctx.closePath();
    ctx.fill();
    // Штриховка темноты.
    pencilHatch(ctx, x1 + 18, top + 20, x2 - x1 - 36, 100, 0.22, 9);
    ctx.strokeStyle = "rgba(67, 63, 73, 0.6)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x1 - 8, top);
    for (let x = x1; x <= x2; x += 18) {
      ctx.lineTo(x, top + Math.sin(x * 0.09) * 7);
    }
    ctx.stroke();
    // Обрывки страниц по краям.
    for (let i = 0; i < 5; i++) {
      const y = top + 25 + i * 22;
      ctx.strokeStyle = "rgba(248, 245, 234, 0.28)";
      ctx.beginPath();
      ctx.moveTo(x1 + 8, y);
      ctx.quadraticCurveTo(x1 + 24, y + 8, x1 + 12, y + 31);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x2 - 8, y);
      ctx.quadraticCurveTo(x2 - 25, y + 9, x2 - 13, y + 33);
      ctx.stroke();
    }
    for (let i = 0; i < 4; i++) {
      A.sparkle(ctx, 470 + i * 79, 645 + Math.sin(t * 0.8 + i) * 8, 2, "rgba(252, 248, 236, 0.5)", 0.3, t + i);
    }
  }

  function drawColoringTree(ctx, t, painted, progress) {
    const trunkX = 784;
    const trunkTop = 330;
    ctx.save();
    if (!painted) {
      // Прозрачный контур.
      ctx.strokeStyle = "rgba(86, 81, 96, 0.38)";
      ctx.lineWidth = 2;
      ctx.setLineDash([7, 6]);
      ctx.beginPath();
      ctx.moveTo(trunkX, 600);
      ctx.quadraticCurveTo(770, 480, trunkX, 360);
      ctx.moveTo(trunkX, 600);
      ctx.quadraticCurveTo(802, 480, 790, 365);
      ctx.stroke();
      ctx.setLineDash([]);
      for (const [cx, cy, rr] of [[690, 286, 94], [770, 248, 108], [840, 300, 78]]) {
        ctx.beginPath();
        ctx.arc(cx, cy, rr, 0, TAU);
        ctx.stroke();
      }
      A.glow(ctx, 710, 290, 130, "rgba(102, 201, 138, 0.24)", 0.8);
      // Призрачная ветка через обрыв.
      ctx.setLineDash([8, 8]);
      ctx.strokeStyle = "rgba(86, 81, 96, 0.28)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(trunkX - 18, 568);
      ctx.quadraticCurveTo(590, 600, 430, 588);
      ctx.stroke();
      ctx.setLineDash([]);
      for (let i = 0; i < 5; i++) {
        A.sparkle(ctx, 640 + i * 24, 300 + Math.sin(t * 1.2 + i) * 10, 2.2, "#a9edb8", 0.5, t + i);
      }
      ctx.restore();
      return;
    }

    // Живое дерево.
    A.glow(ctx, 710, 290, 190, "rgba(86, 205, 125, 0.25)", 0.8);
    ctx.fillStyle = "#8a6248";
    ctx.strokeStyle = "#5c4a43";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(trunkX - 18, 600);
    ctx.quadraticCurveTo(766, 480, trunkX - 10, 360);
    ctx.lineTo(trunkX + 12, 360);
    ctx.quadraticCurveTo(802, 480, trunkX + 20, 600);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Ветви.
    ctx.strokeStyle = "#805a43";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(trunkX - 2, 420);
    ctx.quadraticCurveTo(744, 348, 706, 306);
    ctx.moveTo(trunkX + 6, 450);
    ctx.quadraticCurveTo(792, 380, 826, 330);
    ctx.stroke();
    // Крона.
    const canopy = [
      [688, 292, 92, "#6fce8e"],
      [766, 250, 108, "#58bd7b"],
      [842, 300, 78, "#78d397"],
      [756, 302, 80, "#4faa70"],
    ];
    for (const [cx, cy, rr, col] of canopy) {
      ctx.fillStyle = col;
      ctx.strokeStyle = "#3e8a5d";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, rr, 0, TAU);
      ctx.fill();
      ctx.stroke();
    }
    // Листья-кудри.
    ctx.strokeStyle = "rgba(238, 255, 223, 0.65)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 18; i++) {
      const a = i * 1.7;
      const cx = 760 + Math.cos(a) * (50 + (i % 4) * 16);
      const cy = 282 + Math.sin(a * 1.3) * (42 + (i % 3) * 12);
      ctx.beginPath();
      ctx.arc(cx, cy, 6 + (i % 3), 0.2, 2.6);
      ctx.stroke();
    }
    // Живой мост-ветка.
    const p = A.clamp(progress, 0, 1);
    if (p > 0) {
      const endX = 784 - 354 * A.easeOut(p);
      ctx.strokeStyle = "#876146";
      ctx.lineWidth = 25;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(trunkX - 6, 560);
      ctx.quadraticCurveTo(620, 602, endX, 585);
      ctx.stroke();
      ctx.strokeStyle = "#4faa70";
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.moveTo(trunkX - 6, 552);
      ctx.quadraticCurveTo(620, 592, endX, 576);
      ctx.stroke();
      // Листики на ветке.
      for (let i = 0; i < 8; i++) {
        const lx = A.lerp(760, endX, i / 7);
        const ly = 566 - Math.sin((i / 7) * Math.PI) * 16 + (i % 2) * 8;
        ctx.fillStyle = i % 2 ? "#8edea0" : "#6ccd88";
        ctx.beginPath();
        ctx.ellipse(lx, ly, 9, 4.5, -0.6, 0, TAU);
        ctx.fill();
      }
      for (let i = 0; i < 4; i++) {
        A.sparkle(ctx, 500 + i * 58, 548 - Math.sin(t * 1.6 + i) * 7, 2.3, "#c8f6c6", 0.55, t + i);
      }
    }
    ctx.restore();
  }

  function drawColoringSwing(ctx, t, state) {
    const s = state || {};
    const pivotX = 980;
    const pivotY = 530;
    ctx.save();
    // Ветка с яблоком.
    ctx.strokeStyle = "rgba(86, 81, 96, 0.5)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(1150, 300);
    ctx.quadraticCurveTo(1090, 220, 1070, 190);
    ctx.stroke();
    ctx.strokeStyle = "rgba(86, 81, 96, 0.25)";
    ctx.lineWidth = 1.3;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(1096 - i * 8, 236 + i * 13);
      ctx.lineTo(1084 - i * 8, 250 + i * 13);
      ctx.stroke();
    }
    // Стойка качелей.
    ctx.fillStyle = "rgba(248, 245, 234, 0.6)";
    ctx.strokeStyle = "rgba(86, 81, 96, 0.5)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pivotX - 16, 600);
    ctx.lineTo(pivotX - 8, pivotY);
    ctx.lineTo(pivotX + 8, pivotY);
    ctx.lineTo(pivotX + 16, 600);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, 9, 0, TAU);
    ctx.fillStyle = "#d9d3c5";
    ctx.fill();
    ctx.stroke();
    // Доска.
    ctx.save();
    ctx.translate(pivotX, pivotY);
    ctx.rotate(s.angle || 0);
    ctx.fillStyle = s.appleLanded ? "#d8b18c" : "#f4f0e5";
    ctx.strokeStyle = "rgba(86, 81, 96, 0.62)";
    ctx.lineWidth = 2;
    A.fillRR(ctx, -142, -8, 284, 17, 7, s.appleLanded ? "#d8b18c" : "#f4f0e5");
    A.rr(ctx, -142, -8, 284, 17, 7);
    ctx.stroke();
    ctx.strokeStyle = "rgba(86, 81, 96, 0.24)";
    ctx.lineWidth = 1;
    for (let i = -120; i < 130; i += 34) {
      ctx.beginPath();
      ctx.moveTo(i, -5);
      ctx.lineTo(i + 5, 5);
      ctx.stroke();
    }
    ctx.restore();

    // Яблоко.
    const ax = 1070;
    const ay = s.applePainted ? (s.appleY || 190) : 190;
    const appleR = 25;
    if (s.applePainted) {
      A.glow(ctx, ax, ay, 48, "rgba(255, 107, 107, 0.35)", 0.8);
      ctx.fillStyle = "#f26563";
      ctx.strokeStyle = "#a8444a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ax, ay, appleR, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "rgba(255, 196, 170, 0.5)";
      ctx.beginPath();
      ctx.ellipse(ax - 8, ay - 9, 6, 4, -0.5, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = "#6d7050";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ax + 1, ay - appleR);
      ctx.quadraticCurveTo(ax + 9, ay - appleR - 12, ax + 18, ay - appleR - 8);
      ctx.stroke();
      ctx.fillStyle = "#7fbe70";
      ctx.beginPath();
      ctx.ellipse(ax + 18, ay - appleR - 8, 7, 4, 0.4, 0, TAU);
      ctx.fill();
      if (!s.appleLanded) {
        for (let i = 0; i < 4; i++) {
          A.sparkle(ctx, ax - 30 + i * 20, ay + 30 + Math.sin(t * 3 + i) * 6, 2, "#ffd0b0", 0.55, t + i);
        }
      }
    } else {
      ctx.strokeStyle = "rgba(86, 81, 96, 0.42)";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.arc(ax, ay, appleR, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = "rgba(86, 81, 96, 0.3)";
      ctx.beginPath();
      ctx.moveTo(ax + 1, ay - appleR);
      ctx.quadraticCurveTo(ax + 9, ay - appleR - 12, ax + 18, ay - appleR - 8);
      ctx.stroke();
      A.glow(ctx, ax, ay, 40, "rgba(255, 107, 107, 0.2)", 0.7);
    }
    ctx.restore();
  }

  function drawColoringShelf(ctx, t) {
    ctx.save();
    // Полка-страница.
    ctx.fillStyle = "#e7e1d2";
    ctx.strokeStyle = "rgba(82, 77, 90, 0.45)";
    ctx.lineWidth = 2;
    A.fillRR(ctx, 1088, 298, 192, 16, 5, "#e7e1d2");
    A.rr(ctx, 1088, 298, 192, 16, 5);
    ctx.stroke();
    ctx.strokeStyle = "rgba(82, 77, 90, 0.32)";
    ctx.beginPath();
    ctx.moveTo(1098, 316);
    ctx.lineTo(1098, 390);
    ctx.moveTo(1270, 316);
    ctx.lineTo(1270, 390);
    ctx.stroke();
    // Раскрытая книга.
    ctx.fillStyle = "#f9f6ed";
    ctx.strokeStyle = "rgba(82, 77, 90, 0.55)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(1128, 300);
    ctx.quadraticCurveTo(1152, 210, 1200, 214);
    ctx.quadraticCurveTo(1248, 210, 1272, 300);
    ctx.quadraticCurveTo(1240, 292, 1200, 296);
    ctx.quadraticCurveTo(1160, 292, 1128, 300);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(1200, 214);
    ctx.quadraticCurveTo(1194, 254, 1200, 296);
    ctx.stroke();
    // Линии страницы.
    ctx.strokeStyle = "rgba(82, 77, 90, 0.12)";
    ctx.lineWidth = 1;
    for (let y = 232; y < 292; y += 10) {
      ctx.beginPath();
      ctx.moveTo(1138, y + 4);
      ctx.lineTo(1188, y);
      ctx.moveTo(1212, y);
      ctx.lineTo(1260, y + 4);
      ctx.stroke();
    }
    // Название книги.
    ctx.fillStyle = "rgba(86, 81, 96, 0.42)";
    ctx.font = '700 10px "Comic Sans MS", "Segoe UI", sans-serif';
    ctx.textAlign = "center";
    ctx.fillText("КНИГА СКАЗОК", 1200, 305);
    // Закладка.
    ctx.fillStyle = "#f0cdd1";
    ctx.strokeStyle = "rgba(160, 94, 108, 0.5)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(1244, 216);
    ctx.lineTo(1252, 248);
    ctx.lineTo(1238, 242);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawColoringBird(ctx, x, y, scale, t, awake, wingPhase) {
    const s = scale || 1;
    const wing = wingPhase || 0;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    if (awake) A.glow(ctx, 0, 35, 92, "rgba(90, 169, 255, 0.35)", 0.8);
    const body = awake ? "#63b4ff" : "#f4f1e8";
    const bodyDark = awake ? "#3f8ed8" : "#c8c3b8";
    const belly = awake ? "#d9f2ff" : "#fbf8ef";
    const ink = "rgba(72, 67, 80, 0.75)";
    // Хвост.
    ctx.fillStyle = bodyDark;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(42, 45);
    ctx.quadraticCurveTo(92, 28, 104, 52);
    ctx.quadraticCurveTo(78, 58, 62, 74);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Тело.
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.ellipse(0, 44, 58, 46, -0.05, 0, TAU);
    ctx.fill();
    ctx.stroke();
    // Живот.
    ctx.fillStyle = belly;
    ctx.beginPath();
    ctx.ellipse(-8, 55, 38, 30, 0.05, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "rgba(72, 67, 80, 0.35)";
    ctx.lineWidth = 1.4;
    ctx.stroke();
    // Крыло.
    ctx.save();
    ctx.translate(10, 36);
    ctx.rotate(-0.15 + wing * 0.25);
    ctx.fillStyle = awake ? "#3f8ed8" : "#e5e0d5";
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 42, 27, -0.4, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = awake ? "rgba(220, 246, 255, 0.6)" : "rgba(72, 67, 80, 0.3)";
    ctx.lineWidth = 1.3;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-24, -10 + i * 9);
      ctx.quadraticCurveTo(-2, -18 + i * 9, 22, -7 + i * 9);
      ctx.stroke();
    }
    ctx.restore();
    // Голова.
    ctx.fillStyle = body;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(-47, 8, 27, 0, TAU);
    ctx.fill();
    ctx.stroke();
    // Хохолок.
    ctx.fillStyle = awake ? "#ffd76e" : "#f0ece2";
    ctx.beginPath();
    ctx.moveTo(-55, -16);
    ctx.quadraticCurveTo(-55, -40, -42, -34);
    ctx.quadraticCurveTo(-40, -22, -34, -19);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Клюв.
    ctx.fillStyle = awake ? "#ffc44e" : "#e8e2d5";
    ctx.beginPath();
    ctx.moveTo(-70, 8);
    ctx.lineTo(-95, 17);
    ctx.lineTo(-68, 23);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Глаз.
    ctx.fillStyle = awake ? "#2f3b58" : "rgba(72, 67, 80, 0.55)";
    ctx.beginPath();
    ctx.arc(-57, 3, 4.2, 0, TAU);
    ctx.fill();
    if (awake) {
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(-58.4, 1.8, 1.4, 0, TAU);
      ctx.fill();
    }
    // Щёчка.
    if (awake) {
      ctx.fillStyle = "rgba(255, 150, 164, 0.35)";
      ctx.beginPath();
      ctx.ellipse(-48, 20, 8, 5, 0, 0, TAU);
      ctx.fill();
    }
    // Лапки.
    ctx.strokeStyle = awake ? "#e8a33d" : "rgba(72, 67, 80, 0.5)";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    for (const fx of [-20, 16]) {
      ctx.beginPath();
      ctx.moveTo(fx, 82);
      ctx.lineTo(fx - 4, 99);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(fx - 4, 99);
      ctx.lineTo(fx - 16, 102);
      ctx.moveTo(fx - 4, 99);
      ctx.lineTo(fx + 5, 102);
      ctx.stroke();
    }
    if (awake) {
      for (let i = 0; i < 5; i++) {
        A.sparkle(ctx, -80 + i * 34, -30 + Math.sin(t * 2 + i) * 12, 2.2, i % 2 ? "#fff0b8" : "#c8ecff", 0.55, t + i);
      }
    }
    ctx.restore();
  }

  function drawColoringPuddle(ctx, t, blue) {
    const x = 890;
    const y = 588;
    ctx.save();
    if (blue) A.glow(ctx, x, y, 72, "rgba(90, 169, 255, 0.35)", 0.8);
    ctx.fillStyle = blue ? "rgba(90, 169, 255, 0.82)" : "rgba(240, 236, 226, 0.45)";
    ctx.strokeStyle = "rgba(72, 67, 80, 0.55)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 52, y + 2);
    ctx.quadraticCurveTo(x - 45, y - 15, x - 15, y - 12);
    ctx.quadraticCurveTo(x + 14, y - 20, x + 32, y - 6);
    ctx.quadraticCurveTo(x + 58, y + 2, x + 39, y + 12);
    ctx.quadraticCurveTo(x + 10, y + 20, x - 20, y + 14);
    ctx.quadraticCurveTo(x - 45, y + 14, x - 52, y + 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    if (blue) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
      ctx.beginPath();
      ctx.ellipse(x - 18, y - 4, 14, 4, -0.2, 0, TAU);
      ctx.fill();
      for (let i = 0; i < 4; i++) {
        const a = t * 1.4 + i * 1.5;
        ctx.strokeStyle = "rgba(206, 242, 255, 0.55)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(x - 5 + Math.cos(a) * 22, y + Math.sin(a) * 3, 5 + i * 2, 0, TAU);
        ctx.stroke();
      }
      for (let i = 0; i < 4; i++) {
        A.sparkle(ctx, x - 35 + i * 23, y - 22 - Math.sin(t * 2 + i) * 6, 2, "#d6f2ff", 0.5, t + i);
      }
    } else {
      ctx.setLineDash([4, 5]);
      ctx.strokeStyle = "rgba(72, 67, 80, 0.35)";
      ctx.beginPath();
      ctx.arc(x, y - 4, 44, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  function drawColoringDoor(ctx, t, visible, open) {
    const v = clamp(visible || 0, 0, 1);
    if (v <= 0.01) return;
    const x = 930;
    const w = 180;
    const base = 600;
    const top = 285;
    ctx.save();
    ctx.globalAlpha = v;
    A.glow(ctx, x + w / 2, 455, 160, "rgba(255, 236, 183, 0.4)", 0.8);
    // Проём.
    ctx.beginPath();
    ctx.moveTo(x + 14, base);
    ctx.lineTo(x + 14, top + 54);
    ctx.quadraticCurveTo(x + 14, top, x + w / 2, top);
    ctx.quadraticCurveTo(x + w - 14, top, x + w - 14, top + 54);
    ctx.lineTo(x + w - 14, base);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, top, 0, base);
    g.addColorStop(0, "rgba(255, 250, 221, 0.95)");
    g.addColorStop(0.4, "rgba(186, 234, 255, 0.9)");
    g.addColorStop(1, "rgba(192, 165, 238, 0.92)");
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    ctx.clip();
    for (let i = 0; i < 18; i++) {
      const a = t * 0.4 + i * 1.4;
      A.sparkle(ctx, x + w / 2 + Math.cos(a) * (26 + (i % 4) * 10), 450 + Math.sin(a) * 95, 2.2, i % 2 ? "#fff0b0" : "#d8f4ff", 0.5, a);
    }
    ctx.restore();
    // Радужная рамка.
    const cols = ["#f28b8b", "#f7c86c", "#8ed6a0", "#79c8ee", "#b6a2e6"];
    ctx.lineWidth = 9;
    for (let i = 0; i < cols.length; i++) {
      ctx.strokeStyle = cols[i];
      ctx.globalAlpha = v * (0.55 + (open || 0) * 0.2);
      ctx.beginPath();
      ctx.moveTo(x + 5, base - 5);
      ctx.lineTo(x + 5, top + 55 - i * 2);
      ctx.quadraticCurveTo(x + 5, top + 5, x + w / 2, top + 5);
      ctx.quadraticCurveTo(x + w - 5, top + 5, x + w - 5, top + 55 - i * 2);
      ctx.lineTo(x + w - 5, base - 5);
      ctx.stroke();
    }
    ctx.globalAlpha = v;
    ctx.fillStyle = "rgba(255, 249, 224, 0.9)";
    ctx.font = '700 10px "Comic Sans MS", "Segoe UI", sans-serif';
    ctx.textAlign = "center";
    ctx.fillText("ДВЕРЬ СНА", x + w / 2, top - 14);
    ctx.restore();
  }

  function drawColorBubble(ctx, x, y, r, t, color) {
    if (r <= 0) return;
    const c = color || "rgba(220, 245, 255, 0.9)";
    ctx.save();
    A.glow(ctx, x, y, r * 1.5, "rgba(155, 225, 255, 0.2)", 0.8);
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.08, x, y, r);
    g.addColorStop(0, "rgba(255,255,255,0.15)");
    g.addColorStop(0.68, "rgba(240,252,255,0.2)");
    g.addColorStop(1, c);
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 0.95;
    ctx.strokeStyle = c;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(x - r * 0.2, y - r * 0.22, r * 0.55, 3.5, 4.6);
    ctx.stroke();
    // Капли краски внутри.
    ctx.fillStyle = c;
    for (let i = 0; i < 4; i++) {
      const a = t * 1.2 + i * 1.7;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.arc(x + Math.cos(a) * r * 0.4, y + Math.sin(a * 1.3) * r * 0.35, 2 + (i % 2), 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawMainMenuRoom(ctx, t, state) {
    const s = state || {};
    const lampColors = [
      { shade: "#ffd894", glow: "rgba(255, 215, 138, 0.5)", ambient: "rgba(255, 196, 115, 0.08)" },
      { shade: "#a8efd0", glow: "rgba(139, 233, 199, 0.46)", ambient: "rgba(120, 224, 190, 0.08)" },
      { shade: "#c8b6ff", glow: "rgba(186, 167, 255, 0.5)", ambient: "rgba(167, 143, 255, 0.09)" },
    ];
    const lamp = lampColors[(s.lamp || 0) % lampColors.length];

    // Вечерняя стена.
    const wall = ctx.createLinearGradient(0, 0, 0, 620);
    wall.addColorStop(0, "#171c40");
    wall.addColorStop(0.55, "#292b56");
    wall.addColorStop(1, "#3c365d");
    ctx.fillStyle = wall;
    ctx.fillRect(0, 0, W, 620);

    // Обои: редкие звёздочки и облачка.
    for (let i = 0; i < 28; i++) {
      const x = seeded(i + 8100) * W;
      const y = 38 + seeded(i + 8200) * 430;
      A.sparkle(ctx, x, y, 1.4 + (i % 3), "rgba(255, 239, 189, 0.18)", 0.28 + 0.12 * Math.sin(t * 0.7 + i), t + i);
    }
    A.drawCloud(ctx, 150, 90, 160, 48, "rgba(206, 202, 235, 0.08)", { shine: false });
    A.drawCloud(ctx, 1120, 120, 190, 54, "rgba(206, 202, 235, 0.07)", { shine: false });

    // Окно с ночным небом.
    const wx = 468;
    const wy = 164;
    const ww = 344;
    const wh = 258;
    A.glow(ctx, wx + ww / 2, wy + wh / 2, 230, "rgba(170, 201, 255, 0.16)", 0.7);
    A.fillRR(ctx, wx - 20, wy - 18, ww + 40, wh + 46, 28, "#56496d");
    A.fillRR(ctx, wx - 8, wy - 8, ww + 16, wh + 28, 20, "#756487");
    const sky = ctx.createLinearGradient(0, wy, 0, wy + wh);
    sky.addColorStop(0, "#111a45");
    sky.addColorStop(0.6, "#27376b");
    sky.addColorStop(1, "#4a568a");
    A.fillRR(ctx, wx, wy, ww, wh, 16, sky);
    // Луна.
    A.glow(ctx, wx + 228, wy + 72, 74, "rgba(255, 235, 173, 0.36)", 0.8);
    ctx.fillStyle = "#ffefb5";
    ctx.beginPath();
    ctx.arc(wx + 228, wy + 72, 35, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#f3d88d";
    ctx.beginPath();
    ctx.arc(wx + 240, wy + 62, 7, 0, TAU);
    ctx.arc(wx + 218, wy + 84, 4, 0, TAU);
    ctx.fill();
    // Звёзды.
    for (let i = 0; i < 22; i++) {
      const x = wx + 16 + seeded(i + 9100) * (ww - 32);
      const y = wy + 14 + seeded(i + 9200) * (wh - 46);
      A.sparkle(ctx, x, y, 1.2 + (i % 3) * 0.7, "#fff5c8", 0.4 + 0.28 * Math.sin(t * 1.3 + i), t + i);
    }
    // Далёкие крыши.
    ctx.fillStyle = "rgba(24, 29, 63, 0.82)";
    ctx.beginPath();
    ctx.moveTo(wx, wy + wh - 36);
    for (let i = 0; i < 8; i++) {
      const bx = wx + i * 44;
      ctx.lineTo(bx, wy + wh - 36 - (i % 3) * 14);
      ctx.lineTo(bx + 22, wy + wh - 48 - (i % 2) * 18);
      ctx.lineTo(bx + 44, wy + wh - 36 - (i % 3) * 8);
    }
    ctx.lineTo(wx + ww, wy + wh);
    ctx.lineTo(wx, wy + wh);
    ctx.closePath();
    ctx.fill();
    // Рама.
    ctx.strokeStyle = "rgba(255, 231, 190, 0.55)";
    ctx.lineWidth = 9;
    A.rr(ctx, wx, wy, ww, wh, 16);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255, 231, 190, 0.35)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(wx + ww / 2, wy);
    ctx.lineTo(wx + ww / 2, wy + wh);
    ctx.moveTo(wx, wy + wh / 2);
    ctx.lineTo(wx + ww, wy + wh / 2);
    ctx.stroke();
    // Шторы.
    ctx.fillStyle = "#6c4f72";
    ctx.strokeStyle = "rgba(255, 226, 186, 0.16)";
    ctx.lineWidth = 2;
    for (const side of [0, 1]) {
      const cx = side === 0 ? wx - 34 : wx + ww + 34;
      ctx.beginPath();
      ctx.moveTo(cx, wy - 24);
      ctx.bezierCurveTo(cx + (side ? 42 : -42), wy + 52, cx + (side ? 20 : -20), wy + 218, cx + (side ? 52 : -52), wy + wh + 22);
      ctx.lineTo(cx + (side ? 8 : -8), wy + wh + 26);
      ctx.bezierCurveTo(cx + (side ? -22 : 22), wy + 190, cx + (side ? -6 : 6), wy + 50, cx + (side ? -8 : 8), wy - 20);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    // Падающая звёздочка.
    if (s.starAt != null && t - s.starAt < 2.2 && t - s.starAt >= 0) {
      const p = (t - s.starAt) / 2.2;
      const sx = wx + 280 - p * 220;
      const sy = wy + 40 + p * 150;
      const alpha = 1 - p;
      ctx.save();
      ctx.globalAlpha = alpha;
      const trail = ctx.createLinearGradient(sx, sy, sx + 120, sy - 82);
      trail.addColorStop(0, "rgba(255, 240, 159, 0.75)");
      trail.addColorStop(1, "rgba(255, 240, 159, 0)");
      ctx.strokeStyle = trail;
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + 140, sy - 98);
      ctx.stroke();
      A.starPath(ctx, sx, sy, 13, 5, 5, t * 2);
      ctx.fillStyle = "#fff2af";
      ctx.fill();
      ctx.strokeStyle = "#e9b95d";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = "#8a6343";
      ctx.beginPath();
      ctx.arc(sx - 4, sy - 3, 1.4, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(sx + 4, sy - 3, 1.4, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = "#8a6343";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(sx, sy + 1, 4, 0.2, Math.PI - 0.2);
      ctx.stroke();
      ctx.restore();
    }

    // Пол.
    ctx.fillStyle = "#211b37";
    ctx.fillRect(0, 604, W, H - 604);
    const floor = ctx.createLinearGradient(0, 590, 0, H);
    floor.addColorStop(0, "#493b53");
    floor.addColorStop(1, "#241d34");
    ctx.fillStyle = floor;
    ctx.fillRect(0, 590, W, H - 590);
    ctx.strokeStyle = "rgba(255, 231, 190, 0.08)";
    for (let i = 0; i < 12; i++) {
      ctx.beginPath();
      ctx.moveTo(500 + i * 90, 590);
      ctx.lineTo(460 + i * 105, H);
      ctx.stroke();
    }

    // Ковёр в центре.
    ctx.save();
    A.softShadow(ctx, 640, 688, 310, 20, 0.24);
    const rug = ctx.createLinearGradient(0, 580, 0, 710);
    rug.addColorStop(0, "#8f6f91");
    rug.addColorStop(1, "#6f537d");
    A.fillRR(ctx, 348, 568, 584, 142, 60, rug);
    ctx.strokeStyle = "rgba(255, 228, 188, 0.26)";
    ctx.lineWidth = 5;
    A.rr(ctx, 360, 580, 560, 118, 50);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255, 222, 177, 0.13)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.arc(390 + i * 72, 640 + (i % 2) * 18, 16 + (i % 3) * 7, 0.2, Math.PI - 0.2);
      ctx.stroke();
    }
    ctx.restore();

    // Две кроватки: слева Илюша, справа Алиса.
    const drawBed = (bx, by, colorA, colorB, kind, childX, starColor, pokeAt) => {
      const bw = 320;
      ctx.save();
      A.softShadow(ctx, bx + bw / 2, by + 116, 180, 18, 0.28);
      // Изголовье.
      A.fillRR(ctx, bx - 18, by - 92, 30, 160, 13, "#5b4054");
      A.fillRR(ctx, bx + bw - 12, by - 92, 30, 160, 13, "#5b4054");
      A.fillRR(ctx, bx - 26, by - 106, bw + 52, 42, 18, "#725164");
      ctx.fillStyle = "rgba(255, 230, 185, 0.32)";
      for (let i = 0; i < 4; i++) {
        A.starPath(ctx, bx + 18 + i * 74, by - 84, 3.5, 1.4, 5, 0.2);
        ctx.fill();
      }
      // Матрас.
      A.fillRR(ctx, bx - 10, by + 12, bw + 20, 90, 22, "#d8c3ad");
      A.fillRR(ctx, bx, by + 20, bw, 55, 18, "#f1dfc9");
      // Подушка.
      A.fillRR(ctx, childX - 64, by + 4, 128, 34, 16, "#fff0d9");
      // Спящий ребёнок.
      drawSleepingChild(ctx, childX, by + 16, kind, t);
      // Одеяло поверх тела.
      const quilt = ctx.createLinearGradient(0, by + 30, 0, by + 108);
      quilt.addColorStop(0, colorA);
      quilt.addColorStop(1, colorB);
      ctx.beginPath();
      ctx.moveTo(bx - 6, by + 42);
      ctx.quadraticCurveTo(bx + bw / 2, by + 20, bx + bw + 8, by + 44);
      ctx.quadraticCurveTo(bx + bw + 18, by + 92, bx + bw - 2, by + 105);
      ctx.quadraticCurveTo(bx + bw / 2, by + 118, bx - 4, by + 104);
      ctx.quadraticCurveTo(bx - 16, by + 70, bx - 6, by + 42);
      ctx.closePath();
      ctx.fillStyle = quilt;
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 238, 207, 0.24)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.save();
      ctx.clip();
      for (let i = 0; i < 8; i++) {
        const sx = bx + 16 + seeded(i + bx) * (bw - 32);
        const sy = by + 50 + seeded(i + bx + 20) * 48;
        ctx.fillStyle = starColor;
        if (kind === "ilya") {
          A.starPath(ctx, sx, sy, 4, 1.5, 5, 0.2);
          ctx.fill();
        } else {
          A.heart(ctx, sx, sy, 3.4, starColor, 0.55, 0.1);
        }
      }
      ctx.restore();
      // Ножки.
      A.fillRR(ctx, bx + 12, by + 100, 20, 24, 7, "#503849");
      A.fillRR(ctx, bx + bw - 28, by + 100, 20, 24, 7, "#503849");
      // Сонные пузырьки при клике.
      if (pokeAt != null && t - pokeAt < 1.8 && t - pokeAt >= 0) {
        const p = (t - pokeAt) / 1.8;
        ctx.globalAlpha = 1 - p;
        ctx.fillStyle = "rgba(255, 246, 206, 0.85)";
        ctx.font = '700 15px "Comic Sans MS", "Segoe UI", sans-serif';
        for (let i = 0; i < 3; i++) {
          ctx.fillText("z", childX + 30 + i * 14, by - 18 - i * 16 - p * 20);
        }
        A.heart(ctx, childX - 48, by - 8 - p * 12, 7, "#ffc6d8", 0.65, -0.2);
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    };

    drawBed(16, 500, "#a9c9e8", "#6388b7", "ilya", 176, "rgba(255, 244, 203, 0.55)", s.pokeIlya);
    drawBed(944, 500, "#f4b2cb", "#cf7da2", "alisa", 1104, "rgba(255, 245, 218, 0.6)", s.pokeAlisa);

    // Тумбочка и ночник.
    A.fillRR(ctx, 338, 486, 92, 112, 12, "#654b5f");
    A.fillRR(ctx, 346, 498, 76, 28, 8, "#7b5b6e");
    A.fillRR(ctx, 346, 534, 76, 28, 8, "#7b5b6e");
    ctx.fillStyle = "#d4a663";
    ctx.beginPath();
    ctx.arc(384, 512, 2.5, 0, TAU);
    ctx.fill();
    // Лампа.
    A.glow(ctx, 384, 430, 105, lamp.glow, 0.85);
    A.fillRR(ctx, 380, 438, 7, 48, 3, "#b58c62");
    A.fillRR(ctx, 362, 420, 44, 8, 4, "#c69b6d");
    ctx.fillStyle = lamp.shade;
    ctx.beginPath();
    ctx.moveTo(346, 428);
    ctx.quadraticCurveTo(384, 382, 422, 428);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 250, 222, 0.65)";
    ctx.lineWidth = 1.4;
    ctx.stroke();
    // Тёплый свет от лампы.
    const ambient = ctx.createRadialGradient(384, 432, 8, 384, 432, 390);
    ambient.addColorStop(0, lamp.ambient);
    ambient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = ambient;
    ctx.fillRect(0, 0, W, H);

    // Гирлянда-флажки над кроватками.
    ctx.save();
    ctx.strokeStyle = "rgba(255, 228, 184, 0.3)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(48, 108);
    ctx.quadraticCurveTo(360, 140, 630, 116);
    ctx.quadraticCurveTo(900, 92, 1232, 122);
    ctx.stroke();
    const flagCols = ["#f39ab0", "#ffd47a", "#8ed7c1", "#b8aae8", "#f4b07e"];
    for (let i = 0; i < 15; i++) {
      const fx = 72 + i * 79;
      const fy = 112 + Math.sin((i / 14) * Math.PI) * 15;
      ctx.fillStyle = flagCols[i % flagCols.length];
      ctx.globalAlpha = 0.82;
      ctx.beginPath();
      ctx.moveTo(fx - 10, fy);
      ctx.lineTo(fx + 10, fy);
      ctx.lineTo(fx, fy + 18);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // Рамки на стене.
    const picture = (px, py, kind) => {
      A.fillRR(ctx, px - 5, py - 5, 118, 92, 10, "#7d5c72");
      A.fillRR(ctx, px, py, 108, 82, 7, "#cbb7cb");
      A.fillRR(ctx, px + 8, py + 8, 92, 66, 5, "#3f456f");
      if (kind === "moon") {
        ctx.fillStyle = "#ffe8a7";
        ctx.beginPath();
        ctx.arc(px + 54, py + 39, 19, 0, TAU);
        ctx.fill();
        A.sparkle(ctx, px + 28, py + 25, 2.2, "#fff4c2", 0.75, t);
        A.sparkle(ctx, px + 80, py + 54, 1.8, "#fff4c2", 0.6, t + 1);
      } else {
        ctx.fillStyle = "#a9d6ef";
        ctx.beginPath();
        ctx.moveTo(px + 16, py + 68);
        ctx.quadraticCurveTo(px + 48, py + 18, px + 88, py + 58);
        ctx.lineTo(px + 88, py + 68);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#ffe9a4";
        ctx.beginPath();
        ctx.arc(px + 30, py + 25, 7, 0, TAU);
        ctx.fill();
      }
    };
    picture(88, 205, "moon");
    picture(1074, 205, "rocket");

    // Полка с игрушками Илюши над левой кроваткой.
    A.fillRR(ctx, 76, 322, 172, 10, 5, "#685775");
    A.fillRR(ctx, 84, 332, 12, 28, 4, "#503f5e");
    A.fillRR(ctx, 228, 332, 12, 28, 4, "#503f5e");
    A.drawToyElephant(ctx, 124, 318, 0.3, t);
    drawToyCar(ctx, 196, 318, 0.34, t);
    A.sparkle(ctx, 218, 292, 4.5, "#a9d8ff", 0.6, t * 0.5);

    // Полка с игрушками над правой кроваткой.
    A.fillRR(ctx, 984, 322, 172, 10, 5, "#76566d");
    A.fillRR(ctx, 992, 332, 12, 28, 4, "#5d4059");
    A.fillRR(ctx, 1136, 332, 12, 28, 4, "#5d4059");
    A.drawToyBear(ctx, 1024, 318, 0.32, t);
    drawMiniTrain(ctx, 1080, 318, 0.3, t);
    A.heart(ctx, 1120, 300, 8, "#ffd3df", 0.6, 0.1);

    // Тапочки у кроватей.
    ctx.fillStyle = "#e9a8b8";
    ctx.beginPath();
    ctx.ellipse(70, 690, 24, 10, 0.15, 0, TAU);
    ctx.ellipse(122, 696, 24, 10, -0.1, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#a8cbe4";
    ctx.beginPath();
    ctx.ellipse(1178, 690, 24, 10, -0.15, 0, TAU);
    ctx.ellipse(1228, 696, 24, 10, 0.1, 0, TAU);
    ctx.fill();

    // Лёгкая виньетка.
    const vignette = ctx.createRadialGradient(640, 360, 220, 640, 360, 760);
    vignette.addColorStop(0, "rgba(7,9,24,0)");
    vignette.addColorStop(1, "rgba(7,9,24,0.44)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);
  }

  function drawStartScene(ctx, t) {
    // Ночь за окном и спальня.
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#11162f");
    bg.addColorStop(0.52, "#252a51");
    bg.addColorStop(1, "#45395b");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    drawStars(ctx, t, H);
    drawMoon(ctx, 1040, 148, 56, t);

    // Обои.
    ctx.save();
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = "#fff2cf";
    for (let i = 0; i < 60; i++) {
      const x = seeded(i + 1701) * W;
      const y = 70 + seeded(i + 1751) * 470;
      A.starPath(ctx, x, y, 3, 1.2, 5, i);
      ctx.fill();
    }
    ctx.restore();

    // Окно справа.
    const wx = 820;
    const wy = 82;
    const ww = 350;
    const wh = 350;
    ctx.save();
    ctx.fillStyle = "#3c3a60";
    ctx.beginPath();
    ctx.moveTo(wx - 26, wy + 100);
    ctx.quadraticCurveTo(wx - 26, wy - 22, wx + ww / 2, wy - 28);
    ctx.quadraticCurveTo(wx + ww + 26, wy - 22, wx + ww + 26, wy + 100);
    ctx.lineTo(wx + ww + 26, wy + wh);
    ctx.lineTo(wx - 26, wy + wh);
    ctx.closePath();
    ctx.fill();
    const sky = ctx.createLinearGradient(0, wy, 0, wy + wh);
    sky.addColorStop(0, "#0d1738");
    sky.addColorStop(0.55, "#243363");
    sky.addColorStop(1, "#5d5887");
    ctx.fillStyle = sky;
    ctx.beginPath();
    ctx.moveTo(wx, wy + 92);
    ctx.quadraticCurveTo(wx, wy, wx + ww / 2, wy);
    ctx.quadraticCurveTo(wx + ww, wy, wx + ww, wy + 92);
    ctx.lineTo(wx + ww, wy + wh);
    ctx.lineTo(wx, wy + wh);
    ctx.closePath();
    ctx.fill();
    ctx.save();
    ctx.clip();
    drawMoon(ctx, wx + ww * 0.58, wy + 132, 72, t);
    A.drawCloud(ctx, wx + 80, wy + 270, 260, 70, "rgba(177, 181, 220, 0.35)", { shine: false });
    A.drawCloud(ctx, wx + 260, wy + 300, 200, 56, "rgba(206, 186, 211, 0.26)", { shine: false });
    for (let i = 0; i < 12; i++) {
      const x = wx + seeded(i + 1801) * ww;
      const y = wy + seeded(i + 1851) * wh * 0.58;
      A.sparkle(ctx, x, y, 1.8, "#fff0be", 0.6, t + i);
    }
    ctx.restore();
    // переплёт
    ctx.strokeStyle = "#4c486f";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(wx + ww / 2, wy + 2);
    ctx.lineTo(wx + ww / 2, wy + wh);
    ctx.moveTo(wx, wy + wh * 0.5);
    ctx.lineTo(wx + ww, wy + wh * 0.5);
    ctx.stroke();
    // шторы
    for (const side of [-1, 1]) {
      ctx.save();
      const bx = side === -1 ? wx - 42 : wx + ww + 42;
      ctx.translate(bx, 0);
      ctx.scale(side === -1 ? 1 : -1, 1);
      const g = ctx.createLinearGradient(0, 80, 80, 0);
      g.addColorStop(0, "#8b5e76");
      g.addColorStop(1, "#644a6c");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, 74);
      ctx.bezierCurveTo(36, 160, 24, 310, 56, 450);
      ctx.quadraticCurveTo(20, 470, 0, 445);
      ctx.bezierCurveTo(-15, 330, 4, 190, -16, 82);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 224, 201, 0.13)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(18, 140);
      ctx.quadraticCurveTo(38, 250, 30, 380);
      ctx.stroke();
      A.fillRR(ctx, 5, 350, 34, 10, 5, "#d8ae76");
      ctx.restore();
    }
    // подоконник
    A.fillRR(ctx, wx - 50, wy + wh - 2, ww + 100, 24, 11, "#54496a");
    ctx.restore();

    // Пол.
    ctx.fillStyle = "#2b243f";
    ctx.fillRect(0, 610, W, H - 610);
    const floor = ctx.createLinearGradient(0, 600, 0, H);
    floor.addColorStop(0, "#4a3953");
    floor.addColorStop(1, "#241d35");
    ctx.fillStyle = floor;
    ctx.fillRect(0, 600, W, H - 600);
    ctx.strokeStyle = "rgba(255, 228, 188, 0.08)";
    for (let i = 0; i < 10; i++) {
      ctx.beginPath();
      ctx.moveTo(600 + i * 80, 600);
      ctx.lineTo(540 + i * 96, H);
      ctx.stroke();
    }

    // Кровать.
    const bedX = 650;
    const bedY = 500;
    const bedW = 590;
    ctx.save();
    A.softShadow(ctx, bedX + bedW / 2, 640, 300, 20, 0.3);
    // изголовье
    A.fillRR(ctx, bedX - 18, bedY - 74, 30, 190, 14, "#6f4d55");
    A.fillRR(ctx, bedX + bedW - 18, bedY - 74, 30, 190, 14, "#6f4d55");
    A.fillRR(ctx, bedX - 34, bedY - 86, bedW + 68, 48, 22, "#7c565b");
    // звёзды на изголовье
    ctx.fillStyle = "rgba(255, 226, 167, 0.38)";
    for (let i = 0; i < 7; i++) {
      A.starPath(ctx, bedX + 30 + i * 84, bedY - 63, 4, 1.6, 5, 0.2);
      ctx.fill();
    }
    // матрас
    A.fillRR(ctx, bedX - 24, bedY + 24, bedW + 48, 106, 28, "#f0dcc2");
    A.fillRR(ctx, bedX - 10, bedY + 40, bedW + 20, 76, 22, "#f8ead4");
    // одеяло
    const quilt = ctx.createLinearGradient(0, bedY + 35, 0, bedY + 150);
    quilt.addColorStop(0, "#b3c8de");
    quilt.addColorStop(0.5, "#89a6c9");
    quilt.addColorStop(1, "#647fa8");
    ctx.beginPath();
    ctx.moveTo(bedX - 20, bedY + 48);
    ctx.quadraticCurveTo(bedX + bedW / 2, bedY + 20, bedX + bedW + 22, bedY + 52);
    ctx.quadraticCurveTo(bedX + bedW + 34, bedY + 140, bedX + bedW + 8, bedY + 154);
    ctx.quadraticCurveTo(bedX + bedW / 2, bedY + 174, bedX - 18, bedY + 148);
    ctx.quadraticCurveTo(bedX - 34, bedY + 100, bedX - 20, bedY + 48);
    ctx.closePath();
    ctx.fillStyle = quilt;
    ctx.fill();
    // узор одеяла
    ctx.save();
    ctx.clip();
    ctx.fillStyle = "rgba(255, 248, 226, 0.36)";
    for (let i = 0; i < 12; i++) {
      const x = bedX + 20 + seeded(i + 1901) * (bedW - 40);
      const y = bedY + 62 + seeded(i + 1951) * 84;
      A.starPath(ctx, x, y, 5, 2, 5, 0.3);
      ctx.fill();
    }
    ctx.restore();
    // подушки
    A.fillRR(ctx, bedX + 30, bedY + 10, 190, 56, 24, "#fff2da");
    A.fillRR(ctx, bedX + 250, bedY + 6, 190, 56, 24, "#ffe8d4");
    // спящие дети
    drawSleepingChild(ctx, bedX + 122, bedY + 22, "ilya", t);
    drawSleepingChild(ctx, bedX + 346, bedY + 20, "alisa", t);
    // ножки кровати
    A.fillRR(ctx, bedX + 10, bedY + 150, 24, 26, 8, "#5b3f43");
    A.fillRR(ctx, bedX + bedW - 30, bedY + 150, 24, 26, 8, "#5b3f43");
    ctx.restore();

    // Тумбочка и ночник.
    ctx.save();
    A.fillRR(ctx, 620, 530, 88, 92, 12, "#6e4f56");
    A.fillRR(ctx, 628, 542, 72, 28, 8, "#836068");
    A.fillRR(ctx, 628, 578, 72, 28, 8, "#836068");
    ctx.fillStyle = "#dfb46d";
    ctx.beginPath();
    ctx.arc(664, 556, 2.5, 0, TAU);
    ctx.fill();
    // лампа
    A.fillRR(ctx, 660, 492, 6, 38, 3, "#b58c62");
    A.glow(ctx, 663, 474, 54, "rgba(255, 219, 135, 0.45)", 0.55);
    ctx.fillStyle = "#ffdf9d";
    ctx.beginPath();
    ctx.moveTo(635, 492);
    ctx.quadraticCurveTo(663, 454, 691, 492);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 247, 211, 0.5)";
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();

    // Окно: свет на полу.
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const beam = ctx.createLinearGradient(1000, 400, 900, 720);
    beam.addColorStop(0, "rgba(181, 196, 255, 0.16)");
    beam.addColorStop(1, "rgba(181, 196, 255, 0)");
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(880, 400);
    ctx.lineTo(1120, 400);
    ctx.lineTo(1240, 720);
    ctx.lineTo(760, 720);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Парящие сны-игрушки.
    const floatY = Math.sin(t * 0.8) * 10;
    drawDreamBubble(ctx, 835, 300 + floatY, 74, "bear", t);
    drawDreamBubble(ctx, 1010, 250 + Math.sin(t * 0.7 + 1) * 12, 82, "train", t);
    drawDreamBubble(ctx, 1170, 320 + Math.sin(t * 0.9 + 2) * 8, 66, "elephant", t);

    // «Z-z-z».
    ctx.save();
    ctx.fillStyle = "rgba(255, 240, 196, 0.3)";
    ctx.font = '700 22px "Comic Sans MS", sans-serif';
    for (let i = 0; i < 3; i++) {
      const a = 0.18 + 0.12 * Math.sin(t * 1.3 + i);
      ctx.globalAlpha = a;
      ctx.fillText("z", 880 + i * 15 + Math.sin(t + i) * 3, 455 - i * 20 - ((t * 8 + i * 14) % 20));
    }
    ctx.restore();

    // Мягкая дымка.
    A.drawCloud(ctx, 720, 680, 300, 72, "rgba(255, 238, 220, 0.12)", { shine: false });
    A.drawCloud(ctx, 1180, 690, 340, 80, "rgba(255, 238, 220, 0.1)", { shine: false });
    drawGrain(ctx);
  }

  function drawSleepingChild(ctx, x, y, kind, t) {
    const isIlya = kind === "ilya";
    const breathe = Math.sin(t * 1.25 + (isIlya ? 0 : 1.2)) * 1.2;
    ctx.save();
    ctx.translate(x, y + breathe);
    // волосы
    ctx.fillStyle = isIlya ? "#5f3b31" : "#74483d";
    ctx.beginPath();
    ctx.ellipse(0, 0, isIlya ? 31 : 28, isIlya ? 25 : 23, -0.08, 0, TAU);
    ctx.fill();
    // лицо
    ctx.fillStyle = isIlya ? "#f6c6a5" : "#f9cfb4";
    ctx.beginPath();
    ctx.ellipse(4, 3, isIlya ? 25 : 23, isIlya ? 21 : 20, -0.08, 0, TAU);
    ctx.fill();
    // чёлка
    ctx.fillStyle = isIlya ? "#5a382f" : "#6c4137";
    ctx.beginPath();
    ctx.moveTo(-20, -10);
    ctx.quadraticCurveTo(2, -33, 26, -13);
    ctx.quadraticCurveTo(8, -20, -2, -12);
    ctx.quadraticCurveTo(-11, -19, -20, -10);
    ctx.closePath();
    ctx.fill();
    // глазки закрыты
    ctx.strokeStyle = "#7d5549";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(-8, 1, 5, 0.15, Math.PI - 0.15);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(15, 1, 5, 0.15, Math.PI - 0.15);
    ctx.stroke();
    // реснички
    ctx.lineWidth = 1;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(-8 + i * 3.5, 6);
      ctx.lineTo(-9 + i * 3.5, 8.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(15 + i * 3.5, 6);
      ctx.lineTo(14 + i * 3.5, 8.5);
      ctx.stroke();
    }
    // улыбка
    ctx.strokeStyle = "#a46661";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(5, 9, 4, 0.2, Math.PI - 0.2);
    ctx.stroke();
    // румянец
    ctx.fillStyle = "rgba(235, 132, 128, 0.2)";
    ctx.beginPath();
    ctx.ellipse(-13, 8, 5, 3, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(21, 8, 4.5, 2.8, 0, 0, TAU);
    ctx.fill();
    if (isIlya) {
      ctx.fillStyle = "#5a382f";
      ctx.beginPath();
      ctx.moveTo(-2, -21);
      ctx.quadraticCurveTo(5, -31, 10, -20);
      ctx.quadraticCurveTo(4, -24, 0, -18);
      ctx.fill();
    } else {
      // хвостики
      ctx.fillStyle = "#6c4137";
      ctx.beginPath();
      ctx.ellipse(-26, 2, 7, 10, -0.3, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#f08ba8";
      ctx.beginPath();
      ctx.arc(-24, -6, 3, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawDreamBubble(ctx, x, y, r, toy, t) {
    ctx.save();
    ctx.translate(x, y);
    // мыльный пузырь
    const g = ctx.createRadialGradient(-r * 0.25, -r * 0.3, r * 0.1, 0, 0, r);
    g.addColorStop(0, "rgba(255, 251, 229, 0.13)");
    g.addColorStop(0.72, "rgba(203, 208, 255, 0.06)");
    g.addColorStop(1, "rgba(255, 245, 216, 0.15)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 241, 206, 0.22)";
    ctx.lineWidth = 1.3;
    ctx.stroke();
    // блик
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.beginPath();
    ctx.arc(-r * 0.22, -r * 0.26, r * 0.42, 3.5, 5.1);
    ctx.stroke();
    ctx.save();
    ctx.globalAlpha = 0.82;
    if (toy === "bear") A.drawToyBear(ctx, 0, r * 0.62, r / 64, t);
    else if (toy === "bunny") A.drawToyBunny(ctx, 0, r * 0.64, r / 68, t);
    else if (toy === "train") drawMiniTrain(ctx, 0, r * 0.66, r / 92, t);
    else A.drawToyElephant(ctx, 0, r * 0.64, r / 72, t);
    ctx.restore();
    ctx.restore();
  }

  function drawEndingScene(ctx, t) {
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#191f48");
    bg.addColorStop(0.55, "#3c3b72");
    bg.addColorStop(1, "#7e6285");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    drawStars(ctx, t, H);
    drawMoon(ctx, 1030, 170, 90, t);

    // Радуга из искорок.
    ctx.save();
    ctx.globalAlpha = 0.27;
    const cols = ["#ffd27a", "#ffb2c6", "#b9a7ff", "#9ed6ff", "#b8e3b0"];
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = cols[i];
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.arc(640, 660, 500 - i * 18, Math.PI * 1.06, Math.PI * 1.94);
      ctx.stroke();
    }
    ctx.restore();

    // Тёплое сияние у облачков с героями.
    A.glow(ctx, 220, 620, 230, "rgba(255, 228, 190, 0.16)", 0.8);
    A.glow(ctx, 1080, 625, 240, "rgba(255, 219, 177, 0.15)", 0.8);

    // Большое облако-основа и облачка по краям, чтобы центр оставался для слов.
    A.drawCloud(ctx, 640, 668, 660, 160, "rgba(255, 250, 241, 0.55)", { shadow: true });
    A.drawCloud(ctx, 210, 650, 390, 120, "rgba(255, 251, 244, 0.98)", { shadow: true });
    A.drawCloud(ctx, 1090, 652, 390, 120, "rgba(255, 251, 244, 0.98)", { shadow: true });

    // Илюша и Алиса обнимаются на левом облачке.
    const ilya = {
      kind: "ilya", x: 145, y: 546, w: 42, h: 94, dir: 1, vx: 0, onGround: true,
      animTime: 3.2, hugPose: 1, hasFlashlight: false, hasKey: false, flashlightOn: false,
    };
    const alisa = {
      kind: "alisa", x: 188, y: 568, w: 34, h: 72, dir: -1, vx: 0, onGround: true,
      animTime: 4.1, hugPose: 1, hasFlashlight: false, hasKey: false, flashlightOn: false,
    };
    A.drawCharacter(ctx, ilya, t);
    A.drawCharacter(ctx, alisa, t);
    A.heart(ctx, 185, 506, 15, "#ffb3c7", 0.95, -0.1);
    A.heart(ctx, 204, 484, 8, "#ffd9a0", 0.95, 0.15);

    // Игрушки на правом облачке.
    A.drawToyBear(ctx, 1000, 626, 0.7, t);
    drawMiniTrain(ctx, 1082, 630, 0.82, t);
    A.drawToyElephant(ctx, 1172, 630, 0.66, t);
    drawColoringBird(ctx, 1112, 487, 0.44, t, true, 0.4);
    A.sparkle(ctx, 1015, 548, 3.4, "#ffe6a7", 0.8, t);
    A.sparkle(ctx, 1100, 530, 2.6, "#ffd7e4", 0.8, t + 1);
    A.sparkle(ctx, 1185, 552, 3, "#d7c9ff", 0.8, t + 2);

    // Салют из искорок.
    for (let i = 0; i < 20; i++) {
      const a = t * 0.45 + i * 1.37;
      const x = 300 + (i * 67) % 700;
      const y = 120 + ((i * 53) % 300) + Math.sin(a) * 12;
      A.sparkle(ctx, x, y, 2 + (i % 4), ["#ffe7a2", "#ffc3d3", "#c8b7ff"][i % 3], 0.35 + 0.3 * Math.sin(t * 1.2 + i), a);
    }
    drawGrain(ctx);
  }

  function drawReward(ctx, toy, t) {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    ctx.clearRect(0, 0, w, h);
    const bg = ctx.createRadialGradient(w / 2, h * 0.52, 8, w / 2, h * 0.52, w * 0.6);
    bg.addColorStop(0, "rgba(255, 246, 218, 0.95)");
    bg.addColorStop(0.55, "rgba(255, 228, 186, 0.5)");
    bg.addColorStop(1, "rgba(255, 228, 186, 0)");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    // лучи
    ctx.save();
    ctx.translate(w / 2, h * 0.52);
    for (let i = 0; i < 12; i++) {
      ctx.rotate(TAU / 12);
      ctx.fillStyle = "rgba(255, 207, 120, 0.08)";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(130, -16);
      ctx.lineTo(130, 16);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    // облако
    A.drawCloud(ctx, w / 2, h * 0.79, 230, 66, "rgba(255, 248, 234, 0.96)", { shadow: true });
    const bob = Math.sin(t * 1.4) * 4;
    if (toy === "bear") A.drawToyBear(ctx, w / 2, h * 0.79 + bob, 1.55, t);
    else if (toy === "bunny") A.drawToyBunny(ctx, w / 2, h * 0.8 + bob, 1.65, t);
    else if (toy === "train") drawMiniTrain(ctx, w / 2, h * 0.79 + bob, 1.8, t);
    else if (toy === "bird") drawColoringBird(ctx, w / 2, h * 0.48 + bob, 1.05, t, true, 0.35);
    else A.drawToyElephant(ctx, w / 2, h * 0.81 + bob, 1.62, t);
    // искорки
    for (let i = 0; i < 10; i++) {
      const a = t * 0.8 + i * 0.9;
      const x = w / 2 + Math.cos(a) * (70 + (i % 4) * 20);
      const y = h * 0.48 + Math.sin(a * 1.2) * (48 + (i % 3) * 14);
      A.sparkle(ctx, x, y, 2 + (i % 3), "#ffdf8f", 0.45 + 0.3 * Math.sin(t * 2 + i), a);
    }
  }

  // -----------------------------------------------------------------------
  // Экспорт
  // -----------------------------------------------------------------------

  const Scenery = {
    drawGrain,
    drawVignette,
    drawDust,
    drawStars,
    drawMoon,
    drawSockRoom,
    drawBlanketRiver,
    drawBridge,
    drawSockMountain,
    drawWardrobe,
    drawButterflyDrawing,
    drawButterflyPlatform,
    drawMagicDoor,
    drawBearCloud,
    drawSockKeySpot,
    drawPillowRoom,
    drawPillowLedge,
    drawPillowTunnel,
    drawCloudShelf,
    drawStarButton,
    drawPillowBridgeStep,
    drawBunnyCloud,
    drawDoorPillow,
    drawLegoIsland,
    drawLegoChasm,
    drawLegoBridge,
    drawLegoTrain,
    drawSleepyCloud,
    drawLegoDoor,
    drawMiniTrain,
    drawSoapBubble,
    drawBubbleJar,
    legoBrick,
    LEGO,
    drawBookForest,
    drawShapePad,
    drawStoryBook,
    drawLanterns,
    drawBookPortal,
    drawElephantCloud,
    drawColoringWorld,
    drawColoringLeftScenery,
    drawColoringChasm,
    drawColoringTree,
    drawColoringSwing,
    drawColoringShelf,
    drawColoringBird,
    drawColoringPuddle,
    drawColoringDoor,
    drawColorBubble,
    drawMainMenuRoom,
    drawStartScene,
    drawEndingScene,
    drawReward,
    shapeColorHex,
    shapeColorRus,
    shapeRus,
    GROUND,
  };

  VO.Scenery = Scenery;
})();
