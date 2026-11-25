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
- ترتيب الحروف العربي مبني على كيبورد ويندوز العربي القياسي (101) للحروف من غير Shift بس.
- الحرف بيتقبل لو كتبته بالحرف نفسه أو بالزرار الفعلي في مكانه، عشان تقدر تتمرن على كيبورد إنجليزي.
- مفيش اختبار للتزامن غير يدوي.
