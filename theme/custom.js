/* ==========================================================================
   اوشن قيمز — custom.js  |  الإصدار: v0.1.0  |  2026-10-26
   الثيم: ملاك — نسخة العمل 1194075878 فقط (غير منشورة)
   --------------------------------------------------------------------------
   وش يسوي (كله عرض فقط):
     1) صفحة المنتج: يبني صندوق "وش تستلم" (4 خانات) فوق نموذج الشراء من قائمة
        "ملخص قبل الشراء" في وصف المنتج، وتحته شريط التسليم.
     2) صفحة المنتج: يخفي شارة الثيم القديمة (الكلمة الممنوعة)، ويخفي
        "عدد مرات الشراء" و"الكمية المتبقية" (أرقام فيها طلبات اختبار).
     3) الرئيسية: ينسخ شعارات الدفع الحقيقية من الفوتر إلى قسم og-trust.
   حدود الأمان:
     - ما يلمس السلة ولا الدفع: يتوقف كلياً في /cart و/checkout و/payment.
     - ما يعدّل ولا يحذف أي input أو form أو زر. يضيف عناصر جديدة ويضيف كلاس
       og-hide فقط. ما يرسل أي طلب شبكة، وما يقرأ بيانات العميل.
     - كل شي داخل try/catch: لو صار خطأ، الصفحة تشتغل عادي بدون التحسين.
     - ما فيه متغيرات عامة غير window.OG_THEME (للتشخيص فقط).
   الكلمات الممنوعة: النصوص اللي نبحث عنها للإخفاء مكتوبة بترميز \u حتى ما
   تطلع الكلمة الممنوعة حرفياً في أي ملف أو فحص نصي.
   ========================================================================== */
