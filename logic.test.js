const test = require('node:test');
const assert = require('node:assert');
const L = require('./logic.js');

test('normalize strips Arabic diacritics', () => {
  assert.strictEqual(L.normalize('مَدْرَسَة'), 'مدرسة');
});
test('compareWord detects exact match and mismatches', () => {
  assert.strictEqual(L.compareWord('cat', 'cat').correct, true);
  const r = L.compareWord('cut', 'cat');
  assert.strictEqual(r.correct, false);
  assert.deepStrictEqual(r.errors, ['a']);
});
test('missing characters count as errors on the expected key', () => {
  assert.deepStrictEqual(L.compareWord('ca', 'cat').errors, ['t']);
});
test('summarize computes WPM from correct words only (5 chars = 1 word)', () => {
  // 'hello world' typed right in 12s -> (5+1+5+1)=12 chars -> 2.4 words/0.2min = 12 wpm
  const s = L.summarize(['hello', 'world'], ['hello', 'world'], 12000);
  assert.strictEqual(s.wpm, 12);
  assert.strictEqual(s.accuracy, 100);
});
test('wrong words reduce accuracy and are not counted in WPM', () => {
  const s = L.summarize(['hello', 'world'], ['hello', 'wurld'], 60000);
  assert.strictEqual(s.correctWords, 1);
  assert.strictEqual(s.accuracy, 90);
  assert.deepStrictEqual(s.badKeys, { o: 1 });
});
test('pickWords never repeats the same word back to back', () => {
  const w = L.pickWords(['a', 'b'], 50);
  for (let i = 1; i < w.length; i++) assert.notStrictEqual(w[i], w[i - 1]);
});
test('weakKeys sorts by total errors', () => {
  const k = L.weakKeys([{ badKeys: { a: 1, b: 3 } }, { badKeys: { a: 4 } }], 2);
  assert.deepStrictEqual(k, [['a', 5], ['b', 3]]);
});
test('bestWpm filters by language and duration', () => {
  const h = [{ lang: 'en', secs: 30, wpm: 40 }, { lang: 'ar', secs: 30, wpm: 99 }, { lang: 'en', secs: 60, wpm: 70 }];
  assert.strictEqual(L.bestWpm(h, 'en', 30), 40);
});

test('lessons add keys cumulatively and cover all 12 steps', () => {
  assert.strictEqual(L.lessonCount(), 12);
  assert.strictEqual(L.lessonKeys(0).length, 8);
  assert.ok(L.lessonKeys(1).includes('KeyG') && L.lessonKeys(1).includes('KeyA'));
});
test('every layout key has a finger, and Arabic/English cover the same physical keys', () => {
  const en = Object.keys(L.LAYOUT.en), ar = Object.keys(L.LAYOUT.ar);
  assert.deepStrictEqual(en.sort(), ar.sort());
  en.forEach(k => assert.ok(L.FINGER[k], k));
});
test('Arabic home row matches the standard 101 layout', () => {
  assert.strictEqual(['KeyA','KeyS','KeyD','KeyF','KeyG','KeyH','KeyJ','KeyK','KeyL','Semicolon'].map(k => L.LAYOUT.ar[k]).join(''), 'شسيبلاتنمك');
});
test('lesson text only uses keys from that lesson and is the requested length', () => {
  const allowed = new Set(L.lessonKeys(2).map(k => L.LAYOUT.en[k]));
  const text = L.makeLessonText('en', 2, Math.random, 12);
  assert.strictEqual(text.split(' ').length, 12);
  text.replace(/ /g, '').split('').forEach(c => assert.ok(allowed.has(c), c));
});
test('new keys dominate a lesson after the first', () => {
  let fresh = 0, total = 0;
  for (let i = 0; i < 200; i++) L.makeLessonText('en', 3, Math.random, 10).replace(/ /g, '').split('').forEach(c => { total++; if (c === 'r' || c === 'u') fresh++; });
  assert.ok(fresh / total > 0.5);
});
test('tokenize keeps the Arabic lam-alef key as one token', () => {
  assert.deepStrictEqual(L.tokenize('ar', 'بلا ب'), ['ب', 'لا', ' ', 'ب']);
});
test('isHit judges the physical key; character only as fallback when no code', () => {
  assert.ok(L.isHit('ar', 'ش', { key: 'ش', code: 'KeyA' }));
  assert.ok(L.isHit('ar', 'ش', { key: 'a', code: 'KeyA' }));
  assert.ok(!L.isHit('ar', 'ش', { key: 's', code: 'KeyS' }));
  assert.ok(L.isHit('en', 'a', { key: 'A', code: 'KeyA' }));
  assert.ok(!L.isHit('en', 'a', { key: 'a', code: 'KeyS' }), 'right character from the wrong physical key must not count');
  assert.ok(!L.isHit('ar', 'ش', { key: 'ش', code: 'KeyS' }));
  assert.ok(L.isHit('ar', 'ش', { key: 'ش', code: '' }));
  assert.ok(!L.isHit('ar', 'ش', { key: 'س', code: '' }));
  assert.ok(L.isHit('en', ' ', { key: ' ', code: 'Space' }));
});
test('gradeLesson stars and pass threshold', () => {
  assert.strictEqual(L.gradeLesson(40, 5, 60000).passed, false);   // 89%
  assert.strictEqual(L.gradeLesson(40, 1, 60000).stars, 1);        // 97.5 -> 98? 40/41=97.6 -> 98 but wpm 8
  assert.strictEqual(L.gradeLesson(150, 1, 60000).stars, 3);       // 99%, 30 wpm
  assert.strictEqual(L.gradeLesson(100, 1, 60000).stars, 2);       // 99%, 20 wpm
});
test('unlocking and recording lesson progress', () => {
  let p = {};
  assert.ok(L.isUnlocked(p, 'en', 0)); assert.ok(!L.isUnlocked(p, 'en', 1));
  p = L.recordLesson(p, 'en', 0, { stars: 2, acc: 98, wpm: 22 });
  assert.ok(L.isUnlocked(p, 'en', 1)); assert.ok(!L.isUnlocked(p, 'ar', 1));
  p = L.recordLesson(p, 'en', 0, { stars: 1, acc: 96, wpm: 30 });
  assert.deepStrictEqual(p.en['0'], { stars: 2, acc: 98, wpm: 30, tries: 2 });
});

test('recordLesson survives an empty or partial saved record', () => {
  const p = L.recordLesson({ ar: { 0: {} } }, 'ar', 0, { stars: 2, acc: 98, wpm: 25 });
  assert.deepStrictEqual(p.ar['0'], { stars: 2, acc: 98, wpm: 25, tries: 1 });
});
