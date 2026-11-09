# Veles Garage Door Service — website

Apple-style, interactive one-page site for https://velesgaragedoorservice.com/ (Tomball, TX).
Plain HTML/CSS/JS, no build step, served by GitHub Pages from `main`.

```
index.html            the page
assets/css/site.css   styles, light + dark theme
assets/js/site.js     all interactions
assets/img/           Veles job photos, logo, favicon, Pexels stock (files starting with stock-)
```

Preview locally: `python3 -m http.server` → http://localhost:8000

## Interactive pieces

- **Hero door** — the garage door rolls up as you scroll; drag it with the mouse or press the remote to open/close.
- **Why Veles bento** — tilt-on-hover cards, animated text-message demo ("Text a photo. Get a price."), live Tomball clock (24/7), rotating brand list, award.
- **Exploded view** — scroll takes a door apart (opener, spring, cables, tracks, rollers, panels, sensors); tap any part for symptoms, price and "safe to use?".
- **Manifesto** — words light up as you scroll.
- **Spring life check** — slider + spring type + install year → years of life left, animated spring.
- **Price it in seconds** — two modes:
  - *Design a new door*: width, style, color, windows, insulation, opener; live SVG preview with a person for scale and a day/night switch.
  - *Price a repair*: service, size, timing, add-ons.
  Both animate the total and can text the result to (832) 606-6633.
- **Recent work** carousel with drag + lightbox, two-way review marquee, **ZIP / city checker** for the service area, FAQ, callback form.
- Light/dark theme (circular transition), sticky Call/Text bar on phones, reduced-motion support.

## Before launch — confirm with the owner

- **All prices are samples**: exploded-view prices, chat demo ($320), FAQ, door configurator model (`STYLES`, `COLORS` in `site.js`), repair model (`PRICE` in `site.js`).
- Brand list, "within the hour" claim, ZIP list (`AREAS` in `site.js`).
- Callback form: set `FORM_ENDPOINT` in `site.js`; without it the form opens a prefilled SMS.
- Stock photos (Pexels license, free for commercial use): `stock-garage-interior` (Peter Vang), `stock-dusk-home` (Binyamin Mellish), others unused but kept for later sections. Replace with own photos when available.
