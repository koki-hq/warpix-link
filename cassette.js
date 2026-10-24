// ---------- カセット えらび（v1.28）：6 この リンクを、たなの 公式リンクから えらんで いれかえる ----------
// リンクは いつも 6 こ。たなは こちらで よういした 公式の トップページと、じぶんで つくった リンク（v1.61）。
// script.js より さきに よみこんで、ページを かく まえに えらんだ リンクへ さしかえる。
// アイコンは 12×12 の オリジナルの ドット絵（"#" が ぬり）。公式ロゴは つかわない。
const CASSETTES = (() => {
  const SHELVES = [
    { id: "default", name: "いつもの" },
    // じぶんの リンク（v1.61）は いつもの の すぐ した（いちばん したでは みつからない）
    { id: "mine", name: "じぶんの リンク" },
    { id: "sns", name: "SNS・あつまる" },
    { id: "music", name: "おんがく" },
    { id: "play", name: "みる・あそぶ" },
    { id: "video", name: "どうが・サブスク" },
    { id: "manga", name: "マンガ" },
    { id: "make", name: "つくる・とどける" },
    { id: "shop", name: "おかいもの" },
    { id: "life", name: "せいかつ" },
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
    { id: "duolingo", label: "DUOLINGO", url: "https://www.duolingo.com/", shelf: "study",
      hi: "DUOLINGOは ことばの れんしゅう。\nまいにち つづけるのが コツ。", back: "ただいま！ ぼくも ひとこと\nおぼえたよ。HELLO！",
      icon: [".#........#.", ".##########.", "############", "##..####..##", "#.##.##.##.#", "#.##.##.##.#", "##..#..#..##", "#####..#####", ".##########.", ".##########.", "..########..", "..#..##..#.."] },
    { id: "quizlet", label: "QUIZLET", url: "https://quizlet.com/", shelf: "study",
      hi: "QUIZLETは たんごカードの せかい。\nめくって おぼえよう。", back: "ただいま！ たんごカード、\nぼくは 3まい おぼえた。",
      icon: ["............", "....########", "....#......#", "..########.#", "..#......#.#", "########.#.#", "#......#.###", "#.####.#.#..", "#......###..", "#.###..#....", "#......#....", "########...."] },
    { id: "wikipedia", label: "WIKIPEDIA", url: "https://ja.wikipedia.org/", shelf: "study",
      hi: "WIKIPEDIAは なんでも じてん。\nしらべものなら ここ。", back: "ただいま！ しらべものを してたら\nリンクを たどって とおくまで いった。",
      icon: ["............", "#....##....#", "#....##....#", "#....##....#", "#...#..#...#", "#...#..#...#", ".#..#..#..#.", ".#.#....#.#.", ".#.#....#.#.", "..#......#..", "..#......#..", "............"] },
    // ---- v1.62 で たした もの（だい 6 かい 会議「いれる ような ものなら デフォで はいってた ほうが 便利」）----
    { id: "line", label: "LINE", url: "https://line.me/R/nv/chat", shelf: "sns",
      hi: "LINEは トークの せかい。\nだれから とどいてるかな？", back: "ただいま！ へんじ、\nちゃんと できた？",
      icon: ["............", ".##########.", "#..........#", "#.#...###..#", "#.#....#...#", "#.#....#...#", "#.###..#...#", "#..........#", ".#######.##.", "........##..", ".......##...", "............"] },
    { id: "netflix", label: "NETFLIX", url: "https://www.netflix.com/", shelf: "video",
      hi: "NETFLIXは よるの えいがかん。\nなにを みる？", back: "ただいま！ つづき、\nきに なっちゃうね。",
      icon: ["............", ".##......##.", ".###.....##.", ".####....##.", ".##.##...##.", ".##..##..##.", ".##...##.##.", ".##....####.", ".##.....###.", ".##......##.", "............", "............"] },
    { id: "primevideo", label: "PRIME VIDEO", url: "https://www.amazon.co.jp/gp/video/storefront", shelf: "video",
      hi: "PRIME VIDEOは えいがの たなが\nずーっと つづく せかい。", back: "ただいま！ ポップコーン、\nたりた？",
      icon: ["............", ".##########.", "#..........#", "#...##.....#", "#...####...#", "#...######.#", "#...####...#", "#...##.....#", "#..........#", ".##########.", "..##....##..", "...######..."] },
    { id: "disneyplus", label: "DISNEY+", url: "https://www.disneyplus.com/ja-jp", shelf: "video",
      hi: "DISNEY+は まほうの おしろの せかい。", back: "ただいま！ まほう、\nかかった きがする。",
      icon: ["............", "..#..#..#...", "..#..#..#...", ".###.#.###..", ".#########..", ".##.###.##..", ".#########..", ".####.####..", ".###...###..", ".###...###..", "##########.#", "..........##"] },
    { id: "unext", label: "U-NEXT", url: "https://video.unext.jp/", shelf: "video",
      hi: "U-NEXTは みたい ものが\nなんでも ある せかい。", back: "ただいま！ いっきみ、\nしちゃった？",
      icon: ["............", ".##....##...", ".##....##...", ".##....##...", ".##....##...", ".##....##.#.", ".##....##.##", ".##....##.#.", ".##....##...", "..######....", "............", "............"] },
    { id: "abema", label: "ABEMA", url: "https://abema.tv/", shelf: "video",
      hi: "ABEMAは いつでも なにか\nやってる テレビの せかい。", back: "ただいま！ あの ばんぐみ、\nおもしろかった？",
      icon: ["...#....#...", "....#..#....", ".....##.....", ".##########.", "#..........#", "#.##.##.##.#", "#..........#", "#.##.##.##.#", "#..........#", ".##########.", "...#....#...", "............"] },
    { id: "tver", label: "TVER", url: "https://tver.jp/", shelf: "video",
      hi: "TVERは みのがした テレビに\nおいつける せかい。", back: "ただいま！ みのがした ぶん、\nとりもどせた？",
      icon: ["............", ".##########.", "#..........#", "#....#.....#", "#....##....#", "#....###...#", "#....##....#", "#....#.....#", "#..........#", ".##########.", ".....##.....", "...######..."] },
    { id: "hulu", label: "HULU", url: "https://www.hulu.jp/", shelf: "video",
      hi: "HULUは ドラマが ならぶ せかい。\nつづきから みる？", back: "ただいま！ つぎの はなしも\nきに なるね。",
      icon: ["............", ".##.........", ".##.........", ".##.........", ".##.#####...", ".####...##..", ".###.....##.", ".##......##.", ".##......##.", ".##......##.", "............", "............"] },
    { id: "mercari", label: "メルカリ", url: "https://jp.mercari.com/", shelf: "shop",
      hi: "メルカリは だれかの たからものが\nならぶ せかい。", back: "ただいま！ いい もの、\nみつかった？",
      icon: ["............", "......####..", ".....#...##.", "....#....##.", "...#.....#..", "..#.##...#..", ".#..##..#...", "#......#....", ".#....#.....", "..#..#......", "...##.......", "............"] },
    { id: "amazon", label: "AMAZON", url: "https://www.amazon.co.jp/", shelf: "shop",
      hi: "AMAZONは なんでも とどく せかい。\nポチっと する？", back: "ただいま！ はこが とどくの、\nたのしみだね。",
      icon: ["............", "............", ".##########.", "#....##....#", "############", "#....##....#", "#....##....#", "#....##....#", "#....##....#", "############", "............", "............"] },
    { id: "rakuten", label: "楽天市場", url: "https://www.rakuten.co.jp/", shelf: "shop",
      hi: "楽天市場は おみせが いっぱいの\nにぎやかな せかい。", back: "ただいま！ ポイント、\nたまった？",
      icon: ["............", "...######...", "..##....##..", ".##.####.##.", ".##.#..#.##.", ".##.####.##.", ".##.#.#..##.", ".##.#..#.##.", "..##....##..", "...######...", "............", "............"] },
    { id: "googlemaps", label: "GOOGLE MAPS", url: "https://www.google.com/maps", shelf: "life",
      hi: "GOOGLE MAPSは まちの ちずの せかい。\nどこへ いく？", back: "ただいま！ みちに まよわなかった？",
      icon: ["............", "#...#...#...", "##.###.###..", "#.##.###.##.", "#..#..#...##", "#..#..#...##", "#..#..#...##", "#..#..#...##", "##.###.###.#", "..#...#...##", "............", "............"] },
    { id: "transit", label: "乗換案内", url: "https://transit.yahoo.co.jp/", shelf: "life",
      hi: "乗換案内は でんしゃの じかんが\nわかる せかい。", back: "ただいま！ でんしゃ、\nまにあいそう？",
      icon: ["............", "..########..", ".##########.", ".#...##...#.", ".#...##...#.", ".##########.", ".##########.", ".#.######.#.", ".##########.", "..#......#..", ".#........#.", "############"] },
    { id: "yahoonews", label: "YAHOO!ニュース", url: "https://news.yahoo.co.jp/", shelf: "life",
      hi: "YAHOO!ニュースは きょうの できごとが\nあつまる せかい。", back: "ただいま！ なにか\nかわった こと あった？",
      icon: ["............", "##########..", "#........#..", "#.######.###", "#........#.#", "#.###.##.#.#", "#.###....#.#", "#.###.##.#.#", "#........#.#", "##########.#", ".##########.", "............"] },
    { id: "gmail", label: "GMAIL", url: "https://mail.google.com/", shelf: "life",
      hi: "GMAILは てがみが とどく せかい。\nだれから かな？", back: "ただいま！ だいじな メール、\nなかった？",
      icon: ["............", "............", "############", "##........##", "#.#......#.#", "#..#....#..#", "#...#..#...#", "#....##....#", "#..........#", "############", "............", "............"] },
    { id: "gcalendar", label: "カレンダー", url: "https://calendar.google.com/", shelf: "life",
      hi: "カレンダーは よていの せかい。\nきょうは なにが ある？", back: "ただいま！ よてい、\nわすれて なかった？",
      icon: ["..#.....#...", "############", "#..........#", "############", "#.#.#.#.#.##", "#..........#", "#.#.#.#.#.##", "#..........#", "#.#.###.#.##", "#.....#....#", "############", "............"] },
    { id: "cookpad", label: "クックパッド", url: "https://cookpad.com/jp", shelf: "life",
      hi: "クックパッドは ごはんの レシピの せかい。\nなに つくる？", back: "ただいま！ おいしそうな におい、\nしてきた きがする。",
      icon: ["....####....", "...#....#...", "..#.#..#.#..", "..#......#..", "...######...", "............", "############", ".#........#.", ".#........#.", ".#........#.", "..########..", "............"] },
    { id: "jumpplus", label: "ジャンプ＋", url: "https://shonenjumpplus.com/", shelf: "manga",
      hi: "ジャンプ＋は まんがの せかい。\nきょうの こうしん、もう よんだ？", back: "ただいま！ つづき、\nらいしゅうまで まてる？",
      icon: ["..#......#..", "...#....#...", "#..#.##.#..#", ".#.######.#.", "..###..###..", "###..##..###", "..###..###..", ".#.######.#.", "#..#.##.#..#", "...#....#...", "..#......#..", "............"] },
    { id: "piccoma", label: "ピッコマ", url: "https://piccoma.com/web/", shelf: "manga",
      hi: "ピッコマは まいにち すこしずつ\nよめる まんがの せかい。", back: "ただいま！ きょうの 1わ、\nよめた？",
      icon: ["............", ".#####.####.", ".#...#.#..#.", ".#...#.#..#.", ".#####.####.", "............", ".####.#####.", ".#..#.#...#.", ".#..#.#...#.", ".####.#####.", "............", "............"] },
    { id: "linemanga", label: "LINEマンガ", url: "https://manga.line.me/", shelf: "manga",
      hi: "LINEマンガは ページを めくる\nまんがの せかい。", back: "ただいま！ いい ところで\nおわっちゃった？",
      icon: ["............", ".####..####.", "#....##....#", "#.##.##.##.#", "#.#..##..#.#", "#.##.##.##.#", "#....##....#", "#.##.##.##.#", "#....##....#", ".####..####.", "............", "............"] },
    { id: "magapoke", label: "マガポケ", url: "https://pocket.shonenmagazine.com/", shelf: "manga",
      hi: "マガポケは ポケットに まんがが\nはいってる せかい。", back: "ただいま！ ポケットの まんが、\nおもしろかった？",
      icon: ["............", "..########..", "..#......#..", "..#.####.#..", "..#......#..", "############", "#..........#", "#..######..#", "#..........#", ".#........#.", "..########..", "............"] },
  ];
  // ワープあなの いろ（v1.30）：たなごと。hole の c は あなの そとがわ、p は うちがわ。ひみつの ワープゾーン（key）は "secret"
  // ピクセが もって かえる「ワープの おみやげ」は v1.52.1 で やめた（行き先が しゅやくに なる、本人）
  const GIFTS = {
    default: { hole: { c: "var(--accent-2)", p: "var(--accent)" } },
    sns: { hole: { c: "var(--accent)", p: "var(--fg)" } },
    music: { hole: { c: "var(--gold)", p: "var(--accent)" } },
    play: { hole: { c: "var(--accent-2)", p: "var(--gold)" } },
    make: { hole: { c: "var(--pumpkin)", p: "var(--gold)" } },
    study: { hole: { c: "var(--accent-2)", p: "var(--fg)" } },
    mine: { hole: { c: "var(--gold)", p: "var(--accent-2)" } },
    video: { hole: { c: "var(--accent)", p: "var(--accent-2)" } },
    manga: { hole: { c: "var(--fg)", p: "var(--accent)" } },
    shop: { hole: { c: "var(--gold)", p: "var(--pumpkin)" } },
    life: { hole: { c: "var(--accent-2)", p: "var(--gold)" } },
    secret: { hole: { c: "var(--gold)", p: "var(--gold)" } },
  };


  // ---------- じぶんの リンク（v1.61）：すきな https の アドレスを 18 こまで（パーティ 3 つ × 6 こ を ぜんぶ じぶんの リンクに できる） ----------
  // ユーザー登録 なし、この ブラウザの なか だけ（ふっかつの じゅもんで もちはこべる）。おすそわけ なし。
  // アイコンは よういした ドット絵から えらぶ（あいての サイトから とって こない。とると あいてに「だれかが ひらいた」と つたわる）
  const MINE_KEY = "warpix-mylinks";
  const MINE_MAX = 18;
  const MINE_ICONS = {
    home: { name: "おうち", rows: ["............", ".....##.....", "....####....", "...######...", "..########..", ".##########.", "..########..", "..##.##.##..", "..##.##.##..", "..##....##..", "..########..", "............"] },
    star: { name: "ほし", rows: ["............", ".....##.....", ".....##.....", "....####....", "############", ".##########.", "..########..", "..###..###..", ".###....###.", ".##......##.", "............", "............"] },
    heart: { name: "ハート", rows: ["............", "..##....##..", ".####..####.", "############", "############", "############", ".##########.", "..########..", "...######...", "....####....", ".....##.....", "............"] },
    book: { name: "ほん", rows: ["............", ".####..####.", "#....##....#", "#.##.##.##.#", "#....##....#", "#.##.##.##.#", "#....##....#", "#.##.##.##.#", "#....##....#", ".####..####.", "............", "............"] },
    music: { name: "おんがく", rows: ["............", "....#######.", "....#######.", "....#.....#.", "....#.....#.", "....#.....#.", "....#.....#.", "..###...###.", ".####..####.", ".####..####.", "..##....##..", "............"] },
    game: { name: "ゲーム", rows: ["............", "............", "..########..", ".##########.", "##.#####.###", "#...###.#.##", "##.#####.###", "############", "###......###", ".##......##.", "............", "............"] },
    cart: { name: "おかいもの", rows: ["............", "##..........", ".#.########.", ".#.#......#.", ".#.#......#.", ".#..######..", ".#..........", ".##########.", "............", "...##...##..", "...##...##..", "............"] },
    camera: { name: "カメラ", rows: ["............", "....####....", ".##########.", "#..........#", "#...####...#", "#..#....#..#", "#..#....#..#", "#...####...#", "#..........#", ".##########.", "............", "............"] },
    chat: { name: "おしゃべり", rows: ["............", ".##########.", "#..........#", "#..##..##..#", "#..........#", "#..........#", ".######.###.", "......#.#...", ".......##...", "............", "............", "............"] },
    pin: { name: "ばしょ", rows: ["............", "....####....", "...######...", "..###..###..", "..##....##..", "..###..###..", "...######...", "....####....", ".....##.....", ".....##.....", "............", "............"] },
    film: { name: "えいが", rows: ["............", "############", "#.#.#.#.#.##", "############", "#....#.....#", "#....##....#", "#....###...#", "#....##....#", "############", "#.#.#.#.#.##", "############", "............"] },
    globe: { name: "せかい", rows: ["............", "....####....", "..##.##.##..", ".#...##...#.", ".##########.", "#....##....#", "#....##....#", ".##########.", ".#...##...#.", "..##.##.##..", "....####....", "............"] },
  };
  // ピクセの ひとこと（なまえは いれない きょうつうの もの、なんパターンか）
  const MINE_HI = ["ここは きみが えらんだ せかい。\nいってらっしゃい！", "きみの とっておきの せかいだね。", "この せかいの こと、\nこんど おしえてね。", "きみの せかいへ\nワープの じゅんび OK！"];
  const MINE_BACK = ["ただいま！ きみの せかい、\nたのしかった？", "おかえり！\nいい ところ だったね。", "ただいま！ ワープ、\nたのしかったね。", "おかえり！ また いこうね。"];
  const pickOne = (a) => a[Math.floor(Math.random() * a.length)];
  // https の アドレス だけ（javascript: などは いれない）
  function cleanUrl(text) {
    try {
      const u = new URL(String(text ?? "").trim());
      return u.protocol === "https:" && u.hostname.includes(".") && u.href.length <= 500 ? u.href : null;
    } catch {
      return null;
    }
  }
  const asCassette = (m) => ({
    id: m.id,
    label: m.label,
    url: m.url,
    iconKey: m.icon,
    icon: (MINE_ICONS[m.icon] ?? MINE_ICONS.star).rows,
    shelf: "mine",
    mine: true,
    get hi() {
      return pickOne(MINE_HI);
    },
    get back() {
      return pickOne(MINE_BACK);
    },
  });
  let mine = [];
  try {
    const saved = JSON.parse(localStorage.getItem(MINE_KEY) ?? "[]");
    if (Array.isArray(saved))
      mine = saved
        .filter((m) => m && /^my-\d+$/.test(m.id) && cleanUrl(m.url) && typeof m.label === "string")
        .slice(0, MINE_MAX)
        .map((m) => asCassette({ id: m.id, label: m.label.slice(0, 10), url: cleanUrl(m.url), icon: MINE_ICONS[m.icon] ? m.icon : "star" }));
  } catch {}
  const saveMine = () => {
    try {
      if (mine.length) localStorage.setItem(MINE_KEY, JSON.stringify(mine.map((c) => ({ id: c.id, label: c.label, url: c.url, icon: c.iconKey }))));
      else localStorage.removeItem(MINE_KEY);
    } catch {}
  };

  const DEFAULT = LIST.filter((c) => c.shelf === "default").map((c) => c.id);
  const KEY = "warpix-cassette";
  const byId = (id) => LIST.find((c) => c.id === id) ?? mine.find((c) => c.id === id);

  // 6 こ、ぜんぶ しっている カセットで、おなじ ものが ない ときだけ つかう
  const valid = (ids) => Array.isArray(ids) && ids.length === 6 && new Set(ids).size === 6 && ids.every(byId);
  // たなから なくした カセット（v1.58 スタディサプリ）は、いつもの 6 この まだ ない ものに おきかえる
  const REMOVED = new Set(["studysapuri"]);
  const mend = (ids) => {
    if (!Array.isArray(ids) || !ids.some((id) => REMOVED.has(id))) return ids;
    const out = ids.filter((id) => !REMOVED.has(id));
    const spare = [...DEFAULT, ...LIST.map((c) => c.id)].filter((d) => !out.includes(d));
    return ids.map((id) => (REMOVED.has(id) ? spare.shift() : id));
  };
  function load() {
    try {
      const ids = mend(JSON.parse(localStorage.getItem(KEY)));
      if (valid(ids)) return ids;
    } catch {}
    return [...DEFAULT];
  }

  // ---------- パーティ（v1.56）：6 この くみあわせを 3 つまで。じぶんで きりかえる（じかんで かわったり しない） ----------
  // 1 つめは いままでの warpix-cassette。2 つめ いこうと なまえ・いま つかって いる ばんごうは warpix-parties に。
  // なまえは さいしょ なし（PARTY 1・2・3 と でる）。「あさ・よる」の ような なまえを かってに つけない（「へんな プレッシャーに なる」）
  const PARTIES = "warpix-parties";
  const MAX = 3;
  const party = (() => {
    const first = { name: "", ids: load() };
    try {
      const p = JSON.parse(localStorage.getItem(PARTIES));
      const more = (p?.more ?? []).map((x) => ({ ...x, ids: mend(x?.ids) })).filter((x) => valid(x?.ids)).slice(0, MAX - 1).map((x) => ({ name: String(x.name ?? "").slice(0, 10), ids: x.ids }));
      const list = [{ ...first, name: String(p?.name ?? "").slice(0, 10) }, ...more];
      const at = Number.isInteger(p?.at) && p.at >= 0 && p.at < list.length ? p.at : 0;
      return { list, at };
    } catch {
      return { list: [first], at: 0 };
    }
  })();
  let current = party.list[party.at].ids;

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
    // その リンクの たな（あなの いろを きめる）
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
      current.splice(0, 6, ...DEFAULT);
      this.save();
    },
    // ---------- パーティ ----------
    MAX,
    parties: () => party.list.map((p, i) => ({ name: p.name, label: p.name || `PARTY ${i + 1}`, ids: [...p.ids] })),
    at: () => party.at,
    valid,
    // i ばんめの パーティに きりかえる
    switchTo(i) {
      if (i < 0 || i >= party.list.length || i === party.at) return false;
      party.at = i;
      current = party.list[i].ids;
      this.save();
      return true;
    },
    // 6 こ ぜんぶ えらんで、はじめて できる（からっぽの パーティは つくらない）
    addParty(ids) {
      if (party.list.length >= MAX || !valid(ids)) return false;
      party.list.push({ name: "", ids: [...ids] });
      this.switchTo(party.list.length - 1);
      return true;
    },
    rename(i, name) {
      if (!party.list[i]) return false;
      party.list[i].name = String(name ?? "").trim().slice(0, 10);
      this.save();
      return true;
    },
    // けすと、のこりの さいしょの パーティに。1 つ しか ない ときは けせない
    removeParty(i) {
      if (party.list.length <= 1 || !party.list[i]) return false;
      party.list.splice(i, 1);
      party.at = 0;
      current = party.list[0].ids;
      this.save();
      return true;
    },
    // ---------- じぶんの リンク ----------
    MINE_MAX,
    MINE_ICONS,
    mine: () => [...mine],
    cleanUrl,
    // つくれない アドレスなら ピクセの ひとこと（v1.62）：WARPIX LINK じしん・たなと まったく おなじ・じぶんの リンク どうしの かさなり
    checkMine(url, except = null) {
      const href = cleanUrl(url);
      if (!href) return "https:// で はじまる アドレスを いれてね。";
      const norm = (u) => u.replace(/\/+$/, "").toLowerCase();
      const host = new URL(href).hostname;
      if (host === "link.warpix.app" || host === location.hostname) return "それは ぼくの いる ここだよ。";
      const same = LIST.find((c) => norm(c.url) === norm(href));
      if (same) return `${same.label} は もう たなに あるよ。`;
      if (mine.some((c) => c.id !== except && norm(c.url) === norm(href))) return "おなじ リンクが もう あるよ。";
      return null;
    },
    // つくる：なまえ（10 もじ）・https の アドレス・アイコン。できたら その カセットを かえす
    addMine({ label, url, icon }) {
      if (this.checkMine(url)) return null;
      const href = cleanUrl(url);
      const name = String(label ?? "").trim().slice(0, 10);
      if (mine.length >= MINE_MAX || !href || !name) return null;
      let n = 1;
      while (mine.some((c) => c.id === `my-${n}`)) n++;
      const c = asCassette({ id: `my-${n}`, label: name, url: href, icon: MINE_ICONS[icon] ? icon : "star" });
      mine.push(c);
      saveMine();
      return c;
    },
    updateMine(id, { label, url, icon }) {
      if (this.checkMine(url, id)) return null;
      const i = mine.findIndex((c) => c.id === id);
      const href = cleanUrl(url);
      const name = String(label ?? "").trim().slice(0, 10);
      if (i < 0 || !href || !name) return null;
      mine[i] = asCassette({ id, label: name, url: href, icon: MINE_ICONS[icon] ? icon : "star" });
      saveMine();
      return mine[i];
    },
    // その リンクが はいって いる パーティの なまえ
    partiesWith: (id) => party.list.map((p, i) => (p.ids.includes(id) ? p.name || `PARTY ${i + 1}` : null)).filter(Boolean),
    // けすと、はいって いた パーティでは いつもの リンクの まだ ない ものを いつもの じゅんで 1 つ いれる
    removeMine(id) {
      const i = mine.findIndex((c) => c.id === id);
      if (i < 0) return false;
      for (const p of party.list) {
        const at = p.ids.indexOf(id);
        if (at < 0) continue;
        p.ids[at] = [...DEFAULT, ...LIST.map((c) => c.id)].find((d) => !p.ids.includes(d));
      }
      mine.splice(i, 1);
      saveMine();
      this.save();
      return true;
    },
    save() {
      try {
        const first = party.list[0];
        if (first.ids.join() === DEFAULT.join()) localStorage.removeItem(KEY);
        else localStorage.setItem(KEY, JSON.stringify(first.ids));
        if (party.list.length === 1 && !first.name) localStorage.removeItem(PARTIES);
        else localStorage.setItem(PARTIES, JSON.stringify({ at: party.at, name: first.name, more: party.list.slice(1) }));
      } catch {}
    },
    // ページの リンクを いまの カセットに そろえる（アイコンを かくのは よびだした がわ）
    apply() {
      slots().forEach((a, i) => fill(a, byId(current[i]), i));
    },
  };
})();
