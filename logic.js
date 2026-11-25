(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TypingLogic = factory();
})(this, function () {
  'use strict';

  var AR = ('في من على أن هذا ذلك التي الذي كان كل بعد قبل عند مع بين حتى لكن أو ثم قد لا نعم هناك الآن اليوم غدا أمس ' +
    'كتاب قلم مدرسة طالب معلم درس امتحان نجاح عمل وقت يوم ليل صباح مساء بيت باب شارع مدينة قرية نهر بحر جبل شمس قمر نجم سماء أرض ' +
    'ماء خبز طعام شاي قهوة صديق أخ أخت أب أم ولد بنت رجل امرأة طفل عالم علم فكرة سؤال جواب كلمة جملة لغة حرف رقم حساب برنامج حاسوب ' +
    'شبكة موقع صفحة رابط بيانات ملف مجلد تطبيق هاتف شاشة لوحة مفاتيح فأرة صورة فيديو صوت لعبة شطرنج ملك وزير فيل حصان قلعة بيدق ' +
    'تعلم أقرأ أكتب أفهم أحفظ أراجع أحاول أبدأ أنتهي أتقدم أصبر أجتهد قراءة كتابة مذاكرة تركيز هدف خطة عادة صحة رياضة نوم راحة').split(' ');

  var EN = ('the be to of and a in that have it for not on with he as you do at this but his by from they we say her she or an will my one all would there their ' +
    'what so up out if about who get which go me when make can like time no just him know take people into year your good some could them see other than then now look ' +
    'only come its over think also back after use two how our work first well way even new want because any these give day most us code array loop function string number ' +
    'object class value index return browser server client request response network data file folder search sort filter map reduce chess board move knight bishop rook queen').split(' ');

  var BANK = { ar: AR, en: EN };

  function normalize(s) {
    // Strip Arabic diacritics (tashkeel), superscript alef and tatweel so typing is compared on base letters.
    return String(s).replace(/[\u064B-\u0652\u0670\u0640]/g, '');
  }

  function pickWords(list, n, rand) {
    rand = rand || Math.random;
    var out = [], last = '';
    while (out.length < n) {
      var w = list[Math.floor(rand() * list.length)];
      if (w === last) continue;
      out.push(w); last = w;
    }
    return out;
  }

  function compareWord(typed, target) {
    typed = normalize(typed); target = normalize(target);
    var errors = [], correctChars = 0, len = Math.max(typed.length, target.length);
    for (var i = 0; i < len; i++) {
      if (i < typed.length && typed[i] === target[i]) correctChars++;
      else errors.push(i < target.length ? target[i] : '+');
    }
    return { correct: typed === target, correctChars: correctChars, typedLen: typed.length, errors: errors };
  }

  function summarize(targets, typedWords, elapsedMs) {
    var typedTotal = 0, charCorrect = 0, goodWords = 0, netChars = 0, badKeys = {};
    for (var i = 0; i < typedWords.length; i++) {
      var r = compareWord(typedWords[i], targets[i] || '');
      typedTotal += r.typedLen;
      charCorrect += r.correctChars;
      if (r.correct) { goodWords++; netChars += r.typedLen + 1; }
      r.errors.forEach(function (k) { if (k !== '+') badKeys[k] = (badKeys[k] || 0) + 1; });
    }
    var minutes = Math.max(elapsedMs, 1) / 60000;
    return {
      wpm: Math.round(netChars / 5 / minutes),
      accuracy: typedTotal ? Math.round((charCorrect / typedTotal) * 100) : 0,
      words: typedWords.length,
      correctWords: goodWords,
      badKeys: badKeys
    };
  }

  function weakKeys(history, top) {
    var total = {};
    history.forEach(function (h) {
      Object.keys(h.badKeys || {}).forEach(function (k) { total[k] = (total[k] || 0) + h.badKeys[k]; });
    });
    return Object.keys(total).map(function (k) { return [k, total[k]]; })
      .sort(function (a, b) { return b[1] - a[1]; }).slice(0, top || 5);
  }

  function bestWpm(history, lang, secs) {
    var best = 0;
    history.forEach(function (h) { if (h.lang === lang && h.secs === secs && h.wpm > best) best = h.wpm; });
    return best;
  }

  return { BANK: BANK, normalize: normalize, pickWords: pickWords, compareWord: compareWord,
           summarize: summarize, weakKeys: weakKeys, bestWpm: bestWpm };
});
