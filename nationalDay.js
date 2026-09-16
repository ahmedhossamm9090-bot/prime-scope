// Prime Scope - Saudi National Day 96 Celebratory Experience (Interactive Audio, Fireworks & Voice)
// ================================================================================================

(function() {
  let audioCtx = null;

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  // Synthesize realistic firework launch and explosion sound
  function playFireworkBoom() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // 1. Launch Whoosh
      const whooshOsc = ctx.createOscillator();
      const whooshGain = ctx.createGain();
      whooshOsc.type = 'sine';
      whooshOsc.frequency.setValueAtTime(220, now);
      whooshOsc.frequency.exponentialRampToValueAtTime(650, now + 0.15);
      whooshGain.gain.setValueAtTime(0.2, now);
      whooshGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      whooshOsc.connect(whooshGain);
      whooshGain.connect(ctx.destination);
      whooshOsc.start(now);
      whooshOsc.stop(now + 0.2);

      // 2. Low Frequency Explosion Boom (delayed slightly)
      const boomTime = now + 0.15;
      const boomOsc = ctx.createOscillator();
      const boomGain = ctx.createGain();
      boomOsc.type = 'triangle';
      boomOsc.frequency.setValueAtTime(120, boomTime);
      boomOsc.frequency.exponentialRampToValueAtTime(28, boomTime + 0.45);
      boomGain.gain.setValueAtTime(0.65, boomTime);
      boomGain.gain.exponentialRampToValueAtTime(0.005, boomTime + 0.5);
      boomOsc.connect(boomGain);
      boomGain.connect(ctx.destination);
      boomOsc.start(boomTime);
      boomOsc.stop(boomTime + 0.5);

      // 3. Crackling Sparkles (Filtered Noise)
      const bufferSize = ctx.sampleRate * 0.35;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, boomTime);
      filter.Q.setValueAtTime(2.5, boomTime);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.4, boomTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, boomTime + 0.35);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(boomTime);
      noise.stop(boomTime + 0.35);
    } catch (e) {
      console.warn("Audio synthesis note:", e);
    }
  }

  // Voice Announcement: "لا تفوت عروض اليوم الوطني في برايم سكوب!"
  function speakSaudiGreeting() {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const text = "لا تفوّت عروض اليوم الوطني في برايم سكوب! دام عزك يا وطن!";
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar-SA';
      utterance.rate = 0.92;
      utterance.pitch = 1.05;

      const voices = window.speechSynthesis.getVoices();
      const arVoice = voices.find(v => v.lang && (v.lang.startsWith('ar-SA') || v.lang.startsWith('ar')));
      if (arVoice) {
        utterance.voice = arVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis note:", e);
    }
  }

  // Fireworks Animation Engine on Canvas
  let canvas, ctx, animationId;
  let particles = [];
  let isFireworksRunning = false;

  function initFireworksCanvas() {
    canvas = document.getElementById('ndFireworksCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
  }

  function resizeCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function createFireworkBurst(x, y) {
    const colors = [
      '#006C35', '#22c55e', '#4ade80', // Saudi Green shades
      '#d4af37', '#facc15', '#fef08a', // Gold shades
      '#ffffff', '#f43f5e', '#38bdf8'  // White, ruby, azure
    ];
    const count = 48;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i + (Math.random() * 0.2);
      const speed = 2.5 + Math.random() * 5.5;
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        decay: 0.012 + Math.random() * 0.015,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 2.2 + Math.random() * 3.2
      });
    }
  }

  function loopFireworks() {
    if (!ctx || !isFireworksRunning) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08;
      p.vx *= 0.98;
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 10;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (isFireworksRunning) {
      animationId = requestAnimationFrame(loopFireworks);
    }
  }

  function startFireworks(burstCount = 6) {
    initFireworksCanvas();
    if (!canvas) return;
    isFireworksRunning = true;
    particles = [];
    loopFireworks();

    let burstsFired = 0;
    const interval = setInterval(() => {
      if (!isFireworksRunning) {
        clearInterval(interval);
        return;
      }
      const x = canvas.width * (0.2 + Math.random() * 0.6);
      const y = canvas.height * (0.15 + Math.random() * 0.45);
      createFireworkBurst(x, y);
      playFireworkBoom();
      burstsFired++;

      if (burstsFired >= burstCount) {
        clearInterval(interval);
      }
    }, 450);
  }

  function stopFireworks() {
    isFireworksRunning = false;
    if (animationId) cancelAnimationFrame(animationId);
    if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles = [];
  }

  // Modal Controls
  window.launchNationalDayCelebration = function(playAudioImmediate = false) {
    const modal = document.getElementById('nationalDayCelebrationModal');
    if (!modal) return;
    modal.classList.remove('hidden');

    startFireworks(8);

    if (playAudioImmediate) {
      speakSaudiGreeting();
      playFireworkBoom();
    }

    const bubble = document.getElementById('ndSpeechBubble');
    if (bubble) {
      bubble.classList.add('pulse-speech');
    }
  };

  window.closeNationalDayCelebration = function() {
    const modal = document.getElementById('nationalDayCelebrationModal');
    if (modal) modal.classList.add('hidden');
    stopFireworks();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  window.replayCelebrationAudio = function() {
    playFireworkBoom();
    speakSaudiGreeting();
    startFireworks(5);
  };

  // Auto trigger check once per session (polite on load)
  document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('nationalDayCelebrationModal');
    if (!modal) return;

    const hasSeen = sessionStorage.getItem('hasSeenNationalDay96');
    if (!hasSeen) {
      sessionStorage.setItem('hasSeenNationalDay96', 'true');
      setTimeout(() => {
        window.launchNationalDayCelebration(false);
      }, 1200);
    }
  });

  if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };
  }
})();
