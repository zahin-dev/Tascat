import { useCallback, useRef, useState } from "react";
import { useApp } from "../../app/AppProvider";
import { CatSprite } from "../../components/CatSprite";
import { PixelButton } from "../../components/ui/PixelButton";

export function CatArea() {
  const { state, commands } = useApp();
  const [eating, setEating] = useState(false);
  const [animationRun, setAnimationRun] = useState(0);
  const feedLock = useRef(false);

  const finishEating = useCallback(() => {
    setEating(false);
    feedLock.current = false;
  }, []);

  const feed = () => {
    if (feedLock.current || state.foodCount <= 0) return;
    feedLock.current = true;
    if (!commands.consumeFood()) {
      feedLock.current = false;
      return;
    }
    setEating(true);
    setAnimationRun((current) => current + 1);
  };

  return (
    <section className="cat-panel" aria-labelledby="cat-heading">
      <div className="cat-room-copy">
        <p className="eyebrow">A QUIET ROOM FOR AICHAN</p>
        <h1 id="cat-heading">ひと息つこう</h1>
        <p>タスクを終えたら、猫と短い休憩を。</p>
      </div>
      <div className="cat-room" data-testid="cat-room" aria-label="Aichanの静かな猫部屋">
        <div className="room-window" aria-hidden="true">
          <span className="forest-tree forest-tree-large pixel-asset" />
          <span className="forest-tree forest-tree-dark pixel-asset" />
          <span className="forest-tree forest-tree-teal pixel-asset" />
        </div>
        <span className="room-asset room-shelf pixel-asset" aria-hidden="true" />
        <span className="room-asset room-plant pixel-asset" aria-hidden="true" />
        <span className="room-asset room-pet-tower pixel-asset" aria-hidden="true" />
        <span className="room-asset room-pet-house pixel-asset" aria-hidden="true" />
        <span className="room-asset room-pet-bed pixel-asset" aria-hidden="true" />
        <span className="room-asset room-scratcher pixel-asset" aria-hidden="true" />
        <span className="room-asset room-pet-bowl pixel-asset" aria-hidden="true" />
        <span className="room-asset room-catnip pixel-asset" aria-hidden="true" />
        <span className="room-asset room-mouse pixel-asset" aria-hidden="true" />
        <span className="room-asset room-toy pixel-asset" aria-hidden="true" />
        <span className="room-asset room-feather-toy pixel-asset" aria-hidden="true" />
        <span className="room-asset room-food-bag pixel-asset" aria-hidden="true" />
        <span className="room-asset room-yarn pixel-asset" aria-hidden="true" />
        <div className="cat-stage">
          <CatSprite
            key={`${eating ? "eat" : "idle"}-${animationRun.toString()}`}
            mode={eating ? "eat" : "idle"}
            onAnimationComplete={eating ? finishEating : undefined}
          />
        </div>
      </div>
      <div className="cat-actions">
        <p className="food-count" aria-live="polite" aria-label={`ごはんの所持数 ${state.foodCount.toString()}食`}>
          <span className="food-bowl-icon pixel-asset" aria-hidden="true" />
          <span><small>ごはん</small> × <strong data-testid="food-count">{state.foodCount}</strong></span>
        </p>
        <PixelButton
          onClick={feed}
          disabled={state.foodCount <= 0 || eating}
          aria-describedby="feed-status"
          className="feed-button"
        >
          {eating ? "食事中…" : state.foodCount <= 0 ? "ごはんがありません" : "ごはんをあげる"}
        </PixelButton>
        <span className="sr-only" id="feed-status" aria-live="polite">
          {eating ? "猫がごはんを食べています。" : ""}
        </span>
      </div>
    </section>
  );
}
