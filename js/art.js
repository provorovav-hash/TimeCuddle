/* ==========================================================================
   ВремяОбнимашки — художественные примитивы, герои и игрушки
   Мягкая «пластилиновая» графика, нарисованная кодом.
   ========================================================================== */

(function () {
  "use strict";

  const VO = (window.VO = window.VO || {});
  const TAU = Math.PI * 2;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  function rr(ctx, x, y, w, h, r) {
    const rad = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.arcTo(x + w, y, x + w, y + h, rad);
    ctx.arcTo(x + w, y + h, x, y + h, rad);
    ctx.arcTo(x, y + h, x, y, rad);
    ctx.arcTo(x, y, x + w, y, rad);
    ctx.closePath();
  }

  function fillRR(ctx, x, y, w, h, r, fill) {
    rr(ctx, x, y, w, h, r);
    ctx.fillStyle = fill;
    ctx.fill();
  }

  function strokeRR(ctx, x, y, w, h, r, stroke, width) {
    rr(ctx, x, y, w, h, r);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width || 1;
    ctx.stroke();
  }

  function starPath(ctx, cx, cy, outer, inner, points, rot) {
    const n = points || 5;
    const r = rot || 0;
    ctx.beginPath();
    for (let i = 0; i < n * 2; i++) {
      const radius = i % 2 === 0 ? outer : inner;
      const a = (i * Math.PI) / n - Math.PI / 2 + r;
      const x = cx + Math.cos(a) * radius;
      const y = cy + Math.sin(a) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  function heartPath(ctx, cx, cy, s) {
    ctx.beginPath();
    ctx.moveTo(cx, cy + s * 0.72);
    ctx.bezierCurveTo(cx - s * 1.18, cy - s * 0.05, cx - s * 0.66, cy - s * 0.92, cx, cy - s * 0.34);
    ctx.bezierCurveTo(cx + s * 0.66, cy - s * 0.92, cx + s * 1.18, cy - s * 0.05, cx, cy + s * 0.72);
    ctx.closePath();
  }

  function shapePath(ctx, shape, cx, cy, size) {
    ctx.beginPath();
    switch (shape) {
      case "circle":
        ctx.arc(cx, cy, size, 0, TAU);
        break;
      case "triangle":
        ctx.moveTo(cx, cy - size);
        ctx.lineTo(cx + size * 0.94, cy + size * 0.72);
        ctx.lineTo(cx - size * 0.94, cy + size * 0.72);
        ctx.closePath();
        break;
      case "square":
        rr(ctx, cx - size * 0.85, cy - size * 0.85, size * 1.7, size * 1.7, size * 0.18);
        break;
      case "star":
        starPath(ctx, cx, cy, size, size * 0.45, 5, -0.08);
        break;
      case "heart":
        heartPath(ctx, cx, cy + size * 0.04, size * 0.86);
        break;
      case "diamond":
        ctx.moveTo(cx, cy - size);
        ctx.lineTo(cx + size * 0.82, cy);
        ctx.lineTo(cx, cy + size);
        ctx.lineTo(cx - size * 0.82, cy);
        ctx.closePath();
        break;
      case "hexagon":
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * TAU - Math.PI / 2;
          const x = cx + Math.cos(a) * size;
          const y = cy + Math.sin(a) * size;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        break;
      default:
        ctx.arc(cx, cy, size, 0, TAU);
    }
  }

  function glow(ctx, x, y, radius, color, alpha) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, Math.max(1, radius));
    g.addColorStop(0, color);
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.save();
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function softShadow(ctx, x, y, rx, ry, alpha) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, Math.max(rx, ry));
    g.addColorStop(0, `rgba(25, 24, 58, ${alpha == null ? 0.22 : alpha})`);
    g.addColorStop(1, "rgba(25, 24, 58, 0)");
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, ry / Math.max(0.001, rx));
    ctx.translate(-x, -y);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, rx, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function cloudPath(ctx, cx, cy, w, h) {
    const l = cx - w / 2;
    const b = cy + h * 0.28;
    ctx.beginPath();
    ctx.moveTo(l + w * 0.08, b);
    ctx.bezierCurveTo(l - w * 0.02, b - h * 0.16, l + w * 0.05, b - h * 0.4, l + w * 0.2, b - h * 0.36);
    ctx.bezierCurveTo(l + w * 0.2, b - h * 0.74, l + w * 0.47, b - h * 0.82, l + w * 0.56, b - h * 0.5);
    ctx.bezierCurveTo(l + w * 0.7, b - h * 0.7, l + w * 0.95, b - h * 0.3, l + w * 0.9, b - h * 0.02);
    ctx.bezierCurveTo(l + w * 0.98, b + h * 0.16, l + w * 0.78, b + h * 0.34, l + w * 0.66, b + h * 0.22);
    ctx.bezierCurveTo(l + w * 0.48, b + h * 0.4, l + w * 0.18, b + h * 0.38, l + w * 0.08, b);
    ctx.closePath();
  }

  function drawCloud(ctx, cx, cy, w, h, color, opts) {
    const o = opts || {};
    ctx.save();
    if (o.shadow) softShadow(ctx, cx, cy + h * 0.36, w * 0.42, h * 0.19, 0.12);
    cloudPath(ctx, cx, cy, w, h);
    ctx.fillStyle = color || "#fff8ec";
    ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
    ctx.fill();
    if (o.outline) {
      ctx.strokeStyle = o.outline;
      ctx.lineWidth = o.lineWidth || 2;
      ctx.stroke();
    }
    // Мягкий блик сверху.
    if (o.shine !== false) {
      const g = ctx.createLinearGradient(cx, cy - h * 0.55, cx, cy + h * 0.25);
      g.addColorStop(0, "rgba(255,255,255,0.7)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      cloudPath(ctx, cx, cy - h * 0.035, w * 0.9, h * 0.82);
      ctx.fillStyle = g;
      ctx.globalAlpha = 0.38 * (o.alpha == null ? 1 : o.alpha);
      ctx.fill();
    }
    ctx.restore();
  }

  // -----------------------------------------------------------------------
  // Герои
  // -----------------------------------------------------------------------

  function limb(ctx, x1, y1, angle, len, width, color) {
    const x2 = x1 + Math.sin(angle) * len;
    const y2 = y1 + Math.cos(angle) * len;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
    return { x: x2, y: y2 };
  }

  function drawIlyaLeg(ctx, hipX, hipY, angle, back) {
    const foot = limb(ctx, hipX, hipY, angle, 27, 11, back ? "#4e7da8" : "#5f92bf");
    ctx.save();
    ctx.translate(foot.x, foot.y);
    ctx.rotate(angle * 0.4);
    fillRR(ctx, -7, -4, 18, 9, 5, back ? "#a8d8c4" : "#c4ead8");
    fillRR(ctx, -5, -3.5, 15, 4, 2, "rgba(255,255,255,0.38)");
    ctx.restore();
  }

  function drawAlisaLeg(ctx, hipX, hipY, angle, back) {
    const foot = limb(ctx, hipX, hipY, angle, 18, 9, back ? "#c77f9d" : "#e095b1");
    ctx.save();
    ctx.translate(foot.x, foot.y);
    ctx.rotate(angle * 0.4);
    fillRR(ctx, -6, -3, 15, 7, 4, back ? "#f2c8d4" : "#ffe0e8");
    fillRR(ctx, -4, -2.5, 12, 3, 1.5, "rgba(255,255,255,0.45)");
    ctx.restore();
  }

  function arm(ctx, shoulderX, shoulderY, angle, len, back, kind) {
    const sleeve = kind === "ilya" ? (back ? "#5d9acb" : "#76b4df") : back ? "#d98cae" : "#efa4be";
    const skin = kind === "ilya" ? "#f3c3a1" : "#f8cfb4";
    const hand = limb(ctx, shoulderX, shoulderY, angle, len, kind === "ilya" ? 9.5 : 7.5, sleeve);
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(hand.x, hand.y, kind === "ilya" ? 5 : 4.1, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "rgba(70,45,55,0.12)";
    ctx.lineWidth = 1;
    ctx.stroke();
    return hand;
  }

  function drawIlyaBody(ctx, p, t) {
    const air = !p.onGround;
    const speed = Math.abs(p.vx || 0);
    const walk = speed > 18 && !air ? Math.sin((p.animTime || 0) * 12.5) : 0;
    const bob = speed > 18 && !air ? Math.abs(Math.sin((p.animTime || 0) * 12.5)) * 1.8 : Math.sin(t * 1.6) * 0.8;
    const hug = clamp(p.hugPose || 0, 0, 1);
    const push = !!p.pushing;
    const legA = air ? -0.52 : walk * 0.58;
    const legB = air ? 0.38 : -walk * 0.5;

    ctx.save();
    ctx.translate(0, -bob);
    if (hug > 0) ctx.rotate(0.035 * hug);

    // Ноги
    drawIlyaLeg(ctx, -8, -31, legA, true);
    drawIlyaLeg(ctx, 8, -31, legB, false);

    // Задняя рука
    arm(ctx, -13, -60, air ? -1.7 : -0.34 - walk * 0.45 + (hug > 0.1 ? 1.15 * hug : 0), 21, true, "ilya");

    // Пижама
    const bodyGrad = ctx.createLinearGradient(0, -68, 0, -30);
    bodyGrad.addColorStop(0, hug > 0 ? "#9dccf0" : "#88c3e9");
    bodyGrad.addColorStop(1, "#5f9dcd");
    ctx.beginPath();
    ctx.moveTo(-14, -68);
    ctx.quadraticCurveTo(-19, -66, -19, -57);
    ctx.quadraticCurveTo(-19, -40, -16, -33);
    ctx.quadraticCurveTo(0, -29, 17, -33);
    ctx.quadraticCurveTo(20, -44, 19, -57);
    ctx.quadraticCurveTo(18, -66, 14, -68);
    ctx.closePath();
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    ctx.strokeStyle = "rgba(48, 65, 105, 0.22)";
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Воротник и пуговицы
    ctx.beginPath();
    ctx.moveTo(-8, -68);
    ctx.quadraticCurveTo(0, -60, 8, -68);
    ctx.lineTo(4, -71);
    ctx.quadraticCurveTo(0, -67, -4, -71);
    ctx.closePath();
    ctx.fillStyle = "#fff4df";
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(0, -52 + i * 7, 1.3, 0, TAU);
      ctx.fill();
    }

    // Звёздочки на пижаме
    ctx.save();
    ctx.fillStyle = "rgba(255, 249, 220, 0.82)";
    starPath(ctx, -9, -48, 3.1, 1.4, 5, 0.2);
    ctx.fill();
    starPath(ctx, 10, -39, 2.4, 1.1, 5, -0.3);
    ctx.fill();
    starPath(ctx, 8, -55, 2.4, 1.1, 5, 0.5);
    ctx.fill();
    ctx.restore();

    // Карман
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 1.4;
    rr(ctx, 5, -49, 9, 8, 2.5);
    ctx.stroke();

    // Шея
    fillRR(ctx, -6, -72, 12, 8, 4, "#edb894");

    // Голова
    ctx.save();
    ctx.translate(1, 0);
    // волосы сзади
    ctx.fillStyle = "#684338";
    ctx.beginPath();
    ctx.ellipse(-1, -84, 18, 17.5, -0.06, 0, TAU);
    ctx.fill();
    // уши
    ctx.fillStyle = "#f1bd97";
    ctx.beginPath();
    ctx.ellipse(-14.5, -82, 4, 5, -0.2, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(17.5, -82, 3.8, 4.6, 0.2, 0, TAU);
    ctx.fill();
    // лицо
    const faceGrad = ctx.createLinearGradient(0, -98, 0, -68);
    faceGrad.addColorStop(0, "#facbaa");
    faceGrad.addColorStop(1, "#f0b58f");
    ctx.fillStyle = faceGrad;
    ctx.beginPath();
    ctx.ellipse(1, -82, 15.4, 16.2, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "rgba(120,70,55,0.13)";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Причёска — мягкая чёлка
    ctx.fillStyle = "#5f3b31";
    ctx.beginPath();
    ctx.moveTo(-14.5, -88);
    ctx.bezierCurveTo(-15, -102, 10, -107, 16, -92);
    ctx.bezierCurveTo(10, -96, 7, -95, 4, -91);
    ctx.bezierCurveTo(0, -96, -6, -96, -9, -89);
    ctx.bezierCurveTo(-11, -85, -13, -85, -14.5, -88);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(10, -99);
    ctx.quadraticCurveTo(18, -102, 17, -91);
    ctx.quadraticCurveTo(14, -96, 9, -94);
    ctx.fill();
    // вихор
    ctx.beginPath();
    ctx.moveTo(-2, -99);
    ctx.quadraticCurveTo(3, -108, 7, -100);
    ctx.quadraticCurveTo(3, -103, 1, -97);
    ctx.fill();

    // Брови
    ctx.strokeStyle = "#5d3d33";
    ctx.lineWidth = 1.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-7, -87.5);
    ctx.quadraticCurveTo(-4, -89, -1, -87.6);
    ctx.moveTo(6, -87.6);
    ctx.quadraticCurveTo(9.5, -89, 12.5, -87.3);
    ctx.stroke();

    // Глаза
    ctx.fillStyle = "#3f3543";
    ctx.beginPath();
    ctx.ellipse(-3.6, -82.8, 2.15, 2.7, 0.06, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(9.2, -82.5, 2.15, 2.7, -0.04, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#fffdf6";
    ctx.beginPath();
    ctx.arc(-3, -83.9, 0.8, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(9.8, -83.6, 0.8, 0, TAU);
    ctx.fill();

    // Нос и улыбка
    ctx.strokeStyle = "rgba(130,75,60,0.45)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(6.5, -80.2);
    ctx.quadraticCurveTo(7.5, -78.3, 5.8, -78);
    ctx.stroke();
    ctx.strokeStyle = "#9b5b54";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(3.3, -74.6);
    ctx.quadraticCurveTo(6.4, -71.7, 9.8, -74.3);
    ctx.stroke();

    // Румянец
    ctx.fillStyle = "rgba(234, 130, 126, 0.24)";
    ctx.beginPath();
    ctx.ellipse(-8.6, -77.2, 4.2, 2.4, -0.15, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(14, -76.8, 3.7, 2.3, 0.12, 0, TAU);
    ctx.fill();
    ctx.restore();

    // Передняя рука
    let hand;
    if (hug > 0.15) {
      hand = arm(ctx, 12, -58, 1.32, 23, false, "ilya");
    } else if (p.hasFlashlight && p.flashlightOn) {
      hand = arm(ctx, 12, -58, 1.38, 22, false, "ilya");
    } else if (push) {
      hand = arm(ctx, 12, -58, 1.48, 24, false, "ilya");
    } else {
      hand = arm(ctx, 12, -58, air ? -1.9 : 0.34 + walk * 0.45, 21, false, "ilya");
    }

    // Фонарик в руке
    if (p.hasFlashlight) {
      ctx.save();
      ctx.translate(hand.x, hand.y);
      ctx.rotate(p.flashlightOn ? 1.4 : 1.1);
      fillRR(ctx, -2, -5.5, 22, 11, 5, "#f5d36e");
      fillRR(ctx, 14, -6.5, 8, 13, 4, "#e7b94f");
      fillRR(ctx, 19, -6.5, 3.6, 13, 2, "rgba(255,255,230,0.92)");
      fillRR(ctx, -1, -3.3, 14, 3.2, 1.6, "rgba(255,255,255,0.45)");
      ctx.restore();
      if (p.flashlightOn) glow(ctx, hand.x + 18, hand.y + 3, 20, "rgba(255, 234, 150, 0.8)", 0.8);
    }

    if (p.hasWheel) {
      drawWheel(ctx, hand.x + 4, hand.y - 2, 0.42, 0.5, "#f5c557", false);
    }

    // Ключ у Алисы не здесь; у Илюши ничего.
    ctx.restore();
  }

  function drawAlisaBody(ctx, p, t) {
    const air = !p.onGround;
    const speed = Math.abs(p.vx || 0);
    const walk = speed > 18 && !air ? Math.sin((p.animTime || 0) * 14) : 0;
    const bob = speed > 18 && !air ? Math.abs(Math.sin((p.animTime || 0) * 14)) * 1.5 : Math.sin(t * 1.9 + 1) * 0.7;
    const hug = clamp(p.hugPose || 0, 0, 1);
    const crouch = !!p.crouching;
    const legA = air ? -0.6 : walk * 0.7;
    const legB = air ? 0.42 : -walk * 0.6;

    ctx.save();
    if (crouch) {
      ctx.scale(1.08, 0.73);
    }
    ctx.translate(0, -bob);
    if (hug > 0) ctx.rotate(-0.035 * hug);

    // Ноги
    drawAlisaLeg(ctx, -6, -22, legA, true);
    drawAlisaLeg(ctx, 6, -22, legB, false);

    // Задняя рука
    arm(ctx, -10, -43, air ? -1.75 : -0.4 - walk * 0.55 + (hug > 0.1 ? 1.18 * hug : 0), 16, true, "alisa");

    // Платьице-пижама
    const dressGrad = ctx.createLinearGradient(0, -48, 0, -19);
    dressGrad.addColorStop(0, hug > 0 ? "#ffc2d4" : "#f4aec5");
    dressGrad.addColorStop(1, "#dd8cab");
    ctx.beginPath();
    ctx.moveTo(-10, -48);
    ctx.quadraticCurveTo(-15, -45, -16, -33);
    ctx.quadraticCurveTo(-17, -24, -14, -20);
    ctx.quadraticCurveTo(0, -16, 15, -20);
    ctx.quadraticCurveTo(18, -26, 15, -35);
    ctx.quadraticCurveTo(14, -45, 10, -48);
    ctx.closePath();
    ctx.fillStyle = dressGrad;
    ctx.fill();
    ctx.strokeStyle = "rgba(110, 55, 85, 0.18)";
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Круглый воротничок
    ctx.beginPath();
    ctx.ellipse(0, -48, 8, 3.4, 0, 0, TAU);
    ctx.fillStyle = "#fff4e6";
    ctx.fill();

    // Облачка на пижаме
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    cloudPath(ctx, -6, -34, 12, 7);
    ctx.fill();
    cloudPath(ctx, 8, -27, 9, 5.5);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 242, 180, 0.9)";
    starPath(ctx, 4, -42, 2.2, 1, 5, 0.4);
    ctx.fill();
    ctx.restore();

    // Шея
    fillRR(ctx, -4, -51, 8, 6, 3, "#f2c0a3");

    // Голова
    ctx.save();
    ctx.translate(1, 0);

    // Задние хвостики
    ctx.fillStyle = "#74483d";
    ctx.beginPath();
    ctx.ellipse(-14, -63, 7.5, 9.5, -0.42, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-9, -72, 5.8, 7, 0.3, 0, TAU);
    ctx.fill();

    // Ушки
    ctx.fillStyle = "#f4c3a5";
    ctx.beginPath();
    ctx.ellipse(-11.5, -59, 3.3, 4.2, -0.2, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(13.5, -59, 3.2, 4.1, 0.2, 0, TAU);
    ctx.fill();

    // Лицо
    const faceGrad = ctx.createLinearGradient(0, -72, 0, -46);
    faceGrad.addColorStop(0, "#fbd0b3");
    faceGrad.addColorStop(1, "#f3bd9d");
    ctx.fillStyle = faceGrad;
    ctx.beginPath();
    ctx.ellipse(1, -59, 12.9, 13.4, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "rgba(120,70,55,0.12)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Волосы
    ctx.fillStyle = "#694238";
    ctx.beginPath();
    ctx.moveTo(-12.5, -63);
    ctx.bezierCurveTo(-13, -76, 9, -79, 13.4, -65);
    ctx.bezierCurveTo(10, -68, 7, -67, 4, -64);
    ctx.bezierCurveTo(0, -69, -6, -68, -9, -62);
    ctx.quadraticCurveTo(-11, -59, -12.5, -63);
    ctx.closePath();
    ctx.fill();
    // чёлка
    ctx.beginPath();
    ctx.moveTo(-8, -68);
    ctx.quadraticCurveTo(-3, -74, 3, -68);
    ctx.quadraticCurveTo(-1, -70, -4, -66);
    ctx.fill();

    // Бантики
    ctx.fillStyle = "#f28ba8";
    for (const bx of [-15.2, -9.4]) {
      ctx.beginPath();
      ctx.ellipse(bx, -68.5, 3.3, 2.3, 0.4, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = "#ffd6e2";
    ctx.beginPath();
    ctx.arc(-12.3, -68.2, 1.2, 0, TAU);
    ctx.fill();

    // Глаза — большие и любопытные
    ctx.fillStyle = "#3e3445";
    ctx.beginPath();
    ctx.ellipse(-3.3, -59.3, 2.2, 2.9, 0.05, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(8.2, -59, 2.2, 2.9, -0.05, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#fffdf7";
    ctx.beginPath();
    ctx.arc(-2.7, -60.5, 0.9, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(8.8, -60.2, 0.9, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "rgba(90,55,70,0.65)";
    ctx.beginPath();
    ctx.arc(-2.2, -58.4, 0.55, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(9.2, -58.1, 0.55, 0, TAU);
    ctx.fill();

    // Брови
    ctx.strokeStyle = "#684139";
    ctx.lineWidth = 1.2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-6.5, -64.5);
    ctx.quadraticCurveTo(-3.5, -65.8, -1, -64.4);
    ctx.moveTo(5.8, -64.4);
    ctx.quadraticCurveTo(8.5, -65.7, 10.8, -64.2);
    ctx.stroke();

    // Носик и улыбка
    ctx.strokeStyle = "rgba(140,80,70,0.42)";
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(4.6, -57);
    ctx.quadraticCurveTo(5.4, -55.8, 4.2, -55.5);
    ctx.stroke();
    ctx.strokeStyle = "#a85e63";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(1.8, -52.7);
    ctx.quadraticCurveTo(4.6, -50.2, 7.8, -52.5);
    ctx.stroke();

    // Румянец
    ctx.fillStyle = "rgba(238, 128, 139, 0.3)";
    ctx.beginPath();
    ctx.ellipse(-7.3, -55, 3.8, 2.2, -0.1, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(12.1, -54.8, 3.4, 2.1, 0.1, 0, TAU);
    ctx.fill();
    ctx.restore();

    // Передняя рука
    let hand;
    if (hug > 0.15) {
      hand = arm(ctx, 9, -43, 1.25, 18, false, "alisa");
    } else if (p.pushing || p.blowing) {
      hand = arm(ctx, 9, -43, 1.45, 18, false, "alisa");
    } else {
      hand = arm(ctx, 9, -43, air ? -2 : 0.4 + walk * 0.55, 16, false, "alisa");
    }

    if (p.hasKey) {
      ctx.save();
      ctx.translate(hand.x + 2, hand.y + 1);
      ctx.rotate(-0.45);
      drawKey(ctx, 0, 0, 0.55, 0, false);
      ctx.restore();
    }

    if (p.hasBubbles) {
      ctx.save();
      ctx.translate(hand.x + 1, hand.y + 1);
      ctx.rotate(-0.55);
      ctx.strokeStyle = "rgba(255, 245, 214, 0.95)";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(9, -7);
      ctx.stroke();
      ctx.strokeStyle = "rgba(185, 230, 255, 0.9)";
      ctx.beginPath();
      ctx.arc(12, -11, 5.5, 0, TAU);
      ctx.stroke();
      if (p.blowing) {
        ctx.fillStyle = "rgba(230, 250, 255, 0.35)";
        ctx.beginPath();
        ctx.arc(15, -15, 8, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  function drawCharacter(ctx, p, t) {
    const bottom = p.y + p.h;
    const cx = p.x + p.w / 2;
    const air = !p.onGround;
    softShadow(ctx, cx, bottom + 3, p.w * 0.72, 8, air ? 0.11 : 0.23);
    ctx.save();
    ctx.translate(cx, bottom);
    // Алиса старше и выше, Илюша младше и ниже. Меняем только рисунок,
    // чтобы не ломать прыжки, проходы и физику персонажей.
    const heightScale = p.kind === "ilya" ? 0.84 : 1.24;
    ctx.scale(p.dir >= 0 ? 1 : -1, heightScale);
    if (p.kind === "ilya") drawIlyaBody(ctx, p, t || 0);
    else drawAlisaBody(ctx, p, t || 0);
    ctx.restore();
  }

  // -----------------------------------------------------------------------
  // Игрушки и предметы
  // -----------------------------------------------------------------------

  function drawKey(ctx, x, y, scale, rot, withGlow) {
    const s = scale || 1;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot || 0);
    ctx.scale(s, s);
    if (withGlow !== false) glow(ctx, 0, 0, 34, "rgba(255, 220, 120, 0.55)", 0.85);
    ctx.fillStyle = "#f8ce63";
    ctx.strokeStyle = "#b9852e";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(-13, 0, 8, 0, TAU);
    ctx.arc(-13, 0, 3.6, 0, TAU, true);
    ctx.fill("evenodd");
    ctx.stroke();
    fillRR(ctx, -6, -2.4, 25, 4.8, 2.2, "#f8ce63");
    ctx.strokeStyle = "#b9852e";
    ctx.strokeRect(-5, -2.4, 22, 4.8);
    fillRR(ctx, 10, 1.8, 4, 7, 1.5, "#f8ce63");
    fillRR(ctx, 16, 1.8, 4, 9, 1.5, "#f8ce63");
    ctx.fillStyle = "rgba(255,255,255,0.58)";
    ctx.beginPath();
    ctx.arc(-15.5, -2.8, 1.8, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawWheel(ctx, x, y, s, angle, color, withGlow) {
    const scale = s || 1;
    const tire = color || "#f2b84b";
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    if (withGlow !== false) glow(ctx, 0, 0, 38, "rgba(255, 215, 122, 0.5)", 0.75);
    ctx.fillStyle = "#4b3b43";
    ctx.beginPath();
    ctx.arc(0, 0, 23, 0, TAU);
    ctx.fill();
    ctx.fillStyle = tire;
    ctx.beginPath();
    ctx.arc(0, 0, 19, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 248, 210, 0.7)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = "rgba(92, 66, 63, 0.55)";
    ctx.lineWidth = 2.2;
    const rot = angle || 0;
    for (let i = 0; i < 5; i++) {
      const a = rot + (i / 5) * TAU;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 5, Math.sin(a) * 5);
      ctx.lineTo(Math.cos(a) * 16, Math.sin(a) * 16);
      ctx.stroke();
    }
    ctx.fillStyle = "#fff1c0";
    ctx.beginPath();
    ctx.arc(0, 0, 5.2, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#d99b42";
    ctx.beginPath();
    ctx.arc(0, 0, 2.4, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.beginPath();
    ctx.arc(-8, -10, 3.5, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawFlashlightItem(ctx, x, y, t) {
    const bob = Math.sin(t * 2.3) * 3;
    glow(ctx, x, y - 10 + bob, 48 + Math.sin(t * 2) * 5, "rgba(255, 229, 140, 0.75)", 0.8);
    ctx.save();
    ctx.translate(x, y + bob);
    ctx.rotate(-0.18);
    ctx.fillStyle = "#f7d46d";
    ctx.strokeStyle = "rgba(125, 85, 40, 0.4)";
    ctx.lineWidth = 1.2;
    rr(ctx, -15, -7, 28, 14, 6);
    ctx.fill();
    ctx.stroke();
    fillRR(ctx, 10, -8.5, 8, 17, 4, "#e9b84b");
    fillRR(ctx, 16, -8.5, 4, 17, 2.2, "#fff6cb");
    fillRR(ctx, -12, -4.3, 19, 4, 2, "rgba(255,255,255,0.45)");
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.beginPath();
    ctx.arc(-8, -2, 1.8, 0, TAU);
    ctx.fill();
    ctx.restore();
    // Искорки
    for (let i = 0; i < 4; i++) {
      const a = t * 1.1 + (i / 4) * TAU;
      const r = 27 + Math.sin(t * 2 + i) * 5;
      Art.sparkle(ctx, x + Math.cos(a) * r, y - 10 + Math.sin(a) * r * 0.55, 2.5, "#fff3b0", 0.6 + 0.4 * Math.sin(t * 3 + i));
    }
  }

  function drawPillowCube(ctx, x, y, w, h, t, opts) {
    const o = opts || {};
    const bob = o.bob || 0;
    ctx.save();
    ctx.translate(x, y + bob);
    softShadow(ctx, w / 2, h + 4, w * 0.6, 8, 0.2);
    // Боковая грань
    ctx.beginPath();
    ctx.moveTo(4, h);
    ctx.lineTo(0, h * 0.3);
    ctx.quadraticCurveTo(0, 0, w * 0.2, 2);
    ctx.lineTo(w * 0.2, h * 0.92);
    ctx.closePath();
    ctx.fillStyle = "#c98fa8";
    ctx.fill();
    // Передняя грань
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, o.tint || "#f6b7c8");
    g.addColorStop(0.55, "#e9a0b6");
    g.addColorStop(1, "#d58ba6");
    rr(ctx, w * 0.16, 3, w * 0.8, h * 0.94, 14);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = "rgba(115, 55, 80, 0.2)";
    ctx.lineWidth = 1.6;
    ctx.stroke();
    // Верхняя грань
    ctx.beginPath();
    ctx.moveTo(w * 0.16, 3);
    ctx.quadraticCurveTo(w * 0.55, -8, w * 0.96, 3);
    ctx.lineTo(w * 0.9, h * 0.2);
    ctx.quadraticCurveTo(w * 0.55, h * 0.1, w * 0.22, h * 0.22);
    ctx.closePath();
    ctx.fillStyle = "rgba(255, 225, 228, 0.72)";
    ctx.fill();
    // Стежки
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = "rgba(255,255,255,0.42)";
    ctx.lineWidth = 1.3;
    rr(ctx, w * 0.23, h * 0.18, w * 0.66, h * 0.69, 9);
    ctx.stroke();
    ctx.setLineDash([]);
    // Буква «А»
    ctx.save();
    ctx.translate(w * 0.56, h * 0.54);
    ctx.font = `700 ${Math.round(h * 0.36)}px "Comic Sans MS", "Segoe UI", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(255, 247, 228, 0.92)";
    ctx.fillText("А", 0, 0);
    ctx.restore();
    // Маленькие звёздочки
    ctx.fillStyle = "rgba(255, 247, 220, 0.65)";
    starPath(ctx, w * 0.3, h * 0.34, 3, 1.3, 5, 0.2);
    ctx.fill();
    ctx.restore();
  }

  function drawToyBear(ctx, x, y, s, t) {
    const scale = s || 1;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    softShadow(ctx, 0, 4, 34, 8, 0.2);
    // лапы
    ctx.fillStyle = "#b9845e";
    ctx.beginPath();
    ctx.ellipse(-22, -6, 12, 9, 0.2, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(22, -6, 12, 9, -0.2, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#e3b98f";
    ctx.beginPath();
    ctx.ellipse(-24, -4, 7, 5, 0.2, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(24, -4, 7, 5, -0.2, 0, TAU);
    ctx.fill();
    // тело
    const g = ctx.createLinearGradient(0, -60, 0, 0);
    g.addColorStop(0, "#d9aa7c");
    g.addColorStop(1, "#bd865e");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, -31, 29, 33, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#f2d2a9";
    ctx.beginPath();
    ctx.ellipse(0, -27, 17, 21, 0, 0, TAU);
    ctx.fill();
    // голова
    ctx.fillStyle = "#c58e64";
    ctx.beginPath();
    ctx.arc(0, -69, 26, 0, TAU);
    ctx.fill();
    // уши
    ctx.fillStyle = "#b8825b";
    ctx.beginPath();
    ctx.arc(-20, -88, 10, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(20, -88, 10, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#e9c49a";
    ctx.beginPath();
    ctx.arc(-20, -88, 5.6, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(20, -88, 5.6, 0, TAU);
    ctx.fill();
    // мордочка
    ctx.fillStyle = "#f3d7b2";
    ctx.beginPath();
    ctx.ellipse(0, -62, 13.5, 11, 0, 0, TAU);
    ctx.fill();
    // глаза
    ctx.strokeStyle = "#4d352c";
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(-9, -72, 3.1, 0.15, Math.PI - 0.15);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(9, -72, 3.1, 0.15, Math.PI - 0.15);
    ctx.stroke();
    // нос
    ctx.fillStyle = "#5a3b31";
    ctx.beginPath();
    ctx.ellipse(0, -63.5, 3.4, 2.5, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "#6b4a3a";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -61);
    ctx.lineTo(0, -58);
    ctx.quadraticCurveTo(-3, -55.6, -5, -58);
    ctx.moveTo(0, -58);
    ctx.quadraticCurveTo(3, -55.6, 5, -58);
    ctx.stroke();
    // ручки
    ctx.strokeStyle = "#b9835a";
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(-25, -48);
    ctx.quadraticCurveTo(-33, -36, -28, -27);
    ctx.moveTo(25, -48);
    ctx.quadraticCurveTo(33, -36, 28, -27);
    ctx.stroke();
    // заплатка
    ctx.fillStyle = "#d3a174";
    rr(ctx, 8, -34, 11, 10, 3);
    ctx.fill();
    ctx.strokeStyle = "rgba(85,55,45,0.38)";
    ctx.setLineDash([2, 2]);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  function drawToyBunny(ctx, x, y, s, t) {
    const scale = s || 1;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    softShadow(ctx, 0, 4, 30, 8, 0.18);
    // уши
    ctx.save();
    ctx.rotate(-0.18 + Math.sin((t || 0) * 1.4) * 0.04);
    ctx.fillStyle = "#e8e3dc";
    ctx.beginPath();
    ctx.ellipse(-12, -80, 8, 27, -0.2, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#f4b8c8";
    ctx.beginPath();
    ctx.ellipse(-12, -80, 4, 18, -0.2, 0, TAU);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.rotate(0.16 - Math.sin((t || 0) * 1.3) * 0.04);
    ctx.fillStyle = "#f2ede6";
    ctx.beginPath();
    ctx.ellipse(11, -79, 8, 26, 0.18, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#f6c3d0";
    ctx.beginPath();
    ctx.ellipse(11, -79, 4, 17, 0.18, 0, TAU);
    ctx.fill();
    ctx.restore();
    // тело
    const g = ctx.createLinearGradient(0, -52, 0, 0);
    g.addColorStop(0, "#fbf7ed");
    g.addColorStop(1, "#e7dfd2");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, -24, 25, 27, 0, 0, TAU);
    ctx.fill();
    // лапки
    ctx.fillStyle = "#f5eee2";
    ctx.beginPath();
    ctx.ellipse(-17, -4, 11, 7, 0.2, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(17, -4, 11, 7, -0.2, 0, TAU);
    ctx.fill();
    // голова
    ctx.fillStyle = "#fbf7ee";
    ctx.beginPath();
    ctx.arc(0, -56, 23, 0, TAU);
    ctx.fill();
    // глаза
    ctx.fillStyle = "#51464c";
    ctx.beginPath();
    ctx.ellipse(-8, -58, 2.7, 3.4, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(8, -58, 2.7, 3.4, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(-7.2, -59.4, 0.9, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(8.8, -59.4, 0.9, 0, TAU);
    ctx.fill();
    // нос
    ctx.fillStyle = "#e793a8";
    ctx.beginPath();
    ctx.moveTo(0, -52.5);
    ctx.lineTo(-3, -55);
    ctx.lineTo(3, -55);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#a7767f";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(0, -52.5);
    ctx.lineTo(0, -50);
    ctx.moveTo(0, -50);
    ctx.quadraticCurveTo(-3, -48, -5, -50);
    ctx.moveTo(0, -50);
    ctx.quadraticCurveTo(3, -48, 5, -50);
    ctx.stroke();
    // румянец
    ctx.fillStyle = "rgba(243, 153, 172, 0.35)";
    ctx.beginPath();
    ctx.ellipse(-13, -51, 3.8, 2.1, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(13, -51, 3.8, 2.1, 0, 0, TAU);
    ctx.fill();
    // хвостик
    ctx.fillStyle = "#fffaf0";
    ctx.beginPath();
    ctx.arc(22, -16, 7, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawToyElephant(ctx, x, y, s, t) {
    const scale = s || 1;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    softShadow(ctx, 0, 4, 36, 9, 0.18);
    ctx.fillStyle = "#a9b8d8";
    ctx.beginPath();
    ctx.ellipse(0, -30, 31, 30, 0, 0, TAU);
    ctx.fill();
    // ноги
    fillRR(ctx, -22, -10, 13, 12, 6, "#91a4c9");
    fillRR(ctx, 8, -10, 13, 12, 6, "#91a4c9");
    // уши
    ctx.fillStyle = "#b9c7e3";
    ctx.beginPath();
    ctx.ellipse(-27, -59, 15, 20, -0.25, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(27, -59, 15, 20, 0.25, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#e6b7c4";
    ctx.beginPath();
    ctx.ellipse(-26, -58, 8, 13, -0.25, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(26, -58, 8, 13, 0.25, 0, TAU);
    ctx.fill();
    // голова
    ctx.fillStyle = "#b9c7e3";
    ctx.beginPath();
    ctx.arc(0, -60, 23, 0, TAU);
    ctx.fill();
    // хобот
    ctx.strokeStyle = "#a9b8d8";
    ctx.lineWidth = 13;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(3, -49);
    ctx.bezierCurveTo(8, -34, 9, -25, 2, -20);
    ctx.stroke();
    ctx.strokeStyle = "#c6d2e9";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(3, -49);
    ctx.bezierCurveTo(7, -36, 8, -28, 2, -23);
    ctx.stroke();
    // глаза
    ctx.fillStyle = "#4c4a60";
    ctx.beginPath();
    ctx.ellipse(-9, -63, 2.6, 3.3, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(9, -63, 2.6, 3.3, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(-8.2, -64.3, 0.9, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(9.8, -64.3, 0.9, 0, TAU);
    ctx.fill();
    // румянец
    ctx.fillStyle = "rgba(238, 154, 170, 0.3)";
    ctx.beginPath();
    ctx.ellipse(-15, -56, 3.5, 2, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(15, -56, 3.5, 2, 0, 0, TAU);
    ctx.fill();
    // хохолок
    ctx.fillStyle = "#95a8cc";
    ctx.beginPath();
    ctx.moveTo(-3, -82);
    ctx.quadraticCurveTo(0, -89, 4, -82);
    ctx.quadraticCurveTo(1, -84, -3, -82);
    ctx.fill();
    ctx.restore();
  }

  function drawFirefly(ctx, x, y, t, scale) {
    const s = scale == null ? 1 : scale;
    const blink = 0.72 + 0.28 * Math.sin(t * 3.1 + x * 0.03);
    glow(ctx, x, y, 24 * s * blink, "rgba(255, 231, 130, 0.75)", 0.8);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.fillStyle = "rgba(255, 252, 214, 0.63)";
    ctx.beginPath();
    ctx.ellipse(-4.5, -3, 4.5, 2.2, -0.55 + Math.sin(t * 9) * 0.3, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(4.5, -3, 4.5, 2.2, 0.55 - Math.sin(t * 9) * 0.3, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#ffeb8a";
    ctx.beginPath();
    ctx.ellipse(0, 0, 3.2, 4.1, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#fffce6";
    ctx.beginPath();
    ctx.arc(0, -1, 1.3, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function sparkle(ctx, x, y, size, color, alpha, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot || 0);
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.fillStyle = color || "#ffe9a8";
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const r = i % 2 === 0 ? size : size * 0.26;
      const a = (i / 8) * TAU;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function heart(ctx, x, y, s, color, alpha, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot || 0);
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    heartPath(ctx, 0, 0, s);
    ctx.fillStyle = color || "#f28ba8";
    ctx.fill();
    ctx.restore();
  }

  // -----------------------------------------------------------------------
  // Портреты для диалогов
  // -----------------------------------------------------------------------

  function drawPortrait(ctx, speaker) {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    ctx.clearRect(0, 0, w, h);

    const palettes = {
      mama: ["#2b3163", "#4b3f79"],
      ilya: ["#4a79a8", "#8fc5e7"],
      alisa: ["#a45c7d", "#ffb9cd"],
      both: ["#6d5b9e", "#ffc4d8"],
    };
    const pal = palettes[speaker] || palettes.mama;

    ctx.save();
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w / 2, 0, TAU);
    ctx.clip();
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, pal[1]);
    g.addColorStop(1, pal[0]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // звёзды
    ctx.fillStyle = "rgba(255,248,214,0.65)";
    for (let i = 0; i < 6; i++) {
      const a = i * 2.1;
      const x = 18 + ((i * 37) % 110);
      const y = 13 + ((i * 29) % 70);
      starPath(ctx, x, y, 2.4 + (i % 3), 0.9, 5, a);
      ctx.fill();
    }
    // облачко снизу
    cloudPath(ctx, w / 2, h - 6, w * 0.95, h * 0.34);
    ctx.fillStyle = "rgba(255, 248, 231, 0.22)";
    ctx.fill();

    if (speaker === "mama") {
      glow(ctx, w / 2, h * 0.46, w * 0.42, "rgba(255, 235, 174, 0.45)", 1);
      // месяц
      ctx.fillStyle = "#ffe9b0";
      ctx.beginPath();
      ctx.arc(w * 0.52, h * 0.46, w * 0.27, 0, TAU);
      ctx.fill();
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(w * 0.63, h * 0.4, w * 0.24, 0, TAU);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
      // звёздный колпак
      ctx.fillStyle = "#8a7cc4";
      ctx.beginPath();
      ctx.moveTo(w * 0.31, h * 0.31);
      ctx.quadraticCurveTo(w * 0.48, h * 0.08, w * 0.69, h * 0.26);
      ctx.quadraticCurveTo(w * 0.55, h * 0.22, w * 0.48, h * 0.34);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#fff1bf";
      ctx.beginPath();
      ctx.arc(w * 0.69, h * 0.24, 4, 0, TAU);
      ctx.fill();
      // лицо на месяце
      ctx.fillStyle = "#8d6b43";
      ctx.beginPath();
      ctx.arc(w * 0.46, h * 0.49, 2.2, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = "#8d6b43";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(w * 0.44, h * 0.55, 5, 0.15, Math.PI - 0.15);
      ctx.stroke();
      ctx.fillStyle = "rgba(230, 143, 127, 0.35)";
      ctx.beginPath();
      ctx.arc(w * 0.38, h * 0.55, 5, 0, TAU);
      ctx.fill();
    } else {
      const isIlya = speaker === "ilya" || speaker === "both";
      const p = {
        kind: isIlya ? "ilya" : "alisa",
        x: 0,
        y: 0,
        w: 40,
        h: isIlya ? 94 : 72,
        dir: 1,
        vx: 0,
        onGround: true,
        animTime: 2.4,
        hugPose: 0,
        hasFlashlight: speaker === "ilya",
        flashlightOn: false,
        hasKey: false,
      };
      ctx.save();
      ctx.translate(w / 2 - 2, h + (isIlya ? 56 : 48));
      ctx.scale(isIlya ? 2.15 : 2.35, isIlya ? 2.15 : 2.35);
      if (isIlya) drawIlyaBody(ctx, p, 1.4);
      else drawAlisaBody(ctx, p, 1.5);
      ctx.restore();
      if (speaker === "both") {
        ctx.fillStyle = "rgba(255, 246, 220, 0.9)";
        heart(ctx, w * 0.77, h * 0.23, 8, "#ffe2a6", 0.9, 0.2);
      }
    }
    ctx.restore();

    // Мягкий внутренний ободок
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w / 2 - 2, 0, TAU);
    ctx.stroke();
  }

  function drawBubble(ctx, x, y, w, h, color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    rr(ctx, x, y, w, h, h / 2);
    ctx.fillStyle = color || "rgba(255, 249, 235, 0.94)";
    ctx.fill();
    ctx.restore();
  }

  const Art = {
    TAU,
    clamp,
    lerp,
    easeOut,
    easeInOut,
    rr,
    fillRR,
    strokeRR,
    starPath,
    heartPath,
    shapePath,
    glow,
    softShadow,
    cloudPath,
    drawCloud,
    drawCharacter,
    drawKey,
    drawWheel,
    drawFlashlightItem,
    drawPillowCube,
    drawToyBear,
    drawToyBunny,
    drawToyElephant,
    drawFirefly,
    sparkle,
    heart,
    drawPortrait,
    drawBubble,
  };

  VO.Art = Art;
})();
