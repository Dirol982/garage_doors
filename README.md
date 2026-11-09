# Veles Garage Door Service — new website

Static redesign of https://velesgaragedoorservice.com/ (Tomball, TX). Plain HTML/CSS/JS, no build step, ready for GitHub Pages.

```
index.html            the page
assets/css/site.css   styles, light + dark theme
assets/js/site.js     theme switch, symptom picker, price calculator, transitions, form
assets/img/           the company's own job photos (from the current site), logo, favicon
```

Preview locally: open `index.html`, or `python3 -m http.server` and visit http://localhost:8000.

## Positioning (USP)

Competitors around Tomball fall into two groups: franchises (Precision Door: 1,400+ reviews, 90-day workmanship promise, "no service fees", call center) and lead-gen sites with generic claims ("15-minute response", 555 numbers). Veles wins on what neither can say:

1. **Text a photo, get a price before we drive out.** Real flow from reviews (Travis B.). Every CTA on the site opens a prefilled SMS.
2. **Owner-operated, no call center.** The person who reads the text shows up with the parts (Dmitri, named in reviews).
3. **Prices on the page.** Most local competitors hide them. Here: a price table, a symptom picker and a calculator.
4. **Same day, 24/7, 5.0 rating, 2025 "Best Garage Door Contractor in Texas"** (Garage Door Galaxy).

## What's on the page

- Two-by-two hero board: name, real install photo, the Veles truck, the SMS offer, 24/7 + rating.
- **"What's your door doing?"** symptom picker: likely cause, typical price, whether it's safe to use, prefilled SMS.
- Mosaic: one finished door photo cut across tiles that assemble on scroll.
- Price table (cards on phones) + **interactive price calculator** (service, size, material, timing, add-ons; animated total; "Text this to Veles").
- Review, "Text, price, fixed" process diagram, drag gallery of real jobs with reviews, FAQ, booking form, block wordmark footer.
- Light / dark theme (follows the system, remembers the choice, circular view-transition switch).
- Transitions: key sections arrive like a sectional garage door rolling up; staggered reveals; hero scales back on scroll; drifting photo strip.
- Phone: sticky Call / Text bar, click-to-call everywhere, A2P-compliant SMS consent text.
- LocalBusiness JSON-LD, Open Graph, `prefers-reduced-motion` support, keyboard-accessible controls.

## Before launch — confirm with the owner

- **All prices are sample ranges** (table, symptom picker, calculator model at the top of the calculator block in `assets/js/site.js`, FAQ). Replace with real numbers.
- After-hours surcharge ($75–$125) and add-on prices: samples.
- Brand list in the FAQ (LiftMaster, Chamberlain, Genie, Clopay, Amarr) and the "within minutes" text-reply promise.
- Service area list.
- Booking form: set `FORM_ENDPOINT` in `assets/js/site.js` (Formspree, CRM webhook…). Without it the form opens a prefilled text message to (832) 606-6633.
- Policy pages and the wind-rated blog post still link to the current WordPress site.
