(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TypingCourseState = factory();
})(this, function () {
  'use strict';
  // Course progress is an append-only list of records with unique ids, so Google sync merges devices by id without losing anything.
  // Thresholds are product calibration for this app. They are not validated against outside data. Arabic values are provisional.
  var RULES = {
    1: { minAcc: 92, minWpm: 8 }, 2: { minAcc: 92, minWpm: 10 }, 3: { minAcc: 92, minWpm: 12 }, 4: { minAcc: 93, minWpm: 14 },
    5: { minAcc: 94, minWpm: 18 }, 6: { minAcc: 95, minWpm: 22 }, 7: { minAcc: 95, minWpm: 26 }
  };
  var EXAM = { pass: { minAcc: 96, minWpm: 30 }, distinction: { minAcc: 98, minWpm: 45 } };
  var STAGES = 7;
  var STEP_RULE = { minAcc: 90, minWpm: 0 }; // key steps are about accuracy only
  var STEP_STAGE = [1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3];
  var KEY = 'typing-trainer-course-v1';

  function empty() { return { v: 1, results: [], certs: [], manual: [] }; }
  function clean(s) {
    var o = empty();
    if (!s || typeof s !== 'object') return o;
    if (Array.isArray(s.results)) o.results = s.results.filter(function (r) { return r && typeof r === 'object' && r.id && typeof r.track === 'string'; });
    if (Array.isArray(s.certs)) o.certs = s.certs.filter(function (c) { return c && typeof c === 'object' && c.id && typeof c.track === 'string'; });
    if (Array.isArray(s.manual)) o.manual = s.manual.filter(function (m) { return m && typeof m === 'object' && m.id && typeof m.track === 'string'; });
    return o;
  }
  var num = function (v) { return typeof v === 'number' && isFinite(v) ? v : 0; };
  function newId(now, rand) { return 'r' + (now || Date.now()).toString(36) + Math.floor((rand ? rand() : Math.random()) * 1e9).toString(36); }

  // kind: 'stage' (ref = 1..7) or 'exam' (ref = text index). result = output of TypingCourse.score
  function addResult(state, track, kind, ref, res, now, rand) {
    var s = clean(state), rule = kind === 'exam' ? EXAM.pass : (kind === 'step' ? STEP_RULE : RULES[ref]);
    var passed = !!(res && res.complete && rule && num(res.acc) >= rule.minAcc && num(res.wpm) >= rule.minWpm);
    var rec = { id: newId(now, rand), track: track, kind: kind, ref: ref, acc: num(res && res.acc), wpm: num(res && res.wpm), cons: num(res && res.consistency),
      corrected: num(res && res.corrected), uncorrected: num(res && res.uncorrected), passed: passed, t: now || Date.now() };
    if (res && res.perKey && typeof res.perKey === 'object') rec.kstats = res.perKey;
    s.results.push(rec);
    return { state: s, record: rec };
  }
  // Manual completion: the owner marked a track finished by hand. It unlocks everything and carries no scores, so it is never an exam result or a certificate.
  function isManual(state, track) { return clean(state).manual.some(function (m) { return m.track === track; }); }
  function markManual(state, track, now) {
    var s = clean(state); if (isManual(s, track)) return s;
    s.manual.push({ id: 'manual-' + track, track: track, kind: 'manual-complete', t: now || Date.now() }); return s;
  }
  function highestPassed(state, track) {
    var h = isManual(state, track) ? STAGES : 0;
    clean(state).results.forEach(function (r) { if (r.track === track && r.kind === 'stage' && r.passed && r.ref > h) h = r.ref; });
    return h;
  }
  // Passing a stage test (also cold, as a test-out) counts for every earlier stage. Stage 1 is always open.
  function stageOpen(state, track, stage) { return stage >= 1 && stage <= STAGES && stage <= highestPassed(state, track) + 1; }
  function stepDone(state, track, idx) {
    return isManual(state, track) ||  clean(state).results.some(function (r) { return r.track === track && r.kind === 'step' && r.ref === idx && r.passed; });
  }
  // A step opens after the previous step is done, or when its whole stage is already passed (tested out). The first step of a stage needs the stage open.
  function stepOpen(state, track, idx) {
    if (idx < 0 || idx >= STEP_STAGE.length) return false;
    var st = STEP_STAGE[idx];
    if (!stageOpen(state, track, st)) return false;
    if (highestPassed(state, track) >= st) return true;
    return idx === 0 || STEP_STAGE[idx - 1] !== st || stepDone(state, track, idx - 1);
  }
  function stepsDone(state, track, stage) {
    var n = 0, t = 0; STEP_STAGE.forEach(function (s, i) { if (s === stage) { t++; if (stepDone(state, track, i)) n++; } }); return [n, t];
  }
  function examOpen(state, track) { return highestPassed(state, track) >= STAGES; }
  function bestExam(state, track) {
    var best = null;
    clean(state).results.forEach(function (r) { if (r.track === track && r.kind === 'exam' && r.passed && (!best || r.wpm > best.wpm)) best = r; });
    return best;
  }
  function distinction(rec) { return !!rec && rec.acc >= EXAM.distinction.minAcc && rec.wpm >= EXAM.distinction.minWpm; }
  // The certificate only exists for a passed exam, and the name is typed by the user (never taken from the account).
  function issueCertificate(state, track, name, now, rand) {
    var s = clean(state), best = bestExam(s, track);
    var nm = String(name || '').replace(/\s+/g, ' ').trim().slice(0, 60);
    if (!best) return { error: 'no-pass' };
    if (!nm) return { error: 'no-name' };
    var cert = { id: newId(now, rand), track: track, name: nm, wpm: best.wpm, acc: best.acc, cons: best.cons, distinction: distinction(best), t: now || Date.now() };
    s.certs.push(cert);
    return { state: s, cert: cert };
  }
  // A manually marked track can get a completion certificate that says so. It carries no scores and is not an exam result.
  function issueManualCertificate(state, track, name, now, rand) {
    var s = clean(state), nm = String(name || '').replace(/\s+/g, ' ').trim().slice(0, 60);
    if (!isManual(s, track)) return { error: 'not-manual' };
    if (bestExam(s, track)) return { error: 'has-exam' };
    if (!nm) return { error: 'no-name' };
    if (s.certs.some(function (c) { return c.track === track && c.manual; })) return { error: 'exists' };
    var cert = { id: 'cert-manual-' + track, track: track, name: nm, manual: true, t: now || Date.now() };
    s.certs.push(cert); return { state: s, cert: cert };
  }
  function summary(state, track) {
    var s = clean(state), tr = s.results.filter(function (r) { return r.track === track; });
    return { highest: highestPassed(s, track), attempts: tr.length, examOpen: examOpen(s, track), exam: bestExam(s, track), certs: s.certs.filter(function (c) { return c.track === track; }).length, manual: isManual(s, track) };
  }
  return { KEY: KEY, RULES: RULES, EXAM: EXAM, STAGES: STAGES, empty: empty, clean: clean, addResult: addResult, highestPassed: highestPassed,
           stageOpen: stageOpen, isManual: isManual, markManual: markManual, stepDone: stepDone, stepOpen: stepOpen, stepsDone: stepsDone, STEP_STAGE: STEP_STAGE, STEP_RULE: STEP_RULE, examOpen: examOpen, bestExam: bestExam, distinction: distinction, issueCertificate: issueCertificate, issueManualCertificate: issueManualCertificate, summary: summary };
});
