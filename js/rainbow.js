(function () {
  "use strict";

  const W = 1280;
  const H = 720;
  const A = VO.Art;
  const PICTURE = { x: 70, y: 112, w: 1140, h: 528 };
  const C = {
    ink: "#575363",
    paper: "#f7f3e8",
    paper2: "#e7e2d6",
    blue: "#5aa9ff",
    green: "#78d48e",
    red: "#f26870",
    yellow: "#ffd45e",
    purple: "#b58bea",
    lime: "#b9e97c",
    gold: "#f6c95e",
  };

  const COLOR_NAME = {
    blue: "синий",
    green: "зелёный",
    red: "красный",
    yellow: "жёлтый",
    purple: "фиолетовый",
    lime: "салатовый",
  };

  function rr(ctx, x, y, w, h, r) {
    const rad = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.lineTo(x + w - rad, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
    ctx.lineTo(x + w, y + h - rad);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
    ctx.lineTo(x + rad, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
    ctx.lineTo(x, y + rad);
    ctx.quadraticCurveTo(x, y, x + rad, y);
    ctx.closePath();
  }

  function inRect(x, y, a) {
    return x >= a.x && x <= a.x + a.w && y >= a.y && y <= a.y + a.h;
  }

  function inCircle(x, y, cx, cy, r) {
    return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
  }

  function inEllipse(x, y, cx, cy, rx, ry) {
    return ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
  }

  function inPoly(x, y, pts) {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const xi = pts[i][0], yi = pts[i][1];
      const xj = pts[j][0], yj = pts[j][1];
      const hit = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (hit) inside = !inside;
    }
    return inside;
  }

  function poly(ctx, pts) {
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
  }

  function starPath(ctx, cx, cy, outer, inner, spikes, rot) {
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 ? inner : outer;
      const a = (i / (spikes * 2)) * Math.PI * 2 + (rot || 0);
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath();
  }

  function zoneColor(need) {
    return C[need] || C.paper2;
  }

  function buildZones() {
    const zones = [];
    const add = (z) => { zones.push(z); return z; };

    add({
      id: "sky", num: 1, need: "blue", owner: "ilya", cx: 640, cy: 620,
      labelX: 150, labelY: 590,
      draw(ctx) { rr(ctx, PICTURE.x, PICTURE.y, PICTURE.w, PICTURE.h, 28); },
      hit(x, y) { return inRect(x, y, PICTURE); },
    });

    add({
      id: "moon", num: 2, need: "yellow", owner: "alisa", cx: 1078, cy: 188,
      labelX: 1078, labelY: 188,
      draw(ctx) { ctx.beginPath(); ctx.arc(1078, 188, 52, 0, Math.PI * 2); },
      hit(x, y) { return inCircle(x, y, 1078, 188, 52); },
    });

    add({
      id: "star", num: 3, need: "yellow", owner: "alisa", cx: 220, cy: 184,
      labelX: 220, labelY: 184,
      draw(ctx) { starPath(ctx, 220, 184, 55, 23, 5, -Math.PI / 2); },
      hit(x, y) { return inCircle(x, y, 220, 184, 56); },
    });

    add({
      id: "purple", num: 4, need: "purple", owner: "mix", cx: 302, cy: 414,
      labelX: 302, labelY: 414,
      draw(ctx) { ctx.beginPath(); ctx.arc(302, 414, 70, 0, Math.PI * 2); },
      hit(x, y) { return inCircle(x, y, 302, 414, 70); },
    });

    add({
      id: "lime", num: 5, need: "lime", owner: "mix", cx: 1002, cy: 420,
      labelX: 1002, labelY: 420,
      draw(ctx) { ctx.beginPath(); ctx.arc(1002, 420, 62, 0, Math.PI * 2); },
      hit(x, y) { return inCircle(x, y, 1002, 420, 62); },
    });

    add({
      id: "flameOuter", num: 6, need: "yellow", owner: "alisa", cx: 640, cy: 578,
      labelX: 600, labelY: 612,
      draw(ctx) {
        ctx.beginPath();
        ctx.moveTo(640, 646);
        ctx.bezierCurveTo(564, 614, 586, 546, 640, 526);
        ctx.bezierCurveTo(694, 546, 716, 614, 640, 646);
        ctx.closePath();
      },
      hit(x, y) { return inEllipse(x, y, 640, 584, 68, 58); },
    });

    add({
      id: "flameInner", num: 7, need: "red", owner: "alisa", cx: 640, cy: 573,
      labelX: 640, labelY: 570,
      draw(ctx) {
        ctx.beginPath();
        ctx.moveTo(640, 624);
        ctx.bezierCurveTo(606, 604, 616, 558, 640, 542);
        ctx.bezierCurveTo(664, 558, 674, 604, 640, 624);
        ctx.closePath();
      },
      hit(x, y) { return inEllipse(x, y, 640, 580, 34, 34); },
    });

    add({
      id: "finL", num: 8, need: "green", owner: "ilya", cx: 536, cy: 476,
      labelX: 535, labelY: 474,
      draw(ctx) { poly(ctx, [[562, 424], [486, 518], [562, 506]]); },
      hit(x, y) { return inPoly(x, y, [[562, 424], [486, 518], [562, 506]]); },
    });

    add({
      id: "finR", num: 9, need: "green", owner: "ilya", cx: 744, cy: 476,
      labelX: 745, labelY: 474,
      draw(ctx) { poly(ctx, [[718, 424], [794, 518], [718, 506]]); },
      hit(x, y) { return inPoly(x, y, [[718, 424], [794, 518], [718, 506]]); },
    });

    add({
      id: "rocket", num: 10, need: "red", owner: "alisa", cx: 640, cy: 405,
      labelX: 640, labelY: 478,
      draw(ctx) { rr(ctx, 560, 254, 160, 270, 44); },
      hit(x, y) { return inRect(x, y, { x: 560, y: 254, w: 160, h: 270 }); },
    });

    add({
      id: "stripe", num: 11, need: "green", owner: "ilya", cx: 640, cy: 450,
      labelX: 590, labelY: 448,
      draw(ctx) { rr(ctx, 560, 432, 160, 36, 10); },
      hit(x, y) { return inRect(x, y, { x: 560, y: 432, w: 160, h: 36 }); },
    });

    add({
      id: "nose", num: 12, need: "yellow", owner: "alisa", cx: 640, cy: 198,
      labelX: 640, labelY: 208,
      draw(ctx) { poly(ctx, [[560, 258], [720, 258], [640, 146]]); },
      hit(x, y) { return inPoly(x, y, [[560, 258], [720, 258], [640, 146]]); },
    });

    add({
      id: "window", num: 13, need: "blue", owner: "ilya", cx: 640, cy: 332,
      labelX: 640, labelY: 332,
      draw(ctx) { ctx.beginPath(); ctx.arc(640, 332, 46, 0, Math.PI * 2); },
      hit(x, y) { return inCircle(x, y, 640, 332, 46); },
    });

    return zones;
  }

  function create() {
    const s = {
      phase: "intro",
      introT: 3.1,
      time: 300,
      timeMax: 300,
      score: 0,
      filled: 0,
      total: 13,
      allFilled: false,
      resultT: 0,
      resultLine: "",
      coverage: 0,
      zones: buildZones(),
      ilya: { x: 380, y: 520, zone: null, trail: [] },
      alisa: { x: 890, y: 520, zone: null, trail: [] },
      pendingMix: null,
      clouds: [],
      cloudTimer: 6,
      particles: [],
      elapsed: 0,
      breakPresses: { Space: -10, Enter: -10 },
      rewarded: false,
      rewardShown: false,
      hint: "",
      hintT: 0,
    };
    s.zones.forEach((z) => { z.filled = false; z.fill = null; });
    VO.Sound.speak(
      "Ох, скоро пора просыпаться! Успеете раскрасить картинку? Время пошло!",
      "mama"
    );
    return s;
  }

  function zoneAt(s, x, y) {
    for (let i = s.zones.length - 1; i >= 0; i--) {
      const z = s.zones[i];
      if (!z.filled && z.hit(x, y)) return z;
    }
    return null;
  }

  function addParticles(s, x, y, color, count, speed, kind) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = speed * (0.35 + Math.random() * 0.65);
      s.particles.push({
        x, y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - (kind === "burst" ? 40 : 0),
        life: 0.65 + Math.random() * 0.55,
        max: 1.2,
        size: 2.2 + Math.random() * 4,
        color: color || C.gold,
        kind: kind || "dot",
      });
    }
  }

  function showHint(s, text) {
    s.hint = text;
    s.hintT = 1.6;
  }

  function bothIn(s, z) {
    return s.ilya.zone === z && s.alisa.zone === z;
  }

  function fillZone(s, z, color) {
    if (z.filled) return;
    z.filled = true;
    z.fill = color;
    s.filled++;
    s.score += z.owner === "mix" ? 20 : 10;
    z.flash = 0.8;
    addParticles(s, z.cx, z.cy, color, z.owner === "mix" ? 34 : 18, z.owner === "mix" ? 260 : 150, "burst");
    if (z.owner === "mix") VO.Sound.celebrate();
    else VO.Sound.sparkle();
    if (s.filled >= s.total) {
      s.allFilled = true;
      finish(s, true);
    }
  }

  function tryPaint(s, player, key) {
    if (s.phase !== "playing") return;
    const p = player === "ilya" ? s.ilya : s.alisa;
    // Тучка важнее зоны: в неё можно попасть любой краской.
    for (const cloud of s.clouds) {
      if (!cloud.dead && inCircle(p.x, p.y, cloud.x, cloud.y, 48)) {
        cloud.dead = true;
        s.time += 5;
        addParticles(s, cloud.x, cloud.y, C.purple, 28, 190, "confetti");
        addParticles(s, cloud.x, cloud.y, C.gold, 18, 170, "star");
        VO.Sound.soapPop();
        showHint(s, "+5 секунд!");
        return;
      }
    }
    const z = p.zone;
    if (!z || z.filled) return;
    if (z.owner === "mix") {
      if (!bothIn(s, z)) {
        showHint(s, "Наведите обе искорки в одну зону!");
        return;
      }
      const now = s.elapsed;
      if (s.pendingMix && s.pendingMix.zone === z.id && s.pendingMix.by !== player && now - s.pendingMix.time < 0.65) {
        fillZone(s, z, z.need === "purple" ? C.purple : C.lime);
        s.pendingMix = null;
      } else {
        s.pendingMix = { zone: z.id, by: player, time: now };
        showHint(s, player === "ilya" ? "Теперь Алиса — вместе!" : "Теперь Илюша — вместе!");
      }
      return;
    }
    if (z.owner !== player) {
      showHint(s, player === "ilya" ? "Эту зону красит Алиса." : "Эту зону красит Илюша.");
      return;
    }
    fillZone(s, z, zoneColor(z.need));
  }

  function finish(s, all) {
    if (s.phase !== "playing") return;
    s.phase = "result";
    s.resultT = 0;
    s.allFilled = !!all;
    s.coverage = s.filled / s.total;
    s.resultLine = all || s.coverage >= 0.999
      ? "Невероятно! Вот это скорость! Вы самая дружная команда на свете!"
      : s.coverage >= 0.5
        ? "Ого, какая яркая открытка получилась! Вы настоящие художники!"
        : "Какая тёплая открытка! В следующий раз раскрасим ещё больше!";
    VO.Sound.stopSpeech();
    VO.Sound.speak(s.resultLine, "mama");
    VO.Sound.celebrate();
    s.breakPresses = { Space: -10, Enter: -10 };
  }

  function updatePlayers(s, dt, input) {
    const speed = 390;
    const p = s.ilya;
    if (input.isDown("KeyA")) p.x -= speed * dt;
    if (input.isDown("KeyD")) p.x += speed * dt;
    if (input.isDown("KeyW")) p.y -= speed * dt;
    if (input.isDown("KeyS")) p.y += speed * dt;
    p.x = Math.max(PICTURE.x + 16, Math.min(PICTURE.x + PICTURE.w - 16, p.x));
    p.y = Math.max(PICTURE.y + 16, Math.min(PICTURE.y + PICTURE.h - 16, p.y));

    const a = s.alisa;
    if (input.isDown("ArrowLeft")) a.x -= speed * dt;
    if (input.isDown("ArrowRight")) a.x += speed * dt;
    if (input.isDown("ArrowUp")) a.y -= speed * dt;
    if (input.isDown("ArrowDown")) a.y += speed * dt;
    a.x = Math.max(PICTURE.x + 16, Math.min(PICTURE.x + PICTURE.w - 16, a.x));
    a.y = Math.max(PICTURE.y + 16, Math.min(PICTURE.y + PICTURE.h - 16, a.y));

    p.zone = zoneAt(s, p.x, p.y);
    a.zone = zoneAt(s, a.x, a.y);
    p.trail.push({ x: p.x, y: p.y, life: 0.45 });
    a.trail.push({ x: a.x, y: a.y, life: 0.45 });
    for (const trail of [p.trail, a.trail]) {
      for (const t of trail) t.life -= dt;
      while (trail.length && trail[0].life <= 0) trail.shift();
      if (trail.length > 24) trail.splice(0, trail.length - 24);
    }
  }

  function updateClouds(s, dt) {
    s.cloudTimer -= dt;
    if (s.cloudTimer <= 0 && s.clouds.filter((c) => !c.dead).length < 2) {
      s.cloudTimer = 7 + Math.random() * 3;
      const fromLeft = Math.random() > 0.5;
      s.clouds.push({
        x: fromLeft ? PICTURE.x - 70 : PICTURE.x + PICTURE.w + 70,
        y: PICTURE.y + 90 + Math.random() * (PICTURE.h - 190),
        vx: fromLeft ? 78 : -78,
        dead: false,
        phase: Math.random() * 2,
      });
    }
    for (const c of s.clouds) {
      if (c.dead) continue;
      c.x += c.vx * dt;
      if (c.x < PICTURE.x - 120 || c.x > PICTURE.x + PICTURE.w + 120) c.off = true;
    }
    s.clouds = s.clouds.filter((c) => !c.dead && !c.off);
  }

  function updateParticles(s, dt) {
    for (const p of s.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 260 * dt;
      p.vx *= Math.pow(0.15, dt);
    }
    s.particles = s.particles.filter((p) => p.life > 0);
  }

  function update(s, dt, input) {
    if (!s) return;
    if (s.hintT > 0) s.hintT -= dt;
    updateParticles(s, dt);
    if (s.phase === "intro") {
      s.introT -= dt;
      if (s.introT <= 0) {
        s.phase = "playing";
        s.elapsed = 0;
      }
      return;
    }
    if (s.phase === "playing") {
      s.elapsed += dt;
      updatePlayers(s, dt, input);
      updateClouds(s, dt);
      s.time = Math.max(0, s.time - dt);
      if (input.justPressed("Space")) tryPaint(s, "ilya", "Space");
      if (input.justPressed("Enter")) tryPaint(s, "alisa", "Enter");
      if (s.time <= 0) finish(s, false);
      return;
    }
    if (s.phase === "result" || s.phase === "reward") {
      s.resultT += dt;
      if (s.phase === "result") {
        const now = s.resultT;
        if (input.justPressed("Space")) s.breakPresses.Space = now;
        if (input.justPressed("Enter")) s.breakPresses.Enter = now;
        const both = Math.abs(s.breakPresses.Space - s.breakPresses.Enter) < 0.65;
        if (both && s.breakPresses.Space > 0 && s.breakPresses.Enter > 0 && s.resultT > 0.5) {
          s.breakPresses.Space = -10;
          s.breakPresses.Enter = -10;
          s.phase = "reward";
          s.rewarded = true;
          s.score += 20;
          addParticles(s, 640, 350, C.gold, 70, 300, "star");
          addParticles(s, 640, 350, C.purple, 40, 250, "confetti");
          VO.Sound.celebrate();
          VO.Sound.speak("Ура! Сердечко открылось, и праздничные наклейки летят в ваш альбом!", "mama");
        }
      }
    }
  }

  function drawZone(ctx, z, hovered) {
    const fill = z.filled ? z.fill : (hovered ? "rgba(255,255,255,0.94)" : "rgba(245,241,232,0.92)");
    z.draw(ctx);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = hovered && !z.filled ? zoneColor(z.need) : "#5b5665";
    ctx.lineWidth = hovered && !z.filled ? 4 : 2.2;
    ctx.stroke();
    if (z.filled) {
      ctx.save();
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = "#ffffff";
      z.draw(ctx);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawLabel(ctx, z, t) {
    const x = z.labelX;
    const y = z.labelY;
    ctx.save();
    if (z.filled) {
      ctx.fillStyle = "rgba(255, 253, 246, 0.82)";
      ctx.strokeStyle = "rgba(80, 69, 89, 0.25)";
    } else {
      ctx.fillStyle = "rgba(255, 250, 238, 0.92)";
      ctx.strokeStyle = "rgba(80, 69, 89, 0.35)";
    }
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(x, y, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#57515e";
    ctx.font = '700 13px "Comic Sans MS", "Segoe UI", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(z.num), x, y + 1);
    if (z.owner !== "mix" && !z.filled) {
      ctx.fillStyle = zoneColor(z.need);
      ctx.strokeStyle = "rgba(80, 69, 89, 0.3)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x + 19, y - 9, 4.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    if (z.owner === "mix" && !z.filled) {
      ctx.fillStyle = C.blue;
      ctx.beginPath();
      ctx.arc(x - 18, y + 17, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = C.red;
      ctx.beginPath();
      ctx.arc(x + 18, y + 17, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    if (z.filled) {
      A.sparkle(ctx, x + 14, y - 11, 2.4, "#fff6ce", 0.75, t + z.num);
    }
    ctx.restore();
  }

  function drawCloud(ctx, c, t) {
    if (c.dead) return;
    ctx.save();
    ctx.globalAlpha = 0.9;
    A.glow(ctx, c.x, c.y, 54, "rgba(180, 166, 220, 0.25)", 0.7);
    A.drawCloud(ctx, c.x, c.y, 82, 42, "rgba(168, 166, 200, 0.92)", { shine: false });
    ctx.fillStyle = "#625f7d";
    ctx.beginPath();
    ctx.arc(c.x - 15, c.y - 4, 3.2, 0, Math.PI * 2);
    ctx.arc(c.x + 15, c.y - 4, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#625f7d";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(c.x, c.y + 8, 7, 0.2, Math.PI - 0.2);
    ctx.stroke();
    ctx.fillStyle = "rgba(71, 68, 101, 0.6)";
    ctx.font = '700 12px "Comic Sans MS", "Segoe UI", sans-serif';
    ctx.textAlign = "center";
    ctx.fillText("z", c.x + 34, c.y - 22 - Math.sin(t * 2) * 3);
    ctx.fillStyle = "rgba(255, 244, 195, 0.9)";
    ctx.font = '700 11px "Comic Sans MS", "Segoe UI", sans-serif';
    ctx.fillText("+5 сек", c.x, c.y + 34);
    ctx.restore();
  }

  function drawCursor(ctx, p, name, color, t, zone) {
    ctx.save();
    for (let i = 0; i < p.trail.length; i++) {
      const tr = p.trail[i];
      const a = Math.max(0, tr.life / 0.45);
      A.sparkle(ctx, tr.x, tr.y, 2 + (i / p.trail.length) * 3, color, a * 0.3, t + i);
    }
    A.glow(ctx, p.x, p.y, 44, color, 0.8);
    A.sparkle(ctx, p.x, p.y, 15, color, 0.9, t * 1.4);
    A.sparkle(ctx, p.x, p.y, 8, "#fff8d5", 1, -t);
    ctx.fillStyle = "rgba(255, 252, 235, 0.95)";
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 17, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = '700 14px "Comic Sans MS", "Segoe UI", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(name, p.x, p.y + 1);
    if (zone) {
      const label = `№${zone.num} · ${COLOR_NAME[zone.need] || "вместе"}`;
      ctx.font = '700 10px "Comic Sans MS", "Segoe UI", sans-serif';
      const w = ctx.measureText(label).width + 16;
      const bx = Math.min(PICTURE.x + PICTURE.w - w, Math.max(PICTURE.x, p.x - w / 2));
      const by = p.y > PICTURE.y + 60 ? p.y - 46 : p.y + 30;
      ctx.fillStyle = "rgba(28, 26, 47, 0.7)";
      rr(ctx, bx, by, w, 20, 8);
      ctx.fill();
      ctx.fillStyle = "rgba(255, 247, 222, 0.9)";
      ctx.textAlign = "center";
      ctx.fillText(label, bx + w / 2, by + 11);
    }
    ctx.restore();
  }

  function drawIntro(ctx, s, t) {
    ctx.save();
    ctx.fillStyle = "rgba(19, 20, 43, 0.55)";
    ctx.fillRect(0, 0, W, H);
    A.glow(ctx, 640, 332, 220, "rgba(255, 215, 132, 0.2)", 0.8);
    // Будильник.
    ctx.fillStyle = "#f6d58a";
    ctx.strokeStyle = "#8a6548";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(526, 330, 66, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#f0b96f";
    ctx.beginPath();
    ctx.arc(482, 272, 20, 0, Math.PI * 2);
    ctx.arc(570, 272, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff8dc";
    ctx.beginPath();
    ctx.arc(526, 330, 48, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#7b5a4a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(526, 330);
    ctx.lineTo(526, 304);
    ctx.moveTo(526, 330);
    ctx.lineTo(548, 338);
    ctx.stroke();
    ctx.fillStyle = "#6f5448";
    ctx.beginPath();
    ctx.arc(510, 322, 3, 0, Math.PI * 2);
    ctx.arc(542, 322, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(526, 338, 5, 0.2, Math.PI - 0.2);
    ctx.stroke();
    // Облачко-речь.
    ctx.fillStyle = "rgba(255, 247, 226, 0.95)";
    rr(ctx, 608, 250, 450, 132, 24);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.stroke();
    ctx.fillStyle = "#5c4b60";
    ctx.font = '700 19px "Comic Sans MS", "Segoe UI", sans-serif';
    ctx.textAlign = "left";
    ctx.fillText("Ох, скоро пора просыпаться!", 632, 292);
    ctx.font = '600 16px "Comic Sans MS", "Segoe UI", sans-serif';
    ctx.fillText("Успеете раскрасить картинку? Время пошло!", 632, 326);
    ctx.font = '700 12px "Comic Sans MS", "Segoe UI", sans-serif';
    ctx.fillStyle = "#9b6a4f";
    ctx.fillText("WASD — синяя искорка · стрелки — жёлтая", 632, 358);
    ctx.restore();
  }

  function drawResult(ctx, s, t) {
    ctx.save();
    ctx.fillStyle = "rgba(16, 18, 42, 0.42)";
    ctx.fillRect(0, 0, W, H);
    // Медаль-сердце.
    const pulse = 1 + Math.sin(t * 3) * 0.015;
    A.glow(ctx, 640, 346, 170, "rgba(255, 216, 115, 0.35)", 0.8);
    ctx.save();
    ctx.translate(640, 340);
    ctx.scale(pulse, pulse);
    A.heart(ctx, 0, 0, 78, "#f7ca5c", 1, 0);
    A.heart(ctx, 0, -4, 58, "#ffe89a", 0.9, 0);
    ctx.strokeStyle = "rgba(164, 111, 47, 0.55)";
    ctx.lineWidth = 3;
    A.heartPath ? A.heartPath(ctx, 0, 0, 78, 0) : null;
    if (A.heartPath) ctx.stroke();
    ctx.restore();
    ctx.fillStyle = "rgba(255, 248, 222, 0.95)";
    ctx.font = '700 22px "Comic Sans MS", "Segoe UI", sans-serif';
    ctx.textAlign = "center";
    ctx.fillText(s.resultLine, 640, 468);
    ctx.font = '600 14px "Comic Sans MS", "Segoe UI", sans-serif';
    ctx.fillStyle = "rgba(255, 245, 218, 0.7)";
    ctx.fillText("Нажмите Пробел и Enter вместе, чтобы разбить сердечко", 640, 500);
    const both = Math.abs(s.breakPresses.Space - s.breakPresses.Enter) < 0.65 && s.breakPresses.Space > 0;
    ctx.fillStyle = both ? "rgba(255, 236, 155, 0.95)" : "rgba(255, 245, 218, 0.55)";
    ctx.font = '700 15px "Comic Sans MS", "Segoe UI", sans-serif';
    ctx.fillText("Пробел + Enter", 640, 530);
    ctx.fillStyle = "rgba(255, 245, 218, 0.62)";
    ctx.font = '600 12px "Comic Sans MS", "Segoe UI", sans-serif';
    ctx.fillText(`Очки дружбы: ${s.score} · Раскрашено зон: ${s.filled} из ${s.total}`, 640, 564);
    ctx.restore();
  }

  function draw(ctx, s, t) {
    if (!s) return;
    // Небо вокруг открытки.
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#202553");
    bg.addColorStop(0.58, "#3c3a71");
    bg.addColorStop(1, "#181a39");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 24; i++) {
      A.sparkle(ctx, 70 + ((i * 173) % 1140), 20 + ((i * 91) % 90), 1.2 + (i % 3), "rgba(255,244,200,0.28)", 0.25 + 0.1 * Math.sin(t + i), t + i);
    }

    // Открытка.
    A.softShadow(ctx, 640, 670, 560, 22, 0.25);
    ctx.fillStyle = "#fffaf0";
    rr(ctx, 46, 92, 1188, 572, 28);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 235, 192, 0.65)";
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = "#f4e7cf";
    rr(ctx, PICTURE.x - 10, PICTURE.y - 10, PICTURE.w + 20, PICTURE.h + 20, 30);
    ctx.fill();

    // Небольшой заголовок на открытке.
    ctx.fillStyle = "rgba(92, 76, 91, 0.72)";
    ctx.font = '700 17px "Comic Sans MS", "Segoe UI", sans-serif';
    ctx.textAlign = "left";
    ctx.fillText("РАДУЖНЫЙ СОН", 94, 78);
    ctx.textAlign = "right";
    ctx.font = '600 11px "Comic Sans MS", "Segoe UI", sans-serif';
    ctx.fillStyle = "rgba(92, 76, 91, 0.48)";
    ctx.fillText("раскрась открытку вместе", 1190, 78);

    // Зоны. На финале ракета «оживает» и поднимается над открыткой.
    const rocketIds = new Set(["flameOuter", "flameInner", "finL", "finR", "rocket", "stripe", "nose", "window"]);
    const lifting = s.phase === "result" || s.phase === "reward";
    const liftP = lifting ? Math.min(1, Math.max(0, (s.resultT - 0.1) / 2.2)) : 0;
    const flyX = liftP * 92;
    const flyY = -liftP * 148;
    for (const z of s.zones) {
      if (rocketIds.has(z.id)) continue;
      const hovered = (s.ilya.zone === z) || (s.alisa.zone === z);
      drawZone(ctx, z, hovered);
    }
    for (const z of s.zones) {
      if (!rocketIds.has(z.id)) drawLabel(ctx, z, t);
    }
    ctx.save();
    rr(ctx, PICTURE.x, PICTURE.y, PICTURE.w, PICTURE.h, 28);
    ctx.clip();
    ctx.translate(flyX, flyY);
    for (const z of s.zones) {
      if (!rocketIds.has(z.id)) continue;
      drawZone(ctx, z, false);
    }
    for (const z of s.zones) {
      if (rocketIds.has(z.id)) drawLabel(ctx, z, t);
    }
    ctx.restore();

    // Тучки.
    for (const c of s.clouds) drawCloud(ctx, c, t);

    // Искры и курсоры.
    if (s.phase !== "result" && s.phase !== "reward") {
      drawCursor(ctx, s.ilya, "И", C.blue, t, s.ilya.zone);
      drawCursor(ctx, s.alisa, "А", C.yellow, t, s.alisa.zone);
    }

    // Частицы.
    for (const p of s.particles) {
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life / 0.6));
      if (p.kind === "star") {
        A.sparkle(ctx, p.x, p.y, p.size * 1.4, p.color, 0.9, p.life * 8);
      } else if (p.kind === "confetti") {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size * 1.6);
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    // Подсказка.
    if (s.hintT > 0 && s.hint) {
      ctx.globalAlpha = Math.min(1, s.hintT);
      ctx.fillStyle = "rgba(28, 26, 48, 0.75)";
      const w = Math.max(200, s.hint.length * 8 + 30);
      rr(ctx, 640 - w / 2, 660, w, 28, 12);
      ctx.fill();
      ctx.fillStyle = "#fff4d2";
      ctx.font = '700 12px "Comic Sans MS", "Segoe UI", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText(s.hint, 640, 679);
      ctx.globalAlpha = 1;
    }

    if (s.phase === "intro") drawIntro(ctx, s, t);
    if (s.phase === "result" || s.phase === "reward") drawResult(ctx, s, t);

    if (s.phase === "playing" || s.phase === "intro") {
      ctx.fillStyle = "rgba(255, 245, 217, 0.6)";
      ctx.font = '600 11px "Comic Sans MS", "Segoe UI", sans-serif';
      ctx.textAlign = "left";
      ctx.fillText("Илюша: WASD · Пробел", 78, 706);
      ctx.textAlign = "right";
      ctx.fillText("Алиса: ← ↑ ↓ → · Enter", 1202, 706);
    }
  }

  const Rainbow = { create, update, draw, PICTURE, COLORS: C, COLOR_NAME };
  VO.Rainbow = Rainbow;
})();
