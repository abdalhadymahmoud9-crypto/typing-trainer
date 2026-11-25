var test = require('node:test'), assert = require('node:assert'), C = require('./coursecontent.js');
test('every drill uses only keys unlocked by its stage', function () { assert.deepEqual(C.check(), []); });
test('each stage has enough text', function () {
  Object.keys(C.CONTENT).forEach(function (l) { Object.keys(C.CONTENT[l]).forEach(function (s) {
    assert.ok(C.CONTENT[l][s].words.length >= 20, l + s + ' words'); assert.ok(C.CONTENT[l][s].sentences.length >= 4, l + s + ' sentences'); }); });
});
test('checker catches a locked key', function () { assert.deepEqual(C.offenders('en', 'zoo', C.unlocked(0)), ['z', 'o', 'o']); });
