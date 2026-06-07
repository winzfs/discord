import { moveOneHeroToCell } from "@discord-random-defense/game";
import type { BoardHero, GameState } from "@discord-random-defense/game";
import { colors } from "./gameTheme";
import type { GameRefs } from "./pixiGameTypes";
import { createUnitGhost, getCellCenter, getNearestCellIndexForDrop } from "./pixiBoardRuntime";

export type PixiDragRuntimeOptions = {
  isFinished: (state: GameState) => boolean;
  clearMenu: (refs: GameRefs) => void;
  clearUnitSelection: (refs: GameRefs) => void;
  clearDrag: (refs: GameRefs) => void;
  addAnimation: (
    refs: GameRefs,
    animation: {
      duration: number;
      update: (progress: number) => void;
      done?: () => void;
    },
  ) => void;
  render: (refs: GameRefs) => void;
  floatText: (refs: GameRefs, value: string, x: number, y: number, color: number) => void;
  showUnitMenu: (refs: GameRefs, cellIndex: number) => void;
};

function createStackGhost(units: BoardHero[], cell: number) {
  return createUnitGhost(units[0], cell, 0);
}

export function beginCellDrag(
  refs: GameRefs,
  sourceIndex: number,
  globalX: number,
  globalY: number,
  cell: number,
  options: PixiDragRuntimeOptions,
) {
  if (options.isFinished(refs.state) || refs.movementLocked) return;

  const sourceCell = refs.state.board[sourceIndex];
  const movingHero = sourceCell?.units[0];
  if (!movingHero) return;

  options.clearMenu(refs);
  options.clearUnitSelection(refs);
  options.clearDrag(refs);

  const ghost = createStackGhost(sourceCell.units, cell);
  ghost.x = globalX;
  ghost.y = globalY;
  refs.effects.addChild(ghost);

  refs.dragging = {
    sourceIndex,
    startX: globalX,
    startY: globalY,
    ghost,
    isMoving: false,
  };
}

export function moveDragGhost(refs: GameRefs, globalX: number, globalY: number) {
  if (!refs.dragging) return;

  const dx = globalX - refs.dragging.startX;
  const dy = globalY - refs.dragging.startY;

  if (!refs.dragging.isMoving && Math.hypot(dx, dy) > 8) {
    refs.dragging.isMoving = true;
    refs.dragging.ghost.alpha = 0.84;
    refs.dragging.ghost.scale.set(1.08);
  }

  if (refs.dragging.isMoving) {
    refs.dragging.ghost.x = globalX;
    refs.dragging.ghost.y = globalY;
  }
}

function getRepresentativeHero(previousState: GameState, cellIndex: number) {
  return previousState.board[cellIndex]?.units[0] ?? null;
}

function animateWalk(
  refs: GameRefs,
  sourceIndex: number,
  targetIndex: number,
  previousState: GameState,
  done: () => void,
  options: PixiDragRuntimeOptions,
) {
  const sourceCell = previousState.board[sourceIndex];
  const movingHero = sourceCell?.units[0];
  if (!movingHero) {
    done();
    return;
  }

  const from = getCellCenter(refs, sourceIndex);
  const to = getCellCenter(refs, targetIndex);
  const ghost = createStackGhost(sourceCell.units, from.cell);
  ghost.x = from.x;
  ghost.y = from.y;
  ghost.alpha = 0.96;
  refs.effects.addChild(ghost);

  options.addAnimation(refs, {
    duration: 420,
    update: (progress) => {
      const eased = 1 - Math.pow(1 - progress, 3);
      const bob = Math.sin(progress * Math.PI * 4) * from.cell * 0.04;
      ghost.x = from.x + (to.x - from.x) * eased;
      ghost.y = from.y + (to.y - from.y) * eased + bob;
      ghost.rotation = Math.sin(progress * Math.PI * 6) * 0.08;
      ghost.alpha = 0.96 - progress * 0.06;
    },
    done: () => {
      ghost.destroy({ children: true });
      done();
    },
  });
}

