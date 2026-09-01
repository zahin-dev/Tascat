import { useEffect, useState } from "react";

type CatSpriteProps = {
  mode: "idle" | "eat";
  onAnimationComplete?: () => void;
};

const FRAME_SIZE = 32;
const FRAME_STRIDE_X = 33;
const ANIMATIONS = {
  idle: { row: 0, frames: 5, duration: 220 },
  eat: { row: 1, frames: 4, duration: 180 },
} as const;

export function CatSprite({ mode, onAnimationComplete }: CatSpriteProps) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const animation = ANIMATIONS[mode];
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      if (mode === "eat") {
        const timeout = window.setTimeout(() => onAnimationComplete?.(), 450);
        return () => window.clearTimeout(timeout);
      }
      return undefined;
    }

    let current = 0;
    const interval = window.setInterval(() => {
      current += 1;
      if (mode === "eat" && current >= animation.frames) {
        window.clearInterval(interval);
        onAnimationComplete?.();
        return;
      }
      setFrame(current % animation.frames);
    }, animation.duration);

    return () => window.clearInterval(interval);
  }, [mode, onAnimationComplete]);

  const animation = ANIMATIONS[mode];
  const visibleFrame = frame % animation.frames;

  return (
    <div
      className="cat-sprite-viewport"
      role="img"
      aria-label={mode === "eat" ? "ごはんを食べている猫" : "ゆっくり立っている猫"}
      data-cat-animation={mode}
    >
      <span
        className="cat-sprite"
        data-animation={mode}
        style={{
          backgroundPosition: `${-(visibleFrame * FRAME_STRIDE_X)}px ${-(animation.row * FRAME_SIZE)}px`,
        }}
      />
    </div>
  );
}
