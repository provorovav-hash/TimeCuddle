(function () {
  "use strict";

  const W = 1280;
  const H = 720;
  const TOTAL_FLOWERS = 16;
  const LAWN = { x: 72, y: 580, w: 1136, h: 28 };
  const A = VO.Art;

  const FLOWER_DEFS = [
    { x: 360, y: 190, r: 22, color: "#ff8f8f" },
    { x: 480, y: 272, r: 22, color: "#ffd15c" },
    { x: 570, y: 166, r: 21, color: "#8fd4ff" },
    { x: 680, y: 260, r: 23, color: "#c39af0" },
    { x: 760, y: 158, r: 21, color: "#ffad66" },
    { x: 900, y: 210, r: 22, color: "#f28fbd" },
    { x: 1030, y: 180, r: 22, color: "#8fe0c1" },
    { x: 1120, y: 300, r: 22, color: "#ffcf5c" },
    { x: 980, y: 390, r: 23, color: "#b7e06f" },
    { x: 860, y: 470, r: 22, color: "#ff9fc4" },
    { x: 700, y: 430, r: 22, color: "#7fc9ff" },
    { x: 520, y: 420, r: 22, color: "#ffb36b" },
    { x: 300, y: 330, r: 21, color: "#ffd15c" },
    { x: 600, y: 330, r: 21, color: "#8fd4ff" },
    { x: 1080, y: 470, r: 21, color: "#ffad66" },
    { x: 820, y: 342, r: 58, color: "#ffd76e", main: true },
  ];

  const NOTE_NAMES = [60, 62, 64, 67, 69, 72, 74, 76, 79, 81, 84, 86, 88, 89, 91, 93];

  const INTRO_LINES = [
    ["mama", "Ой, как тихо... Давайте разбудим лесной оркестр! Если цветок далеко — стреляйте вниз, в светящуюся лужайку.", 4],
  ];

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

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function dist(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }

  function makePlayer(kind, x) {
    return {
      kind,
      x,
      feetY: kind === "ilya" ? 530 : 430,
      w: kind === "ilya" ? 50 : 54,
      h: kind === "ilya" ? 92 : 102,
      aim: -0.2,
      dir: 1,
      animTime: 0,
      vx: 0,
      onGround: true,
      cooldown: 0,
    };
  }

  function create() {
    const s = {
      phase: "playing",
      elapsed: 0,
      opened: 0,
      total: TOTAL_FLOWERS,
      lawnGlow: 0.25,
      lawnBounces: 0,
      players: {
        ilya: makePlayer("ilya", 150),
        alisa: makePlayer("alisa", 255),
      },
      flowers: FLOWER_DEFS.map((def, i) => ({
        ...def,
        id: i,
        open: false,
        openAge: 0,
        openedBy: null,
        lastHit: null,
        note: NOTE_NAMES[i],
      })),
      seeds: [],
      particles: [],
      fireflies: [],
      pollen: null,
      line: null,
      lineT: 0,
      lineQueue: [],
      hint: "",
      hintT: 0,
      bounceSaid: false,
      lawnSaid: false,
      chordSaid: false,
      lastMainSaid: false,
      allOpenT: 0,
      finaleT: 0,
      hugPress: { Space: -10, Enter: -10 },
      rewardShown: false,
      firstBloom: false,
    };
    for (let i = 0; i < 26; i++) {
      s.fireflies.push({
        x: Math.random() * W,
        y: 100 + Math.random() * 520,
        r: 1 + Math.random() * 3,
        phase: Math.random() * Math.PI * 2,
        speed: 6 + Math.random() * 18,
      });
    }
    for (const l of INTRO_LINES) enqueue(s, l[0], l[1], l[2]);
    return s;
  }

  function enqueue(s, speaker, text, dur) {
    s.lineQueue.push({ speaker, text, dur: dur || 3 });
  }

  function say(s, speaker, text, dur) {
    if (s.phase === "reward") return;
    if (s.line || s.lineQueue.length) return;
    enqueue(s, speaker, text, dur || 2.8);
  }

  function showHint(s, text) {
    s.hint = text;
    s.hintT = 2.4;
  }

  function updateLine(s, dt) {
    if (s.line) {
      s.lineT -= dt;
      s.lineMinT = Math.max(0, s.lineMinT - dt);
      if (s.lineT <= 0 || (s.lineEnded && s.lineMinT <= 0)) s.line = null;
    }
    if (!s.line && s.lineQueue.length) {
      const next = s.lineQueue.shift();
      s.line = next;
      s.lineEnded = false;
      s.lineMinT = Math.min(3.2, Math.max(2.1, next.text.length * 0.02 + 1.5));
      // Голос получает всю фразу целиком. Таймер — только страховка,
      // если браузер не сообщил об окончании синтеза речи.
      const fallback = Math.max(6, next.text.length * 0.1 + 4);
      const started = VO.Sound.speak(next.text, next.speaker, {
        force: true,
        onend: () => {
          if (s.line === next) s.lineEnded = true;
        },
        onerror: () => {
          if (s.line === next) s.lineEnded = true;
        },
      });
      s.lineT = started ? fallback : Math.max(3, next.text.length * 0.045 + 1.2);
      if (!started) s.lineEnded = true;
    }
  }

  function addParticles(s, x, y, color, count, speed, kind) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = speed * (0.25 + Math.random() * 0.8);
      s.particles.push({
        x, y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - 20,
        life: 0.6 + Math.random() * 0.8,
        size: 2 + Math.random() * 4,
        color,
        kind: kind || "spark",
        rot: Math.random() * Math.PI,
      });
    }
  }

  function openFlower(s, flower, owner, silent) {
    if (flower.open) return;
    flower.open = true;
    flower.openedBy = owner;
    flower.openAge = 0;
    s.opened++;
    addParticles(s, flower.x, flower.y, flower.color, flower.main ? 55 : 24, flower.main ? 220 : 140, "petal");
    if (!silent) {
      VO.Sound.flowerBloom(flower.id);
      addParticles(s, flower.x, flower.y, "#ffe9a6", 8, 100, "star");
    }
    if (!s.firstBloom) {
      s.firstBloom = true;
      say(s, "alisa", "Ой, он зазвенел! Смотри, как красиво раскрылся!", 2.8);
    }
    if (s.opened === s.total) s.allOpenT = 0.01;
  }

  function triggerChord(s, owner) {
    if (s.chordSaid) return;
    s.chordSaid = true;
    const main = s.flowers.find((f) => f.main);
    const radius = 210;
    s.pollen = { x: main.x, y: main.y, t: 0, max: 1.5, radius };
    openFlower(s, main, "both", true);
    for (const f of s.flowers) {
      if (f.main || f.open) continue;
      if (dist(f.x, f.y, main.x, main.y) <= radius) {
        openFlower(s, f, owner, true);
      }
    }
    VO.Sound.flowerChord();
    VO.Sound.celebrate();
    addParticles(s, main.x, main.y, "#ffe68a", 70, 280, "star");
    addParticles(s, main.x, main.y, "#ff9fc4", 35, 200, "petal");
    say(s, "mama", "Вот это аккорд! Золотая кувшинка раскрылась, и ближние цветы запели вместе с ней!", 3.4);
    say(s, "alisa", "Ура! Цветы вокруг кувшинки проснулись!", 2.4);
    say(s, "ilya", "Остальные бутоны тоже раскроем — стреляем!", 2.4);
  }

  function hitMain(s, ball, flower) {
    const otherBall = s.seeds.some((b) =>
      b !== ball && !b.dead && b.owner !== ball.owner &&
      dist(b.x, b.y, flower.x, flower.y) < flower.r + 60
    );
    const recent = flower.lastHit && flower.lastHit.owner !== ball.owner &&
      s.elapsed - flower.lastHit.t < 0.6;
    if (otherBall || recent) {
      triggerChord(s, ball.owner);
    } else {
      flower.lastHit = { owner: ball.owner, t: s.elapsed };
      addParticles(s, flower.x, flower.y, "#ffe9a6", 16, 100, "star");
      VO.Sound.seedBounce();
      showHint(s, "Ещё одно семечко от другого игрока — и получится аккорд!");
      if (!s.lastMainSaid) {
        s.lastMainSaid = true;
        say(s, "mama", "Главный Бутон ждёт вас двоих: попадите в него синим и розовым семечком вместе!", 3);
      }
    }
    ball.dead = true;
  }

  function shoot(s, p, owner) {
    if (p.cooldown > 0) return;
    p.cooldown = owner === "alisa" ? 0.24 : 0.34;
    const speed = 660;
    const sx = p.x + 27;
    const sy = p.feetY - p.h * 0.6 - 8 - (owner === "ilya" ? 1 : 0);
    s.seeds.push({
      x: sx,
      y: sy,
      vx: Math.cos(p.aim) * speed,
      vy: Math.sin(p.aim) * speed,
      r: owner === "alisa" ? 8 : 10,
      owner,
      color: owner === "alisa" ? "#ff9fc4" : "#7fc9ff",
      life: 2.2,
      trail: [],
      bounces: 0,
      bounceT: 0,
      lawnBounces: 0,
    });
    addParticles(s, sx, sy, owner === "alisa" ? "#ff9fc4" : "#7fc9ff", 7, 80, "spark");
    VO.Sound.seedShot(owner);
  }

  function updatePlayers(s, dt, input) {
    for (const kind of ["ilya", "alisa"]) {
      const p = s.players[kind];
      const up = kind === "ilya" ? "KeyW" : "ArrowUp";
      const down = kind === "ilya" ? "KeyS" : "ArrowDown";
      const aimUp = kind === "ilya" ? "KeyA" : "ArrowLeft";
      const aimDown = kind === "ilya" ? "KeyD" : "ArrowRight";
      const shot = kind === "ilya" ? "Space" : "Enter";
      const speed = 235 / 1.7;
      const aimStep = 1.5 / 1.7;
      p.vx = 0;
      if (input.isDown(up)) p.feetY -= speed * dt;
      if (input.isDown(down)) p.feetY += speed * dt;
      p.feetY = clamp(p.feetY, 220, 590);
      p.animTime += dt;
      if (input.isDown(aimUp)) p.aim -= aimStep * dt;
      if (input.isDown(aimDown)) p.aim += aimStep * dt;
      p.aim = clamp(p.aim, -1.14, 0.75);
      p.cooldown = Math.max(0, p.cooldown - dt);
      if (input.justPressed(shot) && s.phase === "playing") shoot(s, p, kind);
    }
  }

  function bounceOnLawn(s, ball, prevY) {
    if (ball.vy <= 0 || (ball.lawnBounces || 0) >= 2) return false;
    if (ball.x < LAWN.x || ball.x > LAWN.x + LAWN.w) return false;
    const crossed = prevY + ball.r <= LAWN.y && ball.y + ball.r >= LAWN.y;
    const inside = ball.y + ball.r >= LAWN.y && ball.y - ball.r <= LAWN.y + LAWN.h;
    if (!crossed && !inside) return false;
    ball.lawnBounces = (ball.lawnBounces || 0) + 1;
    ball.y = LAWN.y - ball.r;
    ball.vy = -Math.max(320, Math.abs(ball.vy) * 0.92 + 140);
    ball.vx = Math.max(260, ball.vx);
    s.lawnGlow = 1.25;
    s.lawnBounces++;
    addParticles(s, ball.x, LAWN.y, "#ffe9a6", 16, 160, "petal");
    addParticles(s, ball.x, LAWN.y, "#b7e06f", 10, 120, "spark");
    VO.Sound.lawnBounce();
    if (!s.lawnSaid) {
      s.lawnSaid = true;
      say(s, "mama", "Светящаяся лужайка подбросила семечко вверх!", 2.8);
    }
    return true;
  }

  function updateSeeds(s, dt) {
    for (const ball of s.seeds) {
      ball.life -= dt;
      ball.bounceT = Math.max(0, ball.bounceT - dt);
      ball.trail.push({ x: ball.x, y: ball.y, life: 0.28 });
      for (const tr of ball.trail) tr.life -= dt;
      while (ball.trail.length && ball.trail[0].life <= 0) ball.trail.shift();
      const prevY = ball.y;
      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;
      if (ball.life <= 0 || ball.x < -60 || ball.x > W + 80 || ball.y < -70 || ball.y > H + 80) {
        ball.dead = true;
        continue;
      }
      if (bounceOnLawn(s, ball, prevY)) continue;
      for (const flower of s.flowers) {
        if (dist(ball.x, ball.y, flower.x, flower.y) < ball.r + flower.r) {
          if (flower.main) {
            if (!flower.open) hitMain(s, ball, flower);
            else if (ball.bounceT <= 0) bounceSeed(s, ball, flower);
            break;
          }
          if (flower.open) {
            if (ball.bounceT <= 0) bounceSeed(s, ball, flower);
            break;
          }
          openFlower(s, flower, ball.owner, false);
          ball.dead = true;
          break;
        }
      }
    }
    s.seeds = s.seeds.filter((b) => !b.dead);
  }

  function bounceSeed(s, ball, flower) {
    if (ball.bounces >= 2) {
      ball.dead = true;
      return;
    }
    ball.bounces++;
    ball.bounceT = 0.28;
    ball.vy = -Math.max(300, Math.abs(ball.vy) + 180);
    ball.vx = Math.max(220, ball.vx * 0.82);
    addParticles(s, ball.x, ball.y, flower.color, 10, 110, "petal");
    VO.Sound.seedBounce();
    if (!s.bounceSaid) {
      s.bounceSaid = true;
      say(s, "mama", "Вот это прыгучее семечко! Прыг-скок — и может раскрыться новый цветок!", 3);
    }
  }

  function startFinale(s) {
    if (s.phase === "finale" || s.phase === "reward") return;
    s.phase = "finale";
    s.finaleT = 0;
    s.seeds = [];
    s.pollen = null;
    s.line = null;
    s.lineQueue = [];
    VO.Sound.stopSpeech();
    VO.Sound.celebrate();
    enqueue(s, "mama", "Послушайте, какая музыка! Весь лес поёт вместе с вами. Вы настоящие лесные волшебники! Обнимитесь, и белочки принесут награду.", 4.2);
    enqueue(s, "alisa", "Ура! Поляна расцвела и поёт!", 2.2);
    enqueue(s, "ilya", "Алиса, я уже на мостике — обнимаемся!", 2.2);
  }

  function update(s, dt, input) {
    if (!s) return;
    s.elapsed += dt;
    updateLine(s, dt);
    for (const p of s.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 80 * dt;
      p.rot += dt * 1.5;
    }
    s.particles = s.particles.filter((p) => p.life > 0);
    for (const f of s.fireflies) {
      f.x += Math.cos(s.elapsed * 0.7 + f.phase) * f.speed * dt;
      f.y += Math.sin(s.elapsed * 0.9 + f.phase) * f.speed * 0.6 * dt;
      if (f.x < 0) f.x = W;
      if (f.x > W) f.x = 0;
    }
    if (s.hintT > 0) s.hintT -= dt;
    s.lawnGlow = Math.max(0.25, s.lawnGlow - dt * 0.75);
    for (const f of s.flowers) if (f.openAge < 1) f.openAge = Math.min(1, f.openAge + dt * 3);
    if (s.pollen) {
      s.pollen.t += dt;
      if (s.pollen.t >= s.pollen.max) s.pollen = null;
    }

    if (s.phase === "intro") {
      if (!s.line && !s.lineQueue.length) s.phase = "playing";
      return;
    }

    if (s.phase === "playing") {
      updatePlayers(s, dt, input);
      updateSeeds(s, dt);
      if (s.allOpenT > 0) {
        s.allOpenT += dt;
        if (s.allOpenT > 0.9) startFinale(s);
      }
      const main = s.flowers.find((f) => f.main);
      if (s.opened === s.total - 1 && main && !main.open && !s.lastMainSaid) {
        s.lastMainSaid = true;
        say(s, "mama", "Остался Главный Бутон! Попадите в него вдвоём — синим и розовым семечком!", 3.4);
      }
      return;
    }

    if (s.phase === "finale") {
      s.finaleT += dt;
      const p1 = s.players.ilya;
      const p2 = s.players.alisa;
      p1.x += (570 - p1.x) * Math.min(1, dt * 2);
      p2.x += (710 - p2.x) * Math.min(1, dt * 2);
      p1.feetY += (500 - p1.feetY) * Math.min(1, dt * 2);
      p2.feetY += (500 - p2.feetY) * Math.min(1, dt * 2);
      if (s.finaleT > 1) {
        if (input.justPressed("Space")) s.hugPress.Space = s.finaleT;
        if (input.justPressed("Enter")) s.hugPress.Enter = s.finaleT;
        const both = Math.abs(s.hugPress.Space - s.hugPress.Enter) < 0.8 &&
          s.hugPress.Space > 0 && s.hugPress.Enter > 0;
        if (both) {
          s.phase = "reward";
          s.rewardShown = true;
          VO.Sound.celebrate();
          VO.Sound.flowerChord();
          addParticles(s, W / 2, 300, "#ffe68a", 80, 280, "star");
          addParticles(s, W / 2, 300, "#ff9fc4", 50, 220, "petal");
        }
      }
    }
  }

  function drawBackground(ctx, s) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#06172d");
    g.addColorStop(0.45, "#0b2f43");
    g.addColorStop(1, "#123f3f");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Луна.
    A.glow(ctx, 1050, 115, 120, "rgba(255, 237, 170, 0.4)", 0.8);
    ctx.fillStyle = "#ffefb2";
    ctx.beginPath();
    ctx.arc(1050, 115, 47, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(224, 206, 141, 0.4)";
    ctx.beginPath();
    ctx.arc(1035, 105, 10, 0, Math.PI * 2);
    ctx.arc(1062, 130, 7, 0, Math.PI * 2);
    ctx.fill();

    // Звёзды.
    for (let i = 0; i < 55; i++) {
      const x = (i * 223) % W;
      const y = 20 + ((i * 71) % 280);
      ctx.globalAlpha = 0.25 + ((i * 13) % 40) / 100;
      ctx.fillStyle = "#fff4c9";
      ctx.beginPath();
      ctx.arc(x, y, i % 5 === 0 ? 2 : 1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Деревья и ветки.
    for (const side of [0, 1]) {
      const base = side ? W - 70 : 70;
      ctx.fillStyle = "#14302f";
      ctx.beginPath();
      ctx.moveTo(base - 55, H);
      ctx.quadraticCurveTo(base - 20, 420, base, 90);
      ctx.quadraticCurveTo(base + 20, 420, base + 55, H);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#204740";
      ctx.lineWidth = 4;
      for (let i = 0; i < 4; i++) {
        const yy = 170 + i * 100;
        ctx.beginPath();
        ctx.moveTo(base, yy);
        ctx.quadraticCurveTo(base + (side ? -120 : 120), yy - 25, base + (side ? -240 : 240), yy + 8);
        ctx.stroke();
      }
    }

    // Ветки-мишени.
    ctx.strokeStyle = "#254b42";
    ctx.lineCap = "round";
    ctx.lineWidth = 6;
    for (const f of s.flowers) {
      ctx.beginPath();
      ctx.moveTo(f.x - 95, f.y + 26);
      ctx.quadraticCurveTo(f.x, f.y + 5, f.x + 70, f.y - 12);
      ctx.stroke();
    }

    // Тропинка и мостик.
    const ground = ctx.createLinearGradient(0, 565, 0, H);
    ground.addColorStop(0, "#183f38");
    ground.addColorStop(1, "#0c2826");
    ctx.fillStyle = ground;
    ctx.beginPath();
    ctx.moveTo(0, 580);
    ctx.quadraticCurveTo(320, 545, 640, 580);
    ctx.quadraticCurveTo(960, 545, W, 580);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#7b5e43";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(430, 585);
    ctx.quadraticCurveTo(640, 540, 850, 585);
    ctx.stroke();
    ctx.lineWidth = 4;
    for (let i = 0; i < 7; i++) {
      const x = 460 + i * 62;
      ctx.beginPath();
      ctx.moveTo(x, 550 + Math.sin(i) * 4);
      ctx.lineTo(x, 590);
      ctx.stroke();
    }

    // Светлячки.
    for (const f of s.fireflies) {
      A.glow(ctx, f.x, f.y, f.r * 8, "rgba(255, 238, 145, 0.3)", 0.4);
      ctx.fillStyle = "#fff0a3";
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Лесенки и лианы.
    for (const kind of ["ilya", "alisa"]) {
      const p = s.players[kind];
      const x = p.x;
      ctx.strokeStyle = kind === "ilya" ? "#8d704b" : "#5f9b78";
      ctx.lineWidth = kind === "ilya" ? 5 : 4;
      ctx.beginPath();
      ctx.moveTo(x - 34, 210);
      ctx.lineTo(x - 34, 590);
      ctx.moveTo(x + 34, 210);
      ctx.lineTo(x + 34, 590);
      for (let y = 235; y < 590; y += 38) {
        ctx.moveTo(x - 34, y);
        ctx.lineTo(x + 34, y);
      }
      ctx.stroke();
    }
  }

  function drawFlower(ctx, f, t) {
    ctx.save();
    ctx.translate(f.x, f.y);
    const age = f.open ? Math.min(1, f.openAge + 0.2) : 1;
    if (f.open) {
      A.glow(ctx, 0, 0, f.main ? 170 : 66, f.main ? "rgba(255, 220, 120, 0.4)" : f.color, f.main ? 0.8 : 0.45);
      ctx.save();
      ctx.scale(0.75 + age * 0.25, 0.75 + age * 0.25);
      const petals = f.main ? 10 : 6;
      for (let i = 0; i < petals; i++) {
        const a = (i / petals) * Math.PI * 2 + (f.main ? 0.2 : 0);
        const px = Math.cos(a) * f.r * 0.55;
        const py = Math.sin(a) * f.r * 0.55;
        ctx.fillStyle = f.main ? (i % 2 ? "#ffe28a" : "#ffca67") : f.color;
        ctx.beginPath();
        ctx.ellipse(px, py, f.r * 0.48, f.r * 0.3, a, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = f.main ? "#fff2ad" : "#ffe9a6";
      ctx.beginPath();
      ctx.arc(0, 0, f.r * 0.36, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = f.main ? "#c58a35" : "#d0a348";
      ctx.beginPath();
      ctx.arc(0, 0, f.r * 0.16, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      A.sparkle(ctx, f.r * 0.9, -f.r * 0.6, f.main ? 7 : 3, "#fff5c9", 0.8, t + f.id);
    } else {
      ctx.strokeStyle = "#4d7556";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, f.r * 0.6);
      ctx.quadraticCurveTo(-12, f.r + 20, -5, f.r + 40);
      ctx.stroke();
      ctx.fillStyle = "#7e9187";
      ctx.beginPath();
      ctx.moveTo(0, -f.r);
      ctx.quadraticCurveTo(f.r * 0.8, -f.r * 0.2, f.r * 0.42, f.r * 0.65);
      ctx.quadraticCurveTo(0, f.r * 0.95, -f.r * 0.42, f.r * 0.65);
      ctx.quadraticCurveTo(-f.r * 0.8, -f.r * 0.2, 0, -f.r);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -f.r * 0.8);
      ctx.lineTo(0, f.r * 0.6);
      ctx.stroke();
      ctx.fillStyle = "rgba(255, 246, 210, 0.35)";
      ctx.font = '700 9px "Comic Sans MS", "Segoe UI", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText("zzz", f.r * 0.8, -f.r * 0.9);
    }
    ctx.restore();
  }

  function drawPlayer(ctx, p, t) {
    const drawP = {
      kind: p.kind,
      x: p.x - p.w / 2,
      y: p.feetY - p.h,
      w: p.w,
      h: p.h,
      dir: 1,
      onGround: true,
      vx: 0,
      animTime: p.animTime,
      hugPose: 0,
    };
    A.drawCharacter(ctx, drawP, t);
    const sx = p.x + 24;
    const sy = p.feetY - p.h * 0.6 - 8 - (p.kind === "ilya" ? 1 : 0);
    const ex = sx + Math.cos(p.aim) * 46;
    const ey = sy + Math.sin(p.aim) * 46;
    ctx.save();
    ctx.strokeStyle = "#b78a55";
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(p.x + 4, sy + 4);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ctx.strokeStyle = p.kind === "ilya" ? "#7fc9ff" : "#ff9fc4";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex + Math.cos(p.aim) * 12, ey + Math.sin(p.aim) * 12);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255, 246, 196, 0.34)";
    ctx.lineWidth = 1.4;
    ctx.setLineDash([4, 9]);
    ctx.beginPath();
    ctx.moveTo(ex + Math.cos(p.aim) * 15, ey + Math.sin(p.aim) * 15);
    ctx.lineTo(ex + Math.cos(p.aim) * 140, ey + Math.sin(p.aim) * 140);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  function drawSeeds(ctx, s) {
    for (const b of s.seeds) {
      for (const tr of b.trail) {
        ctx.globalAlpha = Math.max(0, tr.life / 0.28) * 0.45;
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(tr.x, tr.y, b.r * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      A.glow(ctx, b.x, b.y, b.r * 4, b.color, 0.7);
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.beginPath();
      ctx.arc(b.x - b.r * 0.25, b.y - b.r * 0.3, b.r * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawParticles(ctx, s) {
    for (const p of s.particles) {
      ctx.save();
      ctx.globalAlpha = clamp(p.life / 0.8, 0, 1);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      if (p.kind === "petal") {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 1.3, p.size * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.kind === "star") {
        A.sparkle(ctx, 0, 0, p.size, p.color, 0.9, p.rot);
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawPollen(ctx, s) {
    if (!s.pollen) return;
    const p = clamp(s.pollen.t / s.pollen.max, 0, 1);
    ctx.save();
    ctx.globalAlpha = 1 - p;
    ctx.strokeStyle = "rgba(255, 235, 150, 0.8)";
    ctx.lineWidth = 8 * (1 - p) + 2;
    ctx.beginPath();
    const maxR = s.pollen.radius || 210;
    ctx.arc(s.pollen.x, s.pollen.y, 70 + p * Math.max(0, maxR - 70), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawFinale(ctx, s, t) {
    ctx.save();
    ctx.fillStyle = "rgba(5, 22, 29, 0.2)";
    ctx.fillRect(0, 0, W, H);
    A.glow(ctx, 640, 350, 160, "rgba(255, 225, 140, 0.25)", 0.8);
    ctx.fillStyle = "rgba(255, 249, 219, 0.95)";
    ctx.font = '700 25px "Comic Sans MS", "Segoe UI", sans-serif';
    ctx.textAlign = "center";
    ctx.fillText("Поляна расцвела!", 640, 210);
    ctx.font = '700 15px "Comic Sans MS", "Segoe UI", sans-serif';
    ctx.fillStyle = "rgba(255, 242, 199, 0.8)";
    ctx.fillText("Дети уже бегут по мостику", 640, 238);
    ctx.fillText("Пробел + Enter — обнимашки", 640, 262);
    ctx.restore();
  }

  function drawLawn(ctx, s) {
    const glow = clamp((s.lawnGlow - 0.25) / 1, 0, 1);
    ctx.save();
    if (glow > 0.05) {
      A.glow(ctx, LAWN.x + LAWN.w / 2, LAWN.y + 10, LAWN.w * 0.58, "rgba(255, 232, 135, 0.27)", glow * 0.7);
    }
    A.fillRR(ctx, LAWN.x, LAWN.y, LAWN.w, LAWN.h, 13, "rgba(42, 88, 55, 0.92)");
    A.fillRR(ctx, LAWN.x + 5, LAWN.y + 4, LAWN.w - 10, 3, 2, `rgba(180, 235, 133, ${0.28 + glow * 0.5})`);
    const colors = ["#ff9d9d", "#ffd86a", "#8fd4ff", "#f7a9c8", "#b9e677"];
    for (let i = 0; i < 38; i++) {
      const x = LAWN.x + 18 + i * 29;
      const sway = Math.sin(s.elapsed * 1.8 + i) * 2;
      const y = LAWN.y + 14 + (i % 3) * 3;
      ctx.strokeStyle = "rgba(138, 199, 105, 0.8)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(x, y + 7);
      ctx.lineTo(x + sway, y - 4);
      ctx.stroke();
      const alpha = 0.42 + glow * 0.58;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = colors[i % colors.length];
      for (let p = 0; p < 5; p++) {
        const a = (p / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.ellipse(x + sway + Math.cos(a) * 3.5, y - 4 + Math.sin(a) * 3, 2.2, 1.5, a, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "#ffe9a6";
      ctx.beginPath();
      ctx.arc(x + sway, y - 4, 1.4, 0, Math.PI * 2);
      ctx.fill();
      if (glow > 0.35 && i % 5 === 0) A.sparkle(ctx, x + sway, y - 10, 2, "#fff2b3", glow, s.elapsed + i);
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = `rgba(255, 244, 181, ${0.35 + glow * 0.5})`;
    ctx.font = '700 9px "Comic Sans MS", "Segoe UI", sans-serif';
    ctx.textAlign = "center";
    ctx.fillText("СВЕТЯЩАЯСЯ ЛУЖАЙКА · СЕМЕЧКО ОТСКОЧИТ ВВЕРХ", LAWN.x + LAWN.w / 2, LAWN.y - 8);
    ctx.restore();
  }

  function draw(ctx, s, t) {
    if (!s) return;
    drawBackground(ctx, s);
    drawLawn(ctx, s);
    for (const f of s.flowers) drawFlower(ctx, f, t);
    drawPlayer(ctx, s.players.ilya, t);
    drawPlayer(ctx, s.players.alisa, t);
    drawSeeds(ctx, s);
    drawPollen(ctx, s);
    drawParticles(ctx, s);

    if (s.hintT > 0 && s.hint) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, s.hintT);
      const hw = Math.max(290, s.hint.length * 7 + 36);
      ctx.fillStyle = "rgba(12, 31, 34, 0.8)";
      rr(ctx, 640 - hw / 2, 84, hw, 31, 13);
      ctx.fill();
      ctx.fillStyle = "#ffe7a8";
      ctx.font = '700 11px "Comic Sans MS", "Segoe UI", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText(s.hint, 640, 104);
      ctx.restore();
    }

    if (s.phase === "finale" || s.phase === "reward") drawFinale(ctx, s, t);
  }

  VO.Forest = { create, update, draw, TOTAL_FLOWERS };
})();
