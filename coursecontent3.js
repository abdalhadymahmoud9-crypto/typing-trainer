(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./coursecontent2.js'));
  else root.TypingCourseContent3 = factory(root.TypingCourseContent2);
})(this, function (B) {
  'use strict';
  // More original text for stages 4 to 7 and the final exam. It extends the pools in coursecontent2.js (same checker applies).
  var X = {
    en: {
      s4: {
        words: ['Nile', 'Alexandria', 'Aswan', 'Giza', 'Monday', 'Friday', 'June', 'March', 'Hello,', 'Thanks!', 'ready?', 'Yes.', 'No,', 'wait;', '2026', '15', '40', '9:30', 'Layla', 'Hassan'],
        sentences: ['Layla called at 9:30, but Hassan was already on the train.', 'The shop opens on Friday; it closes at 6:15 every day.', 'Are you coming to Aswan in March, or in June?', 'Thanks! I bought 12 notebooks and 3 pens.', '"Wait," said Nour, "the bus leaves at 4:45."', 'Cairo, Giza, and Alexandria are all on my list.', 'My room number is 214, and the code is 5071.', 'It rained on Monday. It was sunny on Tuesday!']
      },
      s5: {
        words: ['because', 'between', 'morning', 'quietly', 'balance', 'pattern', 'support', 'journey', 'careful', 'forward', 'whether', 'however'],
        sentences: ['She read the page twice because the last line changed the meaning.', 'He kept a steady rhythm between the letters instead of rushing the ends.', 'Whether the room is quiet or busy, the hands should stay relaxed.', 'A careful start makes the rest of the line feel easier.', 'The train moved forward while the city slowly woke up.', 'Good habits are small, and they grow because you repeat them.']
      },
      s6: {
        words: ['practice', 'accuracy', 'keyboard', 'finger', 'rhythm', 'smooth', 'steady', 'tension'],
        sentences: ['Speed is a side effect of accuracy that has been repeated for many days.', 'When a mistake appears, slow down for one line and let the hands settle.', 'Keep your eyes on the text, and let your fingers find their own places.', 'A short session every day beats one long session once a week.', 'Tension in the shoulders shows up as errors in the fingers.', 'Read two words ahead; your hands will follow without being told.']
      },
      s7: {
        paragraphs: [
          'Most people learn to type by accident, hunting for letters one at a time. It works, but it hits a ceiling. A slower start with the right fingers feels strange for a week and then pays back for years, because the hands stop asking the eyes for help.',
          'A good session has three parts: a short warm up, a stretch where you push a little, and a calm end. The middle part is where the progress happens, but the warm up and the calm end are what let you come back tomorrow.'
        ]
      },
      exam: [
        'The old market opens before the sun is fully up. Sellers carry crates of fruit, and the smell of fresh bread reaches the end of the street. A boy counts coins twice, then smiles when the number is right. By noon the lanes are crowded, but nobody seems to hurry. People stop, talk, and compare prices as if time were something to share. When the light turns gold in the evening, the stalls close one by one, and the street goes quiet again until the next morning.',
        'Learning a new skill rarely feels like progress while it is happening. You repeat the same small movement, you make the same small mistake, and then one day the mistake is gone. Nobody can point to the moment it changed. That is why steady practice matters more than long, tired sessions. Ten calm minutes with full attention teach the hands more than an hour of rushing. Keep the rhythm easy, keep the errors low, and let the speed arrive on its own.',
        'The library at the end of our street has one long table and a window that faces the river. In the afternoon the light falls across the pages, and the whole room goes still. People come with different reasons: a student with a heavy bag, an old man with a newspaper, a woman who writes letters by hand. Nobody speaks much, yet the place never feels empty. It reminds me that quiet is not the same as silence; it is a shared agreement to listen.'
      ]
    },
    ar: {
      s4: {
        words: ['أمينة', 'أسوان', 'إسكندرية', 'القاهرة', 'إيمان', 'أيمن', 'آلة', 'مؤشر', 'سؤالا', 'شكرا،', 'هل؟', 'نعم؛'],
        sentences: ['أمينة تسكن في أسوان، وأيمن يسكن في القاهرة.', 'هل أنت جاهز؟ نعم، أنا جاهز تماما.', 'إيمان تقرأ كتابا؛ وأحمد يكتب رسالة.', 'أين المفتاح؟ إنه على الطاولة، بجانب الكتاب.', 'آلة الطباعة قديمة، لكنها ما زالت تعمل.', 'سألني إبراهيم، هل أنهيت الدرس؟', 'أمل وإسراء وأسماء في الصف نفسه.', 'إلى أين تسير؟ إلى المكتبة، ثم إلى البيت.']
      },
      s5: {
        words: ['لأنه', 'أحيانا', 'بهدوء', 'صباحا', 'معلومة', 'تجربة', 'مستمر', 'الطريق', 'ملاحظة', 'خطوة'],
        sentences: ['قرأ السطر مرتين لأن آخره غير المعنى.', 'تمرين قصير كل يوم أفضل من ساعة طويلة مرة واحدة.', 'حين تهدأ اليدان تقل الأخطاء ويزيد الإيقاع.', 'كل خطوة صغيرة تقربك من طريق تريد أن تمشيه.', 'جلس بهدوء، وبدأ يكتب ما سمعه صباحا.', 'ليس المهم أن تسرع، المهم أن تستمر.']
      },
      s6: {
        words: ['إيقاع', 'ثابت', 'سريع', 'أصابع', 'لوحة', 'دقة', 'مهارة', 'تدريب'],
        sentences: ['السرعة نتيجة طبيعية للدقة حين تتكرر أياما كثيرة.', 'لو أخطأت فأبطئ سطرا واحدا ودع يديك تهدأ.', 'انظر إلى النص ودع أصابعك تجد أماكنها وحدها.', 'التوتر في الكتفين يظهر أخطاء في الأصابع.', 'اقرأ كلمتين إلى الأمام وستتبعك يداك.', 'جلسة قصيرة كل يوم تبني مهارة أكثر من جلسة طويلة متعبة.']
      },
      s7: {
        paragraphs: [
          'يتعلم كثير من الناس الكتابة بالصدفة، فيبحثون عن كل حرف على حدة. تنجح الطريقة، لكنها تقف عند حد. أما البداية الأبطأ بالأصابع الصحيحة فتبدو غريبة أسبوعا، ثم تفيدك سنوات، لأن اليدين تتوقفان عن طلب المساعدة من العينين.',
          'الجلسة الجيدة فيها ثلاثة أجزاء، إحماء قصير، ثم وقت تدفع فيه نفسك قليلا، ثم نهاية هادئة. التقدم يحدث في الجزء الأوسط، لكن الإحماء والنهاية الهادئة يجعلان عودتك غدا أسهل.'
        ]
      },
      exam: [
        'يفتح السوق القديم أبوابه قبل أن تكتمل الشمس. يحمل الباعة صناديق الفاكهة، وتصل رائحة الخبز الطازج إلى آخر الشارع. يعد صبي نقوده مرتين، ثم يبتسم حين يتأكد من العدد. وعند الظهر تمتلئ الأزقة بالناس، ولكن لا يبدو أن أحدا يستعجل. يتوقف الناس ويتحدثون ويقارنون الأسعار كأن الوقت شيء يتقاسمونه. وحين يصير الضوء دافئا في المساء تغلق الأكشاك واحدا بعد آخر، ويعود الشارع إلى هدوئه حتى الصباح. وبعدها يبدأ يوم جديد من العمل والكلام والمساومة الهادئة.',
        'تعلم مهارة جديدة لا يشبه التقدم وهو يحدث. تكرر الحركة الصغيرة نفسها، وتقع في الخطأ الصغير نفسه، ثم يأتي يوم يختفي فيه الخطأ. لا أحد يستطيع أن يشير إلى اللحظة التي تغير فيها كل شيء. ومن هنا فإن التمرين المنتظم أهم من الجلسات الطويلة المتعبة. عشر دقائق هادئة بكامل الانتباه تعلم اليدين أكثر من ساعة كاملة من الاستعجال. حافظ على إيقاع سهل، وأبق الأخطاء قليلة، واترك السرعة تأتي وحدها، فهي تأتي أسرع حين لا تطاردها.'
      ]
    }
  };
  ['en', 'ar'].forEach(function (l) {
    ['s4', 's5', 's6'].forEach(function (k) { var d = B.CONTENT[l][k], x = X[l][k]; x.words.forEach(function (w) { if (d.words.indexOf(w) < 0) d.words.push(w); }); x.sentences.forEach(function (s) { if (d.sentences.indexOf(s) < 0) d.sentences.push(s); }); });
    X[l].s7.paragraphs.forEach(function (p) { if (B.CONTENT[l].s7.paragraphs.indexOf(p) < 0) B.CONTENT[l].s7.paragraphs.push(p); });
    X[l].exam.forEach(function (p) { if (B.CONTENT[l].exam.indexOf(p) < 0) B.CONTENT[l].exam.push(p); });
  });
  return B;
});
