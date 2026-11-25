// Realistic-pace threshold tests: simulated typists at given WPM with jitter, pauses, corrected and uncorrected errors.
var test = require('node:test'), assert = require('node:assert'), C = require('./course.js'), S = require('./coursestate.js'), A = require('./coursecontent.js'), B = require('./coursecontent2.js');
var cf = function (ch) { return ch === ' ' ? { code: 'Space' } : { code: 'Key' + ch.toUpperCase(), shift: ch !== ch.toLowerCase() }; };
function rng(seed) { return function () { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }; }
// wpm = target speed over the whole run; uncorrectedEvery / correctedEvery = an error roughly every N chars
function simulate(text, wpm, opts) {
  opts = opts || {}; var r = rng(opts.seed || 7), t = 0, ev = [], per = 60000 / (wpm * 5);
  for (var i = 0; i < text.length; i++) {
    var jitter = 0.6 + r() * 0.8; t += per * jitter;
    if (opts.pauseAt === i) t += opts.pauseMs;
    var ch = text.charAt(i), c = cf(ch);
    if (opts.uncEvery && i % opts.uncEvery === opts.uncEvery - 1) { ev.push({ t: t, type: 'key', ch: 'Q', code: 'KeyQ', shift: true }); continue; }
    if (opts.corEvery && i % opts.corEvery === opts.corEvery - 1) { ev.push({ t: t, type: 'key', ch: '#', code: 'Digit3' }); t += per; ev.push({ t: t, type: 'back' }); t += per; }
    ev.push({ t: t, type: 'key', ch: ch, code: c.code, shift: c.shift });
  }
  return ev;
}
var text = 'the quick brown fox jumps over a lazy dog while the river city sleeps beneath a pale moon and a quiet wind '.repeat(3);
test('simulated typing speed is measured within 10% of the target', function () {
  [15, 30, 45, 60].forEach(function (w) { var res = C.score(text, simulate(text, w), cf); assert.ok(Math.abs(res.wpm - w) / w < 0.1, w + ' got ' + res.wpm); });
});
test('every stage threshold: just above passes, just below fails (speed and accuracy)', function () {
  for (var st = 1; st <= 7; st++) {
    var rule = S.RULES[st];
    var ok = C.score(text, simulate(text, rule.minWpm + 3), cf); assert.ok(S.addResult(S.empty(), 'en', 'stage', st, ok, 1).record.passed, 'stage ' + st + ' fast enough');
    var slow = C.score(text, simulate(text, rule.minWpm - 3 > 0 ? rule.minWpm - 3 : 1), cf); assert.ok(!S.addResult(S.empty(), 'en', 'stage', st, slow, 1).record.passed, 'stage ' + st + ' too slow');
    var sloppy = C.score(text, simulate(text, rule.minWpm + 10, { uncEvery: 8 }), cf); assert.ok(sloppy.acc < rule.minAcc && !S.addResult(S.empty(), 'en', 'stage', st, sloppy, 1).record.passed, 'stage ' + st + ' low accuracy ' + sloppy.acc);
  }
});
test('corrected mistakes and a long pause lower the result but a calm typist still passes', function () {
  var base = C.score(text, simulate(text, 30), cf);
  var withFix = C.score(text, simulate(text, 30, { corEvery: 25 }), cf);
  assert.ok(withFix.acc < base.acc && withFix.corrected > 5 && withFix.uncorrected === 0);
  var paused = C.score(text, simulate(text, 30, { pauseAt: 100, pauseMs: 100000 }), cf); assert.ok(paused.wpm < base.wpm * 0.7);
  assert.ok(S.addResult(S.empty(), 'en', 'stage', 3, withFix, 1).record.passed); // 30 wpm with an occasional fixed typo still clears stage 3
});
test('final exam: 30 wpm at 96% passes, 29 wpm or 95% fails, distinction needs 45 and 98', function () {
  var ex = B.CONTENT.en.exam[0];
  var p = C.score(ex, simulate(ex, 32, { corEvery: 90 }), cf); assert.ok(p.acc >= 96 && p.wpm >= 30, p.acc + ' ' + p.wpm); assert.ok(S.addResult(S.empty(), 'en', 'exam', 0, p, 1).record.passed);
  var slow = C.score(ex, simulate(ex, 27), cf); assert.ok(!S.addResult(S.empty(), 'en', 'exam', 0, slow, 1).record.passed);
  var sloppy = C.score(ex, simulate(ex, 40, { uncEvery: 20 }), cf); assert.ok(sloppy.acc < 96 && !S.addResult(S.empty(), 'en', 'exam', 0, sloppy, 1).record.passed);
  var d = S.addResult(S.empty(), 'en', 'exam', 0, C.score(ex, simulate(ex, 50, { corEvery: 200 }), cf), 1).record; assert.ok(d.passed && S.distinction(d), d.acc + ' ' + d.wpm);
  var notD = S.addResult(S.empty(), 'en', 'exam', 0, C.score(ex, simulate(ex, 38), cf), 1).record; assert.ok(notD.passed && !S.distinction(notD));
});
test('exam text length vs duration at pass speed (actual behaviour, not a timer)', function () {
  ['en', 'ar'].forEach(function (l) { B.CONTENT[l].exam.forEach(function (t) { var mins = Array.from(t).length / 5 / 30; assert.ok(mins > 2.5 && mins < 4.5, l + ' ' + mins); }); });
});
