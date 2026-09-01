import { useEffect, useState } from "react";
import { useApp } from "../../app/AppProvider";
import { formatRemainingTime } from "../../domain/pomodoro";
import { PixelButton } from "../../components/ui/PixelButton";

export function PomodoroPage() {
  const { state, commands } = useApp();
  const [nowMs, setNowMs] = useState(() => Date.now());
  const timer = state.pomodoro;

  useEffect(() => {
    if (timer.status !== "running" || !timer.endsAt) return undefined;
    const interval = window.setInterval(() => {
      const now = Date.now();
      if (now >= Date.parse(timer.endsAt ?? "")) commands.tickPomodoro();
      else setNowMs(now);
    }, 250);
    return () => window.clearInterval(interval);
  }, [commands, timer.endsAt, timer.status]);

  const displayRemaining = timer.status === "running" && timer.endsAt
    ? Math.max(0, Date.parse(timer.endsAt) - nowMs)
    : timer.remainingMs;
  const modeLabel = timer.mode === "focus" ? "集中" : "休憩";
  const statusLabel = timer.status === "running" ? "進行中" : timer.status === "paused" ? "一時停止中" : "開始を待っています";
  const completedMessage = timer.lastCompletedMode === "focus"
    ? "集中が終わりました。休憩は開始ボタンで始められます。"
    : timer.lastCompletedMode === "break"
      ? "休憩が終わりました。次の集中は開始ボタンで始められます。"
      : null;

  return (
    <section className="page pomodoro-page" aria-labelledby="pomodoro-heading">
      <header className="page-header">
        <div className="page-title-lockup">
          <span className="section-paw pixel-asset" aria-hidden="true" />
          <div><p className="eyebrow">POMODORO</p><h1 id="pomodoro-heading">ポモドーロ</h1></div>
        </div>
        <p>集中25分、休憩5分。終了後は自動で始まりません。</p>
      </header>
      <div className="pomodoro-panel pixel-panel">
        <span className="timer-screw timer-screw-left" aria-hidden="true" />
        <span className="timer-screw timer-screw-right" aria-hidden="true" />
        <p className="timer-device-label">FOCUS TIMER / LOCAL SESSION</p>
        <div className={`mode-chip mode-${timer.mode}`}>{modeLabel}</div>
        <div className="timer-screen">
          <p className="timer-display" role="timer" aria-label={`${modeLabel}、残り${formatRemainingTime(displayRemaining)}`}>
            {formatRemainingTime(displayRemaining)}
          </p>
        </div>
        <p className="timer-status">{statusLabel}</p>
        {completedMessage && <p className="timer-complete" aria-live="polite">▣ {completedMessage}</p>}
        <div className="timer-controls">
          {timer.status === "running" ? (
            <PixelButton variant="primary" onClick={commands.pausePomodoro}>一時停止</PixelButton>
          ) : (
            <PixelButton variant="primary" onClick={commands.startPomodoro}>
              {timer.status === "paused" ? "再開" : "開始"}
            </PixelButton>
          )}
          <PixelButton onClick={commands.resetPomodoro}>リセット</PixelButton>
        </div>
        <div className="timer-vents" aria-hidden="true"><span /><span /><span /><span /><span /></div>
      </div>
    </section>
  );
}
