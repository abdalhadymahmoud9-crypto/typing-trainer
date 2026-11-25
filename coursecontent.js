(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./logic.js'));
  else root.TypingCourseContent = factory(root.TypingLogic);
})(this, function (L) {
  'use strict';
  // Content is original. Stages unlock physical keys; every text is checked to use only keys unlocked so far.
  var STAGE_KEYS = [
    { id: 's1', title: 'صف الأساس', add: ['KeyA','KeyS','KeyD','KeyF','KeyG','KeyH','KeyJ','KeyK','KeyL','Semicolon'] },
    { id: 's2', title: 'الصف العلوي', add: ['KeyQ','KeyW','KeyE','KeyR','KeyT','KeyY','KeyU','KeyI','KeyO','KeyP'] },
    { id: 's3', title: 'الصف السفلي', add: ['KeyZ','KeyX','KeyC','KeyV','KeyB','KeyN','KeyM','Comma','Period','Slash','Quote','BracketLeft','BracketRight'] }
  ];
  var CONTENT = {
    en: {
      s1: { words: ['sad','dad','fad','lad','lass','ask','all','fall','hall','gall','flask','salad','glass','dash','flash','shall','half','had','has','gas','sag','lag','flag','gag','slash','hash','lash','salsa','sash','shall'],
            sentences: ['a lad had a salad','dad shall ask a lass','a flask falls; a glass falls','all lads had half a salad','dad has a flag; a lass has a flask','ask a lad; ask a lass; ask dad'] },
      s2: { words: ['we','were','top','port','story','quiet','tower','rope','power','write','their','pity','your','user','true','output','pretty','request','jury','typewriter','pour','route','poetry','trophy','equip','people','fruit','youth','route','wider'],
            sentences: ['write your story at the quiet tower','the pretty tree is up there','try to type your top row; write it quietly','people were quiet; the router was too','the typewriter is true to its output'] },
      s3: { words: ['zinc','box','can','van','vex','cab','nab','mix','number','zone','lunch','become','combine','maximum','bounce','crown','climb','vanish','zebra','mailbox','banner','cinema','exact','voice','abstract','market'],
            sentences: ['a cab can come back, maybe','we became a zebra, but we vanish','combine a box, a van and a mailbox','my number is exact, not vague','the voice came; the market, calm, was busy'] }
    },
    ar: {
      s1: { words: ['سلام','كلام','نسيم','بيت','ليل','سبب','كتب','مسك','نمل','شمس','ملك','بنت','ابن','اسم','كلمات','تبيان','سكن','نسل','لبس','بسم','شكل','سكب','نبت','كسب'],
            sentences: ['ملك نسي كتابا','سلام يا ابن','كلمات تبيان الكلام','بنت لبست شكلا كسبا','ليل نسيم'] },
      s2: { words: ['قلم','علم','فهم','حلم','صبح','فتح','عمل','ضحك','صحف','حقل','غسل','هلال','سحب','فصل','عقل','نفع','خسف','كتف','شعب','صمت','ضيف','سقف','غنم','ثمن'],
            sentences: ['فتح علي بابا','عمل فصل كامل','هل فهمت الكلمات','قال علي ما فعل','غسل علي الصحف'] },
      s3: { words: ['زهرة','ورد','رجل','مطر','ظهر','مؤمن','سؤال','شيء','مئة','ريح','جديد','طريق','مدرسة','سيارة','حديقة','طبيب','موز','مزرعة','وزير','كبير','صغير','نظيف','ظل','خزانة'],
            sentences: ['المطر نزل في الصباح','الورد جميل والحديقة كبيرة','ظهر القمر فوق البيت','الطريق الى المدرسة طويل','الطبيب نظيف وهادئ'] }
    }
  };
  // fix words that leak unlocked-later keys: filter at build time via the checker below
  function unlocked(stageIdx) { var o = []; for (var i = 0; i <= stageIdx; i++) o = o.concat(STAGE_KEYS[i].add); return o; }

  // Returns offending characters (empty array = ok). Uses Arabic لا-aware tokenization.
  function offenders(lang, text, allowed) {
    var bad = [];
    (lang === 'ar' ? text.split('') : L.tokenize(lang, text)).forEach(function (tk) {
      if (tk === ' ') return;
      var code = L.codeForChar(lang, tk);
      if (!code || allowed.indexOf(code) < 0) bad.push(tk);
    });
    return bad;
  }
  function check() {
    var report = [];
    Object.keys(CONTENT).forEach(function (lang) {
      Object.keys(CONTENT[lang]).forEach(function (sid) {
        var idx = STAGE_KEYS.map(function (s) { return s.id; }).indexOf(sid), allowed = unlocked(idx);
        var c = CONTENT[lang][sid];
        c.words.concat(c.sentences).forEach(function (t) { var b = offenders(lang, t, allowed); if (b.length) report.push({ lang: lang, stage: sid, text: t, bad: b }); });
      });
    });
    return report;
  }
  return { STAGE_KEYS: STAGE_KEYS, CONTENT: CONTENT, unlocked: unlocked, offenders: offenders, check: check };
});
