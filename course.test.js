var test = require('node:test'), assert = require('node:assert'), C = require('./course.js');
var cf = function (ch) { if (ch === ' ') return { code: 'Space' }; var up = ch !== ch.toLowerCase(); return { code: 'Key' + ch.toUpperCase(), shift: up }; };
function typeStr(s, t0, step) { return s.split('').map(function (ch, i) { var e = cf(ch); return { t: t0 + i * step, type: 'key', ch: ch, code: e.code, shift: e.shift }; }); }
test('perfect run: wpm and accuracy', function () {
  var r = C.score('hello world', typeStr('hello world', 0, 200), cf); // 10 intervals => 2000ms
  assert.equal(r.acc, 100); assert.equal(r.correct, 11); assert.equal(r.wpm, Math.round(((11 / 5) / (2000 / 60000)) * 10) / 10);
  assert.ok(r.complete);
});
test('corrected error costs accuracy but not final correctness', function () {
  var ev = typeStr('hex', 0, 100); ev.push({ t: 300, type: 'back' }); ev = ev.concat(typeStr('l', 400, 100)); ev = ev.concat(typeStr('lo', 500, 100));
  var r = C.score('hello', ev, cf);
  assert.equal(r.corrected, 1); assert.equal(r.uncorrected, 0); assert.equal(r.correct, 5); assert.equal(r.acc, Math.round(1000 * 5 / 6) / 10);
});
test('uncorrected error and partial text', function () {
  var r = C.score('hello', typeStr('hxl', 0, 100), cf);
  assert.equal(r.wrong, 1); assert.equal(r.missing, 2); assert.equal(r.uncorrected, 3); assert.equal(r.complete, false);
  assert.ok(!C.passes(r, { minAcc: 0, minWpm: 0 }));
});
test('pause is counted in time, not removed', function () {
  var ev = typeStr('ab', 0, 100).concat(typeStr('cd', 10100, 100));
  var r = C.score('abcd', ev, cf); assert.equal(r.ms, 10200); assert.ok(r.wpm < 5);
});
test('physical key decides: right letter on the wrong key code is wrong', function () {
  var r = C.score('a', [{ t: 0, type: 'key', ch: 'a', code: 'KeyQ' }, { t: 100, type: 'key', ch: 'a', code: 'KeyQ' }], cf);
  assert.equal(r.correct, 0);
});
test('shift matters; missing code falls back to character', function () {
  assert.equal(C.score('A', [{ t: 0, type: 'key', ch: 'a', code: 'KeyA', shift: false }], cf).correct, 0);
  assert.equal(C.score('A', [{ t: 0, type: 'key', ch: 'A', code: 'KeyA', shift: true }], cf).correct, 1);
  assert.equal(C.score('x', [{ t: 0, type: 'key', ch: 'x' }]).correct, 1);
});
test('backspace on empty and extra keys past the end are harmless', function () {
  var r = C.score('ab', [{ t: 0, type: 'back' }].concat(typeStr('abzz', 50, 50)), cf);
  assert.equal(r.correct, 2); assert.equal(r.typed, 2);
});
test('no timing-based rejection; only untrusted/paste', function () {
  assert.ok(C.isTypingEvent({ isTrusted: true }));
  assert.ok(C.isTypingEvent({})); // assistive tech without flags is accepted
  assert.ok(!C.isTypingEvent({ isTrusted: false })); assert.ok(!C.isTypingEvent({ inputType: 'insertFromPaste' }));
});
test('drill: wrong key does not advance', function () {
  assert.equal(C.drillStep({ code: 'KeyF' }, { code: 'KeyD' }).advance, false);
  assert.equal(C.drillStep({ code: 'KeyF' }, { code: 'KeyF' }).advance, true);
});
test('empty events', function () { var r = C.score('abc', [], cf); assert.equal(r.wpm, 0); assert.equal(r.acc, 0); });
test('Arabic lam-alef: ligature key B and lam+alef both give a correct result', function () {
  var ar = function (ch) { return { code: { 'ل': 'KeyG', 'ا': 'KeyH', 'س': 'KeyS', 'م': 'KeyL' }[ch] }; };
  var viaB = C.score('سلام', [{ t: 0, type: 'key', ch: 'س', code: 'KeyS' }, { t: 100, type: 'key', ch: 'لا', code: 'KeyB' }, { t: 200, type: 'key', ch: 'م', code: 'KeyL' }], ar);
  var viaTwo = C.score('سلام', [{ t: 0, type: 'key', ch: 'س', code: 'KeyS' }, { t: 100, type: 'key', ch: 'ل', code: 'KeyG' }, { t: 200, type: 'key', ch: 'ا', code: 'KeyH' }, { t: 300, type: 'key', ch: 'م', code: 'KeyL' }], ar);
  assert.equal(viaB.correct, 4); assert.equal(viaTwo.correct, 4); assert.equal(viaB.acc, 100);
});
