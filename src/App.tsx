import { AppProvider, useApp } from "./app/AppProvider";
import { useHashRoute, type AppRoute } from "./app/useHashRoute";
import { CalendarPage } from "./features/calendar/CalendarPage";
import { HomePage } from "./features/home/HomePage";
import { PomodoroPage } from "./features/pomodoro/PomodoroPage";
import { SettingsPage } from "./features/settings/SettingsPage";

const navigation: Array<{ route: AppRoute; label: string; glyph: string; caption: string }> = [
  { route: "home", label: "ホーム", glyph: "⌂", caption: "HOME" },
  { route: "calendar", label: "カレンダー", glyph: "▦", caption: "CALENDAR" },
  { route: "pomodoro", label: "ポモドーロ", glyph: "◷", caption: "POMODORO" },
  { route: "settings", label: "設定", glyph: "⚙", caption: "SETTINGS" },
];

export function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

function AppContent() {
  const route = useHashRoute();
  const { state } = useApp();

  return (
    <>
      <a className="skip-link" href="#main-content">本文へ移動</a>
      <div className="app-shell">
        <aside className="sidebar" aria-label="メインナビゲーション">
          <div className="brand">
            <img
              className="brand-mark pixel-asset"
              src="/brand/tascat-icon.svg"
              width="48"
              height="48"
              alt=""
              aria-hidden="true"
            />
            <span className="brand-type">Tascat</span>
          </div>
          <nav className="nav-list">
            {navigation.map((item) => (
              <a
                className={route === item.route ? "nav-link is-current" : "nav-link"}
                href={`#/${item.route}`}
                aria-current={route === item.route ? "page" : undefined}
                key={item.route}
              >
                <span className="nav-glyph pixel-control-frame" aria-hidden="true">{item.glyph}</span>
                <span className="nav-copy">
                  <span>{item.label}</span>
                  <small>{item.caption}</small>
                </span>
              </a>
            ))}
          </nav>
          <p className="sidebar-note"><span>ACCOUNT</span> NONE<br /><span>STORAGE</span> LOCAL</p>
        </aside>

        <main className="main-canvas" id="main-content" tabIndex={-1}>
          {state.storageIssue && (
            <div className="storage-banner" role="alert">
              ▣ {state.storageIssue === "corrupt"
                ? "保存されていたデータを読み込めなかったため、初期状態で開始しました。"
                : "この操作を端末に保存できませんでした。ブラウザの保存設定をご確認ください。"}
            </div>
          )}
          {route === "home" && <HomePage />}
          {route === "calendar" && <CalendarPage />}
          {route === "pomodoro" && <PomodoroPage />}
          {route === "settings" && <SettingsPage />}
          <div className="global-status" aria-live="polite" aria-atomic="true">
            {state.notice?.kind === "blocked" ? "" : state.notice?.message ?? ""}
          </div>
        </main>
      </div>
    </>
  );
}
