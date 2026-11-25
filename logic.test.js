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
