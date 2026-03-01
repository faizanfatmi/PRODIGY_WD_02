// ============================================================
//  Liquid Stopwatch — Script
// ============================================================

(() => {
  'use strict';

  // ---- DOM refs ----
  const minutesEl      = document.getElementById('minutes');
  const secondsEl      = document.getElementById('seconds');
  const millisecondsEl = document.getElementById('milliseconds');
  const startBtn       = document.getElementById('startBtn');
  const resetBtn       = document.getElementById('resetBtn');
  const lapBtn         = document.getElementById('lapBtn');
  const lapsList       = document.getElementById('lapsList');
  const lapsContainer  = document.getElementById('lapsContainer');
  const progressRing   = document.getElementById('progressRing');
  const progressDot    = document.getElementById('progressDot');
  const waterFill      = document.getElementById('waterFill');
  const colonEl        = document.querySelector('.time-colon');

  // ---- State ----
  let running       = false;
  let elapsedMs     = 0;
  let startTime     = 0;
  let animFrame      = null;
  let laps           = [];
  let lastLapMs      = 0;

  // Ring constants
  const CIRCUMFERENCE = 2 * Math.PI * 120; // r = 120

  // ---- Helpers ----
  function pad(n, len = 2) {
    return String(n).padStart(len, '0');
  }

  function formatTime(ms) {
    const totalSec = Math.floor(ms / 1000);
    const mins     = Math.floor(totalSec / 60);
    const secs     = totalSec % 60;
    const centis   = Math.floor((ms % 1000) / 10);
    return { mins: pad(mins), secs: pad(secs), centis: pad(centis) };
  }

  function formatTimeFull(ms) {
    const { mins, secs, centis } = formatTime(ms);
    return `${mins}:${secs}.${centis}`;
  }

  // ---- Display ----
  function updateDisplay() {
    const { mins, secs, centis } = formatTime(elapsedMs);
    minutesEl.textContent      = mins;
    secondsEl.textContent      = secs;
    millisecondsEl.textContent = centis;
    updateRing();
    updateWater();
  }

  function updateRing() {
    // One full rotation every 60 seconds
    const secondsFrac = (elapsedMs % 60000) / 60000;
    const offset = CIRCUMFERENCE - (secondsFrac * CIRCUMFERENCE);
    progressRing.style.strokeDashoffset = offset;

    // Move the dot
    const angle = secondsFrac * 360; // in degrees
    const rad   = (angle - 90) * (Math.PI / 180); // offset by -90 to start at top
    const cx    = 130 + 120 * Math.cos(rad);
    const cy    = 130 + 120 * Math.sin(rad);
    progressDot.setAttribute('cx', cx);
    progressDot.setAttribute('cy', cy);
  }

  function updateWater() {
    // Water level rises from 0→100% over 5 minutes, then stays full
    const maxMs = 5 * 60 * 1000;
    const pct   = Math.min((elapsedMs / maxMs) * 100, 100);
    waterFill.querySelector('.water-fill').style.height = pct + '%';
  }

  // ---- Loop ----
  function tick() {
    elapsedMs = Date.now() - startTime;
    updateDisplay();
    animFrame = requestAnimationFrame(tick);
  }

  // ---- Start / Pause ----
  function start() {
    if (running) {
      // Pause
      running = false;
      cancelAnimationFrame(animFrame);
      startBtn.classList.add('paused');
      startBtn.querySelector('.icon-play').style.display  = '';
      startBtn.querySelector('.icon-pause').style.display = 'none';
      colonEl.classList.remove('running');
    } else {
      // Start / Resume
      running = true;
      startTime = Date.now() - elapsedMs;
      tick();
      startBtn.classList.remove('paused');
      startBtn.querySelector('.icon-play').style.display  = 'none';
      startBtn.querySelector('.icon-pause').style.display = '';
      colonEl.classList.add('running');
      progressDot.classList.add('visible');
      lapBtn.disabled  = false;
    }
  }

  // ---- Reset ----
  function reset() {
    running = false;
    cancelAnimationFrame(animFrame);
    elapsedMs = 0;
    lastLapMs = 0;
    laps      = [];
    updateDisplay();

    startBtn.classList.remove('paused');
    startBtn.querySelector('.icon-play').style.display  = '';
    startBtn.querySelector('.icon-pause').style.display = 'none';
    colonEl.classList.remove('running');
    progressDot.classList.remove('visible');
    progressRing.style.strokeDashoffset = CIRCUMFERENCE;
    waterFill.querySelector('.water-fill').style.height = '0%';

    lapsList.innerHTML = '';
    lapsContainer.classList.remove('show');
    lapBtn.disabled  = true;
  }

  // ---- Lap ----
  function addLap() {
    if (!running && elapsedMs === 0) return;

    const lapTime   = elapsedMs - lastLapMs;
    lastLapMs       = elapsedMs;
    const lapNumber = laps.length + 1;
    laps.push({ number: lapNumber, lapTime, total: elapsedMs });

    renderLaps();
    lapsContainer.classList.add('show');
  }

  function renderLaps() {
    // Find best & worst lap times (only when ≥ 2 laps)
    let bestIdx  = -1;
    let worstIdx = -1;
    if (laps.length >= 2) {
      let minTime = Infinity;
      let maxTime = -Infinity;
      laps.forEach((l, i) => {
        if (l.lapTime < minTime) { minTime = l.lapTime; bestIdx  = i; }
        if (l.lapTime > maxTime) { maxTime = l.lapTime; worstIdx = i; }
      });
    }

    lapsList.innerHTML = '';
    // Render in reverse so newest is on top
    for (let i = laps.length - 1; i >= 0; i--) {
      const l  = laps[i];
      const li = document.createElement('li');
      li.className = 'lap-item';
      if (i === bestIdx)  li.classList.add('best');
      if (i === worstIdx) li.classList.add('worst');

      li.innerHTML = `
        <span class="lap-number">${pad(l.number)}</span>
        <span class="lap-time">${formatTimeFull(l.lapTime)}</span>
        <span class="lap-total">${formatTimeFull(l.total)}</span>
      `;
      lapsList.appendChild(li);
    }
  }

  // ---- Wire events ----
  startBtn.addEventListener('click', start);
  resetBtn.addEventListener('click', reset);
  lapBtn.addEventListener('click', addLap);

  // ---- Init ----
  updateDisplay();
  lapBtn.disabled = true;

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      start();
    } else if (e.code === 'KeyR') {
      reset();
    } else if (e.code === 'KeyL') {
      addLap();
    }
  });
})();
