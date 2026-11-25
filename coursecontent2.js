(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TypingCourseContent2 = factory();
})(this, function () {
  'use strict';
  // Stages 4-7 and exam texts. Original writing. Arabic avoids the letter ذ (its key, Backquote, is outside our layout map)
  // and avoids digits/tashkeel; Arabic Shift-layer characters are scored by the character produced, because Shift positions vary by operating system.
  var ALLOW = {
    en: /^[A-Za-z0-9 .,;:'"?!()\-\/\[\]]+$/,
    ar: /^[\u0621-\u063A\u0641-\u064A\u0623\u0625\u0622 \u061F\u060C\u061B.]+$/
  };
  var C = {
    en: {
      s4: { words: ['Cairo','Nile','April','Monday','Sara','Omar','Hassan','Luxor','2026','305','48','7:30','"yes"','(maybe)','well-known','it\'s','don\'t','Ahmed','Mona','Alexandria','12/10','A-1','Q/A','Wi-Fi','Zaid'],
            sentences: ['Omar lives in Cairo, and Sara lives in Luxor.','The meeting is on Monday at 7:30, not at 8:00.','"Yes," she said, "I will come at 5."','Is this the answer? No! It is 48, not 84.','Please read pages 12-15 (and the notes) today.'] },
      s5: { words: ['because','between','without','through','another','important','example','question','practice','together','different','problem','morning','evening','market','teacher','student','library','answer','finger','position','steady','accuracy','rhythm'],
            sentences: ['Good typing starts with a calm and steady rhythm.','Keep your eyes on the text, not on the keys.','A small mistake is fine; fix it and move on.','Short daily practice works better than one long night.','Read the next word while your fingers finish this one.','Accuracy comes first, and speed follows with time.'] },
      s6: { words: ['the','and','you','that','was','for','are','with','his','they','this','have','from','one','had','word','but','not','what','all','were','when','your','can','said','there','use','each','which','she','how','their'],
            sentences: ['We can see that you are here for the first time.','What did they say when the day was over?','Each one has a word for this, but not all of them.','Use the time that you have and do it well.','I think there are more of them than we had said.'] },
      s7: { paragraphs: ['A library is a quiet place, but it is full of voices. Every book holds the thoughts of someone who sat down, took a breath, and began to write. When you type a page from a book, you slow down enough to notice how sentences are built: where a comma rests, where a sentence turns, and how a small word can carry a big idea.',
                         'Learning to type is a little like learning to ride a bicycle. At first you look at your hands and wobble. Then one day your hands know the way, and your mind is free to think about what you want to say. That freedom is the real goal of practice, not a number on a screen.',
                         'Mona kept a notebook by the window. Each morning she wrote three lines: what she had learned, what had been hard, and what she would try next. After a month, the notebook told a clear story of small steps, and the hard parts had started to look easy.'] },
      exam: ['The river city woke slowly that morning. Boats rocked against the stone steps, and a baker carried warm bread across the square. A teacher unlocked the school door and found a note beneath it: the class trip was moved to Thursday, and everyone should bring water and a hat. By noon the streets were busy, the market was loud, and children were already planning which hills they would climb. Nobody noticed the clock tower until it rang twice, and then the whole town laughed, because it was only half past one.',
             'Good habits are built quietly. A student who reads for twenty minutes each evening will, after a year, have finished many books without ever feeling rushed. A runner who walks first and jogs later reaches the finish line with a smile. The same is true for the keyboard: place your fingers on the home row, keep your wrists relaxed, and let each key press be small and sure. Mistakes will come, and that is normal. Correct them calmly, keep your rhythm, and trust that your hands are learning even when you cannot feel it. When the text ends, take a breath and look at your result with patience.'] },
    ar: {
      s4: { words: ['أحمد','أمل','إبراهيم','آمنة','أسرة','إجابة','سؤال؟','نعم،','لا؛','أكتب','أقرأ','إسلام','آخر','أخت','أب','إدارة','أرض','أنا','إلى','أول','آية','أمس','أيام','إنسان'],
            sentences: ['أحمد وأمل في المدرسة.','هل أنت جاهز؟ نعم، أنا جاهز.','آمنة تقرأ كتابا، وإبراهيم يكتب درسا.','أول يوم في الأسبوع؛ وآخر يوم في الشهر.','أين أخي؟ إنه في البيت.'] },
      s5: { words: ['مدرسة','طالب','معلم','كتاب','مكتبة','تمرين','سرعة','دقة','تركيز','صبر','نجاح','مهارة','يوميا','دائما','أحيانا','سؤال','جواب','فكرة','مثال','بداية','نهاية','خطوة','هدوء','إيقاع'],
            sentences: ['الكتابة الجيدة تبدأ بإيقاع هادئ وثابت.','انظر إلى النص ولا تنظر إلى المفاتيح.','الخطأ الصغير عادي؛ صححه وكمل.','تمرين قصير كل يوم أحسن من ليلة طويلة.','اقرأ الكلمة التالية وأصابعك تنهي الحالية.','الدقة أولا، والسرعة تأتي مع الوقت.'] },
      s6: { words: ['في','من','على','أن','هنا','التي','كان','كل','بعد','قبل','عند','مع','بين','حتى','لكن','أو','ثم','قد','لا','نعم','هناك','الآن','اليوم','غدا','أمس','كلمة','جملة','وقت','عمل','بيت','طريق','صديق'],
            sentences: ['كان عندنا وقت كثير قبل الامتحان.','مشيت إلى السوق ثم رجعت إلى البيت.','هناك صديق لي يسكن بين النهر والجبل.','لكن الوقت كان قصيرا حتى نكمل العمل.','قد نبدأ اليوم أو نبدأ غدا.'] },
      s7: { paragraphs: ['المكتبة مكان هادئ لكنه مليء بالأصوات. كل كتاب يحمل أفكار إنسان جلس وتنفس بعمق ثم بدأ يكتب. وحين تنقل صفحة من كتاب بالكتابة على لوحة المفاتيح، فأنت تبطئ بما يكفي لتلاحظ كيف تبنى الجملة، أين تقف الفاصلة، وأين تنعطف الفكرة، وكيف تحمل كلمة صغيرة معنى كبيرا.',
                         'تعلم الكتابة يشبه تعلم ركوب الدراجة. في البداية تنظر إلى يديك وتترنح. ثم يأتي يوم تعرف فيه يداك الطريق، ويصبح عقلك حرا ليفكر فيما تريد قوله. تلك الحرية هي هدف التمرين الحقيقي، وليست رقما على الشاشة.',
                         'كانت منى تحتفظ بدفتر قرب الشباك. كل صباح تكتب ثلاثة أسطر، ما تعلمته، وما كان صعبا، وما ستجربه بعدها. وبعد شهر صار الدفتر يحكي قصة واضحة من خطوات صغيرة، وبدأت الأجزاء الصعبة تبدو سهلة.'] },
      exam: ['استيقظت مدينة النهر ببطء في صباح يوم جميل. كانت القوارب تتأرجح عند الدرج الحجري، وكان خباز يحمل خبزا دافئا عبر الساحة. فتحت المعلمة باب المدرسة فوجدت ورقة تحته تقول إن الرحلة انتقلت إلى يوم الخميس، وعلى الجميع إحضار الماء والقبعة. وعند الظهر امتلأت الشوارع بالناس وارتفع صوت السوق، وكان الأطفال يخططون لأي تل سيتسلقون. ولم ينتبه أحد إلى ساعة البرج حتى دقت مرتين، فضحكت المدينة كلها لأن الوقت كان الواحدة والنصف فقط.',
             'العادات الجيدة تبنى بهدوء. الطالب حين يقرأ عشرين دقيقة كل مساء ينهي بعد سنة كتبا كثيرة دون أن يشعر بالعجلة. والعداء حين يمشي أولا ثم يركض يصل إلى خط النهاية مبتسما. وعلى لوحة المفاتيح، فضع أصابعك على صف الأساس، واجعل معصميك مرتاحين، ودع كل ضغطة تكون صغيرة وواثقة. ستأتي الأخطاء وهو أمر طبيعي، فصححها بهدوء وحافظ على إيقاعك، وثق أن يديك تتعلمان حتى لو لم تشعر بالتقدم. وحين ينتهي النص تنفس بعمق وانظر إلى نتيجتك بصبر.'] }
  };
  function allTexts(lang) {
    var out = [];
    Object.keys(C[lang]).forEach(function (sid) {
      var c = C[lang][sid];
      if (c.words) c.words.forEach(function (t) { out.push([sid, t]); });
      if (c.sentences) c.sentences.forEach(function (t) { out.push([sid, t]); });
      if (c.paragraphs) c.paragraphs.forEach(function (t) { out.push([sid, t]); });
      if (Array.isArray(c)) c.forEach(function (t) { out.push([sid, t]); });
    });
    return out;
  }
  function check() {
    var rep = [];
    ['en', 'ar'].forEach(function (lang) {
      allTexts(lang).forEach(function (p) {
        if (!ALLOW[lang].test(p[1])) rep.push({ lang: lang, stage: p[0], text: p[1].slice(0, 40), why: 'char' });
        if (lang === 'ar' && /\u0630/.test(p[1])) rep.push({ lang: lang, stage: p[0], text: p[1].slice(0, 40), why: 'dhal' });
      });
    });
    return rep;
  }
  return { CONTENT: C, check: check, ALLOW: ALLOW };
});
