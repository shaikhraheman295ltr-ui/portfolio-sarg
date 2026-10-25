/* ── TargetCursor — React Bits port (vanilla JS + GSAP) ── */
    (function () {
      if (!window.gsap) return;

    const targetSelector =
      '.btn, .project-card, .swap-card, .contact-link, .contact-big a, .form-submit, .nav__links a, .skill-block, .hero__photo-frame';
      const spinDuration = 2;
      const hoverDuration = 0.2;
      const parallaxOn = true;
      const cursorColor = '#ffffff';
      const borderWidth = 3;
      const cornerSize = 12;

      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmall = window.innerWidth <= 768;
      const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test((navigator.userAgent || '').toLowerCase());
      if ((isTouch && isSmall) || isMobileUA) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      const cursor = document.getElementById('target-cursor');
      if (!cursor) return;
      const dot = cursor.querySelector('.target-cursor-dot');
      const corners = Array.from(cursor.querySelectorAll('.target-cursor-corner'));

      let spinTl = null;
      let activeTarget = null;
      let currentLeaveHandler = null;
      let resumeTimeout = null;
      let targetCornerPositions = null;
      let tickerFn = null;
      const activeStrength = { current: 0 };

      const getContainingBlock = element => {
        let node = element && element.parentElement;
        while (node && node !== document.documentElement) {
          const style = getComputedStyle(node);
          if (
            style.transform !== 'none' ||
            style.perspective !== 'none' ||
            style.filter !== 'none' ||
            style.willChange.includes('transform') ||
            style.willChange.includes('perspective') ||
            style.willChange.includes('filter') ||
            /paint|layout|strict|content/.test(style.contain)
          ) {
            return node;
          }
          node = node.parentElement;
        }
        return null;
      };

      const getContainingBlockOffset = block => {
        if (!block) return { x: 0, y: 0 };
        const rect = block.getBoundingClientRect();
        return { x: rect.left + block.clientLeft, y: rect.top + block.clientTop };
      };

      document.body.style.cursor = 'none';
      document.documentElement.classList.add('custom-cursor');

      let containingBlock = getContainingBlock(cursor);
      const getOffset = () => getContainingBlockOffset(containingBlock);

      const cleanupTarget = target => {
        if (currentLeaveHandler) {
          target.removeEventListener('mouseleave', currentLeaveHandler);
        }
        currentLeaveHandler = null;
      };

      const initialOffset = getOffset();
      gsap.set(cursor, {
        xPercent: -50,
        yPercent: -50,
        x: window.innerWidth / 2 - initialOffset.x,
        y: window.innerHeight / 2 - initialOffset.y
      });

      const createSpinTimeline = () => {
        if (spinTl) spinTl.kill();
        spinTl = gsap.timeline({ repeat: -1 }).to(cursor, { rotation: '+=360', duration: spinDuration, ease: 'none' });
      };
      createSpinTimeline();

      const moveCursor = (x, y) => {
        const o = getOffset();
        gsap.to(cursor, { x: x - o.x, y: y - o.y, duration: 0.1, ease: 'power3.out' });
      };

      tickerFn = () => {
        if (!targetCornerPositions || !cursor || !corners) return;
        const strength = activeStrength.current;
        if (strength === 0) return;

        const cursorX = gsap.getProperty(cursor, 'x');
        const cursorY = gsap.getProperty(cursor, 'y');

        corners.forEach((corner, i) => {
          const currentX = gsap.getProperty(corner, 'x');
          const currentY = gsap.getProperty(corner, 'y');
          const targetX = targetCornerPositions[i].x - cursorX;
          const targetY = targetCornerPositions[i].y - cursorY;
          const finalX = currentX + (targetX - currentX) * strength;
          const finalY = currentY + (targetY - currentY) * strength;
          const duration = strength >= 0.99 ? (parallaxOn ? 0.2 : 0) : 0.05;

          gsap.to(corner, {
            x: finalX,
            y: finalY,
            duration: duration,
            ease: duration === 0 ? 'none' : 'power1.out',
            overwrite: 'auto'
          });
        });
      };

      window.addEventListener('mousemove', e => moveCursor(e.clientX, e.clientY));

      const scrollHandler = () => {
        if (!activeTarget || !cursor) return;
        const o = getOffset();
        const mouseX = gsap.getProperty(cursor, 'x') + o.x;
        const mouseY = gsap.getProperty(cursor, 'y') + o.y;
        const el = document.elementFromPoint(mouseX, mouseY);
        const stillOver = el && (el === activeTarget || el.closest(targetSelector) === activeTarget);
        if (!stillOver && currentLeaveHandler) currentLeaveHandler();
      };
      window.addEventListener('scroll', scrollHandler, { passive: true });

      const mouseDownHandler = () => {
        if (!dot) return;
        gsap.to(dot, { scale: 0.7, duration: 0.3 });
        gsap.to(cursor, { scale: 0.9, duration: 0.2 });
      };
      const mouseUpHandler = () => {
        if (!dot) return;
        gsap.to(dot, { scale: 1, duration: 0.3 });
        gsap.to(cursor, { scale: 1, duration: 0.2 });
      };
      window.addEventListener('mousedown', mouseDownHandler);
      window.addEventListener('mouseup', mouseUpHandler);

      const enterHandler = e => {
        const directTarget = e.target;
        const allTargets = [];
        let current = directTarget;
        while (current && current !== document.body) {
          if (current.matches && current.matches(targetSelector)) allTargets.push(current);
          current = current.parentElement;
        }
        const target = allTargets[0] || null;
        if (!target || !cursor || !corners) return;
        if (activeTarget === target) return;
        if (activeTarget) cleanupTarget(activeTarget);
        if (resumeTimeout) {
          clearTimeout(resumeTimeout);
          resumeTimeout = null;
        }

        activeTarget = target;
        gsap.killTweensOf(corners, 'x,y');
        gsap.killTweensOf(cursor, 'rotation');
        if (spinTl) spinTl.pause();
        gsap.set(cursor, { rotation: 0 });

        const rect = target.getBoundingClientRect();
        const o = getOffset();
        const cursorX = gsap.getProperty(cursor, 'x');
        const cursorY = gsap.getProperty(cursor, 'y');

        targetCornerPositions = [
          { x: rect.left - borderWidth - o.x, y: rect.top - borderWidth - o.y },
          { x: rect.right + borderWidth - cornerSize - o.x, y: rect.top - borderWidth - o.y },
          { x: rect.right + borderWidth - cornerSize - o.x, y: rect.bottom + borderWidth - cornerSize - o.y },
          { x: rect.left - borderWidth - o.x, y: rect.bottom + borderWidth - cornerSize - o.y }
        ];

        gsap.ticker.add(tickerFn);
        gsap.to(activeStrength, { current: 1, duration: hoverDuration, ease: 'power2.out' });

        corners.forEach((corner, i) => {
          gsap.to(corner, {
            x: targetCornerPositions[i].x - cursorX,
            y: targetCornerPositions[i].y - cursorY,
            duration: 0.2,
            ease: 'power2.out'
          });
        });

        const leaveHandler = () => {
          gsap.ticker.remove(tickerFn);

          activeTarget = null;
          targetCornerPositions = null;
          gsap.set(activeStrength, { current: 0, overwrite: true });

          gsap.killTweensOf(corners, 'x,y');
          const positions = [
            { x: -cornerSize * 1.5, y: -cornerSize * 1.5 },
            { x: cornerSize * 0.5, y: -cornerSize * 1.5 },
            { x: cornerSize * 0.5, y: cornerSize * 0.5 },
            { x: -cornerSize * 1.5, y: cornerSize * 0.5 }
          ];
          const tl = gsap.timeline();
          corners.forEach((corner, index) => {
            tl.to(corner, { x: positions[index].x, y: positions[index].y, duration: 0.3, ease: 'power3.out' }, 0);
          });

          resumeTimeout = setTimeout(() => {
            if (!activeTarget && cursor && spinTl) {
              const rot = gsap.getProperty(cursor, 'rotation');
              const normalized = rot % 360;
              spinTl.kill();
              spinTl = gsap.timeline({ repeat: -1 }).to(cursor, { rotation: '+=360', duration: spinDuration, ease: 'none' });
              gsap.to(cursor, {
                rotation: normalized + 360,
                duration: spinDuration * (1 - normalized / 360),
                ease: 'none',
                onComplete: () => { if (spinTl) spinTl.restart(); }
              });
            }
            resumeTimeout = null;
          }, 50);

          cleanupTarget(target);
        };

        currentLeaveHandler = leaveHandler;
        target.addEventListener('mouseleave', leaveHandler);
      };

      window.addEventListener('mouseover', enterHandler, { passive: true });

    window.addEventListener('resize', () => {
      containingBlock = getContainingBlock(cursor);
    });
  })();

  /* ── CardSwap — React Bits port (vanilla JS + GSAP) ── */
  (function () {
    const container = document.getElementById('card-swap');
    if (!container || !window.gsap) return;

    const cards = Array.from(container.querySelectorAll('.swap-card'));
    const total = cards.length;
    if (total < 2) return;

    const cardDistance = 60;
    const verticalDistance = 70;
    const delay = 3500;
    const pauseOnHover = true;
    const skewAmount = 4;
    const config = {
      ease: 'elastic.out(0.6,0.9)',
      durDrop: 2,
      durMove: 2,
      durReturn: 2,
      promoteOverlap: 0.9,
      returnDelay: 0.05
    };

    const makeSlot = (i, distX, distY, n) => ({
      x: i * distX,
      y: -i * distY,
      z: -i * distX * 1.5,
      zIndex: n - i
    });

    const placeNow = (el, slot, skew) =>
      gsap.set(el, {
        x: slot.x,
        y: slot.y,
        z: slot.z,
        xPercent: -50,
        yPercent: -50,
        skewY: skew,
        transformOrigin: 'center center',
        zIndex: slot.zIndex,
        force3D: true
      });

    const order = Array.from({ length: total }, (_, i) => i);
    let tl = null;
    let interval = null;

    const curEl = document.getElementById('swap-current');
    const totalEl = document.getElementById('swap-total');
    if (totalEl) totalEl.textContent = String(total).padStart(2, '0');

    const renderOrder = () => {
      if (curEl) curEl.textContent = String(order[0] + 1).padStart(2, '0');
    };

    const swap = () => {
      if (order.length < 2) return;
      const front = order.shift();
      const elFront = cards[front];
      const t = gsap.timeline();
      tl = t;

      t.to(elFront, { y: '+=500', duration: config.durDrop, ease: config.ease });

      t.addLabel('promote', `-=${config.durDrop * config.promoteOverlap}`);
      order.forEach((idx, i) => {
        const el = cards[idx];
        const slot = makeSlot(i, cardDistance, verticalDistance, total);
        t.set(el, { zIndex: slot.zIndex }, 'promote');
        t.to(el, { x: slot.x, y: slot.y, z: slot.z, duration: config.durMove, ease: config.ease }, `promote+=${i * 0.15}`);
      });

      const backSlot = makeSlot(total - 1, cardDistance, verticalDistance, total);
      t.addLabel('return', `promote+=${config.durMove * config.returnDelay}`);
      t.call(() => {
        gsap.set(elFront, { zIndex: backSlot.zIndex });
      }, undefined, 'return');
      t.to(elFront, { x: backSlot.x, y: backSlot.y, z: backSlot.z, duration: config.durReturn, ease: config.ease }, 'return');
      t.call(() => {
        order.push(front);
        renderOrder();
      });
    };

    cards.forEach((c, i) => placeNow(c, makeSlot(i, cardDistance, verticalDistance, total), skewAmount));
    renderOrder();

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    swap();
    if (!reduced) interval = setInterval(swap, delay);

    if (pauseOnHover && !reduced) {
      const pause = () => {
        if (tl) tl.pause();
        clearInterval(interval);
      };
      const resume = () => {
        if (tl) tl.play();
        interval = setInterval(swap, delay);
      };
      container.addEventListener('mouseenter', pause);
      container.addEventListener('mouseleave', resume);
    }

    const goNext = () => {
      if (reduced) return;
      clearInterval(interval);
      if (tl) tl.progress(1);
      swap();
      interval = setInterval(swap, delay);
    };

    const goPrev = () => {
      if (reduced) return;
      clearInterval(interval);
      if (tl) tl.progress(1);
      const back = order.pop();
      const elBack = cards[back];
      const t = gsap.timeline();
      tl = t;
      order.forEach((idx, i) => {
        const el = cards[idx];
        const slot = makeSlot(i + 1, cardDistance, verticalDistance, total);
        t.to(el, { x: slot.x, y: slot.y, z: slot.z, zIndex: slot.zIndex, duration: config.durMove, ease: config.ease }, i * 0.12);
      });
      const frontSlot = makeSlot(0, cardDistance, verticalDistance, total);
      t.set(elBack, { zIndex: frontSlot.zIndex }, 0.1);
      t.to(elBack, { x: frontSlot.x, y: frontSlot.y, z: frontSlot.z, duration: config.durReturn, ease: config.ease }, 0.15);
      t.call(() => {
        order.unshift(back);
        renderOrder();
      });
      interval = setInterval(swap, delay);
    };

    const nextBtn = document.getElementById('swap-next');
    const prevBtn = document.getElementById('swap-prev');
    if (nextBtn) nextBtn.addEventListener('click', goNext);
    if (prevBtn) prevBtn.addEventListener('click', goPrev);

    cards.forEach(c => {
      c.addEventListener('click', e => {
        if (e.target.closest('a')) return;
        const link = c.dataset.link;
        if (link) window.open(link, '_blank', 'noopener');
      });
    });
  })();