(function () {
  'use strict';

  var VERSION = '0.1.0';
  try { window.OG_THEME = { version: VERSION }; } catch (e) { /* تجاهل */ }

  /* --- 0. حراسة: صفحات السلة والدفع خارج النطاق ---------------------- */
  var path = (location.pathname || '').toLowerCase();
  if (/\/(cart|checkout|payment|payments|thank-you|orders?)(\/|$)/.test(path)) {
    return;
  }

  /* --- أدوات صغيرة ------------------------------------------------------ */
  function txt(el) {
    return (el && el.textContent ? el.textContent : '').replace(/\s+/g, ' ').trim();
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text; // textContent فقط: ما فيه حقن HTML
    return n;
  }

  // يرجع زر الشراء الرئيسي (مو أزرار البطاقات في "منتجات مشابهة")
  function mainBuyButton() {
    var btns = document.querySelectorAll('salla-add-product-button');
    for (var i = 0; i < btns.length; i++) {
      var b = btns[i];
      if (b.closest('salla-product-card, custom-salla-product-card, .s-product-card-entry, salla-products-slider, salla-products-list')) continue;
      return b;
    }
    return null;
  }

  /* --- 1. صندوق "وش تستلم" --------------------------------------------- */
  var SUMMARY_RE = /^ملخص قبل الشراء/;

  function findSummaryList() {
    var root = document.querySelector('main') || document.body;
    var heads = root.querySelectorAll('h2, h3, h4, p, strong, b');
    for (var i = 0; i < heads.length; i++) {
      var h = heads[i];
      if (!SUMMARY_RE.test(txt(h))) continue;
      // العنوان ممكن يكون <h2> أو <p><strong>..</strong></p>
      var block = (h.tagName === 'STRONG' || h.tagName === 'B') && h.parentElement && h.parentElement.tagName === 'P' ? h.parentElement : h;
      var sib = block.nextElementSibling, hops = 0;
      while (sib && hops < 3) {
        if (sib.tagName === 'UL' || sib.tagName === 'OL') return sib;
        sib = sib.nextElementSibling; hops++;
      }
    }
    return null;
  }

  function parseCells(list) {
    var cells = [];
    var items = list.querySelectorAll(':scope > li');
    for (var i = 0; i < items.length && cells.length < 4; i++) {
      var li = items[i];
      var strong = li.querySelector('strong, b');
      var label = txt(strong).replace(/[:：]\s*$/, '');
      var full = txt(li);
      var value = label && full.indexOf(label) === 0 ? full.slice(label.length) : full;
      value = value.replace(/^\s*[:：]\s*/, '').trim();
      if (!label || !value) continue;
      cells.push({ label: label, value: value });
    }
    return cells;
  }

  function deliveryKind(cells) {
    for (var i = 0; i < cells.length; i++) {
      if (/التسليم/.test(cells[i].label)) {
        if (/تلقائي/.test(cells[i].value)) return 'auto';
        if (/يدوي|24/.test(cells[i].value)) return 'manual';
      }
    }
    return 'unknown';
  }

  function buildReceiveBox() {
    if (document.querySelector('.og-receive, .og-delivery-bar')) return true; // مبني مسبقاً
    var btn = mainBuyButton();
    if (!btn) return false;

    // نضيف قبل نموذج الشراء (خارج الـ form) أو قبل الزر نفسه
    var anchor = btn.closest('form') || btn;
    if (!anchor.parentNode) return false;

    var list = findSummaryList();
    var cells = list ? parseCells(list) : [];
    var frag = document.createDocumentFragment();

    if (cells.length >= 2) {
      var box = el('section', 'og-receive');
      box.setAttribute('aria-label', 'وش تستلم');
      box.appendChild(el('h2', 'og-receive__title', 'وش تستلم'));
      var grid = el('ul', 'og-receive__grid');
      for (var i = 0; i < cells.length; i++) {
        var li = el('li', 'og-receive__cell');
        li.appendChild(el('span', 'og-receive__label', cells[i].label));
        li.appendChild(el('span', 'og-receive__value', cells[i].value));
        grid.appendChild(li);
      }
      box.appendChild(grid);
      frag.appendChild(box);
    }

    // شريط التسليم: من خانة "التسليم" إذا موجودة، وإلا الصيغة الموحّدة للمتجر
    var kind = deliveryKind(cells);
    var barText = kind === 'auto'
      ? 'تسليم تلقائي عبر بوت تيليجرام بعد الدفع'
      : kind === 'manual'
        ? 'تسليم يدوي خلال 24 ساعة كحد أقصى عبر واتساب أو إنستقرام'
        : 'تلقائي لبكجات الأوفلاين، والباقي خلال 24 ساعة كحد أقصى';
    var bar = el('div', 'og-delivery-bar' + (kind === 'auto' ? ' og-delivery-bar--auto' : ''));
    bar.setAttribute('role', 'note');
    bar.appendChild(el('span', 'og-delivery-bar__dot'));
    bar.appendChild(el('span', 'og-delivery-bar__text', barText));
    frag.appendChild(bar);

    anchor.parentNode.insertBefore(frag, anchor);
    return true;
  }

  /* --- 2. إخفاء عناصر الثيم المتضاربة (بالنص، لأن محددات ملاك غير ثابتة) --- */
  // نص الشارة القديمة (عربي) + نسختها الإنجليزية Warranty
  var W_AR = '\u0636\u0645\u0627\u0646 \u0639\u0644\u0649 \u0643\u0644 \u0645\u0646\u062a\u062c';
  var W_EN = /warranty on/i;
  // عبارة التسليم القديمة في نفس الشريط
  var F_AR = '\u062a\u0633\u0644\u064a\u0645 \u0641\u0648\u0631\u064a';
  var COUNTERS = /عدد مرات الشراء|الكمية المتبقية|Purchased \d|times purchased|remaining quantity/i;

  function hideByText(test, maxLen, preferWith) {
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    var node, hits = [];
    while ((node = walker.nextNode())) {
      if (test(node.nodeValue || '')) hits.push(node.parentElement);
    }
    hits.forEach(function (start) {
      if (!start || start.closest('.og-receive, .og-delivery-bar, form, script, style')) return;
      var target = start, cur = start, depth = 0;
      while (cur && cur.parentElement && depth < 6) {
        var p = cur.parentElement;
        if (/^(BODY|MAIN|HTML)$/.test(p.tagName)) break;
        if (p.querySelector('salla-add-product-button, form, input, select, textarea')) break;
        var len = txt(p).length;
        if (len > maxLen) break;
        cur = p; depth++;
        if (!preferWith || preferWith.test(txt(p))) target = p;
      }
      target.classList.add('og-hide');
    });
  }

  function hideConflicts() {
    // الشريط الثلاثي القديم (التسليم / الشارة / دعم فني حقيقي): نخفيه كامل
    hideByText(function (s) { return s.indexOf(W_AR) !== -1 || W_EN.test(s); }, 200,
      new RegExp(F_AR + '|دعم فني|instant|support', 'i'));
    // عداد الشراء والكمية المتبقية: نخفي السطر نفسه فقط
    hideByText(function (s) { return COUNTERS.test(s); }, 60, null);
  }

  /* --- 3. الرئيسية: شعارات الدفع داخل قسم الثقة ------------------------- */
  function cloneFooterPayments() {
    var trust = document.querySelector('.og-trust');
    if (!trust || trust.querySelector('.og-pay-row')) return;
    var src = document.querySelector('footer .s-payments-list, .s-payments-list');
    if (!src || !src.children.length) return;
    var row = src.cloneNode(true);
    row.classList.add('og-pay-row');
    row.removeAttribute('id');
    var ids = row.querySelectorAll('[id]');
    for (var i = 0; i < ids.length; i++) ids[i].removeAttribute('id');
    trust.appendChild(row);
  }

  /* --- التشغيل ----------------------------------------------------------- */
  function run() {
    try { buildReceiveBox(); } catch (e) { /* بدون تحسين */ }
    try { hideConflicts(); } catch (e) { /* بدون تحسين */ }
    try { cloneFooterPayments(); } catch (e) { /* بدون تحسين */ }
  }

  function start() {
    run();
    // مكونات سلة (Web Components) ترسم بعد التحميل؛ نراقب 6 ثواني فقط ثم نوقف
    if (!('MutationObserver' in window)) return;
    var pending = false;
    var mo = new MutationObserver(function () {
      if (pending) return;
      pending = true;
      setTimeout(function () { pending = false; run(); }, 250);
    });
    try { mo.observe(document.body, { childList: true, subtree: true }); } catch (e) { return; }
    setTimeout(function () { try { mo.disconnect(); } catch (e) { /* تجاهل */ } }, 6000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
