document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- Split hero title into characters ---------- */
  let charIndex = 0;
  document.querySelectorAll(".split").forEach(el => {
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = "";
    el.setAttribute("aria-label", words.join(" "));
    words.forEach((word, wi) => {
      const wordSpan = document.createElement("span");
      wordSpan.style.display = "inline-block";
      wordSpan.style.whiteSpace = "nowrap";
      wordSpan.setAttribute("aria-hidden", "true");
      [...word].forEach(ch => {
        const c = document.createElement("span");
        c.className = "char";
        c.textContent = ch;
        c.style.setProperty("--i", charIndex++);
        wordSpan.appendChild(c);
      });
      el.appendChild(wordSpan);
      if (wi < words.length - 1) el.appendChild(document.createTextNode(" "));
    });
  });

  /* ---------- Split section headings into words ---------- */
  document.querySelectorAll(".reveal-words").forEach(el => {
    let i = 0;
    const walk = node => {
      [...node.childNodes].forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) {
          const parts = child.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          parts.forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
            const outer = document.createElement("span");
            outer.className = "w";
            const inner = document.createElement("span");
            inner.textContent = part;
            inner.style.setProperty("--i", i++);
            outer.appendChild(inner);
            frag.appendChild(outer);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          walk(child);
        }
      });
    };
    walk(el);
  });

  /* ---------- Preloader ---------- */
  const loader = document.querySelector(".loader");
  const loaderNum = document.getElementById("loader-num");
  const loaderBar = document.querySelector(".loader-bar i");
  const finishLoading = () => {
    loader?.classList.add("done");
    body.classList.remove("is-loading");
    body.classList.add("ready");
    startTyping();
  };
  if (reduceMotion || !loader) {
    finishLoading();
  } else {
    const duration = 1300;
    const start = performance.now();
    const tick = now => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = Math.round(eased * 100);
      loaderNum.textContent = value;
      loaderBar.style.setProperty("--p", eased);
      if (t < 1) requestAnimationFrame(tick);
      else setTimeout(finishLoading, 250);
    };
    requestAnimationFrame(tick);
  }

  /* ---------- Typewriter code card ---------- */
  const codeLines = [
    [["purple", "class"], ["", " "], ["cyan", "Developer"]],
    [["", "{"]],
    [["", "  "], ["purple", "public string"], ["", " $name"]],
    [["", "    = "], ["green", "'Amir Akash'"], ["", ";"]],
    [],
    [["", "  "], ["purple", "public function"], ["", " "], ["yellow", "build"], ["", "()"]],
    [["", "  {"]],
    [["", "    "], ["purple", "return"], ["", " "], ["green", "'Useful software'"], ["", ";"]],
    [["", "  }"]],
    [["", "}"]]
  ];
  const codeEl = document.querySelector("#code-lines code");
  const codeStatus = document.getElementById("code-status");
  const escapeHtml = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const renderCode = (upToLine, upToChar, caret) => {
    let html = "";
    codeLines.forEach((tokens, li) => {
      if (li > upToLine) return;
      html += `<span class="ln">${String(li + 1).padStart(2, "0")}</span>`;
      let remaining = li < upToLine ? Infinity : upToChar;
      tokens.forEach(([cls, text]) => {
        if (remaining <= 0) return;
        const piece = escapeHtml(text.slice(0, remaining));
        remaining -= text.length;
        html += cls ? `<span class="${cls}">${piece}</span>` : piece;
      });
      if (caret && li === upToLine) html += '<span class="caret"></span>';
      html += "\n";
    });
    codeEl.innerHTML = html;
  };
  let typingStarted = false;
  function startTyping() {
    if (!codeEl || typingStarted) return;
    typingStarted = true;
    const lastLine = codeLines.length - 1;
    if (reduceMotion) {
      renderCode(lastLine, Infinity, true);
      if (codeStatus) codeStatus.textContent = "Ready to build";
      return;
    }
    let line = 0, ch = 0;
    const step = () => {
      const lineLength = codeLines[line].reduce((n, [, t]) => n + t.length, 0);
      renderCode(line, ch, true);
      if (ch < lineLength) {
        ch++;
        setTimeout(step, 22 + Math.random() * 40);
      } else if (line < lastLine) {
        line++; ch = 0;
        setTimeout(step, 120);
      } else if (codeStatus) {
        codeStatus.textContent = "Ready to build";
      }
    };
    setTimeout(step, 900);
  }

  /* ---------- Rotating words ---------- */
  const rotatorWords = document.querySelectorAll(".rotator b");
  if (rotatorWords.length > 1 && !reduceMotion) {
    let current = 0;
    setInterval(() => {
      const prev = rotatorWords[current];
      current = (current + 1) % rotatorWords.length;
      prev.classList.remove("is-active");
      prev.classList.add("is-leaving");
      rotatorWords[current].classList.remove("is-leaving");
      rotatorWords[current].classList.add("is-active");
      setTimeout(() => prev.classList.remove("is-leaving"), 600);
    }, 2400);
  }

  /* ---------- Mobile menu ---------- */
  const menuButton = document.querySelector(".menu-toggle");
  const navLinks = document.querySelector(".nav-links");
  menuButton?.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
    body.style.overflow = isOpen ? "hidden" : "";
  });
  navLinks?.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      menuButton?.setAttribute("aria-expanded", "false");
      body.style.overflow = "";
    });
  });

  /* ---------- Year + copy link ---------- */
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  const toast = document.querySelector(".toast");
  const copyButton = document.getElementById("copy-profile");
  copyButton?.addEventListener("click", async () => {
    const value = copyButton.dataset.copy;
    try {
      await navigator.clipboard.writeText(value);
      toast.textContent = "GitHub profile link copied";
    } catch {
      toast.textContent = value;
    }
    toast.classList.add("show");
    window.setTimeout(() => toast.classList.remove("show"), 2200);
  });

  /* ---------- Scroll reveal (with sibling stagger) ---------- */
  const revealItems = document.querySelectorAll(".reveal, .reveal-words");
  revealItems.forEach(item => {
    const siblings = [...item.parentElement.children].filter(c => c.classList.contains("reveal"));
    const idx = siblings.indexOf(item);
    if (idx > 0) item.style.setProperty("--rd", `${Math.min(idx, 5) * 0.08}s`);
  });
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealItems.forEach(item => observer.observe(item));
  } else {
    revealItems.forEach(item => item.classList.add("visible"));
  }

  /* ---------- Active nav section ---------- */
  const sections = document.querySelectorAll("main section[id]");
  const navAnchors = document.querySelectorAll(".nav-links a[href^='#']");
  if ("IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navAnchors.forEach(anchor => {
            anchor.classList.toggle("active", anchor.getAttribute("href") === `#${entry.target.id}`);
          });
        }
      });
    }, { rootMargin: "-35% 0px -55% 0px" });
    sections.forEach(section => sectionObserver.observe(section));
  }

  /* ---------- Scroll-driven: progress, header, timeline ---------- */
  const header = document.querySelector(".site-header");
  const progress = document.querySelector(".scroll-progress");
  const timeline = document.querySelector(".timeline");
  const timelineFill = document.querySelector(".timeline-fill");
  const timelineItems = document.querySelectorAll(".timeline-item");
  let lastY = window.scrollY;
  let ticking = false;
  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress?.style.setProperty("--sp", max > 0 ? y / max : 0);

    header?.classList.toggle("scrolled", y > 20);
    const menuOpen = navLinks?.classList.contains("open");
    header?.classList.toggle("hide", !menuOpen && y > lastY && y > 400);
    lastY = y;

    if (timeline && timelineFill) {
      const rect = timeline.getBoundingClientRect();
      const anchor = window.innerHeight * 0.6;
      const p = Math.min(Math.max((anchor - rect.top) / rect.height, 0), 1);
      timelineFill.style.setProperty("--tp", p);
      timelineItems.forEach(item => {
        const dot = item.querySelector(".timeline-dot").getBoundingClientRect();
        item.classList.toggle("lit", dot.top < anchor);
      });
    }
    ticking = false;
  };
  window.addEventListener("scroll", () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  /* ---------- Glow cards (mouse-follow border) ---------- */
  document.querySelectorAll(".glow-card").forEach(card => {
    card.addEventListener("pointermove", e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--gx", `${e.clientX - r.left}px`);
      card.style.setProperty("--gy", `${e.clientY - r.top}px`);
    });
  });

  if (!finePointer || reduceMotion) return;

  /* ---------- Desktop-only: spotlight + cursor ---------- */
  const root = document.documentElement;
  const cursor = document.querySelector(".cursor");
  const dot = document.querySelector(".cursor-dot");
  const ring = document.querySelector(".cursor-ring");
  let mx = window.innerWidth / 2, my = window.innerHeight / 2, rx = mx, ry = my;
  window.addEventListener("pointermove", e => {
    mx = e.clientX; my = e.clientY;
    root.style.setProperty("--mx", `${mx}px`);
    root.style.setProperty("--my", `${my}px`);
    dot.style.transform = `translate(${mx}px, ${my}px)`;
    cursor.classList.remove("hidden");
  });
  document.addEventListener("pointerleave", () => cursor.classList.add("hidden"));
  const followRing = () => {
    rx += (mx - rx) * 0.16;
    ry += (my - ry) * 0.16;
    ring.style.transform = `translate(${rx}px, ${ry}px)`;
    requestAnimationFrame(followRing);
  };
  followRing();
  document.querySelectorAll("a, button, .project-card, .skill-card").forEach(el => {
    el.addEventListener("pointerenter", () => cursor.classList.add("hover"));
    el.addEventListener("pointerleave", () => cursor.classList.remove("hover"));
  });

  /* ---------- Magnetic buttons ---------- */
  document.querySelectorAll(".magnetic").forEach(el => {
    el.addEventListener("pointermove", e => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      el.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
    });
    el.addEventListener("pointerleave", () => { el.style.transform = ""; });
  });

  /* ---------- 3D tilt ---------- */
  document.querySelectorAll(".tilt").forEach(el => {
    el.addEventListener("pointermove", e => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `rotateX(${(-py * 10).toFixed(2)}deg) rotateY(${(px * 12).toFixed(2)}deg)`;
    });
    el.addEventListener("pointerleave", () => { el.style.transform = ""; });
  });
});
