// ボタンにホバー/クリックしたときの8bit風効果音（Web Audio API の矩形波）
(() => {
  let ctx = null;

  function beep(freq, duration, slideTo) {
    try {
      ctx ??= new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;

      osc.type = "square";
      osc.frequency.setValueAtTime(freq, now);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration);
    } catch {
      // 音が出せない環境では何もしない
    }
  }

  document.querySelectorAll(".pixel-btn").forEach((btn) => {
    btn.addEventListener("mouseenter", () => beep(880, 0.05));
    btn.addEventListener("focus", () => beep(880, 0.05));
    btn.addEventListener("click", () => beep(440, 0.15, 1760));
  });
})();
