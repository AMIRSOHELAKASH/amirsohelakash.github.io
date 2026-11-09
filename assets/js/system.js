// Hero diagram: animates a request travelling through a Laravel backend.
// Each scenario matches a word in the hero rotator, and drives it.
document.addEventListener("DOMContentLoaded", () => {
  const root = document.querySelector(".system");
  if (!root) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const svg = root.querySelector(".system-svg");
  const packets = root.querySelector(".sys-packets");
  const log = root.querySelector(".system-log");
  const method = root.querySelector(".req-method");
  const path = root.querySelector(".req-path");
  const status = root.querySelector(".req-status");
  const SVG_NS = "http://www.w3.org/2000/svg";
  const $ = id => svg.querySelector(`#${id}`);
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // Scenario order matches the hero rotator words:
  // backend systems · REST APIs · payment workflows · integrations
  const scenarios = [
    {
      client: "web", method: "GET", path: "/api/reservations", result: "200 OK", ms: 86,
      hops: [
        { to: "redis", log: "cache miss · reservations:page:1" },
        { to: "db", log: "select * from reservations · 12ms" },
        { to: "redis", log: "cache put · ttl 300s" }
      ]
    },
    {
      client: "mobile", method: "POST", path: "/api/bookings", result: "201 Created", ms: 64,
      hops: [
        { to: "db", log: "insert into bookings · tx committed" },
        { to: "queue", log: "dispatch SendBookingConfirmation" }
      ]
    },
    {
      client: "web", method: "POST", path: "/api/payments", result: "200 OK", ms: 348,
      hops: [
        { to: "ext", log: "PaymentService::charge() → gateway 200" },
        { to: "db", log: "update payments set status = 'paid'" },
        { to: "queue", log: "dispatch HandlePaymentWebhook" }
      ]
    },
    {
      client: "mobile", method: "POST", path: "/api/providers/sync", result: "202 Accepted", ms: 41,
      hops: [
        { to: "ext", log: "GET provider /rates → 200 · 180ms" },
        { to: "queue", log: "dispatch SyncProviderRates (batch 24)" },
        { to: "db", log: "upsert provider_rates · 24 rows" }
      ]
    }
  ];

  /* ---------- Log ---------- */
  // Timestamps are scaled so the log reads in "request time", ending at the scenario's ms.
  let started = performance.now();
  let scale = 1;
  const stamp = () => `+${String(Math.round((performance.now() - started) * scale)).padStart(3, "0")}ms`;
  const addLog = (text, cls = "", at = null) => {
    const li = document.createElement("li");
    if (cls) li.className = cls;
    li.innerHTML = `<span class="t">${at === null ? stamp() : `+${String(at).padStart(3, "0")}ms`}</span>`;
    li.appendChild(document.createTextNode(text));
    log.appendChild(li);
    while (log.children.length > 5) log.firstElementChild.remove();
  };

  /* ---------- Primitives ---------- */
  const flash = (el, cls = "hit", ms = 500) => {
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), ms);
  };
  const travel = (edge, { back = false, color = "#ff6a3d", duration = 460 } = {}) => new Promise(resolve => {
    const length = edge.getTotalLength();
    const dot = document.createElementNS(SVG_NS, "circle");
    dot.setAttribute("r", "4.5");
    dot.setAttribute("fill", color);
    dot.setAttribute("class", "sys-packet");
    dot.style.color = color;
    packets.appendChild(dot);
    edge.classList.add("on");
    edge.classList.toggle("back", back);
    const start = performance.now();
    const frame = now => {
      const t = Math.min((now - start) / duration, 1);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const p = edge.getPointAtLength((back ? 1 - eased : eased) * length);
      dot.setAttribute("cx", p.x);
      dot.setAttribute("cy", p.y);
      if (t < 1) requestAnimationFrame(frame);
      else {
        dot.remove();
        edge.classList.remove("on", "back");
        resolve();
      }
    };
    requestAnimationFrame(frame);
  });
  const throughLayers = async () => {
    for (let i = 0; i < 4; i++) {
      flash($(`l-${i}`), "hit", 420);
      await sleep(120);
    }
  };

  /* ---------- Scenario runner ---------- */
  const run = async (s, index) => {
    document.dispatchEvent(new CustomEvent("hero:scenario", { detail: { index } }));
    started = performance.now();
    scale = (s.ms * 0.9) / (460 + 480 + s.hops.length * 860 + 460);
    log.innerHTML = "";
    method.textContent = s.method;
    method.dataset.m = s.method;
    path.textContent = s.path;
    status.classList.remove("show");

    const clientEdge = $(`e-${s.client}`);
    flash($(`n-${s.client}`), "hit", 600);
    addLog(`→ ${s.method} ${s.path}`, "req");
    await travel(clientEdge);
    flash($("n-api"), "hit", 1200);
    await throughLayers();

    for (const hop of s.hops) {
      const edge = $(`e-${hop.to}`);
      await travel(edge, { duration: 380 });
      flash($(`n-${hop.to}`), "hit", 520);
      addLog(`  ↳ ${hop.log}`);
      await sleep(140);
      await travel(edge, { back: true, color: "#5ee6b0", duration: 340 });
    }

    flash($("n-api"), "hit", 500);
    await travel(clientEdge, { back: true, color: "#5ee6b0" });
    flash($(`n-${s.client}`), "ok", 900);
    addLog(`← ${s.result} · ${s.ms}ms`, "res", s.ms);
    status.textContent = `${s.result} · ${s.ms}ms`;
    status.classList.add("show");
  };

  /* ---------- Static state for reduced motion ---------- */
  if (reduceMotion) {
    const s = scenarios[0];
    method.textContent = s.method;
    method.dataset.m = s.method;
    path.textContent = s.path;
    addLog(`→ ${s.method} ${s.path}`, "req");
    s.hops.forEach(h => addLog(`  ↳ ${h.log}`));
    addLog(`← ${s.result} · ${s.ms}ms`, "res", s.ms);
    status.textContent = `${s.result} · ${s.ms}ms`;
    status.classList.add("show");
    return;
  }

  /* ---------- Loop: only while visible and after the preloader ---------- */
  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.2 }).observe(root);
  const waitUntil = async cond => { while (!cond()) await sleep(250); };

  (async () => {
    await waitUntil(() => document.body.classList.contains("ready"));
    await sleep(900);
    let i = 0;
    for (;;) {
      await waitUntil(() => visible && !document.hidden);
      await run(scenarios[i], i);
      await sleep(1600);
      i = (i + 1) % scenarios.length;
    }
  })();
});
