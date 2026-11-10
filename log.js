// ---------- ワープの きろく（v2.0）：どこに なんかい ワープしたか、日ごと ----------
// 本人「どのサイトに　何回ワープしたとかも　記録したい　今週のデータとか　今日のデータとかね」。
// URL ごと・日ごとに かぞえる。リンクを けしても、きろくは のこる（なまえと グループは さいごに みた もの）。
// このスマホの なか だけ。どこにも おくらない
const warpLog = (() => {
  const empty = () => ({ v: 1, days: {}, names: {}, groups: {} });
  let data = { ...empty(), ...store.get(KEY.log, null) };
  const save = () => store.set(KEY.log, data);

  function record({ url, name, group }) {
    const day = ymdOf(today());
    const d = (data.days[day] ??= {});
    d[url] = (d[url] ?? 0) + 1;
    data.names[url] = name;
    data.groups[url] = group;
    save();
  }

  // しゅうは げつようから（日本の カレンダーの ならび）
  function weekStart(d) {
    const s = new Date(d);
    s.setDate(s.getDate() - ((s.getDay() + 6) % 7));
    return s;
  }
  function rangeDays(range) {
    const now = today();
    const days = Object.keys(data.days);
    if (range === "all") return days;
    if (range === "today") return days.filter((k) => k === ymdOf(now));
    if (range === "month") return days.filter((k) => k.slice(0, 7) === ymdOf(now).slice(0, 7));
    // week
    const from = ymdOf(weekStart(now));
    const to = ymdOf(now);
    return days.filter((k) => k >= from && k <= to);
  }

  // range：today | week | month | all
  function query(range) {
    const counts = {};
    for (const day of rangeDays(range)) for (const [url, n] of Object.entries(data.days[day])) counts[url] = (counts[url] ?? 0) + n;
    const rank = Object.entries(counts)
      .map(([url, n]) => ({ url, n, name: data.names[url] ?? url, group: data.groups[url] ?? "" }))
      .sort((a, b) => b.n - a.n || a.name.localeCompare(b.name, "ja"));
    const total = rank.reduce((s, r) => s + r.n, 0);
    const result = { range, total, rank };
    if (range === "week") {
      const start = weekStart(today());
      result.week = ["月", "火", "水", "木", "金", "土", "日"].map((label, i) => {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        const day = ymdOf(d);
        const n = Object.values(data.days[day] ?? {}).reduce((s, x) => s + x, 0);
        return { label, day, n, today: day === ymdOf(today()) };
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
