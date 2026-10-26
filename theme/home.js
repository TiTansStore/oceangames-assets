/* ==========================================================================
   اوشن قيمز — home.js  |  الإصدار: v0.2.0  |  2026-10-26
   يُلصق بعد custom.js في نفس حقل JavaScript. يعمل في الرئيسية فقط.
   يبني: (1) الهيرو المخصص بدل السلايدر (السلايدر يبقى في DOM مخفياً)،
         (2) شرائح الأقسام من روابط سلايدر الأقسام، (3) صف الأرقام تحت البكجات.
   حدود الأمان: لا يلمس السلة ولا الدفع، لا يحذف عناصر، لا يرسل طلبات شبكة،
   كل شيء داخل try/catch، والنصوص تُدرج بـ textContent (بلا حقن HTML).
   ========================================================================== */
(function () {
  'use strict';
  var ASSETS = 'https://cdn.jsdelivr.net/gh/TiTansStore/oceangames-assets@37d66dc/hero/';
  var path = (location.pathname || '').replace(/\/+$/, '');
  var isHome = path === '' || path === '/' || /^\/(ar|en)$/.test(path) || /^\/oceangames$/.test(path);
  if (!isHome) return;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function txt(e) { return (e && e.textContent ? e.textContent : '').replace(/\s+/g, ' ').trim(); }

  /* --- روابط الأقسام من سلايدر الأقسام ------------------------------------ */
  function catLinks() {
    var out = [];
    document.querySelectorAll('.og-cats a.slide--cat-entry').forEach(function (a) {
      var name = txt(a);
      var imgEl = a.querySelector('img');
      var bg = '';
      var circle = a.querySelector('.rounded-full');
      if (circle) {
        var s = circle.getAttribute('style') || '';
        var m = s.match(/url\((['"]?)(.*?)\1\)/);
        if (m) bg = m[2];
      }
      if (!bg && imgEl) bg = imgEl.currentSrc || imgEl.src || imgEl.getAttribute('data-src') || '';
      if (name && a.href) out.push({ name: name, href: a.href, img: bg });
    });
    return out;
  }
  function findCat(cats, re) {
    for (var i = 0; i < cats.length; i++) if (re.test(cats[i].name)) return cats[i];
    return null;
  }

  /* --- 1. الهيرو ----------------------------------------------------------- */
  function buildHero() {
    var slider = document.querySelector('section.home-slider, section.s-block--hero-slider');
    if (!slider || document.querySelector('.og-hero')) return;
    var cats = catLinks();
    var offline = findCat(cats, /أوفلاين/);
    var online = findCat(cats, /أونلاين/);
    var firstBtn = slider.querySelector('.hero-slider-btn a');
    var offlineHref = offline ? offline.href : (firstBtn ? firstBtn.href : '#');
    var onlineHref = online ? online.href : offlineHref;

    var hero = el('section', 'og-hero');
    var wrap = el('div', 'og-hero__wrap');

    var left = el('div');
    left.appendChild(el('span', 'og-hero__eyebrow', 'متجر ألعاب سعودي · ستيم PC'));
    var h1 = el('h1');
    h1.appendChild(document.createTextNode('مكتبة ألعابك على ستيم'));
    h1.appendChild(el('br'));
    h1.appendChild(document.createTextNode('بسعر '));
    h1.appendChild(el('em', null, 'بكج واحد'));
    left.appendChild(h1);
    left.appendChild(el('p', null, 'حسابات ستيم للعب أوفلاين بعشرات الألعاب الأصلية، وألعاب أونلاين جديدة مثل مودرن وارفير 4 وFC 27، واشتراكات ديسكورد نيترو وإكزت لاق — كل شيء يوصلك بعد الدفع مباشرة أو خلال 24 ساعة كحد أقصى.'));
    var cta = el('div', 'og-hero__cta');
    var b1 = el('a', 'og-btn og-btn--p', 'تصفّح بكجات الأوفلاين'); b1.href = offlineHref;
    var b2 = el('a', 'og-btn og-btn--o', 'الألعاب الجديدة'); b2.href = onlineHref;
    cta.appendChild(b1); cta.appendChild(b2);
    left.appendChild(cta);
    var trust = el('div', 'og-hero__trust');
    ['موثّق من المركز السعودي للأعمال', 'تسليم خلال 24 ساعة كحد أقصى', 'مدى · أبل باي · فيزا · تمارا'].forEach(function (t) { trust.appendChild(el('span', null, t)); });
    left.appendChild(trust);

    var fan = el('div', 'og-fan');
    [['steam', 'og-fan__c og-fan__c1'], ['fc27', 'og-fan__c og-fan__c2'], ['mw4', 'og-fan__c og-fan__c3'], ['arc-raiders', 'og-fan__c og-fan__c4']].forEach(function (c) {
      var d = el('div', c[1]);
      var img = el('img'); img.src = ASSETS + c[0] + '.webp'; img.alt = ''; img.loading = 'eager'; img.decoding = 'async';
      d.appendChild(img); fan.appendChild(d);
    });
    function tag(cls, icon, b, s) {
      var t = el('div', 'og-fan__tag ' + cls);
      t.appendChild(el('i', null, icon));
      var w = el('div'); w.appendChild(el('b', null, b)); w.appendChild(el('small', null, s)); t.appendChild(w);
      return t;
    }
    fan.appendChild(tag('og-fan__t1', '⚡', 'تسليم تلقائي', 'بكجات الأوفلاين عبر البوت'));
    fan.appendChild(tag('og-fan__t2', '✓', '+100 لعبة', 'في البكج الأسطوري بـ 14.99'));

    wrap.appendChild(left); wrap.appendChild(fan); hero.appendChild(wrap);

    var svgNS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('class', 'og-hero__wave'); svg.setAttribute('viewBox', '0 0 1440 90'); svg.setAttribute('preserveAspectRatio', 'none');
    var p = document.createElementNS(svgNS, 'path');
    p.setAttribute('d', 'M0 50 C 240 0, 420 0, 720 45 S 1200 100, 1440 40 L1440 90 L0 90 Z');
    svg.appendChild(p); hero.appendChild(svg);

    slider.parentNode.insertBefore(hero, slider);
    slider.classList.add('og-hidden');
  }

  /* --- 2. شرائح الأقسام ---------------------------------------------------- */
  function buildChips() {
    var sec = document.querySelector('.og-cats');
    if (!sec || sec.querySelector('.og-chips')) return;
    var cats = catLinks();
    if (!cats.length) return;
    var container = sec.querySelector('.container') || sec;
    var chips = el('div', 'og-chips');
    cats.forEach(function (c) {
      var a = el('a', 'og-chip'); a.href = c.href;
      if (c.img) { var img = el('img'); img.src = c.img; img.alt = ''; img.loading = 'lazy'; a.appendChild(img); }
      a.appendChild(el('span', null, c.name));
      chips.appendChild(a);
    });
    container.appendChild(chips);
  }

  /* --- 3. الأرقام تحت البكجات --------------------------------------------- */
  function buildStats() {
    var sec = document.querySelector('.og-offline');
    if (!sec || sec.querySelector('.og-stats')) return;
    var container = sec.querySelector('.container') || sec;
    var row = el('div', 'og-stats');
    [['+240', 'لعبة أصلية في البكجات'], ['تلقائي', 'التسليم بعد الدفع مباشرة'], ['24h', 'الحد الأقصى للتسليم']].forEach(function (s) {
      var d = el('div'); d.appendChild(el('b', null, s[0])); d.appendChild(el('small', null, s[1])); row.appendChild(d);
    });
    container.appendChild(row);
  }

  function run() {
    try { buildHero(); } catch (e) { /* بدون تحسين */ }
    try { buildChips(); } catch (e) { /* بدون تحسين */ }
    try { buildStats(); } catch (e) { /* بدون تحسين */ }
  }
  function start() {
    run();
    if (!('MutationObserver' in window)) return;
    var pending = false;
    var mo = new MutationObserver(function () {
      if (pending) return; pending = true;
      setTimeout(function () { pending = false; run(); }, 300);
    });
    try { mo.observe(document.body, { childList: true, subtree: true }); } catch (e) { return; }
    setTimeout(function () { try { mo.disconnect(); } catch (e) { /* تجاهل */ } }, 8000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
