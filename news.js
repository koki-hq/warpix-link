// ---------- 製作所だより：WARPIX製作所の おしらせを よんで、あたらしい ものが あれば ピクセが おしえる ----------
// おしらせは ホームページの news.json（config.js の WARPIX_NEWS）。よめない ときは なにも しない。
// フッターの「製作所だより」に、まだ ひらいていない あたらしい おしらせが あると NEW が つく。
const news = (() => {
  const URL_ = window.WARPIX_NEWS;
  const KEY = "warpix-news";
  const RECENT_DAYS = 14;
  const state = { told: [], opened: [], ...store.get(KEY, null) };
  const save = () => store.set(KEY, state);
  const link = document.getElementById("news-link");
  const badge = link.querySelector(".news-new");
  let recent = [];

  const daysAgo = (date) => (today() - new Date(`${date}T00:00:00`)) / 864e5;

  async function load() {
    if (!URL_) return [];
    try {
      const res = await fetch(URL_, { cache: "no-cache" });
      if (!res.ok) return [];
      const items = (await res.json()).news ?? [];
      return items
        .filter((n) => n.id && /^\d{4}-\d{2}-\d{2}$/.test(n.date ?? "") && n.title)
        .sort((a, b) => b.date.localeCompare(a.date));
    } catch {
      return [];
    }
  }

  function showBadge() {
    const fresh = recent.some((n) => !state.opened.includes(n.id));
    badge.hidden = !fresh;
    link.classList.toggle("has-new", fresh);
  }

  // ピクセが あいさつを おえて ひまな ときに、いちばん あたらしい ものを 1 つだけ
  function tell(item) {
    const timer = setInterval(() => {
      if (!document.body.classList.contains("booted") || playing() || !npc.ready() || simple.on) return;
      clearInterval(timer);
      state.told.push(item.id);
      save();
      npc.say([`WARPIX製作所から おしらせ！\n「${item.title}」`, "いちばん したの「製作所だより」から\nよめるよ。"]);
    }, 1500);
  }

  const ready = load().then((items) => {
    recent = items.filter((n) => daysAgo(n.date) < RECENT_DAYS);
    showBadge();
    const untold = recent.find((n) => !state.told.includes(n.id));
    // はじめての 日は ピクセと であう だけ。おしらせは 2 日め から（NEW の しるしは つく）
    if (untold && !firstDay()) tell(untold);
    return items;
  });

  link.addEventListener("click", () => {
    for (const n of recent) if (!state.opened.includes(n.id)) state.opened.push(n.id);
    save();
    showBadge();
    achievements.unlock("factory");
  });

  return { ready, state };
})();
