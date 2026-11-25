var test = require('node:test'), assert = require('node:assert'), C = require('./coursecontent2.js');
test('stage 4-7 and exam texts use only the allowed characters and no dhal', function () { assert.deepEqual(C.check(), []); });
test('enough text per stage', function () {
  ['en', 'ar'].forEach(function (l) {
    ['s4', 's5', 's6'].forEach(function (s) { assert.ok(C.CONTENT[l][s].words.length >= 20, l + s); assert.ok(C.CONTENT[l][s].sentences.length >= 5, l + s); });
    assert.ok(C.CONTENT[l].s7.paragraphs.length >= 3); assert.ok(C.CONTENT[l].exam.length >= 2);
    C.CONTENT[l].exam.forEach(function (t) { assert.ok(t.length >= 400, l + ' exam length ' + t.length); });
  });
});
