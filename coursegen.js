(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./logic.js'), require('./coursecontent.js'), require('./coursecontent2.js'));
  else root.TypingCourseGen = factory(root.TypingLogic, root.TypingCourseContent, root.TypingCourseContent2);
})(this, function (L, A, B) {
  'use strict';
  // Small-step key introduction for stages 1-3. Each step adds 2 keys (a left and a right finger where possible).
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
  function stepsOf(stage) { var o = []; STEPS.forEach(function (s, i) { if (s.stage === stage) o.push(i); }); return o; }
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

  function keyDrill(lang, add, known, rand) {
    var all = add.concat(pickN(known, 3, rand)), out = [];
    for (var i = 0; i < 12; i++) {
      var g = '', len = 3 + Math.floor(rand() * 2);
      for (var j = 0; j < len; j++) { var pickNew = rand() < 0.65; var src = pickNew ? add : all; g += sym(lang, src[Math.floor(rand() * src.length)]); }
      out.push(g);
    }
    return out.join(' ');
  }
  function bigrams(lang, add, un, rand) {
    var out = [];
    add.forEach(function (a) {
      pickN(un.filter(function (k) { return k !== a; }), 5, rand).forEach(function (k) { var x = sym(lang, a) + sym(lang, k), y = sym(lang, k) + sym(lang, a); out.push(x + ' ' + y + ' ' + x); });
    });
    return pickN(out, 10, rand).join(' ');
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
    var add = STEPS[stepIdx].add, un = unlocked(stepIdx), known = un.filter(function (k) { return add.indexOf(k) < 0; });
    if (!known.length) known = add;
    var seg = [{ kind: 'keys', text: keyDrill(lang, add, known, rand) }];
    seg.push({ kind: 'pairs', text: bigrams(lang, add, un, rand) });
    var w = words(lang, add, un, 12, rand); if (w.length >= 3) seg.push({ kind: 'words', text: w.join(' ') });
    var s = sentence(lang, un, rand); if (s) seg.push({ kind: 'sentence', text: s });
    return { segments: seg, text: seg.map(function (x) { return x.text; }).join(' ') };
  }
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
  return { STEPS: STEPS, stepsOf: stepsOf, unlocked: unlocked, fits: fits, pool: pool, stepLesson: stepLesson, review: review, weakKeys: weakKeys, adaptive: adaptive };
});
