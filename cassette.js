// ---------- カセット えらび（v1.28）：6 この リンクを、たなの 公式リンクから えらんで いれかえる ----------
// リンクは いつも 6 こ。自由に URL は いれられない（こちらで よういした 公式の トップページだけ）。
// script.js より さきに よみこんで、ページを かく まえに えらんだ リンクへ さしかえる。
// アイコンは 12×12 の オリジナルの ドット絵（"#" が ぬり）。公式ロゴは つかわない。
const CASSETTES = (() => {
  const SHELVES = [
    { id: "default", name: "いつもの" },
    { id: "sns", name: "SNS・あつまる" },
    { id: "music", name: "おんがく" },
    { id: "play", name: "みる・あそぶ" },
    { id: "make", name: "つくる・とどける" },
    { id: "study", name: "べんきょう" },
  ];
  // hi：ゆびさした ときの ピクセの しょうかい。back：ワープから もどった ときの おみやげばなし
  // （いつもの 6 こは extras.js と warp.js に もとから ある）
  const LIST = [
    { id: "youtube", label: "YOUTUBE", url: "https://www.youtube.com/", shelf: "default" },
    { id: "twitter", label: "TWITTER", sub: "(X)", url: "https://x.com/", shelf: "default" },
    { id: "instagram", label: "INSTAGRAM", url: "https://www.instagram.com/", shelf: "default" },
    { id: "booth", label: "BOOTH", url: "https://booth.pm/", shelf: "default" },
    { id: "tumblr", label: "TUMBLR", url: "https://www.tumblr.com/", shelf: "default" },
    { id: "spotify", label: "SPOTIFY", url: "https://open.spotify.com/", shelf: "default" },

    { id: "tiktok", label: "TIKTOK", url: "https://www.tiktok.com/", shelf: "sns",
      hi: "TIKTOKは みじかい どうがの せかい。\nつい ずっと みちゃう。", back: "ただいま！ おどってる ひとが いっぱい。\nぼくも おどれるかな？",
      icon: ["......##....", "......###...", "......####..", "......##.##.", "......##..#.", "......##....", "......##....", "..######....", ".#######....", ".#######....", "..#####.....", "............"] },
    { id: "discord", label: "DISCORD", url: "https://discord.com/app", shelf: "sns",
      hi: "DISCORDは なかまの たまりば。\nこえで おしゃべり できるよ。", back: "ただいま！ サーバーが いっぱいで\nまいごに なりかけた。",
      icon: ["............", ".##########.", "############", "############", "###..##..###", "###..##..###", "############", "############", ".##########.", "........##..", ".........#..", "............"] },
    { id: "threads", label: "THREADS", url: "https://www.threads.com/", shelf: "sns",
      hi: "THREADSは つぶやきの いと。\nながく つながって いくんだ。", back: "ただいま！ いとが からまって\nぬけだすの たいへんだった。",
      icon: ["...######...", ".##......##.", ".#...###..#.", "#...#...#..#", "#..#....#..#", "#..#....#..#", "#..#...##..#", "#...###.###.", ".#..........", ".##.........", "...######...", "............"] },
    { id: "bluesky", label: "BLUESKY", url: "https://bsky.app/", shelf: "sns",
      hi: "BLUESKYは あおい そらの せかい。\nちょうちょが とんでる。", back: "ただいま！ あおい そら、\nぼくの ほしぞらと となりどうしだね。",
      icon: ["............", "##........##", "###......###", "####....####", "#####..#####", "############", ".##########.", "..###..###..", ".####..####.", ".###....###.", "..#......#..", "............"] },
    { id: "pinterest", label: "PINTEREST", url: "https://www.pinterest.jp/", shelf: "sns",
      hi: "PINTERESTは すきな えを\nピンで とめておく かべ。", back: "ただいま！ かべいっぱいの え、\nぼくの えも とめてほしいな。",
      icon: ["...######...", "....####....", "....####....", "....####....", "...######...", "..########..", "..########..", ".....##.....", ".....##.....", ".....##.....", "......#.....", "............"] },

    { id: "ytmusic", label: "YOUTUBE MUSIC", url: "https://music.youtube.com/", shelf: "music",
      hi: "YOUTUBE MUSICは きょくの うみ。\nなにから きく？", back: "ただいま！ おすすめの きょくが\nとまらなかった♪",
      icon: ["...######...", ".##########.", ".####.#####.", "#####..#####", "#####...####", "#####....###", "#####...####", "#####..#####", ".####.#####.", ".##########.", "...######...", "............"] },
    { id: "applemusic", label: "APPLE MUSIC", url: "https://music.apple.com/", shelf: "music",
      hi: "APPLE MUSICは きょくの たな。\nおきにいりを ならべよう。", back: "ただいま！ ジャケットが きれいで\nずっと ながめてた。",
      icon: ["............", "....########", "....########", "....#......#", "....#......#", "....#......#", "....#......#", "..###....###", ".####...####", ".####...####", "..##.....##.", "............"] },
    { id: "soundcloud", label: "SOUNDCLOUD", url: "https://soundcloud.com/", shelf: "music",
      hi: "SOUNDCLOUDは くもの うえの\nおんがくかんの せかい。", back: "ただいま！ くもの うえで\nできたての きょくを きいたよ。",
      icon: ["............", "............", "......###...", ".....#####..", "..#.#######.", ".##.########", "###.########", "###.########", "############", ".##########.", "............", "............"] },

    { id: "niconico", label: "ニコニコ動画", url: "https://www.nicovideo.jp/", shelf: "play",
      hi: "ニコニコは コメントが ながれる\nふしぎな テレビの せかい。", back: "ただいま！ コメントが ながれてきて\nぼくも まざっちゃった。",
      icon: ["..#......#..", "...#....#...", "....#..#....", ".##########.", "#..........#", "#.##....##.#", "#..........#", "#...####...#", "#..........#", ".##########.", "..#......#..", "............"] },
    { id: "twitch", label: "TWITCH", url: "https://www.twitch.tv/", shelf: "play",
      hi: "TWITCHは ゲームの なまほうそう。\nいま だれか あそんでる。", back: "ただいま！ なまほうそうで\nいっしょに はらはら してた。",
      icon: ["############", "#..........#", "#...#..#...#", "#...#..#...#", "#...#..#...#", "#..........#", "#.........##", "######..###.", "....#..#....", "....#.#.....", "....##......", "............"] },
    { id: "steam", label: "STEAM", url: "https://store.steampowered.com/", shelf: "play",
      hi: "STEAMは ゲームの おみせ。\nセールの ひは あぶないよ。", back: "ただいま！ ゲームの おみせで\nカートが いっぱいに なった……",
      icon: ["............", "............", "..########..", ".##########.", "##.#####.###", "#...###.#.##", "##.#####.###", "############", "####....####", ".##......##.", "............", "............"] },
    { id: "pixiv", label: "PIXIV", url: "https://www.pixiv.net/", shelf: "play",
      hi: "PIXIVは えの びじゅつかん。\nドットの えも あるかな。", back: "ただいま！ えの びじゅつかんで\nドットの えを さがしてきた。",
      icon: ["............", ".########...", ".##.....##..", ".##......##.", ".##......##.", ".##.....##..", ".########...", ".##.........", ".##.........", ".##.........", ".##.........", "............"] },

    { id: "note", label: "NOTE", url: "https://note.com/", shelf: "make",
      hi: "NOTEは ことばの ノート。\nだれかの はなしが よめるよ。", back: "ただいま！ いい はなしを よんで\nちょっと かしこく なった。",
      icon: [".........##.", "........####", ".......####.", "......####..", ".....####...", "....####....", "...####.....", "..####......", ".#.##.......", ".#..#.......", ".####.......", "............"] },
    { id: "suzuri", label: "SUZURI", url: "https://suzuri.jp/", shelf: "make",
      hi: "SUZURIは えを グッズに する\nこうじょうの せかい。", back: "ただいま！ ぼくの えの\nTシャツ、あったら いいな。",
      icon: ["............", "..###..###..", ".####..####.", "############", "############", "##.######.##", "...######...", "...######...", "...######...", "...######...", "...######...", "............"] },
    { id: "skeb", label: "SKEB", url: "https://skeb.jp/", shelf: "make",
      hi: "SKEBは えを おねがいする\nリクエストの せかい。", back: "ただいま！ ぼくの え、\nだれかに かいて もらいたいな。",
      icon: ["..........##", ".........###", "........###.", ".......###..", "......###...", ".....###....", "...####.....", "..#####.....", ".######.....", ".#####......", "####........", "##.........."] },
    { id: "github", label: "GITHUB", url: "https://github.com/", shelf: "make",
      hi: "GITHUBは コードの くら。\nこの ページの コードも ここ。", back: "ただいま！ コードの くらで\nぼくの ソースを みつけた！",
      icon: ["............", ".#........#.", ".##......##.", ".##########.", "############", "###..##..###", "###..##..###", "############", ".###.##.###.", "..########..", "....#..#....", "............"] },
    { id: "canva", label: "CANVA", url: "https://www.canva.com/", shelf: "make",
      hi: "CANVAは デザインの つくえ。\nポスターも かんたん。", back: "ただいま！ デザインの つくえで\nぼくの ポスターを つくりかけた。",
      icon: ["...######...", ".##########.", "#.##.##.####", "############", "#.#########.", "#####...###.", "####.....##.", "#####...###.", "############", ".##########.", "...######...", "............"] },

    { id: "studyplus", label: "STUDYPLUS", url: "https://www.studyplus.jp/", shelf: "study",
      hi: "STUDYPLUSは べんきょうの きろく。\nきょうは なんぷん がんばる？", back: "ただいま！ がんばった じかん、\nちゃんと きろく できた？",
      icon: ["............", ".........##.", ".........##.", "......##.##.", "......##.##.", "...##.##.##.", "...##.##.##.", "##.##.##.##.", "##.##.##.##.", "##.##.##.##.", "############", "............"] },
    { id: "studysapuri", label: "スタディサプリ", url: "https://studysapuri.jp/", shelf: "study",
      hi: "スタディサプリは じゅぎょうの せかい。\nいつでも せんせいに あえる。", back: "ただいま！ じゅぎょうを のぞいて\nちょっと かしこく なった きがする。",
      icon: ["............", "............", ".....##.....", "...######...", ".##########.", "############", ".##########.", "...######.#.", "...######.#.", "...######.#.", "..........#.", "............"] },
    { id: "duolingo", label: "DUOLINGO", url: "https://www.duolingo.com/", shelf: "study",
      hi: "DUOLINGOは ことばの れんしゅう。\nまいにち つづけるのが コツ。", back: "ただいま！ ぼくも ひとこと\nおぼえたよ。HELLO！",
      icon: [".#........#.", ".##########.", "############", "##..####..##", "#.##.##.##.#", "#.##.##.##.#", "##..#..#..##", "#####..#####", ".##########.", ".##########.", "..########..", "..#..##..#.."] },
    { id: "quizlet", label: "QUIZLET", url: "https://quizlet.com/", shelf: "study",
      hi: "QUIZLETは たんごカードの せかい。\nめくって おぼえよう。", back: "ただいま！ たんごカード、\nぼくは 3まい おぼえた。",
      icon: ["............", "....########", "....#......#", "..########.#", "..#......#.#", "########.#.#", "#......#.###", "#.####.#.#..", "#......###..", "#.###..#....", "#......#....", "########...."] },
    { id: "wikipedia", label: "WIKIPEDIA", url: "https://ja.wikipedia.org/", shelf: "study",
      hi: "WIKIPEDIAは なんでも じてん。\nしらべものなら ここ。", back: "ただいま！ しらべものを してたら\nリンクを たどって とおくまで いった。",
      icon: ["............", "#....##....#", "#....##....#", "#....##....#", "#...#..#...#", "#...#..#...#", ".#..#..#..#.", ".#.#....#.#.", ".#.#....#.#.", "..#......#..", "..#......#..", "............"] },
  ];
  // ワープの おみやげ（v1.30）：たなごとに、ワープあなの いろと、ピクセが もって かえる もの（8×8）
  // hole の c は あなの そとがわ、p は うちがわ。ひみつの ワープゾーン（key）は "secret"
  const GIFTS = {
    default: { name: "ほしの かけら", hole: { c: "var(--accent-2)", p: "var(--accent)" },
      rows: ["...c....", "..ccc...", ".ccwcc..", "ccwwwcc.", ".ccwcc..", "..ccc...", "...c....", "........"] },
    sns: { name: "ハートの ふきだし", hole: { c: "var(--accent)", p: "var(--fg)" },
      rows: ["wwwwwwww", "wppwppww", "wpppppww", "wwpppwww", "wwwpwwww", "wwwwwwww", ".ww.....", "w......."] },
    music: { name: "おんぷ", hole: { c: "var(--gold)", p: "var(--accent)" },
      rows: ["...yyyyy", "...y...y", "...y...y", "...y...y", ".yyy.yyy", "yyyy.yyy", "yyy..yy.", "........"] },
    play: { name: "ゲームの コイン", hole: { c: "var(--accent-2)", p: "var(--gold)" },
      rows: ["..yyyy..", ".yyyyyy.", "yyyywyyy", "yyyywyyy", "yyyywyyy", "yyyywyyy", ".yyyyyy.", "..yyyy.."] },
    make: { name: "えふで", hole: { c: "var(--pumpkin)", p: "var(--gold)" },
      rows: [".......k", "......kk", ".....kk.", "....kk..", "...pk...", "..ppp...", ".ppp....", "pp......"] },
    study: { name: "えんぴつ", hole: { c: "var(--accent-2)", p: "var(--fg)" },
      rows: ["......pp", ".....ppp", "....yyp.", "...yyy..", "..yyy...", ".wyy....", "wwy.....", "o......."] },
    secret: { name: "ひみつの かぎ", hole: { c: "var(--gold)", p: "var(--gold)" },
      rows: ["........", ".yyy....", "y...y...", "y...yyyy", "y...y.y.", ".yyy..y.", "........", "........"] },
  };
  const DEFAULT = LIST.filter((c) => c.shelf === "default").map((c) => c.id);
  const KEY = "warpix-cassette";
  const byId = (id) => LIST.find((c) => c.id === id);

  // 6 こ、ぜんぶ しっている カセットで、おなじ ものが ない ときだけ つかう
  function load() {
    try {
      const ids = JSON.parse(localStorage.getItem(KEY));
      if (Array.isArray(ids) && ids.length === 6 && new Set(ids).size === 6 && ids.every(byId)) return ids;
    } catch {}
    return [...DEFAULT];
  }
  let current = load();

  // にほんごの なまえ（ニコニコ動画 など）は ドットの ゴシックで すこし おおきく
  const jp = (c) => /[^\x00-\x7f]/.test(c.label);

  // リンクの なかみを かきかえる（▶・アイコン・なまえ・(X)・よみあげ用の「あたらしい タブ」）
  // i は 0〜5。パソコンでは みぎはしに すうじキーの ばんごう（v1.35）
  function fill(a, c, i) {
    a.href = c.url;
    a.classList.toggle("jp-label", jp(c));
    a.innerHTML = `<span class="arrow">▶</span><span class="icon" data-icon="${c.id}"></span>${c.label}${c.sub ? `<small class="link-sub">${c.sub}</small>` : ""}<span class="link-key" aria-hidden="true">${i + 1}</span><span class="sr-only">（あたらしい タブで ひらく）</span>`;
  }
  const slots = () => [...document.querySelectorAll(".links .pixel-btn:not(.secret)")];
  slots().forEach((a, i) => fill(a, byId(current[i]), i));

  return {
    SHELVES,
    LIST,
    GIFTS,
    // その リンクの たな（おみやげと あなの いろを きめる）
    shelfOf: (icon) => (icon === "key" ? "secret" : byId(icon)?.shelf ?? "default"),
    DEFAULT,
    byId,
    jp,
    current: () => [...current],
    // i ばんめの スロットに id を いれる。ほかの スロットに あれば いれかえる（いつも 6 こ、おなじ ものは ない）
    put(i, id) {
      if (!byId(id) || i < 0 || i > 5 || current[i] === id) return false;
      const j = current.indexOf(id);
      if (j >= 0) current[j] = current[i];
      current[i] = id;
      this.save();
      return true;
    },
    reset() {
      current = [...DEFAULT];
      this.save();
    },
    // おすそわけ（v1.32）：「youtube,tiktok,…」を よむ。6 こで、ぜんぶ しっていて、かぶりが ない ときだけ
    parse(text) {
      const ids = String(text ?? "").split(",").map((s) => s.trim()).filter(Boolean);
      return ids.length === 6 && new Set(ids).size === 6 && ids.every(byId) ? ids : null;
    },
    set(ids) {
      current = [...ids];
      this.save();
    },
    // いまの 6 こが はいった このページの URL
    shareUrl() {
      return `${location.origin}${location.pathname}?cassette=${current.join(",")}`;
    },
    save() {
      try {
        if (current.join() === DEFAULT.join()) localStorage.removeItem(KEY);
        else localStorage.setItem(KEY, JSON.stringify(current));
      } catch {}
    },
    // ページの リンクを いまの カセットに そろえる（アイコンを かくのは よびだした がわ）
    apply() {
      slots().forEach((a, i) => fill(a, byId(current[i]), i));
    },
  };
})();
