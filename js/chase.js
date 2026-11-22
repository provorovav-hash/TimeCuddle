(function () {
  "use strict";

  const W = 1280;
  const H = 720;
  const ARENA = { x: 46, y: 126, w: 1188, h: 510 };
  const ROUND_TIME = 60;
  const INVIS_TIME = 3;
  const INVIS_CD = 7;
  const A = VO.Art;

  const OBSTACLES = [
    { x: 250, y: 270, r: 58, type: "oak" },
    { x: 530, y: 380, r: 76, type: "oak" },
    { x: 850, y: 250, r: 58, type: "fir" },
    { x: 1080, y: 430, r: 68, type: "oak" },
    { x: 420, y: 520, r: 47, type: "fir" },
    { x: 730, y: 540, r: 50, type: "fir" },
    { x: 170, y: 510, r: 35, type: "rock" },
    { x: 780, y: 190, r: 34, type: "rock" },
    { x: 1130, y: 200, r: 35, type: "bush" },
    { x: 330, y: 345, r: 35, type: "bush" },
    { x: 1020, y: 590, r: 34, type: "bush" },
  ];

  const BONUS_TYPES = ["berry", "mushroom", "cone", "fireflies"];

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

  function makePlayer(kind, x, y) {
    return {
      kind,
      x,
      y,
      r: 19,
      speed: 110,
      dir: { x: 0, y: 1 },
      invisT: 0,
      cooldown: 0,
      slowT: 0,
      boostT: 0,
      hopT: 0,
      fireflies: 0,
      trail: [],
      anim: 0,
      moving: false,
    };
  }

  function create() {
    const s = {
      phase: "rules",
      elapsed: 0,
      rulesT: 0,
      readyT: 0,
      round: 1,
      chaser: "ilya",
      runner: "alisa",
      time: ROUND_TIME,
      roundEndT: 0,
      roundEndKind: "",
      lastAward: null,
      roleAfterRound: false,
      stars: { ilya: 0, alisa: 0 },
      finalT: 0,
      hugPress: { Space: -10, Enter: -10 },
      players: {
        ilya: makePlayer("ilya", 300, 390),
        alisa: makePlayer("alisa", 950, 390),
      },
      bonuses: [],
      clouds: [],
      particles: [],
      bonusT: 2.5,
      line: null,
      lineT: 0,
      lineEnded: false,
      lineMinT: 0,
      lineQueue: [],
      readyPress: { Space: -10, Enter: -10 },
      invisSaid: false,
      catchSaid: false,
      rewardShown: false,
    };
    resetPositions(s);
    enqueue(s, "mama", "Смотрите на картинку. Бегайте, прячьтесь и не забудьте про волшебную невидимость!", 3.4);
    return s;
  }

  function enqueue(s, speaker, text, dur) {
    s.lineQueue.push({ speaker, text, dur: dur || 2.8 });
  }

  function say(s, speaker, text, dur) {
    if (s.phase === "reward") return;
    if (s.line || s.lineQueue.length) return;
    enqueue(s, speaker, text, dur);
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

  function resetPositions(s) {
    const chase = s.players[s.chaser];
    const run = s.players[s.runner];
    const chaseLeft = s.chaser === "ilya";
    chase.x = chaseLeft ? 310 : 970;
    chase.y = 420;
    run.x = chaseLeft ? 970 : 310;
    run.y = 420;
    for (const p of [chase, run]) {
      p.invisT = 0;
      p.cooldown = 0;
      p.slowT = 0;
      p.boostT = 0;
      p.hopT = 0;
      p.fireflies = 0;
      p.trail = [];
    }
  }

  function startRound(s) {
    s.phase = "round";
    s.time = ROUND_TIME;
    s.roundEndT = 0;
    s.catchSaid = false;
    s.invisSaid = false;
    s.bonuses = [];
    s.clouds = [];
    resetPositions(s);
    VO.Sound.chaseWhistle();
    if (s.round === 1) {
      enqueue(s, "mama", "Илюша водит", 1.8);
    } else if (!s.roleAfterRound) {
      enqueue(s, "mama", "Водит Алиса", 1.8);
    }
    s.roleAfterRound = false;
  }

  function startFinale(s) {
    s.phase = "finale";
    s.finalT = 0;
    s.time = 0;
    s.bonuses = [];
    s.clouds = [];
    s.players.ilya.x = 570;
    s.players.ilya.y = 390;
    s.players.alisa.x = 710;
    s.players.alisa.y = 390;
    s.players.ilya.invisT = 0;
    s.players.alisa.invisT = 0;
    VO.Sound.celebrate();
    enqueue(s, "mama", "Вот это забег! Вы оба настоящие лесные бегуны! Обнимитесь на полянке!", 3.8);
    enqueue(s, "alisa", "Ура! Смотрите, зверята вышли из кустов!", 2.4);
    enqueue(s, "ilya", "Алиса, иди сюда — обнимашки!", 2.2);
  }

  function finishRound(s, kind) {
    if (s.phase !== "round") return;
    s.phase = "roundEnd";
    s.roundEndT = 0;
    s.roundEndKind = kind;
    const winner = kind === "catch" ? s.chaser : s.runner;
    const stars = kind === "catch"
      ? Math.max(1, Math.ceil((s.time / ROUND_TIME) * 6))
      : 6;
    s.stars[winner] += stars;
    s.lastAward = { winner, stars, kind };
    if (kind === "catch") {
      VO.Sound.chaseCatch();
      enqueue(s, s.chaser, s.chaser === "ilya" ? "Поймал" : "Поймала", 1.8);
      if (s.round === 1) {
        s.roleAfterRound = true;
        enqueue(s, "mama", "Водит Алиса", 1.5);
      }
    } else {
      VO.Sound.celebrate();
      enqueue(s, "mama", `Время вышло! ${winner === "alisa" ? "Алиса" : "Илюша"} убежал${winner === "alisa" ? "а" : ""} от погони и получает ${stars} звёздочек!`, 3.4);
    }
  }

  function activateInvisibility(s, p) {
    if (p.cooldown > 0) return;
    const multiplier = 1 + (p.fireflies || 0);
    p.invisT = INVIS_TIME * multiplier;
    p.cooldown = INVIS_CD;
    VO.Sound.chaseInvis();
    for (let i = 0; i < 18; i++) {
      s.particles.push({
        x: p.x + (Math.random() - 0.5) * 30,
        y: p.y + (Math.random() - 0.5) * 30,
        vx: (Math.random() - 0.5) * 80,
        vy: -30 - Math.random() * 60,
        life: 0.7 + Math.random() * 0.5,
        size: 2 + Math.random() * 3,
        color: p.kind === "ilya" ? "#8fd4ff" : "#ffb0cf",
        kind: "spark",
      });
    }
    if (!s.invisSaid) {
      s.invisSaid = true;
    }
  }

  function safeSpot(s, exclude) {
    for (let i = 0; i < 40; i++) {
      const x = ARENA.x + 70 + Math.random() * (ARENA.w - 140);
      const y = ARENA.y + 70 + Math.random() * (ARENA.h - 140);
      if (exclude && dist(x, y, exclude.x, exclude.y) < 80) continue;
      let ok = true;
      for (const o of OBSTACLES) {
        if (dist(x, y, o.x, o.y) < o.r + 38) { ok = false; break; }
      }
      if (ok) return { x, y };
    }
    return { x: ARENA.x + ARENA.w / 2, y: ARENA.y + ARENA.h / 2 };
  }

  function spawnBonus(s) {
    if (s.bonuses.length >= 3) return;
    const type = BONUS_TYPES[Math.floor(Math.random() * BONUS_TYPES.length)];
    const spot = safeSpot(s);
    s.bonuses.push({ type, x: spot.x, y: spot.y, t: 0, bob: Math.random() * 6 });
    VO.Sound.chaseBonus(type);
  }

  function hopPlayer(s, p) {
    let angle = Math.random() * Math.PI * 2;
    if (Math.abs(p.dir.x) + Math.abs(p.dir.y) > 0.1) angle = Math.atan2(p.dir.y, p.dir.x);
    let dest = null;
    for (let i = 0; i < 18; i++) {
      const a = angle + (i % 2 ? 1 : -1) * (i * 0.22);
      const x = p.x + Math.cos(a) * 280;
      const y = p.y + Math.sin(a) * 280;
      if (x < ARENA.x + 45 || x > ARENA.x + ARENA.w - 45 || y < ARENA.y + 45 || y > ARENA.y + ARENA.h - 45) continue;
      let ok = true;
      for (const o of OBSTACLES) if (dist(x, y, o.x, o.y) < o.r + p.r + 8) { ok = false; break; }
      if (ok) { dest = { x, y }; break; }
    }
    if (!dest) dest = safeSpot(s, p);
    for (let i = 0; i < 14; i++) {
      s.particles.push({
        x: p.x, y: p.y,
        vx: (Math.random() - 0.5) * 130,
        vy: -40 - Math.random() * 80,
        life: 0.7 + Math.random() * 0.5,
        size: 2 + Math.random() * 4,
        color: i % 2 ? "#ffe6a0" : "#d8f3b3",
        kind: "petal",
      });
    }
    p.x = dest.x;
    p.y = dest.y;
    p.hopT = 0.5;
    VO.Sound.boing();
  }

  function applyBonus(s, p, b) {
    if (b.type === "berry") {
      p.boostT = 5;
      VO.Sound.chaseBonus("berry");
      enqueue(s, p.kind, "Земляничка-скороходка! Я теперь быстрый!", 2);
    } else if (b.type === "mushroom") {
      hopPlayer(s, p);
      enqueue(s, p.kind, "Боинг! Я перелетел через кусты!", 2);
    } else if (b.type === "cone") {
      const other = s.players[p.kind === "ilya" ? "alisa" : "ilya"];
      s.clouds.push({
        x: other.x,
        y: other.y,
        t: 0,
        max: 5,
        r: 105,
        owner: p.kind,
        affected: new Set([other.kind]),
      });
      other.slowT = Math.max(other.slowT, 3.2);
      VO.Sound.chaseBonus("cone");
      VO.Sound.chaseSlow();
      enqueue(s, p.kind, "Ой, шишка-липучка! Ловите пушистое облачко!", 2.2);
    } else {
      p.fireflies = (p.fireflies || 0) + 1;
      p.cooldown = 0;
      if (p.invisT > 0) p.invisT = INVIS_TIME * (1 + p.fireflies);
      VO.Sound.chaseBonus("fireflies");
      enqueue(s, p.kind, `Светлячки! Теперь невидимость ×${1 + p.fireflies}!`, 2.2);
    }
  }

  function updatePlayers(s, dt, input) {
    for (const kind of ["ilya", "alisa"]) {
      const p = s.players[kind];
      const up = kind === "ilya" ? "KeyW" : "ArrowUp";
      const down = kind === "ilya" ? "KeyS" : "ArrowDown";
      const left = kind === "ilya" ? "KeyA" : "ArrowLeft";
      const right = kind === "ilya" ? "KeyD" : "ArrowRight";
      const action = kind === "ilya" ? "Space" : "Enter";
      let dx = 0, dy = 0;
      if (input.isDown(left)) dx--;
      if (input.isDown(right)) dx++;
      if (input.isDown(up)) dy--;
      if (input.isDown(down)) dy++;
      p.moving = dx !== 0 || dy !== 0;
      if (p.moving) {
        const len = Math.hypot(dx, dy);
        dx /= len;
        dy /= len;
        p.dir = { x: dx, y: dy };
        const speed = p.speed * (p.slowT > 0 ? 0.02 : (p.boostT > 0 ? 3 : 1));
        p.x += dx * speed * dt;
        p.y += dy * speed * dt;
      }
      p.x = clamp(p.x, ARENA.x + p.r, ARENA.x + ARENA.w - p.r);
      p.y = clamp(p.y, ARENA.y + p.r, ARENA.y + ARENA.h - p.r);
      if (p.invisT <= 0) {
        for (const o of OBSTACLES) {
          const dd = dist(p.x, p.y, o.x, o.y);
          if (dd < p.r + o.r) {
            const a = Math.atan2(p.y - o.y, p.x - o.x);
            p.x = o.x + Math.cos(a) * (p.r + o.r);
            p.y = o.y + Math.sin(a) * (p.r + o.r);
          }
        }
      }
      p.x = clamp(p.x, ARENA.x + p.r, ARENA.x + ARENA.w - p.r);
      p.y = clamp(p.y, ARENA.y + p.r, ARENA.y + ARENA.h - p.r);
      p.anim += dt;
      p.invisT = Math.max(0, p.invisT - dt);
      p.cooldown = Math.max(0, p.cooldown - dt);
      p.slowT = Math.max(0, p.slowT - dt);
      p.boostT = Math.max(0, p.boostT - dt);
      p.hopT = Math.max(0, p.hopT - dt);
      if (p.boostT > 0 && p.moving) {
        p.trail.push({ x: p.x, y: p.y, life: 0.4, color: "#ffb7c8" });
      }
      for (const tr of p.trail) tr.life -= dt;
      p.trail = p.trail.filter((tr) => tr.life > 0);
      if (input.justPressed(action)) activateInvisibility(s, p);
      for (const b of s.bonuses) {
        if (!b.taken && dist(p.x, p.y, b.x, b.y) < p.r + 17) {
          b.taken = true;
          applyBonus(s, p, b);
        }
      }
    }
    s.bonuses = s.bonuses.filter((b) => !b.taken);
  }

  function updateClouds(s, dt) {
    for (const c of s.clouds) {
      c.t += dt;
      for (const kind of ["ilya", "alisa"]) {
        if (kind === c.owner) continue;
        const p = s.players[kind];
        const radius = c.r || 70;
        if (!c.affected.has(kind) && dist(p.x, p.y, c.x, c.y) < radius) {
          c.affected.add(kind);
          p.slowT = Math.max(p.slowT, 3.2);
          VO.Sound.chaseSlow();
          enqueue(s, "mama", "Пушистое облачко! Один бегун попал в кисель и замедлился.", 2.4);
          for (let i = 0; i < 12; i++) {
            s.particles.push({
              x: c.x, y: c.y,
              vx: (Math.random() - 0.5) * 100,
              vy: -20 - Math.random() * 50,
              life: 0.6 + Math.random() * 0.5,
              size: 2 + Math.random() * 3,
              color: "#f5e6bd",
              kind: "dot",
            });
          }
        }
      }
    }
    s.clouds = s.clouds.filter((c) => c.t < c.max);
  }

  function updateParticles(s, dt) {
    for (const p of s.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 40 * dt;
    }
    s.particles = s.particles.filter((p) => p.life > 0);
  }

  function update(s, dt, input) {
    if (!s) return;
    s.elapsed += dt;
    updateLine(s, dt);
    updateParticles(s, dt);

    if (s.phase === "rules") {
      s.rulesT += dt;
      if (s.rulesT >= 5) {
        s.phase = "ready";
        s.readyT = 0;
        s.readyPress = { Space: -10, Enter: -10 };
      }
      return;
    }

    if (s.phase === "ready") {
      s.readyT += dt;
      if (input.justPressed("Space")) s.readyPress.Space = s.readyT;
      if (input.justPressed("Enter")) s.readyPress.Enter = s.readyT;
      const both = s.readyPress.Space > 0 && s.readyPress.Enter > 0 &&
        Math.abs(s.readyPress.Space - s.readyPress.Enter) < 0.8;
      if (both) startRound(s);
      return;
    }

    if (s.phase === "round") {
      s.time = Math.max(0, s.time - dt);
      updatePlayers(s, dt, input);
      updateClouds(s, dt);
      s.bonusT -= dt;
      if (s.bonusT <= 0) {
        s.bonusT = 4.2 + Math.random() * 2;
        spawnBonus(s);
      }
      const chase = s.players[s.chaser];
      const run = s.players[s.runner];
      if (run.invisT <= 0 && dist(chase.x, chase.y, run.x, run.y) < chase.r + run.r + 5) {
        finishRound(s, "catch");
      } else if (s.time <= 0) {
        finishRound(s, "timeout");
      }
      return;
    }

    if (s.phase === "roundEnd") {
      s.roundEndT += dt;
      if (s.roundEndT > 2.1) {
        if (s.round === 1) {
          s.round = 2;
          s.chaser = "alisa";
          s.runner = "ilya";
          startRound(s);
        } else {
          startFinale(s);
        }
      }
      return;
    }

    if (s.phase === "finale") {
      s.finalT += dt;
      if (s.finalT > 1) {
        if (input.justPressed("Space")) s.hugPress.Space = s.finalT;
        if (input.justPressed("Enter")) s.hugPress.Enter = s.finalT;
        const both = Math.abs(s.hugPress.Space - s.hugPress.Enter) < 0.8 &&
          s.hugPress.Space > 0 && s.hugPress.Enter > 0;
        if (both) {
          s.phase = "reward";
          s.rewardShown = true;
          VO.Sound.celebrate();
          VO.Sound.hug();
        }
      }
    }
  }

  function drawGround(ctx, s) {
    const g = ctx.createLinearGradient(0, 120, 0, 680);
    g.addColorStop(0, "#9adf8b");
    g.addColorStop(0.55, "#7dcc78");
    g.addColorStop(1, "#5fae68");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Тропинки.
    ctx.save();
    ctx.strokeStyle = "rgba(236, 205, 142, 0.55)";
    ctx.lineWidth = 32;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(90, 580);
    ctx.bezierCurveTo(330, 470, 460, 620, 700, 500);
    ctx.bezierCurveTo(890, 400, 1030, 510, 1190, 330);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255, 241, 189, 0.25)";
    ctx.lineWidth = 3;
    ctx.setLineDash([9, 14]);
    ctx.stroke();
    ctx.restore();

    // Мелкие цветы и мухоморы.
    const colors = ["#ffd86a", "#ff9dba", "#a8ddff", "#f7f1c7"];
    for (let i = 0; i < 42; i++) {
      const x = 70 + ((i * 149) % 1120);
      const y = 155 + ((i * 83) % 450);
      let onTree = false;
      for (const o of OBSTACLES) if (dist(x, y, o.x, o.y) < o.r + 8) { onTree = true; break; }
      if (onTree) continue;
      ctx.strokeStyle = "rgba(53, 121, 63, 0.55)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, y + 6);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.fillStyle = colors[i % colors.length];
      for (let p = 0; p < 5; p++) {
        const a = (p / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * 3, y + Math.sin(a) * 2.4, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "#fff3b5";
      ctx.beginPath();
      ctx.arc(x, y, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Рамка поляны.
    ctx.strokeStyle = "rgba(73, 96, 55, 0.55)";
    ctx.lineWidth = 10;
    rr(ctx, ARENA.x, ARENA.y, ARENA.w, ARENA.h, 26);
    ctx.stroke();
  }

  function drawTree(ctx, o, t) {
    ctx.save();
    const sway = Math.sin(t * 0.5 + o.x) * 2;
    ctx.fillStyle = "rgba(45, 75, 44, 0.24)";
    ctx.beginPath();
    ctx.ellipse(o.x + 10, o.y + o.r * 0.55, o.r * 1.05, o.r * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = o.type === "fir" ? "#3d8155" : "#5f9852";
    if (o.type === "fir") {
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(o.x + sway, o.y - o.r * 0.8 - i * o.r * 0.35);
        ctx.lineTo(o.x - o.r * (0.7 - i * 0.12), o.y + o.r * 0.28 - i * o.r * 0.18);
        ctx.lineTo(o.x + o.r * (0.7 - i * 0.12), o.y + o.r * 0.28 - i * o.r * 0.18);
        ctx.closePath();
        ctx.fill();
      }
    } else {
      ctx.beginPath();
      ctx.arc(o.x + sway, o.y - 8, o.r * 0.68, 0, Math.PI * 2);
      ctx.arc(o.x - o.r * 0.47, o.y + o.r * 0.2, o.r * 0.48, 0, Math.PI * 2);
      ctx.arc(o.x + o.r * 0.48, o.y + o.r * 0.12, o.r * 0.52, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "rgba(230, 245, 174, 0.22)";
    ctx.beginPath();
    ctx.arc(o.x - o.r * 0.25, o.y - o.r * 0.32, o.r * 0.27, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawObstacles(ctx, s) {
    for (const o of OBSTACLES) {
      if (o.type === "rock") {
        ctx.fillStyle = "rgba(45, 75, 44, 0.2)";
        ctx.beginPath();
        ctx.ellipse(o.x + 7, o.y + o.r * 0.55, o.r, o.r * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#858f84";
        ctx.beginPath();
        ctx.ellipse(o.x, o.y, o.r, o.r * 0.82, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#aab5a5";
        ctx.beginPath();
        ctx.ellipse(o.x - 6, o.y - 8, o.r * 0.45, o.r * 0.28, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(78, 112, 69, 0.55)";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r * 0.8, 0.2, 2.3);
        ctx.stroke();
      } else if (o.type === "bush") {
        ctx.fillStyle = "rgba(45, 75, 44, 0.2)";
        ctx.beginPath();
        ctx.ellipse(o.x + 5, o.y + o.r * 0.5, o.r * 1.1, o.r * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#4d965a";
        ctx.beginPath();
        ctx.arc(o.x - 12, o.y, o.r * 0.7, 0, Math.PI * 2);
        ctx.arc(o.x + 12, o.y - 3, o.r * 0.75, 0, Math.PI * 2);
        ctx.arc(o.x, o.y + 9, o.r * 0.65, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffd86a";
        ctx.beginPath();
        ctx.arc(o.x - 10, o.y - 4, 3, 0, Math.PI * 2);
        ctx.arc(o.x + 12, o.y + 3, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        drawTree(ctx, o, s.elapsed);
      }
    }
  }

  function drawBonus(ctx, b, t) {
    const bob = Math.sin(t * 3 + b.bob) * 4;
    ctx.save();
    ctx.translate(b.x, b.y + bob);
    A.glow(ctx, 0, 0, 35, "rgba(255, 238, 145, 0.45)", 0.6);
    if (b.type === "berry") {
      ctx.fillStyle = "#f25c6b";
      ctx.beginPath();
      ctx.arc(0, 0, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffd86a";
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(-6 + (i % 3) * 6, -5 + Math.floor(i / 3) * 6, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "#6fc26e";
      ctx.beginPath();
      ctx.ellipse(2, -13, 6, 3, -0.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (b.type === "mushroom") {
      ctx.fillStyle = "#f5e7c4";
      ctx.fillRect(-4, -2, 8, 15);
      ctx.fillStyle = "#db5f61";
      ctx.beginPath();
      ctx.arc(0, -4, 15, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = "#fff6d8";
      ctx.beginPath();
      ctx.arc(-7, -9, 2.5, 0, Math.PI * 2);
      ctx.arc(4, -11, 2, 0, Math.PI * 2);
      ctx.arc(9, -5, 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (b.type === "cone") {
      ctx.fillStyle = "#b9804f";
      ctx.beginPath();
      ctx.ellipse(0, 2, 9, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(92, 56, 34, 0.5)";
      ctx.lineWidth = 1.5;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.arc(0, i * 5, 8, 0.2, Math.PI - 0.2);
        ctx.stroke();
      }
      ctx.fillStyle = "#fff4d3";
      ctx.beginPath();
      ctx.arc(0, -13, 4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        ctx.fillStyle = "#fff3a2";
        ctx.beginPath();
        ctx.arc(Math.cos(a) * 10, Math.sin(a) * 6, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      A.glow(ctx, 0, 0, 24, "rgba(255, 244, 160, 0.6)", 0.8);
    }
    ctx.restore();
  }

  function drawCloud(ctx, c) {
    const p = c.t / c.max;
    const radius = c.r || 70;
    ctx.save();
    ctx.globalAlpha = 1 - p * 0.72;
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + c.t * 0.3;
      const puff = radius * (0.3 + (i % 3) * 0.06);
      ctx.fillStyle = "rgba(250, 241, 210, 0.78)";
      ctx.beginPath();
      ctx.arc(c.x + Math.cos(a) * radius * 0.35, c.y + Math.sin(a) * radius * 0.25, puff, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "rgba(255, 247, 220, 0.38)";
    ctx.beginPath();
    ctx.arc(c.x, c.y, radius * 0.75, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(165, 130, 88, 0.9)";
    ctx.beginPath();
    ctx.ellipse(c.x, c.y + 5, 7, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawPlayer(ctx, s, p, t) {
    const chase = p.kind === s.chaser && (s.phase === "round" || s.phase === "roundEnd");
    const invisible = p.invisT > 0;
    if (invisible) return;
    ctx.save();
    ctx.globalAlpha = 1;
    if (chase && s.phase === "round") {
      const pulse = 1 + Math.sin(t * 3.5) * 0.08;
      ctx.strokeStyle = "rgba(255, 212, 91, 0.9)";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(p.x, p.y + 8, p.r + 12 * pulse, 0, Math.PI * 2);
      ctx.stroke();
      A.glow(ctx, p.x, p.y + 8, p.r + 25, "rgba(255, 213, 92, 0.2)", 0.5);
    }
    if (invisible) ctx.setLineDash([5, 6]);
    if (p.hopT > 0) {
      ctx.globalAlpha *= 0.6;
      A.glow(ctx, p.x, p.y - 14, 40, "rgba(255, 230, 153, 0.35)", 0.7);
    }
    if (p.slowT > 0) {
      ctx.strokeStyle = "rgba(144, 198, 232, 0.75)";
      ctx.lineWidth = 3;
      ctx.setLineDash([4, 5]);
      ctx.beginPath();
      ctx.arc(p.x, p.y + 7, p.r + 9 + Math.sin(t * 6) * 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    // Ноги/руки.
    ctx.fillStyle = p.kind === "ilya" ? "#5b8ed6" : "#ef8daf";
    ctx.beginPath();
    ctx.ellipse(p.x - 10, p.y + 17, 7, 5, -0.3, 0, Math.PI * 2);
    ctx.ellipse(p.x + 10, p.y + 17, 7, 5, 0.3, 0, Math.PI * 2);
    ctx.fill();
    // Тело.
    ctx.fillStyle = p.kind === "ilya" ? "#7fb2e8" : "#ffb0cb";
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 6, 17, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    // Голова.
    ctx.fillStyle = "#ffe1bd";
    ctx.beginPath();
    ctx.arc(p.x, p.y - 13, 15, 0, Math.PI * 2);
    ctx.fill();
    // Волосы.
    ctx.fillStyle = p.kind === "ilya" ? "#7b573d" : "#e2bc69";
    ctx.beginPath();
    if (p.kind === "ilya") {
      ctx.arc(p.x, p.y - 19, 14, Math.PI, 0);
      ctx.fill();
    } else {
      ctx.arc(p.x - 7, p.y - 21, 9, 0, Math.PI * 2);
      ctx.arc(p.x + 7, p.y - 21, 9, 0, Math.PI * 2);
      ctx.fill();
    }
    // Глаза.
    ctx.fillStyle = "#4a3e44";
    ctx.beginPath();
    ctx.arc(p.x - 5, p.y - 12, 1.8, 0, Math.PI * 2);
    ctx.arc(p.x + 5, p.y - 12, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(112, 70, 68, 0.65)";
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.arc(p.x, p.y - 8, 4, 0.2, Math.PI - 0.2);
    ctx.stroke();

    // Звёздочка перезарядки.
    const ratio = 1 - clamp(p.cooldown / INVIS_CD, 0, 1);
    ctx.globalAlpha = invisible ? 0.5 : 1;
    ctx.fillStyle = "rgba(38, 49, 46, 0.45)";
    ctx.beginPath();
    ctx.arc(p.x, p.y - 43, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 238, 153, 0.45)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y - 43, 11, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio);
    ctx.stroke();
    A.sparkle(ctx, p.x, p.y - 43, 5, "#ffe68a", 0.9, t + p.x);
    ctx.setLineDash([]);
    ctx.restore();

    // Шлейф ускорения.
    for (const tr of p.trail) {
      ctx.globalAlpha = tr.life / 0.4;
      ctx.fillStyle = tr.color;
      ctx.beginPath();
      ctx.arc(tr.x, tr.y + 15, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawEffects(ctx, s) {
    for (const p of s.particles) {
      ctx.globalAlpha = clamp(p.life / 0.8, 0, 1);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawRules(ctx, s) {
    ctx.save();
    ctx.fillStyle = "rgba(18, 52, 38, 0.6)";
    ctx.fillRect(0, 0, W, H);
    const bx = 90;
    const by = 80;
    const bw = W - 180;
    const bh = 500;
    ctx.fillStyle = "#fff7e3";
    rr(ctx, bx, by, bw, bh, 30);
    ctx.fill();
    ctx.strokeStyle = "#d8b678";
    ctx.lineWidth = 4;
    ctx.stroke();

    const panelW = (bw - 96) / 3;
    for (let i = 0; i < 3; i++) {
      const x = bx + 24 + i * (panelW + 24);
      ctx.fillStyle = i === 0 ? "#f2f6dc" : i === 1 ? "#e8f3f8" : "#f7e9ed";
      rr(ctx, x, by + 24, panelW, bh - 48, 22);
      ctx.fill();
    }

    // Блок 1: водящий и убегающий.
    let x = bx + 24 + panelW / 2;
    let y = by + 170;
    ctx.strokeStyle = "#c9a75a";
    ctx.lineWidth = 5;
    ctx.setLineDash([7, 8]);
    ctx.beginPath();
    ctx.arc(x - panelW * 0.22, y, 43, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    drawRulesKid(ctx, x - panelW * 0.22, y, "ilya", true);
    drawRulesKid(ctx, x + panelW * 0.22, y - 6, "alisa", false);
    ctx.strokeStyle = "#dc9b55";
    ctx.lineWidth = 4;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(x - panelW * 0.06, y - 25);
    ctx.quadraticCurveTo(x + panelW * 0.08, y - 60, x + panelW * 0.18, y - 20);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#ffd76e";
    ctx.beginPath();
    ctx.arc(x + panelW * 0.19, y - 20, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '700 22px "Comic Sans MS", "Segoe UI", sans-serif';
    ctx.textAlign = "center";
    ctx.fillStyle = "#b27a48";
    ctx.fillText("✋", x + panelW * 0.08, y - 55);

    // Блок 2: клавиши.
    const keySize = 35;
    const gap = 8;
    const groupY = by + 260;
    const leftX = bx + 24 + panelW / 2;
    const rightX = bx + 24 + panelW + 24 + panelW / 2;
    drawRulesKid(ctx, leftX - 85, groupY - 55, "ilya", false);
    drawRulesKid(ctx, rightX + 85, groupY - 55, "alisa", false);
    drawKeyGrid(ctx, leftX - 25, groupY - 55, keySize, gap, "wasd");
    drawKeyGrid(ctx, rightX - 25, groupY - 55, keySize, gap, "arrows");

    // Блок 3: невидимость.
    const tx = bx + 24 + 2 * (panelW + 24) + panelW / 2;
    drawKeyCap(ctx, tx - 70, by + 150, 58, 34, "Space", "#7fb2e8");
    drawKeyCap(ctx, tx + 12, by + 150, 58, 34, "Enter", "#ef8daf");
    ctx.strokeStyle = "#c9a75a";
    ctx.lineWidth = 4;
    ctx.setLineDash([7, 8]);
    ctx.beginPath();
    ctx.moveTo(tx - 40, by + 195);
    ctx.lineTo(tx - 40, by + 250);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 0.3;
    drawRulesKid(ctx, tx - 40, by + 300, "alisa", false, true);
    ctx.globalAlpha = 1;
    drawRulesTree(ctx, tx + 45, by + 300);

    // Пять точек-секунд.
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = i < Math.min(5, Math.ceil(s.rulesT)) ? "#ffd76e" : "rgba(136, 110, 85, 0.25)";
      ctx.beginPath();
      ctx.arc(W / 2 - 40 + i * 20, by + bh - 28, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawRulesKid(ctx, x, y, kind, crown, ghost) {
    ctx.save();
    ctx.globalAlpha = ghost ? 0.35 : 1;
    ctx.fillStyle = kind === "ilya" ? "#7fb2e8" : "#ffb0cb";
    ctx.beginPath();
    ctx.ellipse(x, y + 10, 18, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffe1bd";
    ctx.beginPath();
    ctx.arc(x, y - 18, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = kind === "ilya" ? "#7b573d" : "#e2bc69";
    ctx.beginPath();
    ctx.arc(x, y - 24, 15, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = "#4a3e44";
    ctx.beginPath();
    ctx.arc(x - 5, y - 17, 2, 0, Math.PI * 2);
    ctx.arc(x + 5, y - 17, 2, 0, Math.PI * 2);
    ctx.fill();
    if (crown) {
      ctx.fillStyle = "#ffd35f";
      ctx.beginPath();
      ctx.moveTo(x - 18, y - 36);
      ctx.lineTo(x - 10, y - 50);
      ctx.lineTo(x - 2, y - 39);
      ctx.lineTo(x + 6, y - 52);
      ctx.lineTo(x + 16, y - 36);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawRulesTree(ctx, x, y) {
    ctx.fillStyle = "#5f9852";
    ctx.beginPath();
    ctx.arc(x, y - 20, 35, 0, Math.PI * 2);
    ctx.arc(x - 25, y + 3, 22, 0, Math.PI * 2);
    ctx.arc(x + 26, y + 2, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#8a6844";
    ctx.fillRect(x - 6, y + 24, 12, 36);
  }

  function drawKeyCap(ctx, x, y, w, h, label, color) {
    ctx.fillStyle = "rgba(47, 60, 55, 0.2)";
    rr(ctx, x + 2, y + 3, w, h, 8);
    ctx.fill();
    ctx.fillStyle = color;
    rr(ctx, x, y, w, h, 8);
    ctx.fill();
    ctx.fillStyle = "#fffdf4";
    ctx.font = '700 13px "Comic Sans MS", "Segoe UI", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x + w / 2, y + h / 2 + 1);
    ctx.textBaseline = "alphabetic";
  }

  function drawKeyGrid(ctx, cx, cy, size, gap, type) {
    const labels = type === "wasd" ? [["W", 0, -1], ["A", -1, 0], ["S", 0, 0], ["D", 1, 0]] : [["↑", 0, -1], ["←", -1, 0], ["↓", 0, 0], ["→", 1, 0]];
    for (const [label, dx, dy] of labels) {
      drawKeyCap(ctx, cx + dx * (size + gap), cy + dy * (size + gap), size, size, label, type === "wasd" ? "#76bb83" : "#e996b3");
    }
  }

  function drawReady(ctx, s) {
    for (const p of Object.values(s.players)) drawPlayer(ctx, s, p, s.elapsed);
    const bx = W / 2 - 150;
    const by = 580;
    const pulse = 1 + Math.sin(s.elapsed * 4) * 0.03;
    ctx.save();
    ctx.translate(W / 2, by + 33);
    ctx.scale(pulse, pulse);
    A.glow(ctx, 0, 0, 150, "rgba(255, 225, 115, 0.3)", 0.7);
    ctx.fillStyle = "#6cbf72";
    rr(ctx, -150, -34, 300, 68, 26);
    ctx.fill();
    ctx.strokeStyle = "#fff0b1";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = "#fffdf1";
    ctx.font = '700 34px "Comic Sans MS", "Segoe UI", sans-serif';
    ctx.textAlign = "center";
    ctx.fillText("⚑", -82, 9);
    drawKeyCap(ctx, -30, -17, 64, 34, "Space", "#7fb2e8");
    drawKeyCap(ctx, 44, -17, 64, 34, "Enter", "#ef8daf");
    ctx.restore();
    ctx.fillStyle = "rgba(47, 80, 51, 0.62)";
    ctx.font = '700 16px "Comic Sans MS", "Segoe UI", sans-serif';
    ctx.textAlign = "center";
    ctx.fillText("Оба — вместе!", W / 2, by - 45);
  }

  function drawRoundBanner(ctx, s) {
    if (s.phase !== "roundEnd") return;
    ctx.save();
    ctx.fillStyle = "rgba(30, 58, 42, 0.58)";
    rr(ctx, 390, 250, 500, 120, 26);
    ctx.fill();
    ctx.fillStyle = "#fff2c0";
    ctx.font = '700 28px "Comic Sans MS", "Segoe UI", sans-serif';
    ctx.textAlign = "center";
    const who = s.lastAward.winner === "ilya" ? "Илюша" : "Алиса";
    ctx.fillText(s.roundEndKind === "catch" ? "Поймал!" : "Время вышло!", 640, 300);
    ctx.font = '700 18px "Comic Sans MS", "Segoe UI", sans-serif';
    ctx.fillStyle = "#ffe69b";
    ctx.fillText(`${who}: +${s.lastAward.stars} ⭐`, 640, 336);
    ctx.restore();
  }

  function drawFinale(ctx, s) {
    ctx.save();
    ctx.fillStyle = "rgba(24, 54, 38, 0.2)";
    ctx.fillRect(0, 0, W, H);
    // Зверята.
    for (let i = 0; i < 6; i++) {
      const x = 360 + i * 110;
      const y = 530 + Math.sin(s.elapsed * 2 + i) * 4;
      ctx.fillStyle = i % 2 ? "#c79a6a" : "#f2dfc6";
      ctx.beginPath();
      ctx.arc(x, y, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#4b3b35";
      ctx.beginPath();
      ctx.arc(x - 5, y - 3, 1.5, 0, Math.PI * 2);
      ctx.arc(x + 5, y - 3, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#e7c58e";
      ctx.beginPath();
      ctx.arc(x - 10, y - 14, 5, 0, Math.PI * 2);
      ctx.arc(x + 10, y - 14, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    A.glow(ctx, 640, 330, 120, "rgba(255, 224, 136, 0.24)", 0.7);
    ctx.fillStyle = "rgba(255, 249, 219, 0.96)";
    ctx.font = '700 26px "Comic Sans MS", "Segoe UI", sans-serif';
    ctx.textAlign = "center";
    ctx.fillText("Вот это забег!", 640, 245);
    ctx.font = '700 15px "Comic Sans MS", "Segoe UI", sans-serif';
    ctx.fillStyle = "rgba(255, 244, 205, 0.85)";
    ctx.fillText("Пробел + Enter — обнимашки", 640, 278);
    ctx.restore();
  }

  function drawInvisibilityBars(ctx, s) {
    const y = 84;
    const w = 244;
    const h = 18;
    const specs = [
      { p: s.players.ilya, x: 100, color: "#6fb7ff", label: "И" },
      { p: s.players.alisa, x: W - 100 - w, color: "#ff9dc2", label: "А" },
    ];
    for (const spec of specs) {
      const p = spec.p;
      const active = p.invisT > 0;
      const fill = active ? 1 : 1 - clamp(p.cooldown / INVIS_CD, 0, 1);
      const mult = 1 + (p.fireflies || 0);
      ctx.save();
      if (active) A.glow(ctx, spec.x + w / 2, y + h / 2, w * 0.6, spec.color, 0.3);
      ctx.fillStyle = "rgba(28, 48, 38, 0.58)";
      rr(ctx, spec.x, y, w, h, 9);
      ctx.fill();
      ctx.fillStyle = spec.color;
      rr(ctx, spec.x + 2, y + 2, Math.max(0, (w - 4) * fill), h - 4, 7);
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 248, 211, 0.45)";
      ctx.lineWidth = 1.5;
      rr(ctx, spec.x, y, w, h, 9);
      ctx.stroke();
      ctx.fillStyle = "rgba(255, 253, 241, 0.95)";
      ctx.font = '700 12px "Comic Sans MS", "Segoe UI", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${spec.label} · ×${mult}`, spec.x + w / 2, y + h / 2 + 1);
      ctx.textBaseline = "alphabetic";
      A.sparkle(ctx, spec.x + w + 16, y + h / 2, 5, active ? "#fff3a3" : spec.color, 0.8, s.elapsed);
      ctx.restore();
    }
  }

  function draw(ctx, s, t) {
    if (!s) return;
    drawGround(ctx, s);
    drawObstacles(ctx, s);
    for (const b of s.bonuses) drawBonus(ctx, b, t);
    for (const c of s.clouds) drawCloud(ctx, c);
    for (const p of Object.values(s.players)) drawPlayer(ctx, s, p, t);
    drawEffects(ctx, s);
    drawInvisibilityBars(ctx, s);
    drawRoundBanner(ctx, s);

    if (s.phase === "rules") drawRules(ctx, s);
    if (s.phase === "ready") drawReady(ctx, s);
    if (s.phase === "finale" || s.phase === "reward") drawFinale(ctx, s);
  }

  VO.Chase = { create, update, draw, ROUND_TIME };
})();
