/* Veles Garage Door Service — site behaviour.
   Everything here enhances a page that already works without it. */
(function () {
  'use strict';

  var PHONE = '+18326066633';
  /* Paste a form endpoint here (Formspree, Getform, a CRM webhook…) to receive
     callback requests by email. Left empty, the form opens a prefilled text message. */
  var FORM_ENDPOINT = '';

  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------------- theme ---------------- */
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  var mq = window.matchMedia('(prefers-color-scheme: dark)');
  function currentTheme() {
    return root.getAttribute('data-theme') || (mq.matches ? 'dark' : 'light');
  }
  function applyTheme(t) {
    root.setAttribute('data-theme', t);
    var btn = $('[data-theme-toggle]');
    if (btn) btn.setAttribute('aria-label', t === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    var meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'dark' ? '#0d0d0d' : '#e6e6e3');
  }
  var saved = store.get('veles-theme');
  applyTheme(saved || currentTheme());

  var toggle = $('[data-theme-toggle]');
  if (toggle) toggle.addEventListener('click', function (ev) {
    var next = currentTheme() === 'dark' ? 'light' : 'dark';
    store.set('veles-theme', next);
    if (!document.startViewTransition || reduce) { applyTheme(next); return; }
    var r = toggle.getBoundingClientRect();
    var x = r.left + r.width / 2, y = r.top + r.height / 2;
    var end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    var vt = document.startViewTransition(function () { applyTheme(next); });
    vt.ready.then(function () {
      root.animate(
        { clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + end + 'px at ' + x + 'px ' + y + 'px)'] },
        { duration: 650, easing: 'cubic-bezier(.16,1,.3,1)', pseudoElement: '::view-transition-new(root)' }
      );
    });
  });

  /* ---------------- door panels for section transitions ---------------- */
  $$('.door').forEach(function (sec) {
    if (reduce) return;
    var wrap = document.createElement('div');
    wrap.className = 'door__panels';
    wrap.setAttribute('aria-hidden', 'true');
    for (var i = 0; i < 4; i++) {
      var p = document.createElement('div');
      p.className = 'door__panel';
      p.style.setProperty('--n', String(i));
      wrap.appendChild(p);
    }
    sec.appendChild(wrap);
    wrap.lastChild.addEventListener('transitionend', function (e) {
      if (e.propertyName === 'opacity') sec.classList.add('done');
    });
  });

  /* ---------------- reveal on scroll ---------------- */
  var revealSel = [
    '.diagnose__cell', '.calc__head', '.calc__out', '.prices__wrap', '.how__head',
    '.how__steps', '.jobs__head', '.faq__list', '.quote__who'
  ];
  $$(revealSel.join(',')).forEach(function (el) {
    el.classList.add('reveal');
    Array.prototype.forEach.call(el.children, function (c, i) { c.style.setProperty('--i', String(i)); });
  });
  $$('.flow rect').forEach(function (r, i) { r.style.setProperty('--d', String(i)); });

  var watched = $$('.reveal, .shutter, .door, .mosaic, .how');
  if (!('IntersectionObserver' in window) || reduce) {
    watched.forEach(function (el) { el.classList.add('in', 'done'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0 });
    watched.forEach(function (el) { io.observe(el); });
    // a fast fling can skip the observer: anything above the fold line opens on scroll
    var sweep = function () {
      var line = innerHeight * 0.95;
      watched.forEach(function (el) {
        if (!el.classList.contains('in') && el.getBoundingClientRect().top < line) el.classList.add('in');
      });
    };
    addEventListener('scroll', sweep, { passive: true });
    // anything already passed (deep link, reload mid-page) opens at once
    setTimeout(function () {
      watched.forEach(function (el) { if (el.getBoundingClientRect().bottom < 0) el.classList.add('in', 'done'); });
    }, 50);
  }

  /* ---------------- hero scroll ---------------- */
  var hero = $('.hero');
  if (hero && !reduce) {
    var ticking = false;
    var onScroll = function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var p = Math.min(1, Math.max(0, scrollY / (innerHeight * 0.9)));
        hero.style.setProperty('--hp', p.toFixed(3));
        ticking = false;
      });
    };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------------- diagnose: the symptom picker ---------------- */
  var result = $('.diagnose__result');
  var rows = $$('.diagnose__rows .row');
  if (result && rows.length) {
    var cause = $('.diagnose__cause', result), price = $('.diagnose__price', result), safe = $('.diagnose__safe', result);
    var sms = $('.diagnose__sms');
    var note = $('.diagnose__note');
    var pick = function (row) {
      rows.forEach(function (r) { $('.row__btn', r).setAttribute('aria-pressed', r === row ? 'true' : 'false'); });
      var title = $('.row__title', row).textContent.trim();
      cause.textContent = $('.row__text', row).textContent.trim();
      price.textContent = $('.row__terms', row).getAttribute('data-price');
      safe.textContent = row.getAttribute('data-safe');
      result.hidden = false;
      result.classList.remove('flash'); void result.offsetWidth; result.classList.add('flash');
      note.textContent = 'Send us one photo of the door and one of the springs above it. We’ll confirm the price by text.';
      sms.href = 'sms:' + PHONE + '?&body=' + encodeURIComponent('Hi Veles, my garage door: ' + title.toLowerCase() + '. Photo attached. Address: ');
    };
    rows.forEach(function (r) { $('.row__btn', r).addEventListener('click', function () { pick(r); }); });
    pick(rows[0]);
  }

  /* ---------------- price table → blocks on phones ---------------- */
  var table = $('.ptable');
  if (table) {
    var heads = $$('thead th', table).slice(1);
    var bodyRows = $$('tbody tr', table).filter(function (r) { return !r.classList.contains('ptable__actions'); });
    var actions = $$('.ptable__actions td', table);
    var wrap = document.createElement('div');
    wrap.className = 'pcards';
    wrap.innerHTML = '<p class="h2 pcards__h" aria-hidden="true">What it costs</p>';
    heads.forEach(function (th, i) {
      var card = document.createElement('div');
      card.className = 'pcard' + (th.classList.contains('is-pick') ? ' is-pick' : '');
      var html = '<p class="pcard__name">' + $('.ptable__name', th).innerHTML + '</p>' +
        '<p><span class="pcard__price">' + $('.ptable__price', th).textContent + '</span> <span class="pcard__per">' + $('.ptable__per', th).textContent + '</span></p><dl>';
      bodyRows.forEach(function (r) {
        html += '<div><dt>' + r.querySelector('th').textContent + '</dt><dd>' + r.children[i + 1].textContent + '</dd></div>';
      });
      html += '</dl>' + (actions[i] ? actions[i].innerHTML : '');
      card.innerHTML = html;
      wrap.appendChild(card);
    });
    wrap.setAttribute('aria-hidden', 'false');
    table.parentNode.insertBefore(wrap, table.nextSibling);
  }

  /* ---------------- calculator ---------------- */
  /* Sample price model in USD: [low, high]. Edit to match real pricing. */
  var PRICE = {
    service: {
      spring:    { name: 'Spring replacement, pair', base: [250, 380], sized: true,  built: true  },
      cable:     { name: 'Cable replacement',        base: [150, 240], sized: true,  built: true  },
      track:     { name: 'Track and roller reset',   base: [150, 280], sized: true,  built: false },
      opener:    { name: 'Opener repair',            base: [120, 260], sized: false, built: false },
      openerNew: { name: 'New belt-drive opener',    base: [450, 650], sized: false, built: false },
      tuneup:    { name: 'Tune-up and balance',      base: [120, 170], sized: true,  built: false },
      door:      { name: 'New door, installed',      base: [1600, 2400], sized: true, built: true, doorScale: true },
      sensor:    { name: 'Safety sensor alignment',  base: [90, 180],  sized: false, built: false }
    },
    size:  { single: { name: 'Single door', f: 0.85, door: 0.6 }, double: { name: 'Double door', f: 1, door: 1 }, over: { name: 'Oversized door', f: 1.25, door: 1.35 } },
    build: { steel: { name: 'Plain steel', f: 1, door: 1 }, insulated: { name: 'Insulated steel', f: 1.1, door: 1.3 }, wood: { name: 'Wood or custom', f: 1.3, door: 2.1 } },
    when:  { day: { name: 'Same-day, daytime', add: [0, 0] }, night: { name: 'After-hours visit', add: [75, 125] } },
    extra: {
      highCycle: { name: 'High-cycle springs', add: [60, 90] },
      rollers:   { name: 'Nylon rollers', add: [90, 140] },
      wifi:      { name: 'Wi-Fi control', add: [80, 120] },
      remote:    { name: 'Extra remote', add: [35, 45] },
      seal:      { name: 'Bottom seal', add: [60, 100] },
      windows:   { name: 'Window panels', add: [250, 450] }
    }
  };
  var form = $('#calc-form');
  if (form) {
    var out = $('[data-total]'), lines = $('[data-lines]'), smsBtn = $('[data-sms]'), totalP = $('.calc__total');
    var shown = [0, 0], anim = null;
    var money = function (n) { return '$' + Math.round(n).toLocaleString('en-US'); };
    var round5 = function (n) { return Math.round(n / 5) * 5; };
    var val = function (name) { var el = form.querySelector('input[name="' + name + '"]:checked'); return el ? el.value : null; };

    var compute = function () {
      var s = PRICE.service[val('service')], sz = PRICE.size[val('size')], b = PRICE.build[val('build')], w = PRICE.when[val('when')];
      var mult = 1;
      if (s.sized) mult *= s.doorScale ? sz.door : sz.f;
      if (s.built) mult *= s.doorScale ? b.door : b.f;
      var lo = s.base[0] * mult, hi = s.base[1] * mult;
      var items = [[s.name + (s.sized ? ', ' + sz.name.toLowerCase() : ''), lo, hi]];
      if (w.add[1]) { items.push([w.name, w.add[0], w.add[1]]); lo += w.add[0]; hi += w.add[1]; }
      $$('input[name="extra"]:checked', form).forEach(function (x) {
        if (x.closest('.chip').hidden) return;
        var e = PRICE.extra[x.value];
        items.push([e.name, e.add[0], e.add[1]]); lo += e.add[0]; hi += e.add[1];
      });
      return { lo: round5(lo), hi: round5(hi), items: items, service: s.name, size: sz.name, build: b.name, when: w.name };
    };

    var draw = function (lo, hi) { out.textContent = money(lo) + '–' + money(hi); };
    var update = function () {
      var svc = val('service');
      $$('.chip--check', form).forEach(function (c) {
        var on = c.getAttribute('data-for').split(' ').indexOf(svc) > -1;
        c.hidden = !on;
      });
      var r = compute();
      lines.innerHTML = r.items.map(function (it) {
        return '<li><span>' + it[0] + '</span><span>' + money(round5(it[1])) + '–' + money(round5(it[2])) + '</span></li>';
      }).join('');
      smsBtn.href = 'sms:' + PHONE + '?&body=' + encodeURIComponent(
        'Hi Veles, I used your price calculator: ' + r.service + ', ' + r.size.toLowerCase() + ', ' + r.build.toLowerCase() +
        ', ' + r.when.toLowerCase() + '. Estimate ' + money(r.lo) + '–' + money(r.hi) + '. Can you confirm? Address: ');
      if (reduce) { draw(r.lo, r.hi); shown = [r.lo, r.hi]; return; }
      var from = shown.slice(), t0 = performance.now(), dur = 520;
      cancelAnimationFrame(anim);
      totalP.classList.remove('bump'); void totalP.offsetWidth; totalP.classList.add('bump');
      var step = function (t) {
        var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        draw(from[0] + (r.lo - from[0]) * e, from[1] + (r.hi - from[1]) * e);
        if (k < 1) anim = requestAnimationFrame(step); else shown = [r.lo, r.hi];
      };
      anim = requestAnimationFrame(step);
    };
    form.addEventListener('change', update);
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    update();
  }

  /* ---------------- gallery drag ---------------- */
  var row = $('.jobs__row');
  if (row) {
    var down = false, sx = 0, sl = 0, moved = false;
    row.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse') return;
      down = true; moved = false; sx = e.clientX; sl = row.scrollLeft;
    });
    addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - sx;
      if (Math.abs(dx) > 4) { moved = true; row.classList.add('is-dragging'); }
      row.scrollLeft = sl - dx;
    });
    addEventListener('pointerup', function () { down = false; row.classList.remove('is-dragging'); });
    row.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { row.scrollBy({ left: row.clientWidth * 0.6, behavior: reduce ? 'auto' : 'smooth' }); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { row.scrollBy({ left: -row.clientWidth * 0.6, behavior: reduce ? 'auto' : 'smooth' }); e.preventDefault(); }
    });
  }

  /* ---------------- marquee: duplicate the strip so it loops ---------------- */
  var track = $('.strip__track');
  if (track) track.innerHTML += track.innerHTML;

  /* ---------------- booking form ---------------- */
  var book = $('#book-form');
  if (book) {
    var status = $('.book__status', book);
    book.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = book.elements.name, phone = book.elements.phone, ok = true;
      [name, phone].forEach(function (f) {
        var bad = !f.value.trim() || (f === phone && f.value.replace(/\D/g, '').length < 10);
        f.closest('.cell').classList.toggle('is-invalid', bad);
        f.setAttribute('aria-invalid', bad ? 'true' : 'false');
        if (bad) ok = false;
      });
      if (!ok) { status.textContent = 'Please add your name and a 10-digit mobile number.'; return; }
      var body = 'Hi Veles, this is ' + name.value.trim() + ' (' + phone.value.trim() + '). Please call me back about my garage door.';
      if (FORM_ENDPOINT) {
        status.textContent = 'Sending…';
        fetch(FORM_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ name: name.value, phone: phone.value, source: 'website' }) })
          .then(function (r) { if (!r.ok) throw 0; status.textContent = 'Got it, ' + name.value.trim() + '. We’ll call you back shortly.'; book.reset(); })
          .catch(function () { status.textContent = 'That didn’t send. Please call (832) 606-6633.'; });
      } else {
        status.textContent = 'Opening your messages app. Hit send and we’ll call you back.';
        location.href = 'sms:' + PHONE + '?&body=' + encodeURIComponent(body);
      }
    });
  }

  /* ---------------- footer year ---------------- */
  var y = $('[data-year]');
  if (y) y.textContent = String(new Date().getFullYear());
})();
