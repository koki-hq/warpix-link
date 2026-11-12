// ---------- たなの リンク（v1.28 カセット）と グループ（v1.56 パーティ → v2.0 グループ） ----------
// たなは こちらで よういした 公式の トップページと、じぶんで つくった リンク（v1.61）。
// v2.0：リンクは いつも 6 こ → 0〜12 こ（さいしょは から、たなから えらぶか じぶんで つくる）。グループの かずの せいげん なし。
// アイコンは 12×12 の オリジナルの ドット絵（"#" が ぬり）。公式ロゴは つかわない（X だけ 公式の マークを ドットで、v2.0 本人）。
const CASSETTES = (() => {
  const SHELVES = [
    // 「いつもの」の たなは なくした（v1.64、本人「誰のいつものだよってなる」）。さいしょの 6 こも それぞれの たなに
    // じぶんの リンク（v1.61）は いちばん うえ（いちばん したでは みつからない）
    { id: "mine", name: "自分のリンク" },
    { id: "sns", name: "SNS" },
    { id: "music", name: "音楽" },
    { id: "play", name: "見る・遊ぶ" },
    { id: "video", name: "動画・サブスク" },
    { id: "manga", name: "マンガ" },
    { id: "make", name: "作る・届ける" },
    { id: "shop", name: "買い物" },
    { id: "life", name: "生活" },
    { id: "study", name: "勉強" },
  ];
  // hi：ゆびさした ときの ピクセの しょうかい。back：ワープから もどった ときの おみやげばなし
  // （さいしょの 6 こは v1 の extras.js と warp.js に あった もの を ここへ）
  const LIST = [
    { id: "youtube", label: "YOUTUBE", url: "https://www.youtube.com/", shelf: "video",
      hi: "YOUTUBEは うごく えの せかい。\nポップコーンの よういは いい？", back: ["ただいま！ YOUTUBE の せかいは\nがめんが いっぱい ならんでた。", "ただいま！ どうがの せかいで\nおすすめに ながされそうに なった……"] },
    { id: "twitter", label: "X", url: "https://x.com/", shelf: "sns",
      hi: "Xは みんなが いっせいに\nしゃべってる せかい。", back: ["ただいま！ X の せかいは\nみんな いっせいに しゃべってた。", "ただいま！ タイムラインが はやくて\nめが まわった〜"] },
    { id: "instagram", label: "INSTAGRAM", url: "https://www.instagram.com/", shelf: "sns",
      hi: "INSTAGRAMは しゃしんの せかい。\nはい、チーズ！", back: ["ただいま！ しゃしんの せかいは\nきらきら していたよ。", "ただいま！ ぼくも しゃしん\nとって もらえば よかったな。"] },
    { id: "booth", label: "BOOTH", url: "https://booth.pm/", shelf: "shop",
      hi: "BOOTHは おみせの せかい。\nなにか かっていく？", back: ["ただいま！ おみせの せかいで\nほしい ものが いっぱい あった。", "ただいま！ ドットの グッズ、\nつい ながめちゃった。"] },
    { id: "tumblr", label: "TUMBLR", url: "https://www.tumblr.com/", shelf: "sns",
      hi: "TUMBLRは ふしぎな\nブログの せかい。", back: ["ただいま！ TUMBLR の せかいは\nふしぎな え が いっぱい。", "ただいま！ むこうは しずかで\nちょっと ねむく なった。"] },
    { id: "spotify", label: "SPOTIFY", url: "https://open.spotify.com/", shelf: "music",
      hi: "SPOTIFYは おんがくの せかい。\nこの BGMより いい きょく ある？", back: ["ただいま！ おんがくの せかいで\nずっと ゆれてた♪", "ただいま！ むこうの きょくも いいけど、\nぼくの BGM も わすれないでね。"] },

    { id: "tiktok", label: "TIKTOK", url: "https://www.tiktok.com/", app: "snssdk1233://", shelf: "sns",
      hi: "TIKTOKは みじかい どうがの せかい。\nつい ずっと みちゃう。", back: "ただいま！ おどってる ひとが いっぱい。\nぼくも ちょっと おどった。",
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
      hi: "STUDYPLUSは べんきょうの きろく。\nきょうは なんぷん がんばる？", back: "ただいま！ きろくの ノートが\nずらっと ならんでた。",
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
      hi: "LINEは トークの せかい。\nだれから とどいてるかな？", back: "ただいま！ スタンプが いっぱいで\nぼくも ほしく なった。",
      icon: ["............", ".##########.", "############", "############", "##..#..#..##", "##..#..#..##", "############", "############", ".#######.##.", "........##..", ".......##...", "............"] },
    { id: "netflix", label: "NETFLIX", url: "https://www.netflix.com/", shelf: "video",
      hi: "NETFLIXは よるの えいがかん。\nなにを みる？", back: "ただいま！ つづき、\nきに なっちゃうね。",
      icon: ["............", ".##......##.", ".###.....##.", ".####....##.", ".##.##...##.", ".##..##..##.", ".##...##.##.", ".##....####.", ".##.....###.", ".##......##.", "............", "............"] },
    { id: "primevideo", label: "PRIME VIDEO", url: "https://www.amazon.co.jp/gp/video/storefront", shelf: "video",
      hi: "PRIME VIDEOは えいがの たなが\nずーっと つづく せかい。", back: "ただいま！ えいがの たな、\nおわりが みえなかった。",
      icon: ["............", ".##########.", "#..........#", "#...##.....#", "#...####...#", "#...######.#", "#...####...#", "#...##.....#", "#..........#", ".##########.", "..##....##..", "...######..."] },
    { id: "disneyplus", label: "DISNEY+", url: "https://www.disneyplus.com/ja-jp", shelf: "video",
      hi: "DISNEY+は まほうの おしろの せかい。", back: "ただいま！ まほう、\nかかった きがする。",
      icon: ["............", "..#..#..#...", "..#..#..#...", ".###.#.###..", ".#########..", ".##.###.##..", ".#########..", ".####.####..", ".###...###..", ".###...###..", "##########.#", "..........##"] },
    { id: "unext", label: "U-NEXT", url: "https://video.unext.jp/", shelf: "video",
      hi: "U-NEXTは みたい ものが\nなんでも ある せかい。", back: "ただいま！ みたい ものが ありすぎて\nえらぶだけで つかれた。",
      icon: ["............", ".##....##...", ".##....##...", ".##....##...", ".##....##...", ".##....##.#.", ".##....##.##", ".##....##.#.", ".##....##...", "..######....", "............", "............"] },
    { id: "abema", label: "ABEMA", url: "https://abema.tv/", shelf: "video",
      hi: "ABEMAは いつでも なにか\nやってる テレビの せかい。", back: "ただいま！ むこうは ずっと\nなにか やってた。",
      icon: ["...#....#...", "....#..#....", ".....##.....", ".##########.", "#..........#", "#.##.##.##.#", "#..........#", "#.##.##.##.#", "#..........#", ".##########.", "...#....#...", "............"] },
    { id: "tver", label: "TVER", url: "https://tver.jp/", shelf: "video",
      hi: "TVERは みのがした テレビに\nおいつける せかい。", back: "ただいま！ みのがした ばんぐみが\nちゃんと まってた。",
      icon: ["............", ".##########.", "#..........#", "#....#.....#", "#....##....#", "#....###...#", "#....##....#", "#....#.....#", "#..........#", ".##########.", ".....##.....", "...######..."] },
    { id: "hulu", label: "HULU", url: "https://www.hulu.jp/", shelf: "video",
      hi: "HULUは ドラマが ならぶ せかい。\nつづきから みる？", back: "ただいま！ つぎの はなしも\nきに なるね。",
      icon: ["............", ".##.........", ".##.........", ".##.........", ".##.#####...", ".####...##..", ".###.....##.", ".##......##.", ".##......##.", ".##......##.", "............", "............"] },
    { id: "mercari", label: "メルカリ", url: "https://jp.mercari.com/", shelf: "shop",
      hi: "メルカリは だれかの たからものが\nならぶ せかい。", back: "ただいま！ だれかの たからもの、\nいっこ ほしく なった。",
      icon: ["............", "......####..", ".....#...##.", "....#....##.", "...#.....#..", "..#.##...#..", ".#..##..#...", "#......#....", ".#....#.....", "..#..#......", "...##.......", "............"] },
    { id: "amazon", label: "AMAZON", url: "https://www.amazon.co.jp/", shelf: "shop",
      hi: "AMAZONは なんでも とどく せかい。\nポチっと する？", back: "ただいま！ はこが とどくの、\nたのしみだね。",
      icon: ["............", "............", ".##########.", "#....##....#", "############", "#....##....#", "#....##....#", "#....##....#", "#....##....#", "############", "............", "............"] },
    { id: "rakuten", label: "楽天市場", url: "https://www.rakuten.co.jp/", shelf: "shop",
      hi: "楽天市場は おみせが いっぱいの\nにぎやかな せかい。", back: "ただいま！ ポイントの おとが\nずっと ちゃりんちゃりん してた。",
      icon: ["............", "...######...", "..##....##..", ".##.####.##.", ".##.#..#.##.", ".##.####.##.", ".##.#.#..##.", ".##.#..#.##.", "..##....##..", "...######...", "............", "............"] },
    { id: "googlemaps", label: "GOOGLE MAPS", url: "https://www.google.com/maps", shelf: "life",
      hi: "GOOGLE MAPSは まちの ちずの せかい。\nどこへ いく？", back: "ただいま！ ちずの うえを とんで\nぼくの ほしぞらも さがしてみた。",
      icon: ["............", "#...#...#...", "##.###.###..", "#.##.###.##.", "#..#..#...##", "#..#..#...##", "#..#..#...##", "#..#..#...##", "##.###.###.#", "..#...#...##", "............", "............"] },
    { id: "transit", label: "乗換案内", url: "https://transit.yahoo.co.jp/", shelf: "life",
      hi: "乗換案内は でんしゃの じかんが\nわかる せかい。", back: "ただいま！ でんしゃの せんが\nあやとり みたいだった。",
      icon: ["............", "..########..", ".##########.", ".#...##...#.", ".#...##...#.", ".##########.", ".##########.", ".#.######.#.", ".##########.", "..#......#..", ".#........#.", "############"] },
    { id: "yahoonews", label: "YAHOO!ニュース", url: "https://news.yahoo.co.jp/", shelf: "life",
      hi: "YAHOO!ニュースは きょうの できごとが\nあつまる せかい。", back: "ただいま！ きょうの できごとが\nいっぱい ならんでた。",
      icon: ["............", "##########..", "#........#..", "#.######.###", "#........#.#", "#.###.##.#.#", "#.###....#.#", "#.###.##.#.#", "#........#.#", "##########.#", ".##########.", "............"] },
    { id: "gmail", label: "GMAIL", url: "https://mail.google.com/", app: "googlegmail://", shelf: "life",
      hi: "GMAILは てがみが とどく せかい。\nだれから かな？", back: "ただいま！ てがみの せかいで\nぼくあての ものを さがしちゃった。",
      icon: ["............", "............", "############", "##........##", "#.#......#.#", "#..#....#..#", "#...#..#...#", "#....##....#", "#..........#", "############", "............", "............"] },
    { id: "gcalendar", label: "カレンダー", url: "https://calendar.google.com/", shelf: "life",
      hi: "カレンダーは よていの せかい。\nきょうは なにが ある？", back: "ただいま！ よていの マス、\nきれいに ならんでた。",
      icon: ["..#.....#...", "############", "#..........#", "############", "#.#.#.#.#.##", "#..........#", "#.#.#.#.#.##", "#..........#", "#.#.###.#.##", "#.....#....#", "############", "............"] },
    { id: "timetree", label: "TIMETREE", url: "https://timetreeapp.com/discoveries", shelf: "life",
      hi: "TIMETREEは みんなの よていが\nならぶ きの せかい。", back: "ただいま！ よていの きに\nちいさな はっぱが いっぱい。",
      icon: ["............", ".....##.....", "....####....", "...######...", "..########..", "....####....", "...######...", "..########..", ".##########.", ".....##.....", ".....##.....", "............"] },
    { id: "cookpad", label: "クックパッド", url: "https://cookpad.com/jp", shelf: "life",
      hi: "クックパッドは ごはんの レシピの せかい。\nなに つくる？", back: "ただいま！ おいしそうな におい、\nしてきた きがする。",
      icon: ["....####....", "...#....#...", "..#.#..#.#..", "..#......#..", "...######...", "............", "############", ".#........#.", ".#........#.", ".#........#.", "..########..", "............"] },
    { id: "jumpplus", label: "ジャンプ＋", url: "https://shonenjumpplus.com/", shelf: "manga",
      hi: "ジャンプ＋は まんがの せかい。\nきょうの こうしん、もう よんだ？", back: "ただいま！ つづきが きになって\nそわそわ してる。",
      icon: ["..#......#..", "...#....#...", "#..#.##.#..#", ".#.######.#.", "..###..###..", "###..##..###", "..###..###..", ".#.######.#.", "#..#.##.#..#", "...#....#...", "..#......#..", "............"] },
    { id: "piccoma", label: "ピッコマ", url: "https://piccoma.com/web/", shelf: "manga",
      hi: "ピッコマは まいにち すこしずつ\nよめる まんがの せかい。", back: "ただいま！ きょうの 1わ、\nぼくも のぞいてきた。",
      icon: ["............", ".#####.####.", ".#...#.#..#.", ".#...#.#..#.", ".#####.####.", "............", ".####.#####.", ".#..#.#...#.", ".#..#.#...#.", ".####.#####.", "............", "............"] },
    { id: "linemanga", label: "LINEマンガ", url: "https://manga.line.me/", shelf: "manga",
      hi: "LINEマンガは ページを めくる\nまんがの せかい。", back: "ただいま！ いい ところで\nおわっちゃった……",
      icon: ["............", ".####..####.", "#....##....#", "#.##.##.##.#", "#.#..##..#.#", "#.##.##.##.#", "#....##....#", "#.##.##.##.#", "#....##....#", ".####..####.", "............", "............"] },
    { id: "magapoke", label: "マガポケ", url: "https://pocket.shonenmagazine.com/", shelf: "manga",
      hi: "マガポケは ポケットに まんがが\nはいってる せかい。", back: "ただいま！ ポケットの まんが、\nぼくの ポケットにも ほしい。",
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


  // ---------- じぶんの リンク（v1.61）：すきな https の アドレスを 18 こまで ----------
  // ユーザー登録 なし、この ブラウザの なか だけ（ふっかつの じゅもんで もちはこべる）。おすそわけ なし。
  // アイコンは よういした ドット絵から えらぶ（あいての サイトから とって こない。とると あいてに「だれかが ひらいた」と つたわる）
  const MINE_KEY = KEY.mylinks; // v2.0 から あたらしい キー（v1 の warpix-mylinks は よまない）
  const MINE_MAX = 18;
  // なまえは 16 もじまで（v2.1。10 もじでは みじかい と 本人）。ながい なまえは 画面で もじを ちいさく する
  const MINE_LABEL = 16;
  const MINE_ICONS = {
    home: { name: "家", rows: ["............", ".....##.....", "....####....", "...######...", "..########..", ".##########.", "..########..", "..##.##.##..", "..##.##.##..", "..##....##..", "..########..", "............"] },
    star: { name: "星", rows: ["............", ".....##.....", ".....##.....", "....####....", "############", ".##########.", "..########..", "..###..###..", ".###....###.", ".##......##.", "............", "............"] },
    heart: { name: "ハート", rows: ["............", "..##....##..", ".####..####.", "############", "############", "############", ".##########.", "..########..", "...######...", "....####....", ".....##.....", "............"] },
    book: { name: "本", rows: ["............", ".####..####.", "#....##....#", "#.##.##.##.#", "#....##....#", "#.##.##.##.#", "#....##....#", "#.##.##.##.#", "#....##....#", ".####..####.", "............", "............"] },
    music: { name: "音楽", rows: ["............", "....#######.", "....#######.", "....#.....#.", "....#.....#.", "....#.....#.", "....#.....#.", "..###...###.", ".####..####.", ".####..####.", "..##....##..", "............"] },
    game: { name: "ゲーム", rows: ["............", "............", "..########..", ".##########.", "##.#####.###", "#...###.#.##", "##.#####.###", "############", "###......###", ".##......##.", "............", "............"] },
    cart: { name: "買い物", rows: ["............", "##..........", ".#.########.", ".#.#......#.", ".#.#......#.", ".#..######..", ".#..........", ".##########.", "............", "...##...##..", "...##...##..", "............"] },
    camera: { name: "カメラ", rows: ["............", "....####....", ".##########.", "#..........#", "#...####...#", "#..#....#..#", "#..#....#..#", "#...####...#", "#..........#", ".##########.", "............", "............"] },
    chat: { name: "チャット", rows: ["............", ".##########.", "#..........#", "#..##..##..#", "#..........#", "#..........#", ".######.###.", "......#.#...", ".......##...", "............", "............", "............"] },
    pin: { name: "場所", rows: ["............", "....####....", "...######...", "..###..###..", "..##....##..", "..###..###..", "...######...", "....####....", ".....##.....", ".....##.....", "............", "............"] },
    film: { name: "映画", rows: ["............", "############", "#.#.#.#.#.##", "############", "#....#.....#", "#....##....#", "#....###...#", "#....##....#", "############", "#.#.#.#.#.##", "############", "............"] },
    globe: { name: "世界", rows: ["............", "....####....", "..##.##.##..", ".#...##...#.", ".##########.", "#....##....#", "#....##....#", ".##########.", ".#...##...#.", "..##.##.##..", "....####....", "............"] },
  };
  // ピクセの ひとこと（なまえは いれない きょうつうの もの、なんパターンか）
  const MINE_HI = ["ここは きみが えらんだ せかい。\nいってらっしゃい！", "きみの とっておきの せかいだね。", "この せかいの こと、\nこんど おしえてね。", "きみの せかいへ\nワープの じゅんび OK！"];
  // かえって きたのは ピクセ なので「ただいま！」で そろえる。「？」で おわらない（v1.64）
  const MINE_BACK = ["ただいま！ きみの せかい、\nたのしかった。", "ただいま！\nいい ところ だったね。", "ただいま！ ワープ、\nたのしかったね。", "ただいま！ また いこうね。"];
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
        .map((m) => asCassette({ id: m.id, label: Array.from(m.label).slice(0, MINE_LABEL).join(""), url: cleanUrl(m.url), icon: MINE_ICONS[m.icon] ? m.icon : "star" }));
  } catch {}
  const saveMine = () => {
    try {
      if (mine.length) localStorage.setItem(MINE_KEY, JSON.stringify(mine.map((c) => ({ id: c.id, label: c.label, url: c.url, icon: c.iconKey }))));
      else localStorage.removeItem(MINE_KEY);
    } catch {}
  };

  const byId = (id) => LIST.find((c) => c.id === id) ?? mine.find((c) => c.id === id);
  // にほんごの なまえ（ニコニコ動画 など）は ドットの ゴシックで すこし おおきく
  const jp = (c) => /[^\x00-\x7f]/.test(c.label);
  // たなの アイコンも ICONS に のせる（さいしょの 6 こ は core.js）
  for (const c of LIST) if (c.icon && !ICONS[c.id]) ICONS[c.id] = c.icon;
  const iconOf = (c) => ICONS[c.id] ?? c.icon ?? ICONS.youtube;

  // ---------- グループ（v1.56 パーティ → v2.0）：なまえ（ひっす・12 もじ）と リンク 0〜12 こ ----------
  // さいしょは グループも リンクも ない（本人「選べるし　自分でも追加できる」）。おなじ グループに おなじ リンクは 1 つ だけ
  const MAX_LINKS = 12;
  const MAX_TITLE = 12;
  const cut = (s, n) => Array.from(String(s ?? "").trim()).slice(0, n).join("");
  const newId = () => `g-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
  let groups = [];
  let at = 0;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY.groups) ?? "null");
    if (Array.isArray(saved?.list))
      groups = saved.list
        .filter((g) => g && typeof g.id === "string" && cut(g.title, MAX_TITLE))
        .map((g) => ({ id: g.id, title: cut(g.title, MAX_TITLE), ids: [...new Set((Array.isArray(g.ids) ? g.ids : []).filter((id) => byId(id)))].slice(0, MAX_LINKS), ...(cleanBg(g.bg) ? { bg: cleanBg(g.bg) } : {}) }));
    at = Number.isInteger(saved?.at) && saved.at >= 0 && saved.at < groups.length ? saved.at : 0;
  } catch {}
  const save = () => {
    try {
      localStorage.setItem(KEY.groups, JSON.stringify({ at, list: groups }));
    } catch {}
  };
  const find = (gid) => groups.find((g) => g.id === gid);
  // グループだけの はいけい（v2.3）：{ own: ON か, sky: day|evening|night|photo, photo: がぞうが あるか }。がぞう そのものは photo.js（IndexedDB）
  function cleanBg(bg) {
    if (!bg || typeof bg !== "object") return null;
    const sky = ["day", "evening", "night", "photo"].includes(bg.sky) ? bg.sky : "night";
    return { own: bg.own === true, sky, photo: bg.photo === true };
  }

  // アプリで ひらく（v1.64）：ウェブの アドレスだと Gmail は アプリに いかず、TikTok は ログイン して いない まどが ひらいた（本人）。
  // iPhone では アプリの アドレスへ。2.5 びょう たっても この ページが みえた まま なら、アプリが ない ので ウェブへ
  const IOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  document.addEventListener("click", (e) => {
    const a = e.target.closest?.(".links .pixel-btn[data-app]");
    if (!a || e.defaultPrevented) return;
    e.preventDefault();
    const web = a.href;
    location.href = a.dataset.app;
    setTimeout(() => document.hidden || location.assign(web), 2500);
  });

  return {
    SHELVES,
    LIST,
    GIFTS,
    // その リンクの たな（ワープあなの いろを きめる）
    shelfOf: (id) => byId(id)?.shelf ?? "default",
    byId,
    jp,
    iconOf,
    appOf: (c) => (IOS && c.app ? c.app : null),
    MAX_LINKS,
    MAX_TITLE,
    // ---------- グループ ----------
    groups: () => groups.map((g) => ({ ...g, ids: [...g.ids] })),
    at: () => at,
    current: () => groups[at] ?? null,
    switchTo(i) {
      if (!groups.length) return false;
      at = ((i % groups.length) + groups.length) % groups.length;
      save();
      return true;
    },
    addGroup(title) {
      const t = cut(title, MAX_TITLE);
      if (!t) return null;
      const g = { id: newId(), title: t, ids: [] };
      groups.push(g);
      at = groups.length - 1;
      save();
      return g;
    },
    rename(gid, title) {
      const g = find(gid);
      const t = cut(title, MAX_TITLE);
      if (!g || !t) return false;
      g.title = t;
      save();
      return true;
    },
    removeGroup(gid) {
      const i = groups.findIndex((g) => g.id === gid);
      if (i < 0) return false;
      groups.splice(i, 1);
      if (at >= groups.length) at = Math.max(0, groups.length - 1);
      else if (at > i) at--;
      save();
      return true;
    },
    // グループの じゅんばん（-1 まえへ・+1 うしろへ）
    moveGroup(gid, dir) {
      const i = groups.findIndex((g) => g.id === gid);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= groups.length) return false;
      [groups[i], groups[j]] = [groups[j], groups[i]];
      at = j;
      save();
      return true;
    },
    // ドラッグで ならべかえた じゅんばんを そのまま（v2.2）。いま えらんで いる グループは そのまま えらんだ まま
    setGroupOrder(gids) {
      const cur = groups[at]?.id;
      const next = gids.map((id) => find(id)).filter(Boolean);
      if (next.length !== groups.length || new Set(next).size !== groups.length) return false;
      groups = next;
      at = Math.max(0, groups.findIndex((g) => g.id === cur));
      save();
      return true;
    },
    // リンクを 追加（さいごに）・はずす・ならべかえ
    addLink(gid, id) {
      const g = find(gid);
      if (!g || !byId(id) || g.ids.includes(id) || g.ids.length >= MAX_LINKS) return false;
      g.ids.push(id);
      save();
      return true;
    },
    removeLink(gid, id) {
      const g = find(gid);
      if (!g || !g.ids.includes(id)) return false;
      g.ids = g.ids.filter((x) => x !== id);
      save();
      return true;
    },
    setBg(gid, patch) {
      const g = find(gid);
      if (!g) return false;
      g.bg = cleanBg({ own: false, sky: "night", photo: false, ...g.bg, ...patch });
      save();
      return true;
    },
    setLinkOrder(gid, ids) {
      const g = find(gid);
      if (!g) return false;
      const has = new Set(g.ids);
      const next = [...new Set(ids)].filter((id) => has.has(id));
      if (next.length !== g.ids.length) return false;
      g.ids = next;
      save();
      return true;
    },
    moveLink(gid, id, dir) {
      const g = find(gid);
      const i = g?.ids.indexOf(id) ?? -1;
      const j = i + dir;
      if (i < 0 || j < 0 || j >= g.ids.length) return false;
      [g.ids[i], g.ids[j]] = [g.ids[j], g.ids[i]];
      save();
      return true;
    },
    // ---------- じぶんの リンク ----------
    MINE_MAX,
    MINE_LABEL,
    MINE_ICONS,
    mine: () => [...mine],
    cleanUrl,
    // つくれない アドレスなら ピクセの ひとこと（v1.62）：WARPIX LINK じしん・たなと まったく おなじ・じぶんの リンク どうしの かさなり
    checkMine(url, except = null) {
      const href = cleanUrl(url);
      if (!href) return "https:// で始まるアドレスを入れてね。";
      const norm = (u) => u.replace(/\/+$/, "").toLowerCase();
      const host = new URL(href).hostname;
      if (host === "link.warpix.app" || host === location.hostname) return "それはこのアプリのアドレスです。";
      const same = LIST.find((c) => norm(c.url) === norm(href));
      if (same) return `${same.label} はリストにあります。「リストから えらぶ」から追加してね。`;
      if (mine.some((c) => c.id !== except && norm(c.url) === norm(href))) return "同じリンクがもうあります。";
      return null;
    },
    // つくる：なまえ（10 もじ）・https の アドレス・アイコン。できたら その カセットを かえす
    addMine({ label, url, icon }) {
      if (this.checkMine(url)) return null;
      const href = cleanUrl(url);
      const name = Array.from(String(label ?? "").trim()).slice(0, MINE_LABEL).join("");
      if (mine.length >= MINE_MAX || !href || !name) return null;
      let n = 1;
      while (mine.some((c) => c.id === `my-${n}`)) n++;
      const c = asCassette({ id: `my-${n}`, label: name, url: href, icon: MINE_ICONS[icon] ? icon : "star" });
      mine.push(c);
      ICONS[c.id] = c.icon;
      saveMine();
      return c;
    },
    // かえる（v2.0.2）：なまえ・アドレス・アイコン。id は そのまま なので はいって いる グループ ぜんぶで かわる
    updateMine(id, { label, url, icon }) {
      const i = mine.findIndex((c) => c.id === id);
      if (i < 0 || this.checkMine(url, id)) return null;
      const href = cleanUrl(url);
      const name = Array.from(String(label ?? "").trim()).slice(0, MINE_LABEL).join("");
      if (!href || !name) return null;
      const c = asCassette({ id, label: name, url: href, icon: MINE_ICONS[icon] ? icon : "star" });
      mine[i] = c;
      ICONS[id] = c.icon;
      saveMine();
      return c;
    },
    // けすと、はいって いた グループからも はずす
    removeMine(id) {
      const i = mine.findIndex((c) => c.id === id);
      if (i < 0) return false;
      for (const g of groups) g.ids = g.ids.filter((x) => x !== id);
      mine.splice(i, 1);
      delete ICONS[id];
      saveMine();
      save();
      return true;
    },
  };
})();
for (const c of CASSETTES.mine()) ICONS[c.id] = c.icon;
