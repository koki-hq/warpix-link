// ---------- ワープの きろく（v2.0）：どこに なんかい ワープしたか、日ごと ----------
// 本人「どのサイトに　何回ワープしたとかも　記録したい　今週のデータとか　今日のデータとかね」。
// リンク（たなの カセットの id）ごと・日ごとに かぞえる。グループから はずしても、きろくは のこる（なまえと グループは さいごに おした ときの もの）。
// v1 の「リンクごとの ワープした かず」（favorite.js）に 日付を つけた もの。v1 の かずは ひきつがない（本人「v2から　生まれ変わればいい」）。
// このスマホの なか だけ。どこにも おくらない
const warpLog = (() => {
  const empty = () => ({ v: 1, days: {}, names: {}, groups: {} });
  let data = { ...empty(), ...store.get(KEY.log, null) };
  const save = () => store.set(KEY.log, data);

  function record({ id, name, group }) {
    const day = ymdOf(today());
    const d = (data.days[day] ??= {});
    d[id] = (d[id] ?? 0) + 1;
    data.names[id] = name;
    data.groups[id] = group;
    save();
  }

  // しゅうは げつようから（日本の カレンダーの ならび）
  function weekStart(d) {
    const s = new Date(d);
    s.setDate(s.getDate() - ((s.getDay() + 6) % 7));
    return s;
  }
  // range：today | week | month | all。back：いくつ まえか（0 が いま。v2.1 で 前の 日・週・月へ さかのぼれる ように）
  function span(range, back = 0) {
    const now = today();
    if (range === "today") {
      const d = new Date(now);
      d.setDate(d.getDate() - back);
      return { from: ymdOf(d), to: ymdOf(d), start: d };
    }
    if (range === "week") {
      const s = weekStart(now);
      s.setDate(s.getDate() - back * 7);
      const e = new Date(s);
      e.setDate(e.getDate() + 6);
      return { from: ymdOf(s), to: ymdOf(e), start: s, end: e };
    }
    if (range === "month") {
      const s = new Date(now.getFullYear(), now.getMonth() - back, 1, 12);
      const e = new Date(s.getFullYear(), s.getMonth() + 1, 0, 12);
      return { from: ymdOf(s), to: ymdOf(e), start: s, end: e };
    }
    return { from: "0000-00-00", to: "9999-99-99" };
  }
  // いちばん ふるい きろくより まえには もどれない
  function oldest() {
    const days = Object.keys(data.days).sort();
    return days[0] ?? null;
  }
  function canGoBack(range, back) {
    const o = oldest();
    if (!o || range === "all") return false;
    return span(range, back + 1).to >= o;
  }

  function query(range, back = 0) {
    const { from, to, start } = span(range, back);
    const counts = {};
    for (const day of Object.keys(data.days)) {
      if (day < from || day > to) continue;
      for (const [id, n] of Object.entries(data.days[day])) counts[id] = (counts[id] ?? 0) + n;
    }
    const rank = Object.entries(counts)
      .map(([id, n]) => ({ id, n, name: CASSETTES.byId(id)?.label ?? data.names[id] ?? id, group: data.groups[id] ?? "" }))
      .sort((a, b) => b.n - a.n || a.name.localeCompare(b.name, "ja"));
    const total = rank.reduce((s, r) => s + r.n, 0);
    const result = { range, back, from, to, total, rank, older: canGoBack(range, back) };
    if (range === "week") {
      const now = ymdOf(today());
      result.week = ["月", "火", "水", "木", "金", "土", "日"].map((label, i) => {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        const day = ymdOf(d);
        const n = Object.values(data.days[day] ?? {}).reduce((s, x) => s + x, 0);
        return { label, day, n, today: day === now };
      });
    }
    return result;
  }

  function clear() {
    data = empty();
    save();
  }
  function reload() {
    data = { ...empty(), ...store.get(KEY.log, null) };
  }

  return { record, query, clear, reload, data: () => data };
})();
