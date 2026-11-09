# Amir Sohel — Portfolio

A responsive, static portfolio built with HTML, CSS, and vanilla JavaScript for GitHub Pages.

## Files
- `index.html` — page structure and content
- `assets/css/style.css` — design system (warm neutrals + signal-orange accent, 12-col grid) and responsive layout
- `assets/js/script.js` — preloader, split-text hero, rotating words, typewriter code card, sliding nav indicator, Dhaka clock, scroll reveals, timeline progress, magnetic buttons, copy-link
- `assets/js/system.js` — hero "request lifecycle" diagram: animated requests through a Laravel backend, synced with the hero headline
- `assets/js/motion.js` — Lenis smooth scroll, velocity marquee, parallax, scroll-scrubbed statement, project cover parallax, contact glow

All animations respect `prefers-reduced-motion`. Smooth scroll, magnetic buttons and cover parallax run only on devices with a fine pointer (mouse/trackpad).

## Deploy to GitHub Pages
1. Extract this ZIP.
2. Upload the contents (not the outer folder) to the root of `AMIRSOHELAKASH/amirsohelakash.github.io`.
3. Commit the files to the `main` branch.
4. Open **Settings → Pages**.
5. Select **Deploy from a branch**, branch `main`, folder `/ (root)`, then Save.
6. Wait for the deployment to finish. Your site should appear at `https://amirsohelakash.github.io`.

## Before publishing
- Add your own profile photo if you want one.
- Add your LinkedIn URL and public project/demo links when ready.
- Review project descriptions and only publish details you are allowed to share.
- Add a CV PDF if you want a Download CV button.

No build tools or framework are required.
