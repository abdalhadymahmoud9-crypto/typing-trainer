(function () {
  'use strict';
  var G = window.TypingCourseGen, L = window.TypingLogic, C = window.TypingCourse, S = window.TypingCourseState, A = window.TypingCourseContent, B = window.TypingCourseContent2;
  var $ = function (id) { return document.getElementById(id); };
  var stepIdx = -1, track = 'ar', mode = null, stage = 0, target = '', events = [], typed = [], startedAt = 0, examIdx = 0, rejected = 0;
  var TITLES = { 0: 'قبل ما تبدأ', 1: 'صف الأساس', 2: 'الصف العلوي', 3: 'الصف السفلي وحروف الأطراف', 4: 'Shift وعلامات الترقيم والأرقام', 5: 'كلمات وجمل بطلاقة', 6: 'بناء السرعة', 7: 'نص حقيقي طويل' };
  var INTRO = {
    0: 'اقعد معتدل، ضهرك مسنود، ورسغك مرتاح مش مسنود على الترابيزة. حط صوابعك على صف الأساس (الإنجليزي: A S D F و J K L ;). الصوابع الاتنين اللي ماسكين F و J فيهم نتوءة صغيرة تحسّك مكانك من غير ما تبص. المرحلة دي مفيهاش اختبار.',
    1: 'صف الأساس كله مع حرفين من الصف نفسه بيمدّ فيهم السبابتين. الهدف: دقة قبل أي سرعة.', 2: 'الصف العلوي. كل صباع بيطلع لفوق وبيرجع لمكانه.', 3: 'الصف السفلي والفاصلة والنقطة وحروف الأطراف (ط، ج، د في العربي).',
    4: track === 'ar' ? 'همزات (أ إ آ) وعلامات الترقيم العربية (؟ ، ؛). مواضع Shift بتختلف من نظام لنظام، فالمرحلة دي بتتقيّم على الحرف اللي بيطلع فعلاً مش على مكان الزرار. الأرقام والتشكيل مش متدرّب عليهم هنا.' : 'الحروف الكبيرة بـ Shift والأرقام وعلامات الترقيم. بتتقيّم على الحرف اللي بيطلع فعلاً.',
    5: 'كلمات وجمل بطلاقة. اقرأ الكلمة اللي جاية وإيدك بتخلص اللي قبلها.', 6: 'كلمات متكررة وجمل قصيرة بسرعة أعلى شوية. الغلط المصحَّح بيتحسب عليك في الدقة.', 7: 'فقرات حقيقية. هنا بتتعوّد على الاستمرار من غير توقف.'
  };

  function load() { try { return S.clean(JSON.parse(localStorage.getItem(S.KEY))); } catch (e) { return S.empty(); } }
  function save(s) { try { localStorage.setItem(S.KEY, JSON.stringify(s)); } catch (e) {} }

  function pool(lang, st) {
    var out = { words: [], sentences: [] }, a = A.CONTENT[lang], b = B.CONTENT[lang];
    for (var i = 1; i <= st && i <= 3; i++) { var k = 's' + i; if (a[k]) { out.words = out.words.concat(a[k].words); out.sentences = out.sentences.concat(a[k].sentences); } }
    if (st >= 4) { for (var j = 4; j <= Math.min(st, 6); j++) { var c = b['s' + j]; out.words = out.words.concat(c.words); out.sentences = out.sentences.concat(c.sentences); } }
    return out;
  }
  function pick(arr, n) { var a = arr.slice(), o = []; while (a.length && o.length < n) o.push(a.splice(Math.floor(Math.random() * a.length), 1)[0]); return o; }
  function isDrill(m) { return m === 'drill' || m === 'step' || m === 'review' || m === 'weak'; }
  function unlockedNow(s) {
    if (S.highestPassed(s, track) >= 3) return G.unlocked(G.STEPS.length - 1);
    var last = -1; G.STEPS.forEach(function (x, i) { if (S.stepDone(s, track, i) || (S.highestPassed(s, track) >= x.stage)) last = i; });
    return G.unlocked(Math.max(last, 0));
  }
  function textFor(kind, st) {
    var lang = track, s0 = load();
    if (kind === 'step') return G.stepLesson(lang, stepIdx).text;
    if (kind === 'review') { var rv = st <= 3 ? G.review(lang, st) : pick(pool(lang, st - 1).words, 18).join(' '); return rv || pick(pool(lang, Math.max(st, 1)).words, 16).join(' '); }
    if (kind === 'weak') {
      var wt = G.adaptive(lang, G.weakKeys(s0.results, track, 3), unlockedNow(s0));
      if (wt.trim().split(/\s+/).length >= 6) return wt;
      var li = 0; G.STEPS.forEach(function (x, i) { if (S.stepDone(s0, track, i)) li = i; }); // too few real words with the keys so far: repeat the latest step instead
      return G.stepLesson(lang, li).text;
    }
    if (kind === 'exam') { examIdx = Math.floor(Math.random() * B.CONTENT[lang].exam.length); return B.CONTENT[lang].exam[examIdx]; }
    if (st === 7) return B.CONTENT[lang].s7.paragraphs[Math.floor(Math.random() * 3)];
    var p = pool(lang, st);
    if (kind === 'drill') return pick(p.words, 24).join(' ') + ' ' + pick(p.sentences, 3).join(' ');
    return pick(p.sentences, 3).join(' '); // stage test
  }
  function expect(ch) { // stages 1-3 are scored by physical key; 4+ by the character produced
    if (stage > 3 || mode === 'exam') return null;
    if (ch === ' ') return { code: 'Space' };
    var c = L.codeForChar(track, ch); return c ? { code: c } : null;
  }
  function codeFor() { return stage > 3 || mode === 'exam' ? null : expect; }

  function renderMap() {
    var s = load(), sum = S.summary(s, track), box = $('c-map'); box.innerHTML = '';
    for (var i = 0; i <= S.STAGES; i++) (function (i) {
      var open = i === 0 || S.stageOpen(s, track, i), b = document.createElement('button'); b.className = 'les'; b.disabled = !open && i !== 0;
      var best = null; s.results.forEach(function (r) { if (r.track === track && r.kind === 'stage' && r.ref === i && r.passed && (!best || r.wpm > best.wpm)) best = r; });
      b.innerHTML = '<b>' + (i === 0 ? 'تمهيد' : 'مرحلة ' + i) + '</b>';
      var t = document.createElement('span'); t.textContent = TITLES[i]; b.appendChild(t);
      var st = document.createElement('div'); st.className = 'st'; st.textContent = i === 0 ? 'بدون اختبار' : (best ? '✓ ' + best.acc + '% · ' + best.wpm : (sum.manual ? '✓ مكتمل يدوي' : (open ? 'مفتوحة' : 'مقفولة')));
      b.appendChild(st); b.onclick = function () { openStage(i); }; box.appendChild(b);
    })(i);
    var ex = document.createElement('button'); ex.className = 'les'; ex.disabled = !sum.examOpen; ex.innerHTML = '<b>الاختبار النهائي</b>';
    var et = document.createElement('span'); et.textContent = 'نص جديد، شهادة لو عدّيت'; ex.appendChild(et);
    var es = document.createElement('div'); es.className = 'st'; es.textContent = sum.exam ? '✓ ' + sum.exam.acc + '% · ' + sum.exam.wpm : (sum.manual ? 'مفتوح (المسار معلّم مكتمل يدوي، من غير نتيجة)' : (sum.examOpen ? 'مفتوح' : 'مقفول')); ex.appendChild(es);
    ex.onclick = function () { openStage(8); }; box.appendChild(ex);
    $('c-sum').textContent = (sum.manual ? 'المسار ده معلّم مكتمل يدوي من صاحب الحساب (من غير درجات). ' : '') + 'وصلت للمرحلة ' + sum.highest + ' من ' + S.STAGES + ' · محاولات: ' + sum.attempts;
    var ch = $('c-certs'); ch.innerHTML = '';
    s.certs.filter(function (c) { return c.track === track; }).forEach(function (c) {
      var b = document.createElement('button'); b.textContent = 'شهادة ' + c.name + ' (' + new Date(c.t).toLocaleDateString('ar-EG') + ')'; b.onclick = function () { drawCert(c); }; ch.appendChild(b);
    });
  }

  function openStage(i) {
    stage = i; $('c-play').classList.remove('on'); $('c-info').hidden = false; $('c-cert').hidden = true; $('c-info').scrollIntoView({ block: 'nearest' });
    var s = load();
    if (i === 8) { $('c-title').textContent = 'الاختبار النهائي'; $('c-intro').textContent = 'نص ما اتدرّبتش عليه (٤٠٠ حرف تقريباً أو أكتر، مفيش مؤقت: السرعة بتتحسب من أول ضغطة لآخر ضغطة). ' + B.CONTENT[track].exam.length + ' نصوص مختلفة في المسار ده، فهتتكرر بعد كام محاولة. للعدّي: دقة ٩٦٪ وسرعة ٣٠ ك/د على الأقل، ٩٨٪ و٤٥ للتميّز. الأرقام دي معايير اخترتها للتطبيق ومش معتمدة من جهة خارجية' + (track === 'ar' ? '، وفي العربي لسه مبدئية.' : '.') + ' تقدر تعيد من غير حد أقصى وأفضل نتيجة هي اللي بتتحسب. بتتقيّم على الحرف اللي بيطلع.'; $('c-drill').hidden = true; $('c-test').textContent = 'ابدأ الاختبار النهائي'; $('c-test').hidden = false; return; }
    $('c-title').textContent = (i === 0 ? '' : 'مرحلة ' + i + ': ') + TITLES[i]; $('c-intro').textContent = INTRO[i] || '';
    renderSteps(i);
    if (i === 0) { $('c-drill').hidden = true; $('c-test').hidden = true; $('c-review').hidden = true; $('c-weak').hidden = true; return; }
    $('c-review').hidden = false; $('c-weak').hidden = false;
    var r = S.RULES[i]; $('c-intro').textContent += ' شرط العدّي: دقة ' + r.minAcc + '٪ وسرعة ' + r.minWpm + ' ك/د على الأقل (معيار للتطبيق مش معتمد من جهة خارجية).';
    $('c-drill').hidden = false; $('c-test').hidden = false; $('c-test').textContent = S.stageOpen(s, track, i - 1) || i === 1 ? 'اختبار المرحلة' : 'اختبار المرحلة (اختبار مباشر)';
  }

  function renderSteps(i) {
    var box = $('c-steps'), s = load(); box.innerHTML = '';
    if (i < 1 || i > 3) return;
    var sd = S.stepsDone(s, track, i);
    var h = document.createElement('p'); h.className = 'note'; h.textContent = 'خطوات الحروف: ' + sd[0] + ' من ' + sd[1] + ' (كل خطوة: حرفين جداد، أزواج حروف، كلمات حقيقية، جملة. المطلوب دقة ٩٠٪ من غير شرط سرعة). تقدر تعمل اختبار المرحلة مباشرة لو عارف الحروف.'; box.appendChild(h);
    var grid = document.createElement('div'); grid.className = 'stepgrid'; box.appendChild(grid);
    G.stepsOf(i).forEach(function (idx) {
      var b = document.createElement('button'); b.className = 'les'; var open = S.stepOpen(s, track, idx); b.disabled = !open;
      var done = S.stepDone(s, track, idx), keys = G.STEPS[idx].add.map(function (c) { return L.LAYOUT[track][c] || c; }).join(' ');
      b.innerHTML = '<b></b><span></span><div class="st"></div>'; b.firstChild.textContent = 'خطوة ' + (idx + 1); b.children[1].textContent = keys; b.children[2].textContent = done ? '✓ تمت' : (open ? 'مفتوحة' : 'مقفولة');
      b.onclick = function () { stepIdx = idx; begin('step'); }; grid.appendChild(b);
    });
  }
  function begin(kind) {
    mode = kind; target = textFor(kind, stage); events = []; typed = []; startedAt = 0; rejected = 0;
    $('c-info').hidden = true; $('c-play').classList.add('on'); $('c-result').hidden = true;
    $('c-ribbon').className = 'ribbon' + (track === 'en' ? ' ltr' : '');
    $('c-msg').textContent = isDrill(kind) ? 'تمرين: الزرار الغلط مبيقدّمكش. Esc للخروج.' : 'اختبار: تقدر تمسح بـ Backspace. Esc للخروج.';
    render();
  }
  function render() {
    var rb = $('c-ribbon'); rb.innerHTML = '';
    var chars = Array.from(target);
    chars.forEach(function (ch, i) {
      var sp = document.createElement('span'); sp.textContent = ch === ' ' ? '·' : ch;
      var t = typed[i]; sp.className = t === undefined ? (i === typed.length ? 'now' : '') : (t ? 'done' : 'bad'); rb.appendChild(sp);
    });
    $('c-prog').textContent = typed.length + ' / ' + chars.length;
  }
  function finish() {
    var res = C.score(target, events, codeFor());
    var done = mode; $('c-play').classList.remove('on'); mode = null;
    var box = $('c-result'); box.hidden = false; $('c-info').hidden = false;
    var s = load(), msg = '';
    if (done === 'step') {
      var o2 = S.addResult(s, track, 'step', stepIdx, res); save(o2.state); s = o2.state;
      msg = o2.record.passed ? 'عدّيت الخطوة. الخطوة اللي بعدها اتفتحت.' : 'الدقة ' + res.acc + '٪. المطلوب ٩٠٪ على الأقل عشان تعدّي الخطوة، من غير شرط سرعة. جرّب تاني بهدوء.';
    } else if (isDrill(done)) {
      msg = 'خلصت التمرين: ' + res.acc + '% دقة.' + (done === 'weak' ? ' ده تدريب بس ومبيتسجلش.' : '');
    } else {
      var kind = done === 'exam' ? 'exam' : 'stage', ref = done === 'exam' ? examIdx : stage;
      var out = S.addResult(s, track, kind, ref, res); save(out.state); s = out.state;
      msg = out.record.passed ? (kind === 'exam' ? 'عدّيت الاختبار النهائي! اكتب اسمك تحت واطلّع الشهادة.' : 'عدّيت المرحلة ' + stage + '. اللي بعدها اتفتحت.') : 'لسه. جرّب تاني، الدقة الأول.';
    }
    box.innerHTML = '<div class="stat"><b>' + res.wpm + '</b><span>ك/د صافي</span></div><div class="stat"><b>' + res.acc + '%</b><span>دقة</span></div><div class="stat"><b>' + res.corrected + ' / ' + res.uncorrected + '</b><span>مصحَّح / متبقّي</span></div><div class="stat"><b>' + res.consistency + '</b><span>ثبات (معلومة بس)</span></div>';
    $('c-note').textContent = msg + (rejected ? ' (اتجاهل ' + rejected + ' ضغطة مش من الكيبورد.)' : '');
    $('c-name-row').hidden = !(done === 'exam' && S.bestExam(s, track));
    renderMap(); if (done === 'exam') openStageKeep();
  }
  function openStageKeep() { $('c-info').hidden = false; }

  document.addEventListener('keydown', function (e) {
    if (!mode || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Escape') { mode = null; $('c-play').classList.remove('on'); $('c-info').hidden = false; return; }
    if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab', 'Dead', 'Process'].indexOf(e.key) >= 0) return;
    e.preventDefault();
    if (mode === 'exam' && !C.isTypingEvent(e)) { rejected++; return; }
    var now = Date.now(); if (!startedAt) startedAt = now;
    var chars = Array.from(target);
    if (e.key === 'Backspace') { if (isDrill(mode)) return; events.push({ t: now, type: 'back' }); typed.pop(); render(); return; }
    if (e.key === 'Enter') { if (!isDrill(mode) && typed.length >= chars.length) finish(); return; }
    var ch = e.key; if (ch.length > 2) return;
    var ev = { t: now, type: 'key', ch: ch, code: e.code, shift: e.shiftKey };
    if (isDrill(mode)) {
      var want = chars[typed.length], ex = codeFor() ? codeFor()(want) : null;
      var hit = ex && e.code ? ex.code === e.code : ch === want;
      if (!hit) { events.push({ t: now, type: 'key', ch: ch, code: e.code, shift: e.shiftKey, bad: true }); flash(); return; }
      events.push(ev); typed.push(true);
    } else {
      events.push(ev);
      var run = []; events.forEach(function (x) { if (x.type === 'back') run.pop(); else if (run.length < chars.length) { if (x.ch && x.ch.length === 2 && target.substr(run.length, 2) === x.ch) { run.push(true, true); } else { var ex2 = codeFor() ? codeFor()(chars[run.length]) : null; run.push(ex2 && x.code ? ex2.code === x.code && !!ex2.shift === !!x.shift : x.ch === chars[run.length]); } } });
      typed = run;
    }
    if (typed.length >= chars.length) {
      if (isDrill(mode) || typed.every(Boolean)) { finish(); return; }
      $('c-msg').textContent = 'فيه غلطات. امسح وصحّح، أو اضغط Enter عشان تسلّم.';
    }
    render();
  });
  function flash() { var r = $('c-ribbon'); r.classList.add('shake'); setTimeout(function () { r.classList.remove('shake'); }, 150); }

  // Certificate: a PNG drawn in the browser. It records completion and results in THIS app only.
  function drawCert(c) {
    var cv = $('c-canvas'), x = cv.getContext('2d'), W = cv.width = 1400, H = cv.height = 900;
    x.fillStyle = '#fbf8ff'; x.fillRect(0, 0, W, H); x.strokeStyle = '#7c3aed'; x.lineWidth = 10; x.strokeRect(30, 30, W - 60, H - 60); x.lineWidth = 2; x.strokeRect(52, 52, W - 104, H - 104);
    x.textAlign = 'center'; x.direction = c.track === 'ar' ? 'rtl' : 'ltr'; x.fillStyle = '#2a1458';
    var ar = c.track === 'ar'; x.font = '700 64px "Segoe UI",Tahoma,Arial'; x.fillText(ar ? 'شهادة إتمام كورس الكتابة' : 'Typing Course Completion', W / 2, 190);
    x.font = '30px "Segoe UI",Tahoma,Arial'; x.fillStyle = '#5b4a85'; x.fillText(ar ? 'بتفيد إن' : 'This records that', W / 2, 290);
    x.fillStyle = '#6d28d9'; x.font = '700 80px "Segoe UI",Tahoma,Arial'; x.fillText(c.name, W / 2, 400);
    x.fillStyle = '#2a1458'; x.font = '34px "Segoe UI",Tahoma,Arial';
    x.fillText(ar ? 'خلّص كورس الكتابة العربي في تطبيق مدرّب الكتابة' + (c.distinction ? ' بتميّز' : '') : 'completed the English typing course in the Typing Trainer app' + (c.distinction ? ' with distinction' : ''), W / 2, 490);
    var sm = !!c.sample, pv = function (v, u) { return sm ? '--' + (u || '') : v + (u || ''); };
    x.fillText((ar ? 'الاختبار النهائي: ' : 'Final test: ') + pv(c.wpm) + (ar ? ' كلمة/د · دقة ' : ' WPM · accuracy ') + pv(c.acc, '%') + ' · ' + (ar ? 'ثبات ' : 'consistency ') + pv(c.cons), W / 2, 560);
    x.fillStyle = '#5b4a85'; x.font = '26px "Segoe UI",Tahoma,Arial'; x.fillText(c.sample ? (ar ? 'التاريخ: --' : 'Date: --') : new Date(c.t).toLocaleDateString(ar ? 'ar-EG' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric' }), W / 2, 630);
    if (c.sample) { x.save(); x.translate(W / 2, H / 2); x.rotate(-0.35); x.font = '700 110px "Segoe UI",Tahoma,Arial'; x.fillStyle = 'rgba(220,38,38,0.16)'; x.direction = 'rtl'; x.fillText('نموذج للمعاينة فقط', 0, 0); x.restore(); x.direction = ar ? 'rtl' : 'ltr'; x.fillStyle = '#b91c1c'; x.font = '700 26px "Segoe UI",Tahoma,Arial'; x.fillText('معاينة شكل الشهادة: مش شهادة حقيقية، والنتيجة والتاريخ لسه ما اتكتبوش.', W / 2, 110); }
    x.font = '22px "Segoe UI",Tahoma,Arial'; x.fillStyle = '#6b5d8f';
    x.fillText(ar ? 'الشهادة دي صادرة من التطبيق نفسه وبتسجّل إتمام الكورس ونتيجتك فيه بس.' : 'Issued by this app. It records completion and results inside this app only.', W / 2, 740);
    x.fillText(ar ? 'مش تحقق من هوية ولا شهادة مهارة معتمدة، ومحفوظة في المتصفح فمش مقاومة للتعديل.' : 'Not identity verification, not an accredited qualification, and not tamper-proof (stored in the browser).', W / 2, 780);
    $('c-cert').hidden = false; $('c-cert').scrollIntoView({ block: 'nearest' });
  }

  $('ct-ar').onclick = function () { track = 'ar'; $('ct-ar').classList.add('on'); $('ct-en').classList.remove('on'); mode = null; $('c-play').classList.remove('on'); $('c-info').hidden = true; renderMap(); };
  $('ct-en').onclick = function () { track = 'en'; $('ct-en').classList.add('on'); $('ct-ar').classList.remove('on'); mode = null; $('c-play').classList.remove('on'); $('c-info').hidden = true; renderMap(); };
  $('c-drill').onclick = function () { begin('drill'); };
  $('c-review').onclick = function () { begin('review'); };
  $('c-weak').onclick = function () {
    var s = load(), w = G.weakKeys(s.results, track, 3);
    if (!w.length) { $('c-note').textContent = 'لسه مفيش بيانات كفاية عن حروفك. اعمل كام خطوة أو اختبار الأول (٤ ضغطات على الأقل لكل حرف).'; $('c-result').hidden = true; return; }
    begin('weak');
  };
  $('c-test').onclick = function () { begin(stage === 8 ? 'exam' : 'test'); };
  $('c-exit').onclick = function () { mode = null; $('c-play').classList.remove('on'); $('c-info').hidden = false; };
  $('c-issue').onclick = function () {
    var out = S.issueCertificate(load(), track, $('c-name').value); if (out.error) { $('c-note').textContent = out.error === 'no-name' ? 'اكتب اسمك الأول.' : 'لازم تعدّي الاختبار النهائي الأول.'; return; }
    save(out.state); drawCert(out.cert); renderMap();
  };
  $('c-dl').onclick = function () { $('c-canvas').toBlob(function (b) { var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'typing-certificate.png'; a.click(); }); };
  window.addEventListener('storage', renderMap);
  window.__drawCert = drawCert; window.__courseRender = renderMap; renderMap();
})();
