(function () {
  'use strict';
  var L = window.TypingLogic;
  var KEY = 'typing-trainer-history-v1';
  var $ = function (id) { return document.getElementById(id); };
  var state = { lang: 'ar', secs: 30, words: [], idx: 0, typed: [], start: 0, timerId: null, done: false };

  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } }
  function save(h) { try { localStorage.setItem(KEY, JSON.stringify(h.slice(-50))); } catch (e) {} }

  function render() {
    var box = $('words');
    box.dir = state.lang === 'ar' ? 'rtl' : 'ltr';
    $('input').dir = box.dir;
    box.innerHTML = '';
    state.words.forEach(function (w, i) {
      var s = document.createElement('span');
      s.className = 'w' + (i === state.idx ? ' cur' : '');
      if (i < state.idx) s.className += L.compareWord(state.typed[i], w).correct ? ' ok' : ' no';
      s.textContent = w;
      box.appendChild(s);
      box.appendChild(document.createTextNode(' '));
    });
    var cur = box.querySelector('.cur');
    if (cur && cur.offsetTop > 120) box.scrollTop = cur.offsetTop - 60;
  }

  function reset() {
    clearInterval(state.timerId);
    state.words = L.pickWords(L.BANK[state.lang], 120);
    state.idx = 0; state.typed = []; state.start = 0; state.done = false;
    $('timer').textContent = state.secs;
    $('bar').style.width = '0%'; $('livewpm').textContent = '0';
    $('hint').textContent = 'ابدأ الكتابة وهيشتغل العدّاد';
    $('input').value = ''; $('input').disabled = false;
    $('result').hidden = true;
    render();
    $('input').focus();
  }

  function tick() {
    var left = state.secs - Math.floor((Date.now() - state.start) / 1000);
    $('timer').textContent = Math.max(left, 0);
    var el = Date.now() - state.start;
    $('bar').style.width = Math.min(100, el / (state.secs * 10)) + '%';
    $('livewpm').textContent = L.summarize(state.words, state.typed, el).wpm;
    if (left <= 0) finish();
  }

  function finish() {
    if (state.done) return;
    state.done = true;
    clearInterval(state.timerId);
    var partial = $('input').value.trim();
    var typed = state.typed.slice();
    if (partial) typed.push(partial);
    var elapsed = Math.min(Date.now() - state.start, state.secs * 1000);
    var s = L.summarize(state.words, typed, elapsed);
    var h = load();
    h.push({ t: Date.now(), lang: state.lang, secs: state.secs, wpm: s.wpm, acc: s.accuracy, badKeys: s.badKeys });
    save(h);
    $('input').disabled = true;
    $('r-wpm').textContent = s.wpm;
    $('r-acc').textContent = s.accuracy + '%';
    $('r-words').textContent = s.correctWords;
    $('r-best').textContent = L.bestWpm(h, state.lang, state.secs);
    $('result').hidden = false;
    $('hint').textContent = 'خلصت. اضغط «جملة جديدة» تجرب تاني';
    drawStats();
  }

  function onInput(e) {
    if (state.done) return;
    var v = e.target.value;
    if (!state.start && v.trim()) {
      state.start = Date.now();
      state.timerId = setInterval(tick, 200);
      $('hint').textContent = 'كمّل...';
    }
    if (/\s$/.test(v) && v.trim()) {
      state.typed[state.idx] = v.trim();
      state.idx++;
      e.target.value = '';
      render();
    } else if (/^\s+$/.test(v)) {
      e.target.value = '';
    }
  }

  function drawStats() {
    var h = load();
    var cv = $('chart'), ctx = cv.getContext('2d');
    var w = cv.clientWidth, ht = cv.clientHeight, dpr = window.devicePixelRatio || 1;
    cv.width = w * dpr; cv.height = ht * dpr; ctx.scale(dpr, dpr); ctx.direction = 'ltr'; ctx.clearRect(0, 0, w, ht);
    var pts = h.slice(-20);
    $('chart-empty').hidden = pts.length > 0;
    if (pts.length) {
      var max = Math.max.apply(null, pts.map(function (p) { return p.wpm; }).concat([10]));
      ctx.strokeStyle = 'rgba(188,195,210,.2)'; ctx.fillStyle = '#B4BCCD'; ctx.font = '12px sans-serif';
      ctx.beginPath(); ctx.moveTo(30, 10); ctx.lineTo(30, ht - 20); ctx.lineTo(w - 6, ht - 20); ctx.stroke();
      ctx.fillText(max, 2, 18); ctx.fillText('0', 12, ht - 22);
      var x0 = 36, step = pts.length > 1 ? (w - 50) / (pts.length - 1) : 0;
      ctx.strokeStyle = '#c9a7ff'; ctx.lineWidth = 2.5; ctx.beginPath();
      pts.forEach(function (p, i) {
        var x = x0 + i * step, y = (ht - 20) - (p.wpm / max) * (ht - 36);
        if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      });
      ctx.stroke(); ctx.fillStyle = '#c9a7ff';
      pts.forEach(function (p, i) {
        ctx.beginPath(); ctx.arc(x0 + i * step, (ht - 20) - (p.wpm / max) * (ht - 36), 3.5, 0, 7); ctx.fill();
      });
    }
    var wk = L.weakKeys(h, 8), el = $('weak');
    el.innerHTML = '';
    if (!wk.length) { el.innerHTML = '<span class="muted">هتظهر بعد أول محاولة فيها غلطات.</span>'; return; }
    wk.forEach(function (p) {
      var s = document.createElement('span');
      s.textContent = p[0] + ' × ' + p[1];
      el.appendChild(s);
    });
  }

  function setBtn(group, active) {
    group.forEach(function (b) { b.classList.toggle('on', b === active); b.setAttribute('aria-pressed', b === active); });
  }
  var langBtns = [$('lang-ar'), $('lang-en')], timeBtns = [$('t-30'), $('t-60')];
  $('lang-ar').onclick = function () { state.lang = 'ar'; setBtn(langBtns, this); reset(); };
  $('lang-en').onclick = function () { state.lang = 'en'; setBtn(langBtns, this); reset(); };
  $('t-30').onclick = function () { state.secs = 30; setBtn(timeBtns, this); reset(); };
  $('t-60').onclick = function () { state.secs = 60; setBtn(timeBtns, this); reset(); };
  $('restart').onclick = reset;
  $('clear').onclick = function () { if (confirm('تمسح كل السجل؟')) { save([]); drawStats(); } };
  $('input').addEventListener('input', onInput);
  window.addEventListener('resize', drawStats);
  reset(); drawStats();
})();
