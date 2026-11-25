// Google sign-in + per-account sync for a small app that keeps its state in localStorage.
// Data path: users/{uid}/apps/{app}. One document per app, so apps cannot overwrite each other.
// Devices never overwrite each other: every write is a transaction that three-way merges with the account copy (merge.js).
// Access is enforced by Firestore rules (owner only). Only the listed keys sync.
import { firebaseConfig } from "./firebase-config.js";
import { mergeAll } from "./merge.js";
const B = "https://www.gstatic.com/firebasejs/11.0.2/";
let M;
async function load() {
  if (M) return M;
  const [app, auth, fs] = await Promise.all([import(B + "firebase-app.js"), import(B + "firebase-auth.js"), import(B + "firebase-firestore.js")]);
  const a = app.initializeApp(firebaseConfig);
  return (M = { auth, fs, au: auth.getAuth(a), db: fs.getFirestore(a) });
}
export function initSync({ app, keys, authEl, statusEl }) {
  const FLAG = `sync:${app}:on`, BUCKET = (id) => `sync:${app}:bucket:${id}`, ACTIVE = `sync:${app}:active`, BASE = (u) => `sync:${app}:base:${u}`, IMPORTED = (u) => `sync:${app}:imported:${u}`;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const status = (t) => { if (statusEl) statusEl.textContent = t; };
  const nativeSet = Storage.prototype.setItem, nativeRemove = Storage.prototype.removeItem;
  const snap = () => Object.fromEntries(keys.map((k) => [k, localStorage.getItem(k)]).filter(([, v]) => v !== null));
  const pj = (v) => { try { return JSON.parse(v); } catch { return v; } };
  const norm = (o) => JSON.stringify(Object.fromEntries(Object.keys(o).sort().map((k) => [k, pj(o[k])])));
  const same = (a, b) => norm(a) === norm(b); // compare meaning, not formatting
  const readJSON = (k) => { try { return JSON.parse(localStorage.getItem(k)) || {}; } catch { return {}; } };
  let uid = null, timer = null, applying = false, stop = null;
  const apply = (o) => { applying = true; keys.forEach((k) => (k in o ? nativeSet.call(localStorage, k, o[k]) : nativeRemove.call(localStorage, k))); applying = false; };
  const typing = () => /INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || "");
  const refresh = () => { // at most one automatic reload per 20s, so a page that rewrites its own data can never loop
    const last = Number(sessionStorage.getItem(`sync:${app}:reloaded`) || 0);
    if (typing() || Date.now() - last < 20000) { status("اتحدّثت من جهاز تاني. حدّث الصفحة تشوفها."); return; }
    sessionStorage.setItem(`sync:${app}:reloaded`, String(Date.now())); location.reload();
  };
  const touched = (k) => { if (!applying && uid && keys.includes(k)) { clearTimeout(timer); status("بيتحفظ…"); timer = setTimeout(push, 700); } };
  Storage.prototype.setItem = function (k, v) { nativeSet.call(this, k, v); if (this === localStorage) touched(k); };
  Storage.prototype.removeItem = function (k) { nativeRemove.call(this, k); if (this === localStorage) touched(k); };

  async function push() {
    const { fs, db } = await load(), u = uid; if (!u) return;
    const ref = fs.doc(db, "users", u, "apps", app);
    try {
      const merged = await fs.runTransaction(db, async (t) => {
        const s = await t.get(ref); let remote = {}; if (s.exists()) { try { remote = JSON.parse(s.data().json); } catch {} }
        const m = mergeAll(readJSON(BASE(u)), snap(), remote, keys);
        if (!same(m, remote)) t.set(ref, { json: JSON.stringify(m), updatedAt: Date.now() });
        return m;
      });
      nativeSet.call(localStorage, BASE(u), JSON.stringify(merged));
      if (u !== uid) return;
      if (!same(merged, snap())) { apply(merged); refresh(); } // another device's records were merged in
      status("محفوظ على حسابك.");
    } catch (e) { status("مش متحفظ: " + (e.code || e.message)); }
  }
  function paint(user) {
    const copies = storedUids().length;
    authEl.innerHTML = user ? `<span class="who">${esc(user.displayName || user.email || "داخل")}</span> <button type="button" data-a="out">خروج</button>` : `<button type="button" data-a="in">سجّل دخول بجوجل</button>` + (copies ? ` <button type="button" data-a="rm" class="ghost">امسح النسخ المحلية (${copies})</button><small class="offnote">الجهاز ده بيحتفظ بنسخة من بيانات الحساب لحد ما تمسحها. النسخة مش مشفّرة.</small>` : "");
  }
  // Accounts that have a parked copy on this device (not the device-only bucket).
  function storedUids() {
    const pre = `sync:${app}:bucket:`, out = [];
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith(pre) && k !== pre + "device") out.push(k.slice(pre.length)); }
    return out;
  }
  // Removes parked copies that are fully synced. A copy with changes the account has not received is kept, never silently deleted.
  function removeCopies() {
    let removed = 0, kept = 0;
    for (const u of storedUids()) {
      if (u === uid) { kept++; continue; } // signed in as this account right now
      let b = {}, base = {}; try { b = JSON.parse(localStorage.getItem(BUCKET(u))) || {}; } catch {} base = readJSON(BASE(u));
      if (Object.keys(b).length && !same(b, base)) { kept++; continue; }
      [BUCKET(u), BASE(u), IMPORTED(u)].forEach((k) => nativeRemove.call(localStorage, k)); removed++;
    }
    status(`Removed ${removed} offline cop${removed === 1 ? "y" : "ies"}.` + (kept ? ` Kept ${kept} with changes not yet synced: sign in to that account to sync them first.` : ""));
    paint(null);
  }
  function swapTo(id) { // park the live keys with whoever owned them, then load the new owner's keys
    const from = localStorage.getItem(ACTIVE) || "device";
    if (from === id) return false;
    nativeSet.call(localStorage, BUCKET(from), JSON.stringify(snap()));
    let next = {}; try { next = JSON.parse(localStorage.getItem(BUCKET(id))) || {}; } catch {}
    apply(next); nativeSet.call(localStorage, ACTIVE, id); return true;
  }
  async function start() {
    let m; try { m = await load(); } catch { status("المزامنة مش متاحة (أوفلاين؟). متحفظ على الجهاز بس."); return; }
    m.auth.onAuthStateChanged(m.au, async (user) => {
      if (stop) { stop(); stop = null; } clearTimeout(timer);
      paint(user);
      if (!user) { uid = null; nativeRemove.call(localStorage, FLAG); status("متحفظ على الجهاز ده بس. سجّل دخول عشان يتحفظ على حسابك."); if (swapTo("device")) location.reload(); return; }
      nativeSet.call(localStorage, FLAG, "1");
      const changed = swapTo(user.uid); uid = user.uid; status("بيتزامن…");
      const ref = m.fs.doc(m.db, "users", user.uid, "apps", app); let first = true;
      stop = m.fs.onSnapshot(ref, async (s) => {
        if (s.metadata.hasPendingWrites) return;
        let remote = {}; if (s.exists()) { try { remote = JSON.parse(s.data().json); } catch {} }
        if (first) {
          first = false;
          // Offer to merge this device's saved data into the account once per account. Nothing in the account is overwritten.
          let dev = {}; try { dev = JSON.parse(localStorage.getItem(BUCKET("device"))) || {}; } catch {}
          const n = Object.keys(dev).length;
          if (n && !localStorage.getItem(IMPORTED(uid))) {
            nativeSet.call(localStorage, IMPORTED(uid), "1");
            if (confirm("تدمج البيانات المحفوظة على الجهاز ده مع حسابك؟ مفيش حاجة في الحساب هتتمسح، والبيانات اللي هنا بتتضاف بس.")) {
              const merged = mergeAll({}, { ...dev, ...snap() }, remote, keys); apply(merged);
              await push(); if (changed || !same(merged, remote)) refresh(); return;
            }
          }
        }
        const merged = mergeAll(readJSON(BASE(uid)), snap(), remote, keys);
        nativeSet.call(localStorage, BASE(uid), JSON.stringify(remote));
        if (!same(merged, snap())) { apply(merged); if (!same(merged, remote)) await push(); refresh(); return; }
        if (!same(merged, remote)) { await push(); return; }
        status(s.metadata.fromCache ? "أوفلاين، ده آخر نسخة محفوظة." : "محفوظ على حسابك.");
      }, (e) => status("مش متحفظ: " + (e.code || e.message)));
    });
  }
  authEl.addEventListener("click", async (e) => {
    const a = e.target.dataset && e.target.dataset.a; if (!a) return;
    if (a === "rm") { removeCopies(); return; }
    await start(); const m = await load();
    if (a === "in") { try { await m.auth.signInWithPopup(m.au, new m.auth.GoogleAuthProvider()); } catch (err) { status("فشل تسجيل الدخول: " + (err.code || err.message)); } }
    else await m.auth.signOut(m.au);
  });
  paint(null); status("متحفظ على الجهاز ده بس. سجّل دخول عشان يتحفظ على حسابك.");
  if (localStorage.getItem(FLAG)) start();
  return { push };
}

