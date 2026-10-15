// ピクセが育つ：保存された記録を書きかえて、いろいろな「前回からの日数」を作って試す
const dayAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const pixe = (o) => JSON.stringify({ born: dayAgo(1), days: [], last: dayAgo(1), stage: 0, sulk: false, pokeMark: 0, diary: [], ...o });

async function visitWith(t, state, query = "") {
  const server = await t.startServer();
  const b = await t.launchBrowser();
  const p = await b.firstPage();
  await p.goto(server.url);
  await p.ev(`localStorage.clear(); ${state ? `localStorage.setItem("warpix-pixe", ${JSON.stringify(state)})` : ""}`);
  await p.goto(server.url + query);
  await p.ev(`document.getElementById("start-btn").click()`);
  await t.sleep(2600);
  const intro = await p.readIntro();
  return { server, p, intro, state: () => p.ev(`JSON.parse(localStorage.getItem("warpix-pixe"))`) };
}

export default {
  async "はじめて会った日から日記が始まる"(t) {
    const { server, p, state } = await visitWith(t, null);
    const s = await state();
    t.eq(s.days.length, 1, "会えた日数");
    t.eq(s.diary[0]?.text, "はじめて あった。ドキドキした。", "日記の 1 行目");
    await p.ev(`document.getElementById("diary-btn").click()`);
    await t.sleep(300);
    t.ok((await p.ev(`document.getElementById("diary-body").innerText`)).includes("ちびピクセ"), "日記の上の欄");
    t.ok(await p.ev(`achievements.has("diary")`), "実績「ピクセの にっき」がない");
    await p.shot("grow-diary.png");
    t.noErrors(p);
    await server.close();
  },

  async "10 日ぶりはすねて、3 回つつくと仲直り。7 日目でマント"(t) {
    const days = [16, 15, 14, 13, 12, 10].map(dayAgo);
    const { server, p, intro, state } = await visitWith(t, pixe({ born: dayAgo(20), days, last: dayAgo(10), stage: 1 }));
    t.ok(intro.some((l) => l.includes("10にちも まってたんだけど")), "すねない");
    t.ok(intro.includes("……べつに うれしくないし。"), "すねている日の成長のセリフ");
    t.eq((await state()).stage, 2, "マントの段階");
    for (let i = 0; i < 3; i++) { await p.ev(`document.getElementById("npc").click()`); await t.sleep(1200); }
    t.ok((await p.text()).startsWith("……しょうがないなあ"), "仲直りしない");
    t.eq((await state()).sulk, false, "すねたまま");
    t.ok(await p.ev(`achievements.has("reunion") && achievements.has("growup")`), "実績「ただいま」「おおきく なったね」");
    t.noErrors(p);
    await server.close();
  },

  async "40 日ぶりは大喜び、100 日目は記念日"(t) {
    let r = await visitWith(t, pixe({ born: dayAgo(60), days: [dayAgo(40)], last: dayAgo(40) }));
    t.ok(r.intro.some((l) => l.includes("ほんとに きみ")), "大喜びしない");
    t.noErrors(r.p);
    await r.server.close();
    await t.closeAll();
    r = await visitWith(t, pixe({ born: dayAgo(100), days: [dayAgo(1)], last: dayAgo(1) }));
    t.ok(r.intro.some((l) => l.includes("であって 100にち")), "100 日の記念日を言わない");
    t.noErrors(r.p);
    await r.server.close();
  },

  async "30 日でんせつになり、日記はできごとで埋まる（実績の行ばかりにならない）"(t) {
    const days = Array.from({ length: 29 }, (_, i) => dayAgo(i + 1));
    const { server, p } = await visitWith(t, pixe({ born: dayAgo(40), days, stage: 3 }));
    t.ok(await p.ev(`document.getElementById("npc").classList.contains("legend")`), "でんせつのかがやきがない");
    await p.ev(`emit("adventure-clear", { time: 12.3 }); emit("weather", { kind: "rain", temp: 17 }); emit("ufo-down"); emit("game-over", { score: 450, wave: 2 }); achievements.unlock("moon"); achievements.unlock("mothership")`);
    const lines = await p.ev(`grow.state.diary.filter((e) => e.date === grow.state.last).map((e) => e.text)`);
    for (const want of ["ぼうけん", "あめ", "UFO", "インベーダー", "マザーシップ"]) t.ok(lines.some((l) => l.includes(want)), `日記に「${want}」がない: ${lines.join(" / ")}`);
    t.ok(lines.filter((l) => l.startsWith("じっせき「")).length <= 1, "ふつうの実績の行が 1 日 2 行以上");
    t.noErrors(p);
    await server.close();
  },

  async "?date= で未来をのぞいても記録は変わらない"(t) {
    const before = pixe({ born: dayAgo(3), days: [dayAgo(3)], last: dayAgo(3) });
    const { server, p, state } = await visitWith(t, before, "?date=2027-02-01");
    t.eq(await state(), JSON.parse(before), "記録が書きかわった");
    t.noErrors(p);
    await server.close();
  },
};
