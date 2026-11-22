/* ==========================================================================
   ВремяОбнимашки — колыбельная, звуки и добрый голос
   Все звуки синтезируются в браузере, внешние файлы не нужны.
   ========================================================================== */

(function () {
  "use strict";

  const VO = (window.VO = window.VO || {});

  const midiToFreq = (m) => 440 * Math.pow(2, (m - 69) / 12);

  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.master = null;
      this.musicBus = null;
      this.sfxBus = null;
      this.delay = null;
      this.musicEnabled = true;
      this.voiceEnabled = true;
      this.paused = false;
      this.started = false;
      this.noiseBuffer = null;
      this.musicTimer = null;
      this.nextMusicTime = 0;
      this.musicStep = 0;
      this.voices = [];
      this.voice = null;
      this.lastSpoken = "";
      this.lastSpokenAt = 0;

      // Нежная колыбельная: ноты в среднем регистре, много воздуха между ними.
      this.melody = [
        72, 76, 79, 76, 74, 77, 81, 77,
        76, 79, 83, 79, 74, 77, 81, 79,
        72, 76, 79, 84, 81, 79, 76, 72,
        74, 76, 77, 79, 76, 72, null, null,
      ];
      this.bass = [
        48, null, null, null, 45, null, null, null,
        41, null, null, null, 43, null, null, null,
        48, null, null, null, 45, null, null, null,
        41, null, null, null, 43, null, null, null,
      ];

      this.lullabyMelody = this.melody;
      this.lullabyBass = this.bass;
      this.legoMelody = [
        72, 76, 79, 84, 79, 76, 74, 79,
        76, 81, 84, 81, 79, 76, 72, null,
        72, 76, 79, 84, 83, 79, 76, 74,
        72, 74, 76, 79, 76, 72, null, null,
      ];
      this.legoBass = [
        48, null, null, null, 53, null, null, null,
        55, null, null, null, 48, null, null, null,
        48, null, null, null, 53, null, null, null,
        55, null, null, null, 48, null, null, null,
      ];
      this.mood = "lullaby";
      this.stepDur = 0.64;

      if ("speechSynthesis" in window) {
        const loadVoices = () => {
          this.voices = window.speechSynthesis.getVoices() || [];
          this.voice =
            this.voices.find((v) => /^ru/i.test(v.lang) && /female|milena|alena|irina|elena|google/i.test(v.name)) ||
            this.voices.find((v) => /^ru/i.test(v.lang)) ||
            null;
        };
        loadVoices();
        window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
      }
    }

    init() {
      if (this.ctx) {
        if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {});
        return;
      }
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      this.ctx = new AudioCtx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.musicEnabled ? 0.72 : 0;
      this.master.connect(this.ctx.destination);

      this.musicBus = this.ctx.createGain();
      this.musicBus.gain.value = 0.28;
      this.musicBus.connect(this.master);

      this.sfxBus = this.ctx.createGain();
      this.sfxBus.gain.value = 0.52;
      this.sfxBus.connect(this.master);

      // Мягкое эхо, как будто сон звучит в большой тёплой комнате.
      this.delay = this.ctx.createDelay(1.2);
      this.delay.delayTime.value = 0.34;
      const feedback = this.ctx.createGain();
      feedback.gain.value = 0.22;
      const wet = this.ctx.createGain();
      wet.gain.value = 0.17;
      this.delay.connect(feedback);
      feedback.connect(this.delay);
      this.delay.connect(wet);
      wet.connect(this.master);

      this.noiseBuffer = this.createNoiseBuffer();
      this.started = true;
      this.nextMusicTime = this.ctx.currentTime + 0.1;
      this.musicStep = 0;
      this.startScheduler();
      this.ambientPad();
    }

    createNoiseBuffer() {
      const len = Math.floor(this.ctx.sampleRate * 0.6);
      const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      return buffer;
    }

    startScheduler() {
      if (this.musicTimer) return;
      this.musicTimer = window.setInterval(() => this.scheduleMusic(), 220);
    }

    scheduleMusic() {
      if (!this.ctx || !this.started) return;
      if (this.ctx.state !== "running") return;
      const stepDur = this.stepDur;
      while (this.nextMusicTime < this.ctx.currentTime + 0.75) {
        const step = this.musicStep % this.melody.length;
        const note = this.melody[step];
        const bassNote = this.bass[step];
        const when = this.nextMusicTime;
        if (note !== null && note !== undefined) {
          this.playMusicNote(midiToFreq(note), when, 1.5, 0.045, "sine");
          this.playMusicNote(midiToFreq(note + 12), when + 0.016, 0.8, 0.012, "triangle");
        }
        if (bassNote !== null && bassNote !== undefined) {
          this.playPad([bassNote, bassNote + 7, bassNote + 12], when, 3.4, 0.016);
        }
        // В Лего-сне музыка чуть бодрее, с пластиковыми щелчками.
        if (this.mood === "lego" && step % 4 === 0) {
          this.playMusicNote(midiToFreq(88), when + 0.04, 0.14, 0.007, "triangle");
        }
        // Изредка — крошечная звёздочка в мелодии.
        if (step % 8 === 3) {
          this.playMusicNote(midiToFreq(note ? note + 24 : 96), when + 0.32, 0.5, 0.008, "sine");
        }
        this.nextMusicTime += stepDur;
        this.musicStep++;
      }
    }

    playMusicNote(freq, when, dur, gain, type) {
      if (!this.ctx || !this.musicEnabled) return;
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      osc.type = type || "sine";
      osc.frequency.value = freq;
      env.gain.setValueAtTime(0.0001, when);
      env.gain.exponentialRampToValueAtTime(gain, when + 0.03);
      env.gain.exponentialRampToValueAtTime(0.0001, when + dur);
      osc.connect(env);
      env.connect(this.musicBus);
      env.connect(this.delay);
      osc.start(when);
      osc.stop(when + dur + 0.05);
    }

    playPad(notes, when, dur, gain) {
      notes.forEach((n, i) => {
        const osc = this.ctx.createOscillator();
        const env = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 900;
        osc.type = i === 0 ? "sine" : "triangle";
        osc.frequency.value = midiToFreq(n);
        env.gain.setValueAtTime(0.0001, when);
        env.gain.linearRampToValueAtTime(gain, when + 0.55);
        env.gain.linearRampToValueAtTime(0.0001, when + dur);
        osc.connect(filter);
        filter.connect(env);
        env.connect(this.musicBus);
        osc.start(when);
        osc.stop(when + dur + 0.1);
      });
    }

    ambientPad() {
      // Едва слышный тёплый аккорд под всей сказкой.
      if (!this.ctx) return;
      const when = this.ctx.currentTime + 0.4;
      const notes = [36, 43, 48, 55];
      notes.forEach((n, i) => {
        const osc = this.ctx.createOscillator();
        const env = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 520;
        osc.type = "sine";
        osc.frequency.value = midiToFreq(n);
        env.gain.setValueAtTime(0.0001, when);
        env.gain.linearRampToValueAtTime(0.009 - i * 0.001, when + 2);
        env.gain.linearRampToValueAtTime(0.0001, when + 11);
        osc.connect(filter);
        filter.connect(env);
        env.connect(this.musicBus);
        osc.start(when);
        osc.stop(when + 12);
      });
    }

    tone(freq, dur, type, gain, when, slideTo) {
      if (!this.ctx) return;
      const t = when || this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      osc.type = type || "sine";
      osc.frequency.setValueAtTime(freq, t);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
      env.gain.setValueAtTime(0.0001, t);
      env.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t + 0.015);
      env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(env);
      env.connect(this.sfxBus);
      osc.start(t);
      osc.stop(t + dur + 0.03);
    }

    noise(dur, gain, freq) {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = freq || 800;
      const env = this.ctx.createGain();
      env.gain.setValueAtTime(0.0001, t);
      env.gain.linearRampToValueAtTime(gain, t + 0.02);
      env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(filter);
      filter.connect(env);
      env.connect(this.sfxBus);
      src.start(t);
      src.stop(t + dur + 0.05);
    }

    jump(who) {
      if (!this.ctx || who === "alisa") {
        this.tone(480, 0.17, "sine", 0.055, null, 720);
        return;
      }
      this.tone(360, 0.2, "sine", 0.06, null, 620);
    }

    land() { this.tone(130, 0.12, "sine", 0.035, null, 85); }
    step() { this.tone(180 + Math.random() * 25, 0.045, "triangle", 0.012, null, 140); }
    push() { this.noise(0.18, 0.045, 420); this.tone(110, 0.16, "sine", 0.025, null, 90); }
    bump() { this.tone(150, 0.09, "sine", 0.02, null, 120); }

    pickup() {
      const t = this.ctx ? this.ctx.currentTime : 0;
      [76, 79, 83, 88].forEach((n, i) => this.tone(midiToFreq(n), 0.45, "sine", 0.04, t + i * 0.075));
    }

    firefly() {
      const t = this.ctx ? this.ctx.currentTime : 0;
      [88, 91, 96].forEach((n, i) => this.tone(midiToFreq(n), 0.5, "sine", 0.022, t + i * 0.08));
    }

    correct() {
      const t = this.ctx ? this.ctx.currentTime : 0;
      [72, 76, 79, 84].forEach((n, i) => {
        this.tone(midiToFreq(n), 0.7, "triangle", 0.035, t + i * 0.09);
      });
    }

    wrong() {
      this.tone(245, 0.18, "sine", 0.022, null, 220);
      this.tone(196, 0.26, "sine", 0.018, null, 196);
    }

    key() {
      const t = this.ctx ? this.ctx.currentTime : 0;
      [84, 88, 91, 96].forEach((n, i) => this.tone(midiToFreq(n), 0.55, "sine", 0.035, t + i * 0.07));
    }

    door() {
      const t = this.ctx ? this.ctx.currentTime : 0;
      [48, 55, 60, 64, 67, 72].forEach((n, i) => this.tone(midiToFreq(n), 1.6, "triangle", 0.025, t + i * 0.12));
      this.noise(1.2, 0.018, 1600);
    }

    hug() {
      const t = this.ctx ? this.ctx.currentTime : 0;
      [60, 64, 67, 72, 76, 79].forEach((n, i) => {
        this.tone(midiToFreq(n), 2.2, "sine", 0.035, t + i * 0.055);
      });
      this.tone(523.25, 1.4, "triangle", 0.018, t + 0.4);
    }

    celebrate() {
      const t = this.ctx ? this.ctx.currentTime : 0;
      const notes = [72, 76, 79, 84, 83, 79, 84, 88, 91, 96];
      notes.forEach((n, i) => {
        this.tone(midiToFreq(n), 1.1, "sine", 0.04, t + i * 0.12);
        this.tone(midiToFreq(n + 12), 0.7, "triangle", 0.012, t + i * 0.12 + 0.02);
      });
      this.noise(1.6, 0.016, 2400);
    }

    sparkle(x) {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const scale = [84, 86, 88, 91, 93, 96, 98];
      for (let i = 0; i < 4; i++) {
        const n = scale[Math.floor(Math.random() * scale.length)];
        this.tone(midiToFreq(n), 0.55, "sine", 0.012 + Math.random() * 0.01, t + i * 0.05);
      }
    }

    setMood(mood) {
      const next = mood === "lego" ? "lego" : "lullaby";
      if (this.mood === next) return;
      this.mood = next;
      this.melody = next === "lego" ? this.legoMelody : this.lullabyMelody;
      this.bass = next === "lego" ? this.legoBass : this.lullabyBass;
      this.stepDur = next === "lego" ? 0.46 : 0.64;
      this.musicStep = 0;
      if (this.ctx) this.nextMusicTime = this.ctx.currentTime + 0.28;
    }

    setMusicEnabled(enabled) {
      this.musicEnabled = !!enabled;
      if (this.master && this.ctx) {
        this.master.gain.cancelScheduledValues(this.ctx.currentTime);
        this.master.gain.linearRampToValueAtTime(this.musicEnabled ? (this.paused ? 0.28 : 0.72) : 0, this.ctx.currentTime + 0.25);
      }
    }

    setVoiceEnabled(enabled) {
      this.voiceEnabled = !!enabled;
      if (!enabled && "speechSynthesis" in window) {
        try { window.speechSynthesis.cancel(); } catch (_) {}
      }
    }

    setPaused(paused) {
      this.paused = paused;
      if (this.master && this.ctx) {
        this.master.gain.cancelScheduledValues(this.ctx.currentTime);
        const target = !this.musicEnabled ? 0 : paused ? 0.26 : 0.72;
        this.master.gain.linearRampToValueAtTime(target, this.ctx.currentTime + 0.4);
      }
      if (paused && "speechSynthesis" in window) {
        try { window.speechSynthesis.pause(); } catch (_) {}
      } else if ("speechSynthesis" in window) {
        try { window.speechSynthesis.resume(); } catch (_) {}
      }
    }

    speak(text, speaker, options) {
      if (!this.voiceEnabled || !("speechSynthesis" in window) || !text) return false;
      const clean = String(text)
        .replace(/[♡♥✦✧☁☾★]/g, "")
        .replace(/\s+/g, " ")
        .trim();
      if (!clean) return false;

      const opts = options || {};
      // Не повторяем одну и ту же фразу чаще, чем раз в 4 секунды.
      const now = performance.now();
      if (!opts.force && clean === this.lastSpoken && now - this.lastSpokenAt < 4000) return false;
      this.lastSpoken = clean;
      this.lastSpokenAt = now;

      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(clean);
        if (this.voice) utter.voice = this.voice;
        utter.lang = "ru-RU";
        utter.volume = 0.92;
        const map = {
          mama: { pitch: 1.02, rate: 0.9 },
          ilya: { pitch: 1.12, rate: 1.0 },
          alisa: { pitch: 1.38, rate: 1.02 },
          both: { pitch: 1.2, rate: 0.98 },
        };
        const p = map[speaker] || map.mama;
        utter.pitch = p.pitch;
        utter.rate = p.rate;
        if (typeof opts.onstart === "function") utter.onstart = opts.onstart;
        if (typeof opts.onend === "function") utter.onend = opts.onend;
        if (typeof opts.onerror === "function") utter.onerror = opts.onerror;
        window.speechSynthesis.speak(utter);
        return true;
      } catch (_) {
        /* Голос недоступен — остаются красивые субтитры. */
        return false;
      }
    }

    stopSpeech() {
      if ("speechSynthesis" in window) {
        try { window.speechSynthesis.cancel(); } catch (_) {}
      }
    }

    bubble() {
      const t = this.ctx ? this.ctx.currentTime : 0;
      this.tone(260, 0.45, "sine", 0.028, t, 640);
      this.tone(420, 0.28, "triangle", 0.014, t + 0.12, 760);
      this.noise(0.16, 0.012, 1500);
    }

    soapPop() {
      const t = this.ctx ? this.ctx.currentTime : 0;
      this.tone(880, 0.09, "sine", 0.045, t, 360);
      this.tone(1320, 0.07, "triangle", 0.02, t + 0.02, 700);
      this.noise(0.08, 0.03, 2200);
    }

    boing() {
      const t = this.ctx ? this.ctx.currentTime : 0;
      this.tone(180, 0.32, "sine", 0.055, t, 660);
      this.tone(360, 0.22, "triangle", 0.022, t + 0.03, 820);
    }

    toot() {
      const t = this.ctx ? this.ctx.currentTime : 0;
      this.tone(392, 0.48, "triangle", 0.04, t);
      this.tone(523.25, 0.62, "triangle", 0.03, t + 0.08);
      this.tone(659.25, 0.5, "sine", 0.018, t + 0.16);
    }

    plastic() {
      this.noise(0.045, 0.018, 2100);
      this.tone(1200, 0.035, "triangle", 0.01, null, 900);
    }

    sleepy() {
      this.tone(300, 0.5, "sine", 0.025, null, 180);
      this.tone(220, 0.7, "sine", 0.018, null, 140);
    }

    paint() {
      const t = this.ctx ? this.ctx.currentTime : 0;
      this.tone(520, 0.24, "sine", 0.028, t, 880);
      this.tone(780, 0.3, "triangle", 0.015, t + 0.05, 1180);
    }

    chirp() {
      const t = this.ctx ? this.ctx.currentTime : 0;
      this.tone(1180, 0.12, "sine", 0.03, t, 1680);
      this.tone(1520, 0.16, "triangle", 0.022, t + 0.12, 1980);
      this.tone(1320, 0.1, "sine", 0.018, t + 0.28, 1750);
    }

    paper() {
      this.noise(0.32, 0.018, 900);
      this.noise(0.18, 0.012, 1900);
    }

    waterShot(owner) {
      const t = this.ctx ? this.ctx.currentTime : 0;
      if (owner === "alisa") {
        this.tone(720, 0.09, "sine", 0.02, t, 980);
        this.tone(960, 0.06, "triangle", 0.012, t + 0.04, 1180);
        this.noise(0.06, 0.012, 2200);
      } else {
        this.tone(260, 0.12, "sine", 0.035, t, 420);
        this.tone(180, 0.16, "triangle", 0.018, t + 0.03, 260);
        this.noise(0.1, 0.018, 1200);
      }
    }

    inkPop(step) {
      const notes = [60, 62, 64, 67, 69, 72, 74, 76, 79];
      const n = notes[Math.min(notes.length - 1, Math.max(0, step || 0))];
      const t = this.ctx ? this.ctx.currentTime : 0;
      this.tone(midiToFreq(n), 0.2, "sine", 0.04, t, midiToFreq(n + 3));
      this.tone(midiToFreq(n + 12), 0.16, "triangle", 0.014, t + 0.035, midiToFreq(n + 17));
      this.noise(0.18, 0.028, 900);
      this.tone(170, 0.2, "sine", 0.03, t + 0.02, 85);
    }

    fishRescue(step) {
      const notes = [76, 79, 81, 84, 86, 88, 91, 93];
      const n = notes[Math.min(notes.length - 1, Math.max(0, step || 0))];
      const t = this.ctx ? this.ctx.currentTime : 0;
      this.tone(midiToFreq(n), 0.24, "sine", 0.03, t, midiToFreq(n + 5));
      this.tone(midiToFreq(n + 12), 0.18, "triangle", 0.01, t + 0.06);
    }

    megaBubble() {
      const t = this.ctx ? this.ctx.currentTime : 0;
      [60, 64, 67, 72, 76, 79, 84, 88].forEach((n, i) => {
        this.tone(midiToFreq(n), 0.7, "triangle", 0.032, t + i * 0.06);
        this.tone(midiToFreq(n + 12), 0.5, "sine", 0.012, t + i * 0.06 + 0.02);
      });
      this.noise(0.5, 0.02, 1800);
      this.tone(140, 0.4, "sine", 0.04, t, 70);
    }

    fishChime() {
      const t = this.ctx ? this.ctx.currentTime : 0;
      [88, 91, 96].forEach((n, i) => this.tone(midiToFreq(n), 0.5, "sine", 0.018, t + i * 0.06));
    }

    seedShot(owner) {
      const t = this.ctx ? this.ctx.currentTime : 0;
      if (owner === "alisa") {
        this.tone(760, 0.1, "sine", 0.022, t, 1080);
        this.noise(0.06, 0.012, 2600);
      } else {
        this.tone(500, 0.12, "triangle", 0.026, t, 760);
        this.noise(0.07, 0.014, 1800);
      }
    }

    flowerBloom(step) {
      const notes = [60, 62, 64, 67, 69, 72, 74, 76, 79, 81, 84, 86, 88];
      const n = notes[Math.min(notes.length - 1, Math.max(0, step || 0))];
      const t = this.ctx ? this.ctx.currentTime : 0;
      this.tone(midiToFreq(n + 12), 0.55, "sine", 0.025, t);
      this.tone(midiToFreq(n + 19), 0.4, "triangle", 0.01, t + 0.03);
      this.tone(midiToFreq(n + 24), 0.28, "sine", 0.007, t + 0.07);
    }

    seedBounce() {
      const t = this.ctx ? this.ctx.currentTime : 0;
      this.tone(620, 0.11, "sine", 0.022, t, 960);
      this.tone(940, 0.12, "triangle", 0.012, t + 0.05, 700);
    }

    lawnBounce() {
      const t = this.ctx ? this.ctx.currentTime : 0;
      this.tone(360, 0.16, "sine", 0.024, t, 680);
      [76, 79, 84].forEach((n, i) => this.tone(midiToFreq(n), 0.28, "triangle", 0.012, t + 0.03 + i * 0.045));
      this.noise(0.16, 0.012, 1900);
    }

    chaseWhistle() {
      const t = this.ctx ? this.ctx.currentTime : 0;
      this.tone(1050, 0.2, "sine", 0.03, t, 1450);
      this.tone(1450, 0.3, "triangle", 0.02, t + 0.08, 980);
      this.noise(0.12, 0.012, 2600);
    }

    chaseCatch() {
      const t = this.ctx ? this.ctx.currentTime : 0;
      this.tone(220, 0.2, "sine", 0.035, t, 380);
      [72, 76, 79, 84].forEach((n, i) => this.tone(midiToFreq(n), 0.3, "triangle", 0.018, t + 0.05 + i * 0.06));
      this.noise(0.15, 0.02, 900);
    }

    chaseBonus(kind) {
      const t = this.ctx ? this.ctx.currentTime : 0;
      if (kind === "berry") {
        [84, 88, 91].forEach((n, i) => this.tone(midiToFreq(n), 0.22, "sine", 0.016, t + i * 0.05));
      } else if (kind === "mushroom") {
        this.tone(330, 0.16, "sine", 0.03, t, 820);
        this.tone(720, 0.18, "triangle", 0.018, t + 0.08, 460);
      } else if (kind === "cone") {
        this.noise(0.28, 0.028, 700);
        this.tone(240, 0.3, "sine", 0.025, t, 150);
      } else {
        [88, 91, 96, 100].forEach((n, i) => this.tone(midiToFreq(n), 0.4, "sine", 0.012, t + i * 0.05));
      }
    }

    chaseInvis() {
      const t = this.ctx ? this.ctx.currentTime : 0;
      this.tone(880, 0.22, "sine", 0.02, t, 1320);
      this.tone(1320, 0.35, "triangle", 0.012, t + 0.06, 660);
      this.noise(0.1, 0.008, 2800);
    }

    chaseSlow() {
      const t = this.ctx ? this.ctx.currentTime : 0;
      this.tone(300, 0.35, "sine", 0.025, t, 150);
      this.noise(0.3, 0.018, 650);
    }

    flowerChord() {
      const t = this.ctx ? this.ctx.currentTime : 0;
      [60, 64, 67, 72, 76, 79, 84, 88, 91].forEach((n, i) => {
        this.tone(midiToFreq(n), 0.7, "triangle", 0.028, t + i * 0.055);
        this.tone(midiToFreq(n + 12), 0.45, "sine", 0.01, t + i * 0.055 + 0.02);
      });
      this.noise(0.4, 0.018, 2200);
      this.tone(160, 0.35, "sine", 0.03, t, 80);
    }

    click() { this.tone(660, 0.08, "sine", 0.03, null, 720); }
  }

  VO.Sound = new SoundEngine();
})();
