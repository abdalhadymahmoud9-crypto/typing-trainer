var test = require('node:test'), assert = require('node:assert'), S = require('./coursestate.js');
var good = function (acc, wpm) { return { acc: acc, wpm: wpm, consistency: 70, corrected: 1, uncorrected: 0, complete: true }; };
test('stage 1 open, others locked until previous passed', function () {
  var s = S.empty(); assert.ok(S.stageOpen(s, 'en', 1)); assert.ok(!S.stageOpen(s, 'en', 2));
  s = S.addResult(s, 'en', 'stage', 1, good(95, 12), 1000).state; assert.ok(S.stageOpen(s, 'en', 2)); assert.ok(!S.stageOpen(s, 'en', 3));
});
test('failing or incomplete stage test does not pass', function () {
  var s = S.addResult(S.empty(), 'en', 'stage', 1, good(80, 20), 1).state; assert.equal(S.highestPassed(s, 'en'), 0);
  var r = good(99, 50); r.complete = false; s = S.addResult(s, 'en', 'stage', 1, r, 2).state; assert.equal(S.highestPassed(s, 'en'), 0);
  s = S.addResult(s, 'en', 'stage', 1, good(92, 7.9), 3).state; assert.equal(S.highestPassed(s, 'en'), 0);
});
test('test-out: passing stage 4 cold opens stage 5 and counts for earlier stages', function () {
  var s = S.addResult(S.empty(), 'ar', 'stage', 4, good(96, 20), 1).state; assert.equal(S.highestPassed(s, 'ar'), 4); assert.ok(S.stageOpen(s, 'ar', 5)); assert.ok(S.stageOpen(s, 'ar', 2));
  assert.equal(S.highestPassed(s, 'en'), 0); // tracks are separate
});
test('exam opens only after stage 7; certificate needs a pass and a typed name', function () {
  var s = S.empty(); assert.ok(!S.examOpen(s, 'en'));
  s = S.addResult(s, 'en', 'stage', 7, good(97, 30), 1).state; assert.ok(S.examOpen(s, 'en'));
  assert.equal(S.issueCertificate(s, 'en', 'Ali', 5).error, 'no-pass');
  s = S.addResult(s, 'en', 'exam', 0, good(95.9, 40), 2).state; assert.equal(S.issueCertificate(s, 'en', 'Ali', 5).error, 'no-pass');
  s = S.addResult(s, 'en', 'exam', 0, good(97, 31), 3).state;
  assert.equal(S.issueCertificate(s, 'en', '   ', 5).error, 'no-name');
  var c = S.issueCertificate(s, 'en', '  Ali   Hassan ', 5); assert.equal(c.cert.name, 'Ali Hassan'); assert.equal(c.cert.distinction, false); assert.equal(c.state.certs.length, 1);
});
test('distinction needs both thresholds; best exam is by wpm among passes', function () {
  var s = S.addResult(S.empty(), 'en', 'exam', 0, good(98, 46), 1).state; s = S.addResult(s, 'en', 'exam', 1, good(97, 35), 2).state;
  var c = S.issueCertificate(s, 'en', 'A', 3).cert; assert.ok(c.distinction); assert.equal(c.wpm, 46);
  assert.ok(!S.distinction({ acc: 97.9, wpm: 60 }));
});
test('old data and junk are preserved or ignored safely', function () {
  assert.deepEqual(S.clean(null), S.empty()); assert.deepEqual(S.clean({ results: [null, 5, { id: 'x', track: 'en', kind: 'stage', ref: 1, passed: true }] }).results.length, 1);
  assert.equal(S.addResult({ results: 'bad' }, 'en', 'stage', 1, null, 1).record.passed, false);
});
test('records have unique ids so sync merges by id', function () {
  var s = S.empty(); for (var i = 0; i < 20; i++) s = S.addResult(s, 'en', 'stage', 1, good(50, 1), 1000).state;
  assert.equal(new Set(s.results.map(function (r) { return r.id; })).size, 20);
});
