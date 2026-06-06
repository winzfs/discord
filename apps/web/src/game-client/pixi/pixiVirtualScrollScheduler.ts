export type VirtualScrollScheduler = {
  request: () => void;
  flush: () => void;
};

export function createVirtualScrollScheduler(render: () => void): VirtualScrollScheduler {
  let scheduled = false;

  function run() {
    scheduled = false;
    render();
  }

  return {
    request: () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(run);
    },
    flush: () => {
      scheduled = false;
      render();
    },
  };
}
