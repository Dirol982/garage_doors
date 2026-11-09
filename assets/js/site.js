/* Veles Garage Door Service — interactions.
   The page reads and works without this file; everything here is enhancement. */
(function () {
  'use strict';

  var PHONE = '+18326066633';
  /* Paste a form endpoint (Formspree, Getform, CRM webhook) to receive callback requests.
     Left empty, the callback form opens a prefilled text message instead. */
  var FORM_ENDPOINT = '';

  var root = document.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var ease = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var money = function (n) { return '$' + Math.round(n).toLocaleString('en-US'); };
  var sms = function (body) { return 'sms:' + PHONE + '?&body=' + encodeURIComponent(body); };

  /* animated number range */
  function rangeAnimator(el) {
    var cur = [0, 0], raf = 0;
    return function (lo, hi) {
      if (reduce || !cur[1]) { cur = [lo, hi]; el.textContent = money(lo) + '–' + money(hi); return; }
      var from = cur.slice(), t0 = performance.now();
      cancelAnimationFrame(raf);
      (function step(t) {
        var k = Math.min(1, (t - t0) / 600), e = 1 - Math.pow(1 - k, 3);
        el.textContent = money(from[0] + (lo - from[0]) * e) + '–' + money(from[1] + (hi - from[1]) * e);
        if (k < 1) raf = requestAnimationFrame(step); else cur = [lo, hi];
      })(t0);
    };
  }

  /* ================= theme ================= */
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  var mqDark = matchMedia('(prefers-color-scheme: dark)');
  function theme() { return root.getAttribute('data-theme') || (mqDark.matches ? 'dark' : 'light'); }
  function setTheme(t) {
    root.setAttribute('data-theme', t);
    var b = $('[data-theme-toggle]');
    if (b) b.setAttribute('aria-label', t === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    var m = $('meta[name="theme-color"]');
    if (m) m.content = t === 'dark' ? '#000000' : '#ffffff';
    if (window.__drawDoor) window.__drawDoor();
  }
  setTheme(theme());
  var tbtn = $('[data-theme-toggle]');
  if (tbtn) tbtn.addEventListener('click', function () {
    var next = theme() === 'dark' ? 'light' : 'dark';
    store.set('veles-theme', next);
    if (!document.startViewTransition || reduce) return setTheme(next);
    var r = tbtn.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    var end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    document.startViewTransition(function () { setTheme(next); }).ready.then(function () {
      root.animate({ clipPath: ['circle(0 at ' + x + 'px ' + y + 'px)', 'circle(' + end + 'px at ' + x + 'px ' + y + 'px)'] },
        { duration: 700, easing: 'cubic-bezier(.22,1,.36,1)', pseudoElement: '::view-transition-new(root)' });
    });
  });

  /* ================= reveal ================= */
  var reveals = $$('.reveal');
  reveals.forEach(function (el) {
    var sibs = $$('.reveal', el.parentNode).filter(function (s) { return s.parentNode === el.parentNode; });
    el.style.setProperty('--d', (sibs.indexOf(el) * 0.08) + 's');
  });
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -10% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else reveals.forEach(function (el) { el.classList.add('in'); });

  /* ================= scroll scenes ================= */
  var hero = $('#hero'), stage = $('[data-door-stage]'), remote = $('[data-remote]');
  var explode = $('#parts'), xsvg = $('.xsvg');
  var manifesto = $('.manifesto'), area = $('.area'), book = $('#book');
  var nav = $('.nav'), callbar = $('.callbar');

  // words for the manifesto
  var words = [];
  var wt = $('[data-words]');
  if (wt) {
    wt.innerHTML = wt.textContent.trim().split(/\s+/).map(function (w) { return '<span class="w">' + w + '</span>'; }).join(' ');
    words = $$('.w', wt);
  }

  function progress(el, startOffset) {
    var r = el.getBoundingClientRect();
    var total = r.height - innerHeight;
    return clamp((-r.top + (startOffset || 0)) / (total || 1), 0, 1);
  }

  // fill the hero door with raised panels
  $$('.door--hero .door__panel').forEach(function (pn) { for (var k = 0; k < 8; k++) pn.insertBefore(document.createElement('i'), pn.firstChild); });
  var heroCopy = $('.hero__copy');
  function setLift() { if (stage && heroCopy) stage.style.setProperty('--lift', Math.round(heroCopy.offsetHeight + parseFloat(getComputedStyle(stage).marginTop) - 8)); }
  setLift(); addEventListener('resize', setLift);

  // brands light up one after another
  var brands = $$('[data-brands] li'), bi = 0;
  if (brands.length) setInterval(function () { brands.forEach(function (b, i) { b.classList.toggle('on', i === bi); }); bi = (bi + 1) % brands.length; }, 1200);

  var lastOpen = -1;
  function frame() {
    // page progress
    var max = document.documentElement.scrollHeight - innerHeight;
    nav.style.setProperty('--sp', (scrollY / (max || 1)).toFixed(4));

    // hero door
    if (hero) {
      var p = progress(hero, 0);
      var open = reduce ? (p > .4 ? 1 : 0) : ease(clamp((p - .08) / .72, 0, 1));
      hero.style.setProperty('--hp', clamp(p * 2.2, 0, 1).toFixed(3));
      if (Math.abs(open - lastOpen) > .001) {
        stage.style.setProperty('--open', open.toFixed(4));
        lastOpen = open;
        hero.classList.toggle('is-open', open > .92);
        remote.classList.toggle('is-on', open > .5);
        remote.setAttribute('aria-label', open > .5 ? 'Close the door with the remote' : 'Open the door with the remote');
      }
    }

    // exploded view
    if (explode) {
      var q = progress(explode, 0);
      var x = reduce ? 1 : ease(clamp((q - .05) / .45, 0, 1));
      xsvg.style.setProperty('--xp', x.toFixed(4));
      xsvg.style.setProperty('--hot', q > .3 ? 1 : 0);
    }

    // manifesto words light up
    if (words.length) {
      var r = manifesto.getBoundingClientRect();
      var m = clamp((innerHeight * .85 - r.top) / (r.height * .9), 0, 1);
      var n = Math.round(m * words.length);
      for (var i = 0; i < words.length; i++) words[i].classList.toggle('on', i < n);
    }

    // area parallax
    if (area) {
      var ar = area.getBoundingClientRect();
      area.style.setProperty('--ap', clamp(1 - (ar.top + ar.height) / (innerHeight + ar.height), 0, 1).toFixed(3));
    }

    // phone call bar: tuck away at the booking section (it has its own buttons)
    if (callbar && book) {
      var br = book.getBoundingClientRect();
      callbar.style.setProperty('--cb', br.top < innerHeight && br.bottom > 0 ? 1 : 0);
    }
  }
  var ticking = false;
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(function () { ticking = false; frame(); }); } }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  frame();

  function heroScrollRange() {
    var top = hero.getBoundingClientRect().top + scrollY;
    return { top: top, len: hero.offsetHeight - innerHeight };
  }

  // remote: glide to open / closed
  if (remote) remote.addEventListener('click', function (e) {
    e.stopPropagation();
    var h = heroScrollRange();
    var target = lastOpen > .5 ? h.top : h.top + h.len * .86;
    scrollTo({ top: target, behavior: reduce ? 'auto' : 'smooth' });
  });

  // drag the door (mouse); touch scrolls the page natively, which does the same thing
  if (stage) {
    var dragging = false, sy = 0, s0 = 0;
    stage.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.target.closest('.remote')) return;
      dragging = true; sy = e.clientY; s0 = scrollY; stage.classList.add('is-dragging');
      e.preventDefault();
    });
    addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var h = heroScrollRange();
      var dy = sy - e.clientY; // drag up = open
      scrollTo(0, s0 + dy / stage.offsetHeight * h.len * .8);
    });
    addEventListener('pointerup', function () { dragging = false; stage.classList.remove('is-dragging'); });
  }

  /* ================= tilt cards ================= */
  if (finePointer && !reduce) $$('.tilt').forEach(function (c) {
    c.addEventListener('pointermove', function (e) {
      var r = c.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      c.style.setProperty('--ry', ((px - .5) * 6).toFixed(2) + 'deg');
      c.style.setProperty('--rx', ((.5 - py) * 6).toFixed(2) + 'deg');
      c.style.setProperty('--mx', (px * 100) + '%');
      c.style.setProperty('--my', (py * 100) + '%');
      c.style.setProperty('--glow', 1);
    });
    c.addEventListener('pointerleave', function () {
      c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); c.style.setProperty('--glow', 0);
    });
  });

  /* ================= chat demo ================= */
  var chat = $('[data-chat]');
  if (chat) {
    var msgs = $$('.msg', chat), timers = [];
    var play = function () {
      timers.forEach(clearTimeout); timers = [];
      msgs.forEach(function (m) { m.classList.remove('show', 'gone'); });
      var plan = [[0, 300], [1, 1100], [2, 1900], [3, 3600], [4, 4900]];
      plan.forEach(function (s) {
        timers.push(setTimeout(function () {
          if (s[0] === 3) msgs[2].classList.add('gone');
          msgs[s[0]].classList.add('show');
        }, reduce ? 0 : s[1]));
      });
    };
    if ('IntersectionObserver' in window) {
      var cio = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { play(); cio.disconnect(); } }, { threshold: .4 });
      cio.observe(chat);
    } else play();
    $('[data-chat-replay]').addEventListener('click', play);
  }

  /* ================= live clock ================= */
  var clock = $('[data-clock]');
  if (clock && window.Intl) {
    var tick = function () {
      clock.textContent = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Chicago' }).format(new Date());
    };
    tick(); setInterval(tick, 15000);
  }

  /* ================= exploded view parts ================= */
  var PARTS = {
    spring:  { name: 'Torsion spring', groups: ['spring'], what: 'Lifts the whole door. When it snaps you hear a bang, and the door won’t go up.', price: '$250–$450 a pair', safe: 'No. Leave it closed.' },
    cables:  { name: 'Cables & drums', groups: ['cables'], what: 'Steel cables wind onto drums to raise the door. A frayed or loose cable makes the door hang crooked.', price: '$150–$300', safe: 'No. It can drop on one side.' },
    rollers: { name: 'Rollers & hinges', groups: ['p2'], what: 'Carry the door along the track. Worn rollers grind, shake and wear out your springs faster.', price: '$120–$250 full set', safe: 'Yes, for now.' },
    tracks:  { name: 'Tracks', groups: ['trackL', 'trackR'], what: 'Guide the door up and back. A bump from the car can bend them and pop rollers out.', price: '$150–$350', safe: 'No. Unplug the opener.' },
    panels:  { name: 'Panels', groups: ['p0', 'p1', 'p2', 'p3'], what: 'The sections you see from the street. A dent or crack can be fixed by swapping just that section.', price: '$300–$650 per section', safe: 'Usually yes.' },
    opener:  { name: 'Opener', groups: ['opener'], what: 'Hums but won’t move? Usually a stripped gear, a dead logic board or a remote that lost its code.', price: '$120–$300 repair', safe: 'Yes. Pull the red release cord.' },
    sensors: { name: 'Safety sensors', groups: ['sensors'], what: 'Two little eyes at floor level. If they’re blocked or misaligned, the door reverses before closing.', price: '$90–$180', safe: 'Yes. Hold the wall button to close.' }
  };
  var card = $('[data-part-card]');
  function pickPart(key, fromUser) {
    var p = PARTS[key]; if (!p || !card) return;
    $('[data-part-name]').textContent = p.name;
    $('[data-part-what]').textContent = p.what;
    $('[data-part-price]').textContent = p.price;
    $('[data-part-safe]').textContent = p.safe;
    $('[data-part-sms]').href = sms('Hi Veles, I think my garage door ' + p.name.toLowerCase() + ' needs work. Photo attached. Address: ');
    card.classList.remove('bump'); void card.offsetWidth; card.classList.add('bump');
    $$('.part-chips button').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-part') === key ? 'true' : 'false'); });
    if (fromUser) {
      xsvg.classList.add('has-focus');
      $$('.xp', xsvg).forEach(function (g) { g.classList.toggle('is-active', p.groups.indexOf(g.getAttribute('data-x')) > -1); });
    }
  }
  $$('[data-part]').forEach(function (el) {
    el.addEventListener('click', function () { pickPart(el.getAttribute('data-part'), true); });
    if (el.tagName.toLowerCase() === 'g') el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pickPart(el.getAttribute('data-part'), true); }
    });
  });
  if (xsvg) xsvg.addEventListener('click', function (e) {
    if (!e.target.closest('.hot')) { xsvg.classList.remove('has-focus'); }
  });

  /* ================= range fill ================= */
  function fill(r) { r.style.setProperty('--fill', ((r.value - r.min) / (r.max - r.min) * 100) + '%'); }
  $$('input[type="range"]').forEach(function (r) { fill(r); r.addEventListener('input', function () { fill(r); }); });

  /* ================= spring life game ================= */
  var uses = $('[data-uses]');
  if (uses) {
    var coil = $('[data-coil]'), yearsEl = $('[data-years]'), usesOut = $('[data-uses-out]');
    var inst = $('[data-installed]'), bar = $('[data-life-bar]'), verdict = $('[data-verdict]');
    var now = new Date().getFullYear();
    for (var y = now; y >= now - 20; y--) { var o = document.createElement('option'); o.value = y; o.textContent = y; inst.appendChild(o); }
    var shownYears = 0, yraf = 0, wob = 0, wraf = 0;

    var coilPath = function (stretch, jitter) {
      var x1 = 60, x2 = 540, n = 18, len = (x2 - x1), d = 'M' + x1 + ' 80';
      for (var i = 0; i < n; i++) {
        var xa = x1 + len * (i + .25) / n, xb = x1 + len * (i + .75) / n, xc = x1 + len * (i + 1) / n;
        var a = 34 + stretch, jj = jitter * Math.sin(i * 1.7);
        d += ' L' + xa.toFixed(1) + ' ' + (80 - a + jj).toFixed(1) + ' L' + xb.toFixed(1) + ' ' + (80 + a - jj).toFixed(1) + ' L' + xc.toFixed(1) + ' 80';
      }
      return d;
    };
    var springUpdate = function () {
      var u = +uses.value;
      var rated = +$('input[name="springType"]:checked').value;
      var years = rated / (u * 365);
      usesOut.textContent = u;
      var col = years >= 8 ? '#34c759' : years >= 4 ? '#ff9f0a' : '#ff3b30';
      coil.style.setProperty('--coil', col);
      // little wobble so the spring reacts to the slider
      cancelAnimationFrame(wraf); var t0 = performance.now();
      (function w(t) {
        var k = (t - t0) / 700; var j = reduce ? 0 : Math.max(0, 1 - k) * 10 * Math.sin(k * 18);
        coil.setAttribute('d', coilPath(-(u - 1) * 1.2, j));
        if (k < 1 && !reduce) wraf = requestAnimationFrame(w);
      })(t0);
      // years count
      var from = shownYears, s0 = performance.now(); cancelAnimationFrame(yraf);
      (function step(t) {
        var k = reduce ? 1 : Math.min(1, (t - s0) / 500), v = from + (years - from) * (1 - Math.pow(1 - k, 3));
        yearsEl.textContent = v.toFixed(1);
        if (k < 1) yraf = requestAnimationFrame(step); else shownYears = years;
      })(s0);
      // life left
      if (inst.value) {
        var age = now - (+inst.value) + .5, left = years - age, pct = clamp(left / years, 0, 1);
        bar.style.width = (pct * 100) + '%';
        bar.style.backgroundColor = pct > .5 ? '#34c759' : pct > .2 ? '#ff9f0a' : '#ff3b30';
        verdict.textContent = left <= 0
          ? 'Your springs are past their rated life. They could go any day. Worth a check.'
          : left < 1.5 ? 'About ' + Math.max(1, Math.round(left * 12)) + ' months left. Book a tune-up before it snaps.'
          : 'About ' + left.toFixed(1) + ' years left. Expect a replacement around ' + Math.round(now + left) + '.';
      } else {
        bar.style.width = '0'; verdict.textContent = 'Pick the year your springs went in and we’ll tell you how much life is left.';
      }
    };
    uses.addEventListener('input', springUpdate);
    $$('input[name="springType"]').forEach(function (r) { r.addEventListener('change', springUpdate); });
    inst.addEventListener('change', springUpdate);
    springUpdate();
    $('[data-goto-repair]').addEventListener('click', function () {
      selectTab('repair');
      var sp = $('[data-repair-form] input[value="spring"]'); if (sp) { sp.checked = true; repairUpdate(); }
      if ($('input[name="springType"]:checked').value === '25000') { var hc = $('[data-repair-form] input[value="highCycle"]'); if (hc) { hc.checked = true; repairUpdate(); } }
    });
  }

  /* ================= tabs ================= */
  var tabs = $$('[role="tab"]');
  function selectTab(which) {
    tabs.forEach(function (t) {
      var on = t.id === 'tab-' + which;
      t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1;
      $('#' + t.getAttribute('aria-controls')).hidden = !on;
    });
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { selectTab(t.id.replace('tab-', '')); });
    t.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        var n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
        n.focus(); n.click();
      }
    });
  });

  /* ================= door configurator ================= */
  var COLORS = {
    white: { name: 'White', c: '#f3f3f1', mult: 1 }, almond: { name: 'Almond', c: '#e4dac8', mult: 1 },
    sandstone: { name: 'Sandstone', c: '#c8b591', mult: 1 }, gray: { name: 'Steel gray', c: '#8e8f91', mult: 1.03 },
    walnut: { name: 'Walnut wood-look', c: '#7a4f31', mult: 1.18, wood: true }, black: { name: 'Black', c: '#2b2b2d', mult: 1.06 }
  };
  var STYLES = { traditional: { name: 'Raised panel', perFt: 95 }, carriage: { name: 'Carriage house', perFt: 135 }, modern: { name: 'Modern flush', perFt: 150 }, glass: { name: 'Full-view glass', perFt: 230 } };
  var doorForm = $('[data-door-form]'), doorSvg = $('[data-door-svg]');
  var night = false;

  function shade(hex, amt) {
    var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    var f = function (v) { return clamp(Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt), 0, 255); };
    return '#' + ((1 << 24) + (f(r) << 16) + (f(g) << 8) + f(b)).toString(16).slice(1);
  }
  function drawDoor() {
    if (!doorForm) return;
    var f = doorForm.elements;
    var w = +f.width.value, style = f.style.value, col = COLORS[f.color.value], win = f.windows.checked;
    var PX = 46, H = 7 * PX, ground = 366, dw = w * PX, x0 = (1300 - dw) / 2, y0 = ground - H, rows = 4, rh = H / rows;
    var base = col.c, dark = shade(base, -.14), light = shade(base, .35);
    var s = '';
    s += '<defs><linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + (night ? '#ffd58a' : '#9fb4c8') + '"/><stop offset=".55" stop-color="' + (night ? '#f0a640' : '#4c5f73') + '"/><stop offset="1" stop-color="' + (night ? '#ffcf7a' : '#7d93a8') + '"/></linearGradient>' +
      '<linearGradient id="pshade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".25"/><stop offset=".2" stop-color="#fff" stop-opacity="0"/><stop offset=".85" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".18"/></linearGradient></defs>';
    // opening + trim
    s += '<rect x="' + (x0 - 16) + '" y="' + (y0 - 16) + '" width="' + (dw + 32) + '" height="' + (H + 16) + '" rx="4" fill="' + (night ? '#3a3631' : '#f7f5f0') + '"/>';
    s += '<rect x="' + x0 + '" y="' + y0 + '" width="' + dw + '" height="' + H + '" fill="' + base + '" class="dpanel"/>';
    var lites = Math.max(2, Math.round(w / 2));
    for (var r = 0; r < rows; r++) {
      var ry = y0 + r * rh;
      var glassRow = style === 'glass' || (win && r === 0);
      if (glassRow) {
        var gw = (dw - 24 - (lites - 1) * 10) / lites;
        for (var i = 0; i < lites; i++) {
          var gx = x0 + 12 + i * (gw + 10);
          s += '<rect x="' + gx.toFixed(1) + '" y="' + (ry + 10) + '" width="' + gw.toFixed(1) + '" height="' + (rh - 20) + '" rx="3" fill="url(#glass)"/>';
          s += '<path d="M' + (gx + gw * .15).toFixed(1) + ' ' + (ry + rh - 12) + ' L' + (gx + gw * .45).toFixed(1) + ' ' + (ry + 12) + '" stroke="#fff" stroke-opacity=".35" stroke-width="6"/>';
        }
      } else if (style === 'traditional') {
        var cols = w <= 10 ? 4 : w <= 14 ? 6 : 8, pw = (dw - 24 - (cols - 1) * 12) / cols;
        for (var j = 0; j < cols; j++) {
          var px = x0 + 12 + j * (pw + 12);
          s += '<rect x="' + px.toFixed(1) + '" y="' + (ry + 11) + '" width="' + pw.toFixed(1) + '" height="' + (rh - 22) + '" rx="3" fill="' + dark + '"/>';
          s += '<rect x="' + (px + 3).toFixed(1) + '" y="' + (ry + 14) + '" width="' + (pw - 6).toFixed(1) + '" height="' + (rh - 28) + '" rx="2" fill="' + base + '"/>';
          s += '<rect x="' + (px + 3).toFixed(1) + '" y="' + (ry + 14) + '" width="' + (pw - 6).toFixed(1) + '" height="2" fill="' + light + '" opacity=".7"/>';
        }
      } else if (style === 'carriage') {
        for (var k = x0 + 20; k < x0 + dw - 5; k += 20) s += '<rect x="' + k + '" y="' + ry + '" width="2" height="' + rh + '" fill="' + dark + '" opacity=".55"/>';
      } else if (style === 'modern') {
        s += '<rect x="' + x0 + '" y="' + (ry + rh / 2 - 1) + '" width="' + dw + '" height="2" fill="' + dark + '" opacity=".5"/>';
      }
      if (col.wood && !glassRow) {
        for (var g = 0; g < 7; g++) {
          var gy = ry + 6 + g * (rh - 12) / 6 + Math.sin(g * 3.1 + w) * 2;
          s += '<path d="M' + x0 + ' ' + gy.toFixed(1) + ' C' + (x0 + dw * .3) + ' ' + (gy - 3).toFixed(1) + ' ' + (x0 + dw * .6) + ' ' + (gy + 3).toFixed(1) + ' ' + (x0 + dw) + ' ' + gy.toFixed(1) + '" stroke="' + shade(base, -.3) + '" stroke-opacity=".35" fill="none" stroke-width="1.2"/>';
        }
      }
      s += '<rect x="' + x0 + '" y="' + ry + '" width="' + dw + '" height="' + rh + '" fill="url(#pshade)"/>';
      s += '<rect x="' + x0 + '" y="' + (ry + rh - 2) + '" width="' + dw + '" height="2" fill="#000" opacity=".22"/>';
    }
    if (style === 'carriage') {
      var mid = x0 + dw / 2, hw = '#1d1d1f';
      s += '<rect x="' + (mid - 2) + '" y="' + y0 + '" width="4" height="' + H + '" fill="' + dark + '"/>';
      [y0 + rh * 1.3, y0 + rh * 3.3].forEach(function (hy) {
        s += '<rect x="' + (x0 + 14) + '" y="' + hy + '" width="' + Math.min(120, dw * .18) + '" height="7" rx="3" fill="' + hw + '"/>';
        s += '<rect x="' + (x0 + dw - 14 - Math.min(120, dw * .18)) + '" y="' + hy + '" width="' + Math.min(120, dw * .18) + '" height="7" rx="3" fill="' + hw + '"/>';
      });
      s += '<rect x="' + (mid - 26) + '" y="' + (y0 + rh * 2.4) + '" width="6" height="44" rx="3" fill="' + hw + '"/><rect x="' + (mid + 20) + '" y="' + (y0 + rh * 2.4) + '" width="6" height="44" rx="3" fill="' + hw + '"/>';
    }
    // driveway shadow + person for scale
    s += '<rect x="' + (x0 - 16) + '" y="' + ground + '" width="' + (dw + 32) + '" height="6" fill="#000" opacity=".12"/>';
    var pxp = x0 + dw + 70, sc = 5.83 * PX / 120;
    s += '<g transform="translate(' + pxp + ' ' + (ground - 120 * sc) + ') scale(' + sc.toFixed(3) + ')" fill="' + (night ? '#5a5650' : '#b9b3a8') + '"><circle cx="20" cy="12" r="10"/><path d="M8 28h24l4 44h-7l-3 46h-7l-2-40-2 40h-7l-3-46H4z"/></g>';
    if (f.opener.checked) {
      s += '<g transform="translate(' + (x0 + dw - 40) + ' ' + (y0 - 60) + ')"><rect width="74" height="34" rx="17" fill="#34c759"/><text x="37" y="22" text-anchor="middle" font-size="15" font-weight="700" fill="#fff" font-family="-apple-system, Inter, sans-serif">Wi-Fi</text></g>';
    }
    doorSvg.innerHTML = s;
    $('[data-dims]').textContent = w + ' ft × 7 ft · person shown at 5′10″';
    $('[data-width-out]').textContent = w + ' ft';
    $('[data-color-name]').textContent = col.name;
    var wall = $('.preview__wall');
    wall.style.background = night ? 'linear-gradient(180deg,#1b2233 0 78%,#14161c 78% 100%)' : '';
  }
  window.__drawDoor = drawDoor;

  if (doorForm) {
    var doorTotal = rangeAnimator($('[data-door-total]'));
    var doorUpdate = function () {
      var f = doorForm.elements, w = +f.width.value, st = STYLES[f.style.value], col = COLORS[f.color.value];
      var cost = w * st.perFt * col.mult;
      if (f.insulated.checked) cost *= 1.12;
      if (f.windows.checked && f.style.value !== 'glass') cost += Math.ceil(w / 2) * 55;
      cost += 450;
      if (f.opener.checked) cost += 600;
      var lo = Math.round(cost * .92 / 10) * 10, hi = Math.round(cost * 1.12 / 10) * 10;
      doorTotal(lo, hi);
      var parts = [w + ' ft', st.name, col.name];
      if (f.windows.checked && f.style.value !== 'glass') parts.push('Windows');
      if (f.insulated.checked) parts.push('Insulated');
      if (f.opener.checked) parts.push('Wi-Fi opener');
      $('[data-door-sum]').textContent = parts.join(' · ');
      $('[data-door-sms]').href = sms('Hi Veles, I designed a door on your site: ' + parts.join(', ') + '. Estimate ' + money(lo) + '–' + money(hi) + '. Can you quote it? Address: ');
      drawDoor();
    };
    doorForm.addEventListener('input', doorUpdate);
    doorForm.addEventListener('change', doorUpdate);
    doorForm.addEventListener('submit', function (e) { e.preventDefault(); });
    // day / night switch on the preview
    var nb = document.createElement('button');
    nb.type = 'button'; nb.className = 'pill pill--sm pill--ghost preview__night'; nb.textContent = 'See it at night';
    nb.setAttribute('aria-pressed', 'false');
    nb.addEventListener('click', function () {
      night = !night; nb.textContent = night ? 'See it by day' : 'See it at night'; nb.setAttribute('aria-pressed', night); drawDoor();
    });
    $('[data-preview]').appendChild(nb);
    doorUpdate();
  }

  /* ================= repair calculator ================= */
  var PRICE = {
    service: {
      spring: { name: 'Spring replacement, pair', base: [250, 380], sized: true },
      cable: { name: 'Cable replacement', base: [150, 240], sized: true },
      track: { name: 'Track and roller reset', base: [150, 280], sized: true },
      opener: { name: 'Opener repair', base: [120, 260] },
      openerNew: { name: 'New belt-drive opener', base: [450, 650] },
      panel: { name: 'Replace one section', base: [300, 550], sized: true },
      sensor: { name: 'Safety sensor alignment', base: [90, 180] },
      tuneup: { name: 'Tune-up and balance', base: [120, 170], sized: true }
    },
    size: { single: { name: 'single door', f: .85 }, double: { name: 'double door', f: 1 }, over: { name: 'oversized door', f: 1.25 } },
    when: { day: { name: 'Same-day, daytime', add: [0, 0] }, night: { name: 'After-hours visit', add: [75, 125] } },
    extra: { highCycle: { name: 'High-cycle springs', add: [60, 90] }, rollers: { name: 'Nylon rollers', add: [90, 140] }, wifi: { name: 'Wi-Fi control', add: [80, 120] }, remote: { name: 'Extra remote', add: [35, 45] }, seal: { name: 'Bottom seal', add: [60, 100] } }
  };
  var repairForm = $('[data-repair-form]');
  var repairUpdate = function () {};
  if (repairForm) {
    var repairTotal = rangeAnimator($('[data-repair-total]'));
    var r5 = function (n) { return Math.round(n / 5) * 5; };
    repairUpdate = function () {
      var f = repairForm.elements, svc = f.service.value, s = PRICE.service[svc], sz = PRICE.size[f.size.value], w = PRICE.when[f.when.value];
      $$('.toggle[data-for]', repairForm).forEach(function (t) {
        var on = t.getAttribute('data-for').split(' ').indexOf(svc) > -1; t.hidden = !on;
      });
      var m = s.sized ? sz.f : 1, lo = s.base[0] * m, hi = s.base[1] * m;
      var items = [[s.name + (s.sized ? ', ' + sz.name : ''), lo, hi]];
      if (w.add[1]) { items.push([w.name, w.add[0], w.add[1]]); lo += w.add[0]; hi += w.add[1]; }
      $$('input[name="extra"]:checked', repairForm).forEach(function (x) {
        if (x.closest('.toggle').hidden) return;
        var e = PRICE.extra[x.value]; items.push([e.name, e.add[0], e.add[1]]); lo += e.add[0]; hi += e.add[1];
      });
      lo = r5(lo); hi = r5(hi);
      repairTotal(lo, hi);
      $('[data-repair-lines]').innerHTML = items.map(function (it) { return '<li><span>' + it[0] + '</span><span>' + money(r5(it[1])) + '–' + money(r5(it[2])) + '</span></li>'; }).join('');
      $('[data-repair-sms]').href = sms('Hi Veles, I used your price calculator: ' + items.map(function (i) { return i[0]; }).join(', ') + '. Estimate ' + money(lo) + '–' + money(hi) + '. Can you confirm? Address: ');
    };
    repairForm.addEventListener('change', repairUpdate);
    repairUpdate();
  }

  /* ================= carousel + lightbox ================= */
  var car = $('[data-carousel]');
  if (car) {
    var step = function (dir) { car.scrollBy({ left: dir * car.clientWidth * .7, behavior: reduce ? 'auto' : 'smooth' }); };
    $('[data-car-prev]').addEventListener('click', function () { step(-1); });
    $('[data-car-next]').addEventListener('click', function () { step(1); });
    car.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1); });
    var down = false, sx = 0, sl = 0, moved = false;
    car.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = car.scrollLeft; car.style.scrollSnapType = 'none'; });
    addEventListener('pointermove', function (e) { if (!down) return; var dx = e.clientX - sx; if (Math.abs(dx) > 5) moved = true; car.scrollLeft = sl - dx; });
    addEventListener('pointerup', function () { if (!down) return; down = false; car.style.scrollSnapType = ''; });
    var lb = $('[data-lb]'), lbImg = $('[data-lb-img]');
    $$('[data-lightbox]', car).forEach(function (b) {
      b.addEventListener('click', function (e) {
        if (moved) { e.preventDefault(); return; }
        var img = $('img', b); lbImg.src = img.src; lbImg.alt = img.alt;
        if (lb.showModal) lb.showModal();
      });
    });
    $('[data-lb-close]').addEventListener('click', function () { lb.close(); });
    lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
  }

  /* ================= marquee: duplicate rows for a seamless loop ================= */
  $$('.marquee__row, .ticker__in').forEach(function (r) {
    if (r.classList.contains('ticker__in')) return;
    $$('.rev', r).forEach(function (n) { var c = n.cloneNode(true); c.setAttribute('aria-hidden', 'true'); r.appendChild(c); });
  });

  /* ================= service area check ================= */
  var zipForm = $('[data-zip]');
  if (zipForm) {
    var AREAS = [
      ['Tomball', ['77375', '77377']], ['Spring', ['77373', '77379', '77386', '77388', '77389']], ['Cypress', ['77410', '77429', '77433']],
      ['Magnolia', ['77354', '77355']], ['The Woodlands', ['77380', '77381', '77382', '77384', '77385', '77387']], ['Conroe', ['77301', '77302', '77303', '77304', '77306']],
      ['Klein', ['77379', '77389']], ['Hockley', ['77447']], ['Waller', ['77484']], ['Katy', ['77449', '77450', '77493', '77494']],
      ['Humble', ['77338', '77339', '77396']], ['Atascocita', ['77346']], ['NW Houston', ['77064', '77065', '77066', '77068', '77069', '77070', '77084', '77086', '77088', '77090', '77095']]
    ];
    var out = $('[data-zip-out]'), towns = $$('.towns li');
    var check = function () {
      var q = zipForm.elements.q.value.trim().toLowerCase();
      towns.forEach(function (t) { t.classList.remove('hit'); });
      out.className = 'zip__out';
      if (!q) { out.textContent = ''; return; }
      var hit = AREAS.filter(function (a) { return a[0].toLowerCase().indexOf(q) === 0 || (q.length === 5 && a[1].indexOf(q) > -1) || (q.length >= 3 && a[0].toLowerCase().indexOf(q) > -1); })[0];
      if (hit) {
        out.classList.add('ok'); out.textContent = 'Yes, we’re in ' + hit[0] + '. Same-day service most days.';
        towns.forEach(function (t) { if (t.textContent === hit[0]) t.classList.add('hit'); });
      } else if (/^77\d{3}$/.test(q)) {
        out.classList.add('maybe'); out.textContent = 'Most likely. Text us your address and we’ll confirm.';
      } else if (/^\d{5}$/.test(q)) {
        out.classList.add('maybe'); out.textContent = 'That’s outside our usual area, but text us and we’ll see what we can do.';
      } else { out.textContent = 'Try a 5-digit ZIP code, like 77375.'; }
    };
    zipForm.addEventListener('submit', function (e) { e.preventDefault(); check(); });
    zipForm.elements.q.addEventListener('input', function () { if (zipForm.elements.q.value.trim().length >= 3) check(); });
  }

  /* ================= callback form ================= */
  var book2 = $('#book-form');
  if (book2) {
    var status = $('.book__status');
    book2.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = book2.elements.name, phone = book2.elements.phone, ok = true;
      [name, phone].forEach(function (f) {
        var bad = !f.value.trim() || (f === phone && f.value.replace(/\D/g, '').length < 10);
        f.setAttribute('aria-invalid', bad ? 'true' : 'false'); if (bad) ok = false;
      });
      if (!ok) { status.textContent = 'Please add your name and a 10-digit mobile number.'; return; }
      if (FORM_ENDPOINT) {
        status.textContent = 'Sending…';
        fetch(FORM_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ name: name.value, phone: phone.value, source: 'website' }) })
          .then(function (r) { if (!r.ok) throw 0; status.textContent = 'Got it, ' + name.value.trim() + '. We’ll call you shortly.'; book2.reset(); })
          .catch(function () { status.textContent = 'That didn’t send. Please call (832) 606-6633.'; });
      } else {
        status.textContent = 'Opening your messages app. Hit send and we’ll call you back.';
        location.href = sms('Hi Veles, this is ' + name.value.trim() + ' (' + phone.value.trim() + '). Please call me back about my garage door.');
      }
    });
  }

  var yr = $('[data-year]'); if (yr) yr.textContent = new Date().getFullYear();
})();
