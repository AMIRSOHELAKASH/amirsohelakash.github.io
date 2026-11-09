// Core UI: text splitting, preloader, typewriter, rotator, navigation,
// clock, copy-to-clipboard, scroll reveals, timeline progress, magnetic buttons.
document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- Split hero lines into characters ---------- */
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

  /* ---------- Split headings into words ---------- */
  document.querySelectorAll(".reveal-words").forEach(el => {
    let i = 0;
    const walk = node => {
      [...node.childNodes].forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(part => {
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

  /* ---------- Typewriter code card ---------- */
  const codeLines = [
    [["purple", "class"], ["", " "], ["cyan", "Developer"]],
    [["", "{"]],
    [["", "    "], ["purple", "public string"], ["", " $name"]],
    [["", "        = "], ["green", "'Amir Sohel'"], ["", ";"]],
    [],
    [["", "    "], ["purple", "public function"], ["", " "], ["yellow", "build"], ["", "(): "], ["cyan", "string"]],
    [["", "    {"]],
    [["", "        "], ["purple", "return"], ["", " "], ["green", "'Useful software'"], ["", ";"]],
    [["", "    }"]],
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
  const startTyping = () => {
    if (!codeEl) return;
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
      if (ch < lineLength) { ch++; setTimeout(step, 22 + Math.random() * 40); }
      else if (line < lastLine) { line++; ch = 0; setTimeout(step, 120); }
      else if (codeStatus) codeStatus.textContent = "Ready to build";
    };
    step();
  };
  // Type only when the card scrolls into view.
  if (codeEl) {
    renderCode(0, 0, true);
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) { io.disconnect(); setTimeout(startTyping, 400); }
      }, { threshold: 0.4 });
      io.observe(codeEl);
    } else {
      startTyping();
    }
  }

  /* ---------- Preloader ---------- */
  const loader = document.querySelector(".loader");
  const loaderNum = document.getElementById("loader-num");
  const loaderNumFill = document.getElementById("loader-num-fill");
  const loaderStatus = document.getElementById("loader-status");
  const statuses = [[0, "Initializing"], [22, "Loading assets"], [48, "Compiling Laravel"], [74, "Booting 3D scene"], [100, "Ready"]];
  let pageLoaded = document.readyState === "complete";
  window.addEventListener("load", () => { pageLoaded = true; });

  const setStatus = text => {
    if (!loaderStatus || loaderStatus.textContent === text) return;
    loaderStatus.classList.add("swap");
    setTimeout(() => { loaderStatus.textContent = text; loaderStatus.classList.remove("swap"); }, 180);
  };
  const revealSite = () => {
    body.classList.remove("is-loading");
    body.classList.add("ready");
  };
  const finishLoading = () => {
    if (reduceMotion || !loader) {
      loader?.classList.add("done");
      revealSite();
      return;
    }
    loader.classList.add("exit");
    setTimeout(() => { loader.classList.add("open"); revealSite(); }, 750);
    setTimeout(() => loader.classList.add("done"), 1900);
  };

  if (reduceMotion || !loader) {
    finishLoading();
  } else {
    const duration = 1900;
    const start = performance.now();
    let shown = 0;
    const tick = now => {
      const elapsed = Math.max(now - start, 0);
      const t = Math.min(elapsed / duration, 1);
      let target = 1 - Math.pow(1 - t, 3);
      if (!pageLoaded && elapsed < 4500) target = Math.min(target, 0.9);
      shown += (target - shown) * 0.18;
      if (target === 1 && 1 - shown < 0.004) shown = 1;
      const pct = Math.round(shown * 100);
      const label = String(pct).padStart(3, "0");
      loaderNum.textContent = label;
      loaderNumFill.textContent = label;
      loader.style.setProperty("--p", shown.toFixed(4));
      setStatus(statuses.filter(([at]) => pct >= at).pop()[1]);
      if (shown < 1) requestAnimationFrame(tick);
      else setTimeout(finishLoading, 420);
    };
    requestAnimationFrame(tick);
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
      setTimeout(() => prev.classList.remove("is-leaving"), 700);
    }, 2600);
  }

  /* ---------- Mobile menu ---------- */
  const menuButton = document.querySelector(".menu-toggle");
  const mobileMenu = document.querySelector(".mobile-menu");
  const setMenu = open => {
    mobileMenu?.classList.toggle("open", open);
    menuButton?.setAttribute("aria-expanded", String(open));
    menuButton?.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    body.style.overflow = open ? "hidden" : "";
  };
  menuButton?.addEventListener("click", () => setMenu(!mobileMenu.classList.contains("open")));
  mobileMenu?.querySelectorAll("a").forEach(a => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", e => { if (e.key === "Escape") setMenu(false); });

  /* ---------- Year + Dhaka clock ---------- */
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
  const clocks = document.querySelectorAll("[data-clock]");
  const clockFmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dhaka" });
  const tickClock = () => { const t = clockFmt.format(new Date()); clocks.forEach(c => { c.textContent = t; }); };
  tickClock();
  setInterval(tickClock, 15000);

  /* ---------- Copy link ---------- */
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
    setTimeout(() => toast.classList.remove("show"), 2200);
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
        if (entry.isIntersecting) { entry.target.classList.add("visible"); observer.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealItems.forEach(item => observer.observe(item));
  } else {
    revealItems.forEach(item => item.classList.add("visible"));
  }

  /* ---------- Nav: active section + sliding indicator ---------- */
  const pill = document.querySelector(".nav-pill");
  const indicator = document.querySelector(".nav-indicator");
  const pillLinks = [...document.querySelectorAll(".nav-pill a")];
  const moveIndicator = link => {
    if (!indicator || !pill) return;
    if (!link) { indicator.style.opacity = "0"; return; }
    const p = pill.getBoundingClientRect();
    const r = link.getBoundingClientRect();
    indicator.style.width = `${r.width}px`;
    indicator.style.transform = `translateX(${r.left - p.left}px)`;
    indicator.style.opacity = "1";
  };
  let activeLink = null;
  pillLinks.forEach(link => {
    link.addEventListener("pointerenter", () => moveIndicator(link));
    link.addEventListener("pointerleave", () => moveIndicator(activeLink));
  });
  if ("IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        activeLink = pillLinks.find(a => a.getAttribute("href") === `#${entry.target.id}`) || null;
        pillLinks.forEach(a => a.classList.toggle("active", a === activeLink));
        moveIndicator(activeLink);
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    document.querySelectorAll("main section[id]").forEach(s => sectionObserver.observe(s));
  }
  window.addEventListener("resize", () => moveIndicator(activeLink));

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
    const menuOpen = mobileMenu?.classList.contains("open");
    header?.classList.toggle("hide", !menuOpen && y > lastY && y > 500);
    lastY = y;

    if (timeline && timelineFill) {
      const rect = timeline.getBoundingClientRect();
      const anchor = window.innerHeight * 0.6;
      timelineFill.style.setProperty("--tp", Math.min(Math.max((anchor - rect.top) / rect.height, 0), 1));
      timelineItems.forEach(item => {
        item.classList.toggle("lit", item.querySelector(".timeline-dot").getBoundingClientRect().top < anchor);
      });
    }
    ticking = false;
  };
  window.addEventListener("scroll", () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  /* ---------- Bento glow follows pointer ---------- */
  document.querySelectorAll(".bento-card").forEach(card => {
    card.addEventListener("pointermove", e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--gx", `${e.clientX - r.left}px`);
      card.style.setProperty("--gy", `${e.clientY - r.top}px`);
    });
  });

  /* ---------- Magnetic buttons (mouse only) ---------- */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll(".magnetic").forEach(el => {
      el.addEventListener("pointermove", e => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${x * 0.22}px, ${y * 0.3}px)`;
      });
      el.addEventListener("pointerleave", () => { el.style.transform = ""; });
    });
  }
});
