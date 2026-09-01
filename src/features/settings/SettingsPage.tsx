import { useState } from "react";
import { useApp } from "../../app/AppProvider";
import { APP_VERSION } from "../../domain/constants";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { PixelButton } from "../../components/ui/PixelButton";

export function SettingsPage() {
  const { commands } = useApp();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <section className="page settings-page" aria-labelledby="settings-heading">
      <header className="page-header">
        <div className="page-title-lockup">
          <span className="section-paw pixel-asset" aria-hidden="true" />
          <div><p className="eyebrow">SETTINGS</p><h1 id="settings-heading">設定</h1></div>
        </div>
      </header>
      <div className="settings-grid">
        <section className="settings-panel pixel-panel" aria-labelledby="data-heading">
          <span className="panel-asset-icon danger-asset-icon pixel-asset" aria-hidden="true" />
          <span className="panel-index" aria-hidden="true">01</span>
          <h2 id="data-heading">データ</h2>
          <p>タスク、ごはん、報酬状態、ポモドーロ状態など、このブラウザに保存されたTascatのデータを削除します。</p>
          <PixelButton variant="danger" onClick={() => setConfirmOpen(true)}>全データを削除</PixelButton>
        </section>
        <section className="settings-panel pixel-panel" aria-labelledby="app-info-heading">
          <span className="panel-asset-icon pixel-asset" aria-hidden="true" />
          <span className="panel-index" aria-hidden="true">02</span>
          <h2 id="app-info-heading">アプリ情報</h2>
          <dl className="app-info-list">
            <div><dt>アプリ名</dt><dd>Tascat</dd></div>
            <div><dt>バージョン</dt><dd>{APP_VERSION}</dd></div>
            <div><dt>保存先</dt><dd>このブラウザ内のみ</dd></div>
          </dl>
        </section>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        title="全データを削除しますか？"
        description="タスク、サブタスク、完了と報酬の状態、ごはん、ポモドーロ状態をすべて削除します。この操作は元に戻せません。"
        confirmLabel="すべて削除する"
        onClose={() => setConfirmOpen(false)}
        onConfirm={commands.resetAllData}
      />
    </section>
  );
}