function animateSwapWalk(
  refs: GameRefs,
  sourceIndex: number,
  targetIndex: number,
  previousState: GameState,
  done: () => void,
  options: PixiDragRuntimeOptions,
) {
  const targetCell = previousState.board[targetIndex];
  const swapHero = getRepresentativeHero(previousState, targetIndex);

  if (!swapHero || !targetCell) {
    done();
    return;
  }

  const from = getCellCenter(refs, targetIndex);
  const to = getCellCenter(refs, sourceIndex);
  const ghost = createStackGhost(targetCell.units, from.cell);
  ghost.x = from.x;
  ghost.y = from.y;
  ghost.alpha = 0.96;
  refs.effects.addChild(ghost);

  options.addAnimation(refs, {
    duration: 420,
    update: (progress) => {
      const eased = 1 - Math.pow(1 - progress, 3);
      const bob = Math.sin(progress * Math.PI * 4) * from.cell * 0.04;
      ghost.x = from.x + (to.x - from.x) * eased;
      ghost.y = from.y + (to.y - from.y) * eased + bob;
      ghost.rotation = Math.sin(progress * Math.PI * 6) * 0.08;
      ghost.alpha = 0.96 - progress * 0.06;
    },
    done: () => {
      ghost.destroy({ children: true });
      done();
    },
  });
}

function animateMoveResult(
  refs: GameRefs,
  sourceIndex: number,
  targetIndex: number,
  previousState: GameState,
  nextState: GameState,
  action: "move" | "stack" | "swap",
  options: PixiDragRuntimeOptions,
) {
  refs.movementLocked = true;

  const finish = () => {
    refs.state = nextState;
    refs.lastSummonedIndex = targetIndex;
    refs.movementLocked = false;
    options.render(refs);
    options.floatText(
      refs,
      action === "swap" ? "자리 교환" : action === "stack" ? "중첩" : "이동",
      refs.app.renderer.width / 2,
      refs.app.renderer.height * 0.52,
      action === "swap" ? colors.orange : colors.green,
    );
  };

  if (action === "swap") {
    let completed = 0;
    const onDone = () => {
      completed += 1;
      if (completed >= 2) finish();
    };

    animateWalk(refs, sourceIndex, targetIndex, previousState, onDone, options);
    animateSwapWalk(refs, sourceIndex, targetIndex, previousState, onDone, options);
    return;
  }

  animateWalk(refs, sourceIndex, targetIndex, previousState, finish, options);
}

export function finishCellDrag(
  refs: GameRefs,
  globalX: number,
  globalY: number,
  options: PixiDragRuntimeOptions,
) {
  if (!refs.dragging) return;

  const sourceIndex = refs.dragging.sourceIndex;
  const wasMoving = refs.dragging.isMoving;
  const targetIndex = getNearestCellIndexForDrop(refs, globalX, globalY);

  options.clearDrag(refs);

  if (!wasMoving || targetIndex === sourceIndex) {
    options.showUnitMenu(refs, sourceIndex);
    return;
  }

  if (targetIndex === null) {
    options.floatText(
      refs,
      "이동 취소",
      refs.app.renderer.width / 2,
      refs.app.renderer.height * 0.52,
      colors.white,
    );
    return;
  }

  const previousState = refs.state;
  const result = moveOneHeroToCell(refs.state, sourceIndex, targetIndex);

  if (!result.movedHero || !result.action) {
    const message =
      result.reason === "target_full"
        ? "칸이 가득 찼어"
        : result.reason === "mythic_stack_blocked"
          ? "신화는 중첩 불가"
          : "이동 불가";
    options.floatText(
      refs,
      message,
      refs.app.renderer.width / 2,
      refs.app.renderer.height * 0.52,
      colors.red,
    );
    return;
  }

  animateMoveResult(refs, sourceIndex, targetIndex, previousState, result.state, result.action, options);
}
