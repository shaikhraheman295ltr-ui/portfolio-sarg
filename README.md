# AR.DEV — Portfolio

> **🔴 Live demo:** [https://portfolio-sarg.vercel.app](https://portfolio-sarg.vercel.app)

Personal portfolio of **Shaikh Abdul Raheman Gaffar** — Full-Stack & Frontend Developer, 2nd-year CS student at COCSIT Latur, shipping real things beyond the curriculum.

Built with **raw HTML, CSS & JavaScript** — no frameworks, no build step, no dependencies to install.

## ✨ Highlights

- **Brutalist design system** — pure `#000` canvas, 3px solid borders, zero border-radius, hard offset shadows, one saturated red (`#FF2D00`)
- **CardSwap project deck** — 3D rotating cards (React Bits port, vanilla JS + GSAP), hover-to-pause, prev/next, click-to-open live links
- **AccordionGallery services** — tilt/parallax panels with grayscale-to-color active state (React Bits port)
- **TargetCursor** — corner-bracket custom cursor that locks onto interactive elements (desktop only, auto-disabled on touch)
- **WebGL "light pillar" background** — raymarched shader (Three.js) with automatic quality tiers for low-end devices & phones
- **Typewriter role line**, scroll-reveal sections, animated skill bars
- **Working contact form** via FormSubmit (free, no IP restrictions)
- **Accessibility first** — WCAG AA contrast, `:focus-visible` keyboard rings, full `prefers-reduced-motion` support
- **Responsive** — mobile burger drawer nav, tuned breakpoints at 768px / 520px / 480px

## 🗺 Sections

Home (hero + portrait) · About · Skills · Services · Projects · Contact

## 📁 Structure

```
index.html            markup only — sections, cards, form
css/styles.css        full brutalist theme (tokens → components → responsive)
js/main.js            typewriter, nav/drawer, scroll reveals, contact form
js/gsap-effects.js    TargetCursor + CardSwap + AccordionGallery
js/lightpillar.js     Three.js WebGL background
image/                project thumbnails & service SVGs
```

Load order matters: `main.js` → GSAP (CDN) → `gsap-effects.js` → Three.js (CDN) → `lightpillar.js`.

## 🛠 Run locally

Open `index.html` in any browser — that's it. No install, no build.

## 🚀 Deploy

Auto-deploys to **Vercel** on every push to `main` (project: `portfolio-sarg`).

First-time setup only requires `vercel link` — the `.vercel/project.json` bindings are gitignored.

## 📬 Contact

- **Email:** shaikhraheman295ltr@gmail.com
- **GitHub:** [shaikhraheman295ltr-ui](https://github.com/shaikhraheman295ltr-ui)
- **LinkedIn / Instagram** — linked on the site
