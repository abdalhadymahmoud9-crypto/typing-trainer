(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TypingCourse = factory();
})(this, function () {
  'use strict';
  // Scoring engine for the structured course. Definitions (also shown in the app):
  //  - A keystroke is "correct" when the PHYSICAL key (KeyboardEvent.code) plus Shift state matches the
  //    expected key for the target character. If the browser gives no code, the typed character is compared.
  //  - Final correct chars = positions where the final typed text matches the target.
  //  - Corrected errors = wrong characters that were erased with Backspace before the end.
  //  - Uncorrected errors = wrong or missing positions in the final text.
  //  - Accuracy = final correct chars / (final typed chars + corrected errors). Corrected mistakes still cost accuracy.
  //  - Net WPM = (final correct chars / 5) / minutes from first to last keystroke. Pauses are included, not removed.
  //  - Consistency = 100 - coefficient of variation of per-second typing speed (information only, never gates).
  var STAGE_RULES = { // product calibration, not validated against outside data
    drill: { minAcc: 90, minWpm: 0 }
  };

  function expectedFor(target, i, codeFor) {
    var ch = target.charAt(i);
    return codeFor ? codeFor(ch) : null; // {code, shift} or null
  }

  // events: [{t:ms, type:'key'|'back', ch, code, shift}] in order. target: string.
  function score(target, events, codeFor) {
    var typed = [], corrected = 0, first = null, last = null, secs = {}, perKey = {}, badPresses = 0, prevT = null;
    function kid(i) { var ex = expectedFor(target, i, codeFor); return ex && ex.code ? ex.code : target.charAt(i); }
    function stat(i, wrong, dt) { var k = kid(i), v = perKey[k] || (perKey[k] = [0, 0, 0]); v[0]++; if (wrong) v[1]++; else v[2] += dt; }
    function ok(i, e) {
      var exp = expectedFor(target, i, codeFor);
      if (exp && e.code) return exp.code === e.code && !!exp.shift === !!e.shift;
      return e.ch === target.charAt(i);
    }
    events.forEach(function (e) {
      if (first === null) first = e.t; last = e.t;
      var dt = prevT === null ? 0 : Math.min(e.t - prevT, 5000); prevT = e.t;
      if (e.bad) { if (typed.length < target.length) { badPresses++; stat(typed.length, true, 0); } return; } // wrong key in a drill: attempt recorded, position does not advance
      if (e.type === 'back') {
        if (typed.length) { var r = typed.pop(); if (!r.ok) corrected++; }
        return;
      }
      if (typed.length >= target.length) return; // extra keys past the end are ignored
      // Arabic ligature key (B) types two characters at once; it is accepted where the target has lam + alef.
      if (e.ch && e.ch.length === 2 && target.substr(typed.length, 2) === e.ch) {
        typed.push({ ok: true, t: e.t }); typed.push({ ok: true, t: e.t }); return;
      }
      var okNow = ok(typed.length, e); stat(typed.length, !okNow, dt);
      typed.push({ ok: okNow, t: e.t });
    });
    var correct = typed.filter(function (x) { return x.ok; }).length;
    var wrong = typed.length - correct, missing = target.length - typed.length;
    typed.forEach(function (x) { if (x.ok) { var s = Math.floor((x.t - first) / 1000); secs[s] = (secs[s] || 0) + 1; } });
    var ms = first === null ? 0 : last - first;
    var wpm = ms > 0 ? (correct / 5) / (ms / 60000) : 0;
    var denom = typed.length + corrected + badPresses;
    var acc = denom ? 100 * correct / denom : 0;
    var n = ms > 0 ? Math.floor(ms / 1000) + 1 : 0, vals = [];
    for (var i = 0; i < n; i++) vals.push(secs[i] || 0);
    var cons = 0;
    if (vals.length > 1) {
      var mean = vals.reduce(function (a, b) { return a + b; }, 0) / vals.length;
      var sd = Math.sqrt(vals.reduce(function (a, b) { return a + (b - mean) * (b - mean); }, 0) / vals.length);
      cons = mean > 0 ? Math.max(0, Math.min(100, Math.round(100 - 100 * sd / mean))) : 0;
    }
    return { correct: correct, uncorrected: wrong + Math.max(0, missing), wrong: wrong, missing: Math.max(0, missing), corrected: corrected,
      typed: typed.length, bad: badPresses, perKey: perKey, ms: ms, wpm: Math.round(wpm * 10) / 10, acc: Math.round(acc * 10) / 10, consistency: cons, complete: missing <= 0 };
  }

  function passes(res, rule) {
    return !!res && res.complete && res.acc >= rule.minAcc && res.wpm >= rule.minWpm;
  }

  // Only reject input that is clearly not typing. Never rejects on speed or timing patterns (assistive tech, fast typists).
  function isTypingEvent(e) {
    if (!e) return false;
    if (e.isTrusted === false) return false;
    if (e.inputType && /paste|drop/i.test(e.inputType)) return false;
    return true;
  }

  // Drill progress: a wrong key does not advance; returns {advance, mistake}
  function drillStep(expected, e) {
    var hit = expected.code && e.code ? (expected.code === e.code && !!expected.shift === !!e.shift) : expected.ch === e.ch;
    return { advance: hit, mistake: !hit };
  }

  return { score: score, passes: passes, isTypingEvent: isTypingEvent, drillStep: drillStep, STAGE_RULES: STAGE_RULES };
});
