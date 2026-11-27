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

/* og v0.2.10 (2026-11-27): زر «عرض الكل» لآراء العملاء لو سلة ما حطته */
(function(){try{var f=function(){var s=document.querySelector('section.s-block--testimonials salla-slider');if(s&&!s.getAttribute('display-all-url')){var l=(document.documentElement.lang||'ar').slice(0,2);s.setAttribute('display-all-url',location.origin+'/'+l+'/testimonials');}};if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',f);}else{f();}setTimeout(f,2500);}catch(e){}})();

/* og v0.2.12 (2026-11-27): عنوان «قالوا عن اوشن قيمز» + إحصائيات بأيقونات متحركة وعداد (الأرقام من تقارير سلة 27 نوفمبر) */
(function(){try{
var AR=(document.documentElement.lang||'ar').slice(0,2)!=='en';
var I={cart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6"/><circle cx="10" cy="20" r="1.3"/><circle cx="17" cy="20" r="1.3"/></svg>',star:'<svg viewBox="0 0 24 24" fill="#F5B700" stroke="#F5B700" stroke-width="1.5" stroke-linejoin="round"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z"/></svg>',users:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 14.5a6.5 6.5 0 0 1 3 5.5"/></svg>'};
var S=AR?[['cart',1,750,0,'طلب'],['star',0,4.99,2,'من 5 في 192 تقييم'],['users',1,1100,0,'عميل']]:[['cart',1,750,0,'orders'],['star',0,4.99,2,'out of 5 from 192 reviews'],['users',1,1100,0,'customers']];
var fmt=function(s,v){var n=v.toFixed(s[3]);return s[1]?(AR?'+'+n:n+'+'):n;};
var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var count=function(row){var bs=row.querySelectorAll('.og-tt b');S.forEach(function(s,i){var b=bs[i];if(!b||reduce)return;var t0=null;var step=function(t){if(t0===null)t0=t;var k=Math.min(1,(t-t0)/1300),e=1-Math.pow(1-k,3);b.textContent=fmt(s,s[2]*e);if(k<1){requestAnimationFrame(step);}else{b.textContent=fmt(s,s[2]);}};requestAnimationFrame(step);});};
var run=function(){
  var sec=document.querySelector('section.s-block--testimonials');if(!sec)return;
  var sl=sec.querySelector('salla-slider');if(!sl)return;
  if(AR){var t='قالوا عن اوشن قيمز';if(sl.getAttribute('block-title')!==t)sl.setAttribute('block-title',t);}
  setTimeout(function(){
    if(sec.querySelector('.og-tstats'))return;
    var ti=sl.querySelector('.s-slider-block__title');if(!ti)return;
    var row=document.createElement('div');row.className='og-tstats';
    row.innerHTML=S.map(function(s){return '<div><i class="og-ti og-ti--'+s[0]+'" aria-hidden="true">'+I[s[0]]+'</i><span class="og-tt"><b></b><small></small></span></div>';}).join('');
    var items=row.querySelectorAll('.og-tt');S.forEach(function(s,i){items[i].querySelector('b').textContent=fmt(s,s[2]);items[i].querySelector('small').textContent=s[4];});
    ti.insertAdjacentElement('afterend',row);
    if('IntersectionObserver' in window){var io=new IntersectionObserver(function(en){en.forEach(function(x){if(x.isIntersecting){count(row);io.disconnect();}});},{threshold:.4});io.observe(row);}
  },700);
};
if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',run);}else{run();}
setTimeout(run,2500);setTimeout(run,5000);
}catch(e){}})();

/* og v0.2.13 (2026-11-27): شيل التشكيل (الشدة والفتحة والضمة والكسرة والسكون والتنوين) من نصوص الموقع. ما يلمس السلة والدفع والطلبات. */
(function(){try{
  var path=(location.pathname||'').toLowerCase();
  if(/\/(cart|checkout|payment|payments|thank-you|orders?)(\/|$)/.test(path))return;
  var RG=/[ً-ْٰ]/g, RT=/[ً-ْٰ]/;
  var SKIP={SCRIPT:1,STYLE:1,TEXTAREA:1,INPUT:1,NOSCRIPT:1,CODE:1,PRE:1};
  var fixText=function(t){if(t.nodeValue&&RT.test(t.nodeValue)){var p=t.parentNode;if(p&&!SKIP[p.nodeName]&&!p.isContentEditable)t.nodeValue=t.nodeValue.replace(RG,'');}};
  var walk=function(root){
    if(!root)return;
    if(root.nodeType===3){fixText(root);return;}
    if(root.nodeType!==1&&root.nodeType!==9&&root.nodeType!==11)return;
    if(root.nodeType===1&&SKIP[root.nodeName])return;
    var w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,null),n,a=[];
    while((n=w.nextNode()))a.push(n);
    for(var i=0;i<a.length;i++)fixText(a[i]);
    if(root.querySelectorAll){var ph=root.querySelectorAll('[placeholder],[title],[aria-label]');for(var j=0;j<ph.length;j++){['placeholder','title','aria-label'].forEach(function(k){var v=ph[j].getAttribute(k);if(v&&RT.test(v))ph[j].setAttribute(k,v.replace(RG,''));});}}
  };
  var queue=[],busy=false;
  var flush=function(){busy=false;var q=queue;queue=[];for(var i=0;i<q.length;i++)walk(q[i]);};
  var start=function(){
    walk(document.body);
    if(document.title&&RT.test(document.title))document.title=document.title.replace(RG,'');
    if('MutationObserver' in window){new MutationObserver(function(ms){for(var i=0;i<ms.length;i++){var m=ms[i];if(m.type==='characterData'){if(RT.test(m.target.nodeValue||''))queue.push(m.target);}else{for(var j=0;j<m.addedNodes.length;j++)queue.push(m.addedNodes[j]);}}if(queue.length&&!busy){busy=true;(window.requestAnimationFrame||setTimeout)(flush);}}).observe(document.body,{childList:true,subtree:true,characterData:true});}
  };
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',start);}else{start();}
}catch(e){}})();
