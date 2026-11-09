// Page-wide motion: Lenis smooth scroll, velocity marquee, parallax,
// scroll-scrubbed statement, project cover parallax, contact glow.
document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

  /* ---------- Smooth scroll (Lenis) ---------- */
  let lenis = null;
  if (!reduceMotion && finePointer && typeof window.Lenis === "function") {
    lenis = new window.Lenis({ duration: 1.15, easing: t => 1 - Math.pow(1 - t, 4), smoothWheel: true });
    const sync = () => {
      if (!body.classList.contains("ready") || body.style.overflow === "hidden") lenis.stop();
      else lenis.start();
    };
    sync();
    new MutationObserver(sync).observe(body, { attributes: true, attributeFilter: ["class", "style"] });

    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener("click", e => {
        const id = link.getAttribute("href");
        const target = id.length > 1 ? document.querySelector(id) : null;
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(id === "#home" ? 0 : target, { offset: id === "#home" ? 0 : -24 });
        history.replaceState(null, "", id);
      });
    });
  }

  /* ---------- Scrubbed statement: split into words ---------- */
  const scrubs = [...document.querySelectorAll(".scrub-text")].map(el => {
    const words = [];
    const walk = node => {
      [...node.childNodes].forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
            const span = document.createElement("span");
            span.className = "sw";
            span.textContent = part;
            words.push(span);
            frag.appendChild(span);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          walk(child);
        }
      });
    };
    walk(el);
    if (reduceMotion) words.forEach(w => w.classList.add("on"));
    return { el, words, lit: -1 };
  });

  /* ---------- Velocity marquee ---------- */
  const marquees = [...document.querySelectorAll(".marquee")].map(el => {
    el.classList.add("js-driven");
    const m = { el, track: el.querySelector(".marquee-track"), x: 0, dir: Number(el.dataset.dir) || -1, hover: false, visible: true };
    el.addEventListener("pointerenter", () => { m.hover = true; });
    el.addEventListener("pointerleave", () => { m.hover = false; });
    new IntersectionObserver(([e]) => { m.visible = e.isIntersecting; }).observe(el);
    return m;
  });

  /* ---------- Parallax targets ---------- */
  const parallax = [...document.querySelectorAll("[data-speed]")].map(el => ({
    el, speed: parseFloat(el.dataset.speed) || 0, fade: el.hasAttribute("data-fade")
  }));

  /* ---------- Main loop ---------- */
  let lastY = window.scrollY;
  let velocity = 0;
  let scrollDir = 1;
  const loop = time => {
    if (lenis) lenis.raf(time);
    const y = window.scrollY;
    const vh = window.innerHeight;
    const delta = y - lastY;
    lastY = y;
    velocity += (delta - velocity) * 0.12;
    if (Math.abs(delta) > 0.5) scrollDir = delta > 0 ? 1 : -1;

    if (!reduceMotion) {
      marquees.forEach(m => {
        if (!m.visible || !m.track) return;
        const half = m.track.scrollWidth / 2;
        const speed = (m.hover ? 0.3 : 0.8) + Math.min(Math.abs(velocity) * 0.5, 20);
        m.x += speed * m.dir * scrollDir;
        if (m.x <= -half) m.x += half;
        if (m.x > 0) m.x -= half;
        const skew = clamp(velocity * 0.2, -6, 6);
        m.track.style.transform = `translate3d(${m.x}px,0,0) skewX(${-skew}deg)`;
      });

      parallax.forEach(p => {
        const r = p.el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        const offset = (r.top + r.height / 2 - vh / 2) * -p.speed;
        p.el.style.translate = `0 ${offset.toFixed(1)}px`;
        if (p.fade) p.el.style.opacity = clamp(1 - y / (vh * 0.9), 0, 1).toFixed(3);
      });

      scrubs.forEach(s => {
        const r = s.el.getBoundingClientRect();
        const progress = clamp((vh * 0.85 - r.top) / (r.height + vh * 0.25), 0, 1);
        const lit = Math.round(progress * s.words.length);
        if (lit === s.lit) return;
        s.words.forEach((w, i) => w.classList.toggle("on", i < lit));
        s.lit = lit;
      });
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  if (!finePointer || reduceMotion) return;

  /* ---------- Project cover parallax ---------- */
  document.querySelectorAll(".work-card").forEach(card => {
    const cover = card.querySelector(".work-cover");
    card.addEventListener("pointermove", e => {
      const r = cover.getBoundingClientRect();
      cover.style.setProperty("--mx", (((e.clientX - r.left) / r.width) - 0.5).toFixed(3));
      cover.style.setProperty("--my", (((e.clientY - r.top) / r.height) - 0.5).toFixed(3));
    });
    card.addEventListener("pointerleave", () => {
      cover.style.setProperty("--mx", 0);
      cover.style.setProperty("--my", 0);
    });
  });

  /* ---------- Contact glow follows pointer ---------- */
  const panel = document.querySelector(".contact-panel");
  const glow = document.querySelector(".contact-glow");
  panel?.addEventListener("pointermove", e => {
    const r = panel.getBoundingClientRect();
    glow.style.setProperty("--ox", `${(e.clientX - r.right) * 0.5 + 180}px`);
    glow.style.setProperty("--oy", `${(e.clientY - r.top) * 0.5 - 40}px`);
  });
  panel?.addEventListener("pointerleave", () => {
    glow.style.setProperty("--ox", "0px");
    glow.style.setProperty("--oy", "0px");
  });
});
