# Typing Trainer (مدرّب الكتابة)

Arabic and English typing practice. Pick a language and 30 or 60 seconds, type the words, press space to move on. Shows words per minute, accuracy, your best score, a chart of the last 20 attempts, and the letters you miss most.

- WPM counts only correct words (5 characters = 1 word). Accuracy is correct characters out of typed characters.
- Arabic diacritics (tashkeel) are ignored when comparing, so you do not need to type them.
- History (last 50 attempts) is stored in your browser only (localStorage). No account, no network calls.
- Word lists are written for this project (about 130 Arabic and 130 English common words), so repeats happen in longer runs.

## Run / test
`python3 -m http.server`, open http://localhost:8000. Tests: `npm test` (Node 18+). `logic.js` has the scoring maths and is covered by `logic.test.js`.

## Limits
No Google sync. Word lists are short. Tested on desktop Chrome; mobile keyboards with autocorrect may behave differently.

## Credits
Built with AI assistance.

## دروس الأصابع (جديد)
12 درس لتعلّم اللمس على الكيبورد الحقيقي (كمبيوتر): صف الارتكاز، الصف العلوي والسفلي، الأرقام. كل درس بيوضّح الحرف المطلوب، أنهي صباع بيضغطه، ومكانه على كيبورد مرسوم. النجوم: 1 = دقة 95%، 2 = دقة 98% و20 كلمة/د، 3 = دقة 99% و30 كلمة/د.

## حفظ التقدّم بحساب جوجل
تسجيل الدخول اختياري. التقدّم بيتخزّن في Firebase (Firestore) تحت `users/{uid}/apps/typing`، ومتاح لصاحب الحساب بس حسب قواعد المشروع. من غير تسجيل دخول كل حاجة بتفضل في المتصفح.

## حدود معروفة
- ترتيب الحروف العربي متراجع مع key-test.com و learntype.app (عربي 101، الحروف من غير Shift بس).
- الدرس بيحسب الزرار الفعلي على الكيبورد (مش الحرف اللي طلع)، عشان العضلات تحفظ المكان الصح. تقدر تتمرن على الحروف العربي حتى لو الكيبورد عندك إنجليزي. لو المتصفح مبعتش كود الزرار (بعض كيبوردات الموبايل) بنقارن بالحرف.
- مفيش اختبار للتزامن غير يدوي.

## الكورس الكامل (جديد)
مسارين (عربي وإنجليزي)، تمهيد و٧ مراحل، كل مرحلة ليها تمرين واختبار، واختبار نهائي بنص جديد وشهادة إتمام كصورة.
- العدّي في كل مرحلة بيتحسب بدقة وسرعة صافية. الأرقام (٩٢-٩٥٪ دقة، ٨-٢٦ ك/د للمراحل، و٩٦٪/٣٠ للنهائي، و٩٨٪/٤٥ للتميّز) معايير اخترتها للتطبيق ومش متحقق منها من مصدر خارجي. في العربي لسه مبدئية.
- المراحل ١-٣ بتتقيّم على الزرار الفعلي (KeyboardEvent.code). من مرحلة ٤ على الحرف اللي بيطلع، لأن مواضع Shift والهمزات بتختلف بين الأنظمة. التشكيل والأرقام العربي مش متدرّب عليهم.
- الصافي = (الحروف الصح ÷ ٥) ÷ الدقايق من أول لآخر ضغطة، والوقفات محسوبة. الدقة = الصح ÷ (المكتوب + الغلطات المصحَّحة). مفيش رفض بسبب السرعة أو انتظام التوقيت. بس الاختبار النهائي بيتجاهل أحداث مش من الكيبورد (isTrusted=false) واللصق.
- الشهادة صادرة من التطبيق نفسه وبتسجّل إتمام الكورس ونتيجتك فيه بس. مش تحقق هوية، مش معتمدة، ومحفوظة في المتصفح فمش مقاومة للتعديل.
- التقدّم سجلات بمعرّف (typing-trainer-course-v1) بتتزامن مع حساب جوجل وبتتدمج بالمعرّف. من غير تسجيل بيفضل على الجهاز.
- الملفات: course.js (حساب النتيجة)، coursecontent*.js (النصوص + فحص إن كل نص بيستخدم حروف المرحلة بس)، coursegen.js (خطوات الحروف)، coursestate.js (التقدّم والشهادة)، course-ui.js.
- مراحل ١ لـ ٣ فيها ١٦ خطوة، كل خطوة حرفين جداد: تمرين على الحرفين، أزواج حروف، كلمات حقيقية، جملة. بتعدّي بدقة ٩٠٪ من غير شرط سرعة. فيه مراجعة سريعة في أول المرحلة، وتدريب على الحروف الضعيفة بيتبني من إحصائيات كل حرف في محاولاتك. مراحل ٤ لـ ٧ فيها ١٢ خطوة نصية: Shift والهمزات والأرقام والترقيم، ثم أزواج حروف شائعة وكلمات قصيرة وجمل، ثم جمل بإيقاع ثابت وكلمات طويلة، ثم فقرات. دي خطوات على نقطة واحدة مش حرف حرف، وبتتقيّم بالحرف اللي بيطلع فعلًا.
- تعليم مسار كمكتمل يدويًا (manual) بيفتح كل حاجة من غير درجات، ومبيصدرش شهادة ولا بيتحسب كنتيجة اختبار.
- مش مجرَّب: كيبورد الموبايل، وتخطيطات كيبورد غير ANSI/Arabic 101.
