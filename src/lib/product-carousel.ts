interface CarouselImage { src: string; alt: string; }

export function initializeProductCarousels() {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const controllers = new Map<Element, { visibility: (visible: boolean) => void; refresh: () => void; reduce: () => void }>();
  let pageActive = true;
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) controllers.get(entry.target)?.visibility(entry.isIntersecting);
  }, { threshold: .15 });

  document.querySelectorAll<HTMLElement>('[data-product-carousel]').forEach(root => {
    if (root.dataset.carouselReady) return;
    const images: CarouselImage[] = JSON.parse(root.dataset.carouselImages || '[]');
    if (images.length < 2) return;
    root.dataset.carouselReady = 'true';
    const image = root.querySelector<HTMLImageElement>('[data-carousel-image]')!;
    const overlay = root.querySelector<HTMLImageElement>('[data-carousel-overlay]')!;
    const link = root.querySelector<HTMLAnchorElement>('[data-carousel-link]')!;
    const stage = root.querySelector<HTMLElement>('[data-carousel-stage]')!;
    const toggle = root.querySelector<HTMLButtonElement>('[data-carousel-toggle]')!;
    const buttons = [...root.querySelectorAll<HTMLButtonElement>('[data-carousel-select]')];
    const counter = root.querySelector<HTMLElement>('[data-carousel-counter]')!;
    const announcement = root.querySelector<HTMLElement>('[data-carousel-announcement]')!;
    let current = 0;
    let selected = 0;
    let request = 0;
    let loading = false;
    let paused = motion.matches;
    let hovered = false;
    let focused = false;
    let visible = false;
    let timer: number | undefined;
    let animation: Animation | undefined;
    let pointer: { x: number; y: number; id: number } | undefined;
    let suppressClick = false;

    function refresh() {
      window.clearTimeout(timer);
      timer = undefined;
      const running = !paused && !hovered && !focused && visible && pageActive && !document.hidden && !loading;
      root.dataset.carouselRunning = String(running);
      toggle.setAttribute('aria-label', `${paused ? 'Reproducir' : 'Pausar'} carrusel de ${image.alt}`);
      root.querySelector('[data-carousel-toggle-icon]')!.textContent = paused ? '▶' : 'Ⅱ';
      root.querySelector('[data-carousel-toggle-label]')!.textContent = paused ? 'Reproducir' : 'Pausar';
      if (running) timer = window.setTimeout(() => { void show(selected + 1); }, 5000);
    }

    async function show(index: number, manual = false) {
      selected = (index + images.length) % images.length;
      if (manual) paused = true;
      const target = selected;
      const activeRequest = ++request;
      loading = true;
      refresh();
      try {
        const candidate = new Image();
        candidate.src = images[target].src;
        await candidate.decode();
        if (activeRequest !== request) return;
        animation?.cancel();
        overlay.hidden = true;
        const previous = image.src;
        image.src = images[target].src;
        image.alt = images[target].alt;
        if (root.classList.contains('carousel--detail')) link.href = images[target].src;
        current = target;
        root.dataset.carouselCurrent = String(current);
        counter.textContent = `${current + 1} / ${images.length}`;
        buttons.forEach((button, position) => button.setAttribute('aria-pressed', String(position === current)));
        if (manual) announcement.textContent = `Fotografía ${current + 1} de ${images.length}: ${image.alt}`;
        if (!motion.matches && previous !== image.src) {
          overlay.src = previous;
          overlay.hidden = false;
          animation = overlay.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400, easing: 'ease-in-out', fill: 'forwards' });
          await animation.finished.catch(() => {});
          if (activeRequest === request) overlay.hidden = true;
        }
      } catch {
        if (activeRequest === request) selected = current;
      } finally {
        if (activeRequest === request) { loading = false; refresh(); }
      }
    }

    toggle.addEventListener('click', () => {
      paused = !paused;
      if (!paused) { hovered = false; focused = false; }
      refresh();
    });
    root.querySelector('[data-carousel-previous]')!.addEventListener('click', () => { void show(selected - 1, true); });
    root.querySelector('[data-carousel-next]')!.addEventListener('click', () => { void show(selected + 1, true); });
    buttons.forEach((button, index) => button.addEventListener('click', () => { void show(index, true); }));
    root.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') { hovered = true; refresh(); } });
    root.addEventListener('pointerleave', () => { hovered = false; refresh(); });
    root.addEventListener('focusin', () => { focused = true; refresh(); });
    root.addEventListener('focusout', event => { focused = root.contains(event.relatedTarget as Node | null); refresh(); });
    root.addEventListener('keydown', event => {
      const target = event.key === 'ArrowRight' ? selected + 1 : event.key === 'ArrowLeft' ? selected - 1 : event.key === 'Home' ? 0 : event.key === 'End' ? images.length - 1 : undefined;
      if (target === undefined) return;
      event.preventDefault();
      void show(target, true);
    });
    stage.addEventListener('pointerdown', event => {
      if (event.pointerType === 'mouse' || (event.target as Element).closest('button')) return;
      suppressClick = false;
      pointer = { x: event.clientX, y: event.clientY, id: event.pointerId };
    });
    stage.addEventListener('pointercancel', () => { pointer = undefined; });
    stage.addEventListener('pointerup', event => {
      if (!pointer || event.pointerId !== pointer.id) return;
      const horizontal = event.clientX - pointer.x;
      const vertical = event.clientY - pointer.y;
      pointer = undefined;
      if (Math.abs(horizontal) < 45 || Math.abs(horizontal) < Math.abs(vertical) * 1.3) return;
      suppressClick = true;
      void show(selected + (horizontal < 0 ? 1 : -1), true);
    });
    stage.addEventListener('click', event => {
      if (!suppressClick) return;
      event.preventDefault();
      event.stopPropagation();
      suppressClick = false;
    }, true);
    root.querySelectorAll<HTMLElement>('[data-carousel-controls], [data-carousel-selectors]').forEach(element => { element.hidden = false; });
    controllers.set(root, {
      visibility: value => { visible = value; refresh(); },
      refresh,
      reduce: () => { if (motion.matches) { paused = true; animation?.cancel(); overlay.hidden = true; } refresh(); },
    });
    observer.observe(root);
    refresh();
  });

  document.addEventListener('visibilitychange', () => controllers.forEach(controller => controller.refresh()));
  window.addEventListener('pagehide', () => { pageActive = false; controllers.forEach(controller => controller.refresh()); });
  window.addEventListener('pageshow', () => { pageActive = true; controllers.forEach(controller => controller.refresh()); });
  motion.addEventListener('change', () => controllers.forEach(controller => controller.reduce()));
}
