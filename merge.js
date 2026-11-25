// Three-way merge of synced values so two devices never silently overwrite each other.
// base = last state both sides agreed on, local = this device now, remote = the account now.
// Arrays of records are merged record by record (by id, or by content when there is no id).
// Rule for a record present on both sides: this device's version wins only if this device changed it.
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const parse = (s) => { if (s === undefined || s === null) return undefined; try { return JSON.parse(s); } catch { return s; } };
const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
const rid = (x) => (isObj(x) && x.id !== undefined ? "id:" + x.id : "c:" + JSON.stringify(x));

export function mergeValue(base, local, remote) {
  if (eq(local, remote)) return local;
  if (Array.isArray(local ?? remote) || Array.isArray(base)) {
    const L = Array.isArray(local) ? local : [], R = Array.isArray(remote) ? remote : [], B = Array.isArray(base) ? base : [];
    const m = (a) => new Map(a.map((x) => [rid(x), x]));
    const lm = m(L), rm = m(R), bm = m(B), out = [], seen = new Set();
    for (const [k, lv] of lm) {
      seen.add(k);
      const inR = rm.has(k), inB = bm.has(k);
      if (inR) out.push(inB && !eq(lv, bm.get(k)) ? lv : rm.get(k)); // both have it: this device's version only if it edited it since base (an import never overwrites the account)
      else if (!inB) out.push(lv);                                  // new here
      /* else: removed on the other side, stays removed */
    }
    for (const [k, rv] of rm) { if (seen.has(k)) continue; if (!bm.has(k)) out.push(rv); } // new there (or removed here if in base)
    return out;
  }
  if (isObj(local) || isObj(remote)) {
    const L = local || {}, R = remote || {}, B = isObj(base) ? base : {}, out = {};
    for (const k of new Set([...Object.keys(L), ...Object.keys(R)])) {
      const v = mergeValue(B[k], L[k], R[k]);
      if (v !== undefined) out[k] = v;
    }
    return out;
  }
  // scalar: take this device's value only if it changed since base
  if (eq(local, base)) return remote;
  return local;
}
export function mergeAll(base, local, remote, keys) {
  const out = {};
  for (const k of keys) {
    const v = mergeValue(parse(base[k]), parse(local[k]), parse(remote[k]));
    if (v !== undefined) out[k] = typeof v === "string" && typeof (local[k] ?? remote[k]) === "string" && parse(local[k] ?? remote[k]) === v ? (local[k] ?? remote[k]) : JSON.stringify(v);
  }
  return out;
}

