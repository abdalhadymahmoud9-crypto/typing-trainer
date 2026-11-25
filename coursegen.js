(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./logic.js'), require('./coursecontent.js'), require('./coursecontent2.js'));
  else root.TypingCourseGen = factory(root.TypingLogic, root.TypingCourseContent, root.TypingCourseContent2);
})(this, function (L, A, B) {
  'use strict';
  // Small-step key introduction for stages 1-3. Each step adds 2 keys (a left and a right finger where possible).
  var ALL;
  var STEPS = [
    { stage: 1, add: ['KeyF', 'KeyJ'], title: 'السبابتين: F و J' },
    { stage: 1, add: ['KeyD', 'KeyK'], title: 'الوسطى: D و K' },
    { stage: 1, add: ['KeyS', 'KeyL'], title: 'البنصر: S و L' },
    { stage: 1, add: ['KeyA', 'Semicolon'], title: 'الخنصر: A و ;' },
    { stage: 1, add: ['KeyG', 'KeyH'], title: 'السبابتين بتمتد: G و H' },
    { stage: 2, add: ['KeyR', 'KeyU'], title: 'R و U' },
    { stage: 2, add: ['KeyE', 'KeyI'], title: 'E و I' },
    { stage: 2, add: ['KeyT', 'KeyY'], title: 'T و Y' },
    { stage: 2, add: ['KeyW', 'KeyO'], title: 'W و O' },
    { stage: 2, add: ['KeyQ', 'KeyP'], title: 'Q و P' },
    { stage: 3, add: ['KeyV', 'KeyM'], title: 'V و M' },
    { stage: 3, add: ['KeyC', 'Comma'], title: 'C و الفاصلة' },
    { stage: 3, add: ['KeyX', 'Period'], title: 'X و النقطة' },
    { stage: 3, add: ['KeyZ', 'Slash'], title: 'Z و /' },
    { stage: 3, add: ['KeyB', 'KeyN'], title: 'B و N' },
    { stage: 3, add: ['Quote', 'BracketLeft', 'BracketRight'], title: 'حروف الأطراف' }
  ];
  function stepsOf(stage) { var o = []; (ALL || STEPS).forEach(function (s, i) { if (s.stage === stage) o.push(i); }); return o; }
  function unlocked(stepIdx) { var o = []; for (var i = 0; i <= stepIdx && i < STEPS.length; i++) o = o.concat(STEPS[i].add); return o; }

  function pool(lang) {
    var set = {}, out = [];
    function add(w) { if (/^[^\s]+$/.test(w) && !set[w]) { set[w] = 1; out.push(w); } }
    (L.BANK[lang] || []).forEach(add);
    [A.CONTENT[lang], B.CONTENT[lang]].forEach(function (c) { Object.keys(c).forEach(function (k) { if (c[k].words) c[k].words.forEach(function (w) { if (/^[\u0621-\u064Aa-zA-Z]+$/.test(w)) add(w); }); }); });
    return out;
  }
  function fits(lang, text, allowed) {
    var chars = lang === 'ar' ? text.split('') : text.split('');
    return chars.every(function (ch) { if (ch === ' ') return true; var c = L.codeForChar(lang, ch.toLowerCase()); return c && allowed.indexOf(c) >= 0; });
  }
  function pickN(arr, n, rand) { var a = arr.slice(), o = []; while (a.length && o.length < n) o.push(a.splice(Math.floor(rand() * a.length), 1)[0]); return o; }
  function sym(lang, code) { return L.LAYOUT[lang][code]; }

  function keyDrill(lang, add, known, rand, groups, pNew) {
    var all = add.concat(pickN(known, 3, rand)), out = [];
    for (var i = 0; i < (groups || 10); i++) {
      var g = '', len = 3 + Math.floor(rand() * 2);
      for (var j = 0; j < len; j++) { var pickNew = rand() < (pNew || 0.7); var src = pickNew ? add : all; g += sym(lang, src[Math.floor(rand() * src.length)]); }
      out.push(g);
    }
    return out.join(' ');
  }
  function bigrams(lang, add, un, rand) {
    var out = [];
    add.forEach(function (a) {
      pickN(un.filter(function (k) { return k !== a; }), 3, rand).forEach(function (k) { var x = sym(lang, a) + sym(lang, k), y = sym(lang, k) + sym(lang, a); out.push(x + ' ' + y + ' ' + x); });
    });
    return pickN(out, 6, rand).join(' ');
  }
  function words(lang, add, un, n, rand) {
    var p = pool(lang).filter(function (w) { return fits(lang, w, un); });
    var withNew = p.filter(function (w) { return add.some(function (a) { return w.indexOf(sym(lang, a)) >= 0 || w.toLowerCase().indexOf(sym(lang, a)) >= 0; }); });
    var list = withNew.length >= 4 ? withNew : p;
    return pickN(list, n, rand);
  }
  function sentence(lang, un, rand) {
    var all = [];
    ['s1', 's2', 's3'].forEach(function (k) { if (A.CONTENT[lang][k]) all = all.concat(A.CONTENT[lang][k].sentences); });
    var ok = all.filter(function (s) { return fits(lang, s, un.concat(['Space'])); });
    return ok.length ? pickN(ok, 1, rand)[0] : '';
  }
  // Returns segments [{kind, text}] and the full text. Segments with nothing to say (too few unlocked keys for real words) are skipped.
  function stepLesson(lang, stepIdx, rand) {
    rand = rand || Math.random;
    if (stepIdx >= STEPS.length) return textStep(lang, stepIdx - STEPS.length, rand);
    var add = STEPS[stepIdx].add, un = unlocked(stepIdx), known = un.filter(function (k) { return add.indexOf(k) < 0; });
    if (!known.length) known = add;
    var first = stepIdx < 2; // the very first steps are shorter and heavier on the new keys
    var seg = [{ kind: 'keys', text: keyDrill(lang, add, known, rand, first ? 6 : 8, first ? 0.8 : 0.7) }];
    seg.push({ kind: 'pairs', text: bigrams(lang, add, un, rand) });
    var w = words(lang, add, un, first ? 5 : 8, rand); if (w.length >= 3) seg.push({ kind: 'words', text: w.join(' ') });
    var s = first ? '' : sentence(lang, un, rand); if (s) seg.push({ kind: 'sentence', text: s });
    return { segments: seg, text: seg.map(function (x) { return x.text; }).join(' ') };
  }

  // Stages 4 to 7 steps: scored by the character produced. Same count in both tracks so the progress ids line up.
  var STEPS2 = [
    { stage: 4, title: { en: 'حروف كبيرة بـ Shift', ar: 'الهمزة على الألف: أ إ' } },
    { stage: 4, title: { en: 'أرقام ١ لـ ٥', ar: 'آ ؤ ئ ء' } },
    { stage: 4, title: { en: 'أرقام ٦ لـ ٠', ar: 'علامات الترقيم العربية' } },
    { stage: 4, title: { en: 'علامات الترقيم', ar: 'جمل فيها كل ده' } },
    { stage: 5, title: { en: 'أزواج حروف شائعة', ar: 'أزواج حروف شائعة' } },
    { stage: 5, title: { en: 'كلمات قصيرة متكررة', ar: 'كلمات قصيرة متكررة' } },
    { stage: 5, title: { en: 'جمل بطلاقة', ar: 'جمل بطلاقة' } },
    { stage: 6, title: { en: 'جمل قصيرة بإيقاع ثابت', ar: 'جمل قصيرة بإيقاع ثابت' } },
    { stage: 6, title: { en: 'كلمات طويلة', ar: 'كلمات طويلة' } },
    { stage: 6, title: { en: 'خليط من كل المراحل', ar: 'خليط من كل المراحل' } },
    { stage: 7, title: { en: 'فقرة: الجزء الأول', ar: 'فقرة: الجزء الأول' } },
    { stage: 7, title: { en: 'فقرة: الجزء التاني', ar: 'فقرة: الجزء التاني' } }
  ];
  function sents(t) { return t.split(/(?<=[.!?؟])\s+/).filter(Boolean); }
  function digitsRun(set, rand, n) { var o = []; for (var i = 0; i < n; i++) { var len = 2 + Math.floor(rand() * 3), g = ''; for (var j = 0; j < len; j++) g += set[Math.floor(rand() * set.length)]; o.push(g); } return o.join(' '); }
  function commonBigrams(lang, n) {
    var cnt = {}; pool(lang).forEach(function (w) { for (var i = 0; i + 1 < w.length; i++) { var b = w.substr(i, 2); if (/^[\u0621-\u064Aa-z]{2}$/.test(b)) cnt[b] = (cnt[b] || 0) + 1; } });
    return Object.keys(cnt).sort(function (a, b) { return cnt[b] - cnt[a] || (a < b ? -1 : 1); }).slice(0, n);
  }
  function textStep(lang, j, rand) {
    var s4 = B.CONTENT[lang].s4, s5 = B.CONTENT[lang].s5, s6 = B.CONTENT[lang].s6, seg = [], en = lang === 'en';
    var allW = pool(lang).filter(function (w) { return /^[\u0621-\u064Aa-z]+$/.test(w); });
    function add(kind, text) { if (text && text.trim()) seg.push({ kind: kind, text: text }); }
    if (j === 0) {
      if (en) { var caps = s4.words.filter(function (w) { return /^[A-Z][a-z]+$/.test(w); }); add('words', pickN(caps, 10, rand).join(' ')); add('sentence', pickN(s4.sentences.filter(function (s) { return !/\d/.test(s); }), 2, rand).join(' ')); }
      else { var hw = s4.words.filter(function (w) { return /[أإ]/.test(w); }); add('words', pickN(hw, 10, rand).join(' ')); add('sentence', pickN(s4.sentences.filter(function (s) { return /[أإ]/.test(s); }), 2, rand).join(' ')); }
    } else if (j === 1) {
      if (en) { add('digits', digitsRun('12345'.split(''), rand, 8)); add('sentence', 'Room ' + digitsRun('12345'.split(''), rand, 1) + ' is on floor ' + (1 + Math.floor(rand() * 5)) + '.'); }
      else { var h2 = s4.words.concat(['آمن', 'مؤمن', 'سؤال', 'مسؤول', 'شيء', 'جزء', 'بدء', 'قرآن', 'رئيس', 'مئة', 'بيئة', 'هيئة', 'مؤلف', 'ضوء', 'سماء']).filter(function (w) { return /[آؤئء]/.test(w); }); add('words', pickN(h2, 10, rand).join(' ')); }
    } else if (j === 2) {
      if (en) { add('digits', digitsRun('67890'.split(''), rand, 8)); add('sentence', 'The code is ' + digitsRun('1234567890'.split(''), rand, 1) + ', and it was set in 20' + (10 + Math.floor(rand() * 17)) + '.'); }
      else { var ps = ['؟', '،', '؛']; var o = []; for (var i = 0; i < 9; i++) o.push(pickN(allW, 1, rand)[0] + ps[i % 3]); add('punct', o.join(' ')); add('sentence', pickN(s4.sentences.filter(function (s) { return /[؟،؛]/.test(s); }), 2, rand).join(' ')); }
    } else if (j === 3) {
      if (en) { var pm = [',', '.', '?', '!', ';', ':']; var oo = []; for (var k = 0; k < 8; k++) oo.push(pickN(allW, 1, rand)[0] + pm[k % pm.length]); add('punct', oo.join(' ')); }
      add('sentence', pickN(s4.sentences, 3, rand).join(' '));
    } else if (j === 4) {
      var bg = commonBigrams(lang, 14); add('pairs', pickN(bg, 8, rand).map(function (b) { return b + ' ' + b + ' ' + b; }).join(' '));
      add('words', pickN(allW.filter(function (w) { return bg.some(function (b) { return w.indexOf(b) >= 0; }); }), 10, rand).join(' '));
    } else if (j === 5) {
      add('words', pickN(allW.filter(function (w) { return w.length <= 4; }), 16, rand).join(' '));
      add('words', pickN(allW.filter(function (w) { return w.length <= 5; }), 12, rand).join(' '));
    } else if (j === 6) {
      add('sentence', pickN(s5.sentences, 3, rand).join(' '));
    } else if (j === 7) {
      add('sentence', pickN(s6.sentences.slice().sort(function (a, b) { return a.length - b.length; }).slice(0, 6), 3, rand).join(' '));
    } else if (j === 8) {
      add('words', pickN(allW.filter(function (w) { return w.length >= 6; }), 14, rand).join(' '));
    } else if (j === 9) {
      add('sentence', pickN(s4.sentences.concat(s5.sentences, s6.sentences), 4, rand).join(' '));
    } else {
      var para = B.CONTENT[lang].s7.paragraphs[Math.floor(rand() * B.CONTENT[lang].s7.paragraphs.length)], ss = sents(para), half = Math.ceil(ss.length / 2);
      add('paragraph', (j === 10 ? ss.slice(0, half) : ss.slice(half).length ? ss.slice(half) : ss).join(' '));
    }
    return { segments: seg, text: seg.map(function (x) { return x.text; }).join(' ') };
  }
  ALL = STEPS.concat(STEPS2.map(function (s) { return { stage: s.stage, text: true, title: s.title.en, titleAr: s.title.ar, titles: s.title }; }));
  // Start-of-stage review (about a minute): words and pairs from everything unlocked before this stage.
  function review(lang, stage, rand) {
    rand = rand || Math.random;
    var first = STEPS.findIndex ? STEPS.findIndex(function (s) { return s.stage === stage; }) : 0;
    if (first <= 0) return '';
    var un = unlocked(first - 1), w = pool(lang).filter(function (x) { return fits(lang, x, un); });
    return pickN(w, 16, rand).join(' ');
  }
  // Weak keys from per-attempt records: each record may carry kstats {id: [presses, wrong, msSum]}.
  function weakKeys(results, track, top) {
    var tot = {};
    results.filter(function (r) { return r.track === track && r.kstats; }).slice(-30).forEach(function (r) {
      Object.keys(r.kstats).forEach(function (k) { var v = r.kstats[k], t = tot[k] || (tot[k] = [0, 0, 0]); t[0] += v[0]; t[1] += v[1]; t[2] += v[2]; });
    });
    var rows = Object.keys(tot).filter(function (k) { return tot[k][0] >= 4; }).map(function (k) {
      var t = tot[k], err = t[1] / t[0], avg = t[2] / Math.max(1, t[0] - t[1]); return { key: k, err: err, avg: avg, score: err * 100 + avg / 50 };
    });
    rows.sort(function (a, b) { return b.score - a.score; });
    return rows.slice(0, top || 3);
  }
  // Practice text built from our own words that contain the weakest keys and only keys unlocked so far.
  function adaptive(lang, weak, unlockedCodes, rand) {
    rand = rand || Math.random;
    var un = unlockedCodes.filter(Boolean), ws = weak.map(function (k) { return (L.LAYOUT[lang][k.key] || k.key).toLowerCase(); });
    var p = pool(lang).filter(function (w) { return fits(lang, w, un); });
    var hit = p.filter(function (w) { return ws.some(function (k) { return w.toLowerCase().indexOf(k) >= 0; }); });
    var list = hit.length >= 5 ? hit : p;
    return pickN(list, 24, rand).join(' ');
  }
  return { ALL: ALL, STEPS2: STEPS2, STEPS: STEPS, stepsOf: stepsOf, unlocked: unlocked, fits: fits, pool: pool, stepLesson: stepLesson, review: review, weakKeys: weakKeys, adaptive: adaptive };
});
