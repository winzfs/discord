export type PixiAnimation = {
  age: number;
  duration: number;
  update: (progress: number) => void;
  done?: () => void;
};

export type PixiAnimationInput = Omit<PixiAnimation, "age">;

export function addPixiAnimation(animations: PixiAnimation[], animation: PixiAnimationInput) {
  animations.push({ ...animation, age: 0 });
}

export function tickPixiAnimations(animations: PixiAnimation[], deltaMs: number) {
  return animations.filter((animation) => {
    animation.age += deltaMs;
    const progress = Math.min(1, animation.age / animation.duration);
    animation.update(progress);
    if (progress >= 1) {
      animation.done?.();
      return false;
    }
    return true;
  });
}
