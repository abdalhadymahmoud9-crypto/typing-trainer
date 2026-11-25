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


  // ---------- Touch-typing lessons (physical keyboard) ----------
  var ROWS = [
    ['KeyQ','KeyW','KeyE','KeyR','KeyT','KeyY','KeyU','KeyI','KeyO','KeyP','BracketLeft','BracketRight'],
    ['KeyA','KeyS','KeyD','KeyF','KeyG','KeyH','KeyJ','KeyK','KeyL','Semicolon','Quote'],
    ['KeyZ','KeyX','KeyC','KeyV','KeyB','KeyN','KeyM','Comma','Period','Slash']
  ];
  var LAYOUT = {
    en: { KeyQ:'q',KeyW:'w',KeyE:'e',KeyR:'r',KeyT:'t',KeyY:'y',KeyU:'u',KeyI:'i',KeyO:'o',KeyP:'p',BracketLeft:'[',BracketRight:']',
          KeyA:'a',KeyS:'s',KeyD:'d',KeyF:'f',KeyG:'g',KeyH:'h',KeyJ:'j',KeyK:'k',KeyL:'l',Semicolon:';',Quote:"'",
          KeyZ:'z',KeyX:'x',KeyC:'c',KeyV:'v',KeyB:'b',KeyN:'n',KeyM:'m',Comma:',',Period:'.',Slash:'/' },
    // Standard Arabic 101 layout, base (unshifted) characters.
    ar: { KeyQ:'ض',KeyW:'ص',KeyE:'ث',KeyR:'ق',KeyT:'ف',KeyY:'غ',KeyU:'ع',KeyI:'ه',KeyO:'خ',KeyP:'ح',BracketLeft:'ج',BracketRight:'د',
          KeyA:'ش',KeyS:'س',KeyD:'ي',KeyF:'ب',KeyG:'ل',KeyH:'ا',KeyJ:'ت',KeyK:'ن',KeyL:'م',Semicolon:'ك',Quote:'ط',
          KeyZ:'ئ',KeyX:'ء',KeyC:'ؤ',KeyV:'ر',KeyB:'لا',KeyN:'ى',KeyM:'ة',Comma:'و',Period:'ز',Slash:'ظ' }
  };
  // finger ids: L5 = left pinky ... L2 = left index, R2 = right index ... R5 = right pinky
  var FINGER = {
    KeyQ:'L5',KeyA:'L5',KeyZ:'L5', KeyW:'L4',KeyS:'L4',KeyX:'L4', KeyE:'L3',KeyD:'L3',KeyC:'L3',
    KeyR:'L2',KeyT:'L2',KeyF:'L2',KeyG:'L2',KeyV:'L2',KeyB:'L2',
    KeyY:'R2',KeyU:'R2',KeyH:'R2',KeyJ:'R2',KeyN:'R2',KeyM:'R2',
    KeyI:'R3',KeyK:'R3',Comma:'R3', KeyO:'R4',KeyL:'R4',Period:'R4',
    KeyP:'R5',BracketLeft:'R5',BracketRight:'R5',Semicolon:'R5',Quote:'R5',Slash:'R5'
  };
  var FINGER_NAME = { L5:'خنصر الإيد الشمال', L4:'بنصر الإيد الشمال', L3:'وسطى الإيد الشمال', L2:'سبابة الإيد الشمال',
                      R2:'سبابة الإيد اليمين', R3:'وسطى الإيد اليمين', R4:'بنصر الإيد اليمين', R5:'خنصر الإيد اليمين' };
  var HOME = ['KeyA','KeyS','KeyD','KeyF','KeyJ','KeyK','KeyL','Semicolon'];

  // Each lesson adds new keys on top of the previous ones. Keys are physical positions, so the same plan works for both languages.
  var STEPS = [
    { add: HOME, title: 'صف الأساس' },
    { add: ['KeyG','KeyH'], title: 'السبابتين: G و H' },
    { add: ['KeyE','KeyI'], title: 'الصف العلوي: E و I' },
    { add: ['KeyR','KeyU'], title: 'R و U' },
    { add: ['KeyT','KeyO'], title: 'T و O' },
    { add: ['KeyY','KeyP'], title: 'Y و P' },
    { add: ['KeyW','KeyQ'], title: 'W و Q' },
    { add: ['KeyN','KeyM'], title: 'الصف السفلي: N و M' },
    { add: ['KeyC','KeyV'], title: 'C و V' },
    { add: ['KeyX','KeyZ','KeyB'], title: 'X و Z و B' },
    { add: ['Comma','Period','Slash','Quote'], title: 'الفاصلة والنقطة و / و \'' },
    { add: ['BracketLeft','BracketRight'], title: 'الأقواس [ ]' }
  ];

  function lessonKeys(idx) {
    var out = [];
    for (var i = 0; i <= idx && i < STEPS.length; i++) out = out.concat(STEPS[i].add);
    return out;
  }
  function lessonCount() { return STEPS.length; }

  // Practice text: pseudo-words of 2-5 keys, with the newly introduced keys appearing most often.
  function makeLessonText(lang, idx, rand, wordsCount) {
    rand = rand || Math.random; wordsCount = wordsCount || 10;
    var all = lessonKeys(idx), fresh = STEPS[idx].add, map = LAYOUT[lang], words = [];
    for (var w = 0; w < wordsCount; w++) {
      var len = 2 + Math.floor(rand() * 4), word = '';
      for (var i = 0; i < len; i++) {
        var pool = (idx > 0 && rand() < 0.6) ? fresh : all;
        word += map[pool[Math.floor(rand() * pool.length)]];
      }
      words.push(word);
    }
    return words.join(' ');
  }

  // Split practice text into tokens that each correspond to one key press (Arabic "لا" is one key).
  function tokenize(lang, text) {
    var map = LAYOUT[lang], multi = Object.keys(map).map(function (k) { return map[k]; }).filter(function (c) { return c.length > 1; });
    var out = [], i = 0;
    while (i < text.length) {
      var m = multi.filter(function (c) { return text.substr(i, c.length) === c; })[0];
      if (m) { out.push(m); i += m.length; } else { out.push(text[i]); i++; }
    }
    return out;
  }
  function codeForChar(lang, ch) {
    if (ch === ' ') return 'Space';
    var map = LAYOUT[lang];
    for (var k in map) if (map[k] === ch) return k;
    return null;
  }
  // Lessons train muscle memory, so the PHYSICAL key is what counts (KeyboardEvent.code).
  // The typed character is only used as a fallback when the browser gives no physical code (some virtual keyboards).
  // A character produced by a different key (another layout, a remap) is not accepted.
  function isHit(lang, token, ev) {
    var want = codeForChar(lang, token);
    if (ev.code && ev.code !== 'Unidentified') return ev.code === want;
    if (token === ' ') return ev.key === ' ';
    return ev.key === token || String(ev.key).toLowerCase() === token;
  }

  function gradeLesson(totalKeys, mistakes, elapsedMs) {
    var presses = totalKeys + mistakes;
    var acc = presses ? Math.round((totalKeys / presses) * 100) : 0;
    var wpm = Math.round((totalKeys / 5) / (Math.max(elapsedMs, 1) / 60000));
    var stars = 0;
    if (acc >= 95) stars = 1;
    if (acc >= 98 && wpm >= 20) stars = 2;
    if (acc >= 99 && wpm >= 30) stars = 3;
    return { acc: acc, wpm: wpm, stars: stars, passed: stars >= 1 };
  }

  // progress: { ar: { "0": {stars, acc, wpm, tries} }, en: {...} }
  function isUnlocked(progress, lang, idx) {
    if (idx === 0) return true;
    var p = progress && progress[lang] && progress[lang][String(idx - 1)];
    return !!(p && p.stars >= 1);
  }
  function recordLesson(progress, lang, idx, result) {
    var out = JSON.parse(JSON.stringify(progress || {}));
    out[lang] = out[lang] || {};
    var old = out[lang][String(idx)] || { stars: 0, acc: 0, wpm: 0, tries: 0 };
    out[lang][String(idx)] = { stars: Math.max(old.stars, result.stars), acc: Math.max(old.acc, result.acc),
                               wpm: Math.max(old.wpm, result.wpm), tries: old.tries + 1 };
    return out;
  }

  return { ROWS: ROWS, LAYOUT: LAYOUT, FINGER: FINGER, FINGER_NAME: FINGER_NAME, HOME: HOME, STEPS: STEPS, lessonKeys: lessonKeys, lessonCount: lessonCount,
           makeLessonText: makeLessonText, tokenize: tokenize, codeForChar: codeForChar, isHit: isHit, gradeLesson: gradeLesson,
           isUnlocked: isUnlocked, recordLesson: recordLesson, BANK: BANK, normalize: normalize, pickWords: pickWords, compareWord: compareWord,
           summarize: summarize, weakKeys: weakKeys, bestWpm: bestWpm };
});