(function () {
    if (!window.gsap) return;
    const roots = document.querySelectorAll('.accordion-gallery');
    roots.forEach(root => {
      const panels = Array.from(root.children).filter(el => el.classList.contains('ag-panel'));
      const count = panels.length;
      if (!count) return;

      const num = (v, d) => { const n = parseFloat(root.dataset[v]); return isNaN(n) ? d : n; };
      const opts = {
        defaultIndex: num('defaultIndex', Math.floor(count / 2)),
        accentColor: root.dataset.accent || '#FF2D00',
        overlayColor: root.dataset.overlay || '#0a0a0a',
        textColor: root.dataset.text || '#ffffff',
        height: num('height', 460),
        gap: num('gap', 10),
        radius: num('radius', 16),
        expandRatio: num('expandRatio', 0.52),
        vertical: (root.dataset.orientation || 'horizontal') === 'vertical',
        duration: num('duration', 0.6),
        ease: root.dataset.ease || 'power3.out',
        parallax: num('parallax', 0.5),
        tilt: num('tilt', 8),
        stagger: num('stagger', 0.06),
        trigger: root.dataset.trigger || 'hover',
        showLabels: root.dataset.showLabels !== 'false',
        grayscale: root.dataset.grayscale !== 'false'
      };

      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      root.style.setProperty('--ag-accent', opts.accentColor);
      root.style.setProperty('--ag-overlay', opts.overlayColor);
      root.style.setProperty('--ag-text', opts.textColor);
      root.style.setProperty('--ag-gap', opts.gap + 'px');
      root.style.setProperty('--ag-radius', opts.radius + 'px');
      root.style.setProperty('--ag-media-size', '320px');
      if (opts.vertical) root.classList.add('accordion-gallery--vertical');
      if (!opts.vertical) root.style.height = opts.height + 'px';

      let active = Math.min(Math.max(opts.defaultIndex, 0), count - 1);
      let mediaSize = 320;
      let tl = null;

      function applyLayout(animate) {
        if (!panels.length) return;
        const r = Math.min(Math.max(opts.expandRatio, 0.2), 0.9);
        const grow = count > 1 ? (r * (count - 1)) / (1 - r) : 1;
        const dur = animate && !prefersReduced ? opts.duration : 0;
        if (tl) tl.kill();
        tl = gsap.timeline();
        panels.forEach((panel, i) => {
          const isActive = i === active;
          const media = panel.querySelector('.ag-panel__media');
          const bar = panel.querySelector('.ag-panel__bar');
          const text = panel.querySelector('.ag-panel__text');
          const rot = isActive ? 0 : (i < active ? opts.tilt : -opts.tilt);
          const rotProp = opts.vertical ? { rotateX: -rot } : { rotateY: rot };
          tl.to(panel, { flexGrow: isActive ? grow : 1, ...rotProp, duration: dur, ease: opts.ease }, 0);
          if (media) {
            const drift = Math.max(-1.5, Math.min(1.5, active - i));
            const shift = drift * opts.parallax * mediaSize * 0.06;
            const gray = opts.grayscale ? (isActive ? 0 : 1) : 0;
            tl.to(media, {
              xPercent: -50, yPercent: -50,
              x: opts.vertical ? 0 : (isActive ? 0 : shift),
              y: opts.vertical ? (isActive ? 0 : shift) : 0,
              '--ag-gray': gray,
              '--ag-dim': isActive ? 0 : 0.35,
              duration: dur, ease: opts.ease
            }, 0);
          }
          if (opts.showLabels && bar && text) {
            if (isActive) {
              tl.to([bar, text], { opacity: 1, x: 0, duration: dur, ease: opts.ease, stagger: prefersReduced ? 0 : opts.stagger }, 0);
            } else {
              tl.to([bar, text], { opacity: 0, x: -14, duration: dur * 0.6, ease: opts.ease }, 0);
            }
          }
        });
      }

      function setActive(i, animate) {
        active = i;
        panels.forEach((p, idx) => p.classList.toggle('ag-panel--active', idx === i));
        applyLayout(animate);
      }

      function measure() {
        const rect = root.getBoundingClientRect();
        const total = opts.vertical ? rect.height : rect.width;
        const usable = Math.max(total - opts.gap * (count - 1), 120);
        const size = Math.max(140, usable * Math.min(Math.max(opts.expandRatio, 0.2), 0.9) * 1.22);
        mediaSize = size;
        root.style.setProperty('--ag-media-size', size + 'px');
        applyLayout(true);
      }

      panels.forEach((panel, i) => {
        if (opts.trigger === 'hover') panel.addEventListener('mouseenter', () => setActive(i, true));
        panel.addEventListener('click', (e) => {
          if (i !== active) { e.preventDefault(); setActive(i, true); }
        });
        panel.addEventListener('focus', () => setActive(i, true));
        panel.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); setActive((i + 1) % count, true); }
          else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); setActive((i - 1 + count) % count, true); }
        });
      });

      setActive(active, false);
      requestAnimationFrame(measure);

      if ('ResizeObserver' in window) {
        const ro = new ResizeObserver(() => measure());
        ro.observe(root);
      }
    });
  })();