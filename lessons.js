(function () {
  'use strict';
  var L = window.TypingLogic;
  var KEY = 'typing-trainer-lessons-v1';
  var $ = function (id) { return document.getElementById(id); };
  var COLORS = { L5: '#ff8aa5', L4: '#ffb36b', L3: '#ffe27a', L2: '#7ee8b0', R2: '#6ad7ff', R3: '#8fa8ff', R4: '#c9a7ff', R5: '#ff9be0' };
  var lang = 'ar', cur = -1, tokens = [], pos = 0, mistakes = 0, start = 0, active = false, badKeys = {};

  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save(p) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) {} }

  function showTab(name) {
    $('pane-test').hidden = name !== 'test'; $('pane-lessons').hidden = name !== 'lessons';
    $('tab-test').classList.toggle('on', name === 'test'); $('tab-lessons').classList.toggle('on', name === 'lessons');
    if (name === 'lessons') renderList(); else if (active) exitLesson();
  }
  $('tab-test').onclick = function () { showTab('test'); };
  $('tab-lessons').onclick = function () { showTab('lessons'); };
  $('ll-ar').onclick = function () { lang = 'ar'; $('ll-ar').classList.add('on'); $('ll-en').classList.remove('on'); exitLesson(); renderList(); };
  $('ll-en').onclick = function () { lang = 'en'; $('ll-en').classList.add('on'); $('ll-ar').classList.remove('on'); exitLesson(); renderList(); };

  function renderList() {
    var p = load(), box = $('lesson-list'); box.innerHTML = ''; var done = 0;
    for (var i = 0; i < L.lessonCount(); i++) (function (i) {
      var rec = p[lang] && p[lang][String(i)]; if (rec && typeof rec.stars !== 'number') rec = null; var ok = L.isUnlocked(p, lang, i);
      if (rec && rec.stars >= 1) done++;
      var b = document.createElement('button'); b.className = 'les' + (i === cur ? ' cur' : ''); b.disabled = !ok;
      b.innerHTML = '<b>درس ' + (i + 1) + '</b>';
      var t = document.createElement('span'); t.textContent = L.STEPS[i].title; b.appendChild(t);
      var st = document.createElement('div'); st.className = 'st';
      st.textContent = ok ? (rec ? '★'.repeat(rec.stars) + '☆'.repeat(3 - rec.stars) : '☆☆☆') : 'مقفول';
      b.appendChild(st);
      if (rec) { var m = document.createElement('small'); m.className = 'muted'; m.textContent = 'أفضل: ' + rec.acc + '% · ' + rec.wpm + ' ك/د'; b.appendChild(m); }
      b.onclick = function () { begin(i); };
      box.appendChild(b);
    })(i);
    $('ll-sum').textContent = 'خلّصت ' + done + ' من ' + L.lessonCount() + ' درس';
  }

  function drawKeyboard(allowed) {
    var map = L.LAYOUT[lang], kb = $('kb'); kb.innerHTML = '';
    L.ROWS.forEach(function (row) {
      var r = document.createElement('div'); r.className = 'kbrow';
      row.forEach(function (code) {
        var k = document.createElement('div'); k.className = 'key' + (L.HOME.indexOf(code) >= 0 && (code === 'KeyF' || code === 'KeyJ') ? ' home' : '') + (allowed.indexOf(code) < 0 ? ' dim' : '');
        k.dataset.code = code; k.style.setProperty('--fc', COLORS[L.FINGER[code]]); k.textContent = map[code]; r.appendChild(k);
      });
      kb.appendChild(r);
    });
    var sr = document.createElement('div'); sr.className = 'kbrow';
    var sp = document.createElement('div'); sp.className = 'key space'; sp.dataset.code = 'Space'; sp.style.setProperty('--fc', '#b3a6d1'); sp.textContent = 'مسافة'; sr.appendChild(sp); kb.appendChild(sr);
    $('legend').innerHTML = Object.keys(COLORS).map(function (f) { return '<span><i style="background:' + COLORS[f] + '"></i>' + L.FINGER_NAME[f] + '</span>'; }).join('');
  }

  function begin(i) {
    cur = i; active = true; pos = 0; mistakes = 0; start = 0; badKeys = {};
    var text = L.makeLessonText(lang, i, Math.random, 10);
    tokens = L.tokenize(lang, text);
    $('stage').classList.add('on'); $('st-result').hidden = true;
    $('st-title').textContent = 'درس ' + (i + 1) + ': ' + L.STEPS[i].title;
    $('st-msg').textContent = 'اضغط الحرف المنوّر على الكيبورد. الغلطة بتتحسب ومبتتعداش.';
    $('ribbon').className = 'ribbon' + (lang === 'en' ? ' ltr' : '');
    drawKeyboard(L.lessonKeys(i).concat(['Space']));
    renderStep(); renderList();
    $('stage').scrollIntoView({ block: 'nearest' });
  }

  function renderStep() {
    var rb = $('ribbon'); rb.innerHTML = '';
    tokens.forEach(function (t, i) {
      var s = document.createElement('span'); s.textContent = t === ' ' ? '·' : t;
      s.className = i < pos ? 'done' : (i === pos ? 'now' : ''); rb.appendChild(s);
    });
    $('st-prog').textContent = pos + ' / ' + tokens.length;
    var t = tokens[pos]; if (t === undefined) return;
    var code = L.codeForChar(lang, t);
    $('big').textContent = t === ' ' ? 'مسافة' : t;
    $('fing').textContent = code === 'Space' ? 'الإبهام' : L.FINGER_NAME[L.FINGER[code]];
    document.querySelectorAll('#kb .key').forEach(function (k) { k.classList.remove('hit', 'bad'); if (k.dataset.code === code) k.classList.add('hit'); });
  }

  function exitLesson() { active = false; cur = -1; $('stage').classList.remove('on'); }
  $('st-exit').onclick = function () { exitLesson(); renderList(); };

  function finish() {
    active = false;
    var r = L.gradeLesson(tokens.length, mistakes, Date.now() - start);
    var p = L.recordLesson(load(), lang, cur, r); save(p);
    var weak = Object.keys(badKeys).sort(function (a, b) { return badKeys[b] - badKeys[a]; }).slice(0, 3).map(function (k) { return k + ' ×' + badKeys[k]; }).join('  ');
    var box = $('st-result'); box.hidden = false;
    box.innerHTML = '<div class="stat"><b>' + '★'.repeat(r.stars) + '☆'.repeat(3 - r.stars) + '</b><span>' + (r.passed ? 'عدّيت الدرس' : 'محتاج دقة 95% على الأقل') + '</span></div>' +
      '<div class="stat"><b>' + r.acc + '%</b><span>الدقة</span></div><div class="stat"><b>' + r.wpm + '</b><span>كلمة في الدقيقة</span></div>' +
      '<div class="stat"><b>' + mistakes + '</b><span>غلطات' + (weak ? ': ' + weak : '') + '</span></div>';
    $('st-msg').textContent = r.passed ? (cur + 1 < L.lessonCount() ? 'الدرس اللي بعده اتفتح. ارجع لقائمة الدروس.' : 'خلّصت كل الدروس.') : 'جرّب تاني بهدوء. الدقة قبل السرعة.';
    $('big').textContent = r.passed ? '✓' : '↻'; $('fing').textContent = '';
    renderList();
  }

  document.addEventListener('keydown', function (e) {
    if (!active || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Escape') { exitLesson(); renderList(); return; }
    if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab', 'Dead', 'Process'].indexOf(e.key) >= 0) return;
    e.preventDefault();
    if (!start) start = Date.now();
    var t = tokens[pos];
    if (L.isHit(lang, t, e)) {
      pos++;
      if (pos >= tokens.length) { finish(); return; }
      renderStep();
    } else {
      mistakes++; badKeys[t === ' ' ? 'مسافة' : t] = (badKeys[t === ' ' ? 'مسافة' : t] || 0) + 1;
      var hit = document.querySelector('#kb .key.hit'); if (hit) { hit.classList.add('bad'); setTimeout(function () { hit.classList.remove('bad'); }, 160); }
    }
  });
  window.addEventListener('storage', renderList);
})();
