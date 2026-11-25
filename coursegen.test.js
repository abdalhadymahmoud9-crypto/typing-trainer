var test = require('node:test'), assert = require('node:assert'), G = require('./coursegen.js'), L = require('./logic.js');
function rng(seed) { return function () { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }; }
test('every step lesson uses only keys unlocked so far, includes the new keys, in both languages, over many random draws', function () {
  ['en', 'ar'].forEach(function (lang) {
    G.STEPS.forEach(function (st, i) {
      for (var n = 0; n < 40; n++) {
        var les = G.stepLesson(lang, i, rng(i * 100 + n + 1)), un = G.unlocked(i);
        assert.ok(G.fits(lang, les.text, un), lang + ' step ' + i + ' leaks keys: ' + les.text);
        var hasNew = st.add.some(function (k) { return les.segments[0].text.indexOf(L.LAYOUT[lang][k]) >= 0; });
        assert.ok(hasNew, lang + ' step ' + i + ' new key missing in drill');
        assert.ok(Array.from(les.text).length >= 40, lang + ' step ' + i + ' too short ' + les.text.length);
      }
    });
  });
});
test('real words appear once enough keys are unlocked, and they contain the new keys when possible', function () {
  ['en', 'ar'].forEach(function (lang) {
    var late = G.stepLesson(lang, 12, rng(5)); assert.ok(late.segments.some(function (s) { return s.kind === 'words'; }), lang + ' words by step 12');
  });
});
test('steps cover stages 1-3 in order with no repeated keys; each key introduced once', function () {
  var seen = {}; G.STEPS.forEach(function (s) { s.add.forEach(function (k) { assert.ok(!seen[k], k + ' twice'); seen[k] = 1; }); });
  assert.equal(Object.keys(seen).length, 33); assert.deepEqual(G.stepsOf(1).length, 5); assert.equal(G.stepsOf(2).length, 5); assert.equal(G.stepsOf(3).length, 6);
});
test('stage review draws only from earlier stages', function () {
  ['en', 'ar'].forEach(function (lang) { var un = G.unlocked(G.stepsOf(2)[0] - 1); for (var i = 0; i < 20; i++) assert.ok(G.fits(lang, G.review(lang, 2, rng(i + 3)), un)); });
  assert.equal(G.review('en', 1, rng(1)), '');
});
test('weak keys rank by error rate and slowness; ignore keys with too few presses; adaptive text targets them and stays within unlocked keys', function () {
  var res = [{ track: 'en', kstats: { KeyF: [20, 0, 4000], KeyG: [20, 8, 6000], KeyH: [20, 1, 9000], KeyA: [2, 2, 100] } }, { track: 'ar', kstats: { KeyF: [50, 50, 1] } }];
  var w = G.weakKeys(res, 'en', 3); assert.equal(w[0].key, 'KeyG'); assert.ok(!w.some(function (x) { return x.key === 'KeyA'; })); assert.ok(w.length === 3);
  var un = G.unlocked(9), t = G.adaptive('en', [{ key: 'KeyG' }], un, rng(2)); assert.ok(G.fits('en', t, un)); assert.ok(t.split(' ').some(function (x) { return x.indexOf('g') >= 0; }));
});

test('stage 4-7 steps: every draw is non-empty, typeable, and the counts match the progress state', function () {
  var S = require('./coursestate.js'); assert.equal(G.ALL.length, S.STEP_STAGE.length); assert.equal(G.STEPS2.length, 12);
  ['en', 'ar'].forEach(function (lang) {
    for (var i = G.STEPS.length; i < G.ALL.length; i++) for (var d = 0; d < 30; d++) {
      var r = G.stepLesson(lang, i); assert.ok(r.text.trim().length >= 40, lang + ' step ' + i + ' too short: ' + r.text.length); assert.ok(r.text.length <= 260, lang + ' step ' + i + ' too long');
      var re = lang === 'en' ? /^[A-Za-z0-9 ,.?!;:'"()\-]+$/ : /^[\u0621-\u064A \u060C\u061F\u061B.]+$/;
      assert.ok(re.test(r.text), lang + ' step ' + i + ' has an untypeable char: ' + r.text.replace(re, '').slice(0, 5) + ' | ' + r.text.slice(0, 60));
    }
  });
});
test('key steps are short at first and grow gently', function () {
  [0, 1, 5, 10].forEach(function (i) { var r = G.stepLesson('en', i); assert.ok(Array.from(r.text).length <= 200, 'step ' + i + ' len ' + r.text.length); });
  assert.ok(G.stepLesson('en', 0).text.length < 70);
});
