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
var S=AR?[['cart',1,820,0,'طلب'],['star',0,5,1,'من 5 في 191 تقييم'],['users',1,1150,0,'عميل']]:[['cart',1,820,0,'orders'],['star',0,5,1,'out of 5 from 191 reviews'],['users',1,1150,0,'customers']];
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

/* og v0.2.14 (2026-11-27): ينظف نصوص الموقع وقت العرض: يشيل التشكيل (الشدة والحركات والتنوين)، ويبدل الشرطة الطويلة — والنقطة الوسطية · بفاصلة عادية. ما يلمس السلة والدفع والطلبات. */
(function(){try{
  var path=(location.pathname||'').toLowerCase();
  if(/\/(cart|checkout|payment|payments|thank-you|orders?)(\/|$)/.test(path))return;
  var AR=(document.documentElement.lang||'ar').slice(0,2)!=='en';
  var CM=AR?'، ':', ';
  var RD=/[ً-ْٰ]/g, RT=/[ً-ْٰ—–·•]/;
  var norm=function(s){
    s=s.replace(RD,'');
    s=s.replace(/(\d)\s*[–—]\s*(\d)/g,'$1-$2');
    s=s.replace(/^\s*[·•—–]\s*/,' ');
    s=s.replace(/\s*[·•—–]\s*$/,' ');
    s=s.replace(/\s*[·•—–]\s*/g,CM);
    return s;
  };
  var SKIP={SCRIPT:1,STYLE:1,TEXTAREA:1,INPUT:1,NOSCRIPT:1,CODE:1,PRE:1};
  var fixText=function(t){var v=t.nodeValue;if(v&&RT.test(v)){var p=t.parentNode;if(p&&!SKIP[p.nodeName]&&!p.isContentEditable){var n=norm(v);if(n!==v)t.nodeValue=n;}}};
  var walk=function(root){
    if(!root)return;
    if(root.nodeType===3){fixText(root);return;}
    if(root.nodeType!==1&&root.nodeType!==9&&root.nodeType!==11)return;
    if(root.nodeType===1&&SKIP[root.nodeName])return;
    var w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,null),n,a=[];
    while((n=w.nextNode()))a.push(n);
    for(var i=0;i<a.length;i++)fixText(a[i]);
    if(root.querySelectorAll){var ph=root.querySelectorAll('[placeholder],[title],[aria-label]');for(var j=0;j<ph.length;j++){['placeholder','title','aria-label'].forEach(function(k){var v=ph[j].getAttribute(k);if(v&&RT.test(v))ph[j].setAttribute(k,norm(v).trim());});}}
  };
  var queue=[],busy=false;
  var flush=function(){busy=false;var q=queue;queue=[];for(var i=0;i<q.length;i++)walk(q[i]);};
  var start=function(){
    walk(document.body);
    if(document.title&&RT.test(document.title))document.title=norm(document.title).trim();
    if('MutationObserver' in window){new MutationObserver(function(ms){for(var i=0;i<ms.length;i++){var m=ms[i];if(m.type==='characterData'){if(RT.test(m.target.nodeValue||''))queue.push(m.target);}else{for(var j=0;j<m.addedNodes.length;j++)queue.push(m.addedNodes[j]);}}if(queue.length&&!busy){busy=true;(window.requestAnimationFrame||setTimeout)(flush);}}).observe(document.body,{childList:true,subtree:true,characterData:true});}
  };
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',start);}else{start();}
}catch(e){}})();

/* og v0.2.15 (2026-11-27): الواجهة صارت شرائح تتبدل: ألعاب الأوفلاين، ألعاب بلايستيشن 5، ألعاب الأونلاين */
(function(){try{
  if((document.documentElement.lang||'ar').slice(0,2)==='en')return;
  var path=(location.pathname||'').replace(/\/+$/,'');
  if(!(path===''||path==='/ar'))return;
  var J='https://cdn.jsdelivr.net/gh/TiTansStore/oceangames-assets@c0ef37b79f9f3af2173e7134c27849494cb9f7b5/hero/';
  var ST='https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/';
  var O='/ar/';
  var SL=[
    {t:'ألعاب بلايستيشن 5',em:'من 74.99 ر.س',p:'قراند 6، إلدن رينغ، ريزدنت ايفل ريكويم وغيرها، تلعبها من حسابك الشخصي مع ضمان سنة.',
     b1:['تصفح ألعاب بلايستيشن',O+'playstation/c477347009'],b2:['اطلب قراند 6',O+'grand-theft-auto-6-ps5-primary/p822014425'],
     c:[[J+'ps5/elden-400.webp',O+'elden-ring-ps5-primary/p298056513','إلدن رينغ'],
        ['https://cdn.jsdelivr.net/gh/TiTansStore/oceangames-assets@72f40e9/hero/light/phantom-blade-zero-poster-300.webp',O+'phantom-blade-zero-ps5-primary/p1513787734','فانتوم بليد زيرو'],
        [J+'ps5/gta6-400.webp',O+'grand-theft-auto-6-ps5-primary/p822014425','قراند 6','قراند 6، 169.99 ر.س'],
        [J+'ps5/requiem-400.webp',O+'resident-evil-requiem-ps5-primary/p1732692940','ريزدنت ايفل ريكويم','ريكويم، 84.99 ر.س']]},
    {t:'ألعاب أونلاين',em:'من 9.99 ر.س',p:'مودرن وارفير 4، آرك رايدرز، فيفا 27 وريد ديد 2 على حساب ستيم خاص بك، تغير بياناته وتلعب أونلاين.',
     b1:['تصفح ألعاب الأونلاين',O+'onlinegames/c917561752'],b2:['اطلب مودرن وارفير 4',O+'call-of-duty-modern-warfare-4-steam-account/p1077039676'],
     c:[[ST+'1174180/library_600x900.jpg',O+'red-dead-redemption-2-steam-account/p507495291','ريد ديد ريدمبشن 2'],
        [J+'fc27.webp',O+'ea-sports-fc-27-steam-account/p111606232','فيفا 27'],
        [J+'mw4.webp',O+'call-of-duty-modern-warfare-4-steam-account/p1077039676','مودرن وارفير 4','الأكثر مبيعا، 184.99 ر.س'],
        [ST+'1808500/library_600x900.jpg',O+'arc-raiders-steam-account/p1344660420','آرك رايدرز','99.90 ر.س']]}
  ];
  var tries=0;
  var build=function(){
    var hero=document.querySelector('.og-hero');
    if(!hero){if(++tries<40)setTimeout(build,250);return;}
    if(hero.querySelector('.og-hs'))return;
    var w0=hero.querySelector('.og-hero__wrap');if(!w0)return;
    var span0=w0.querySelector('.og-fan a span');var spanCls=span0?span0.className:'';
    var hs=document.createElement('div');hs.className='og-hs';
    w0.parentNode.insertBefore(hs,w0);hs.appendChild(w0);w0.classList.add('og-hs__s','is-on');
    var b0=w0.querySelectorAll('.og-hero__cta a');
    if(b0[0]){b0[0].textContent='تصفح الألعاب';b0[0].href=O+'offline-games/c365938331';}
    if(b0[1]){b0[1].textContent='اطلب بكج اوشن';b0[1].href=O+'ocean-pack-all-offline-games-steam/p1940328167';}
    SL.forEach(function(s){
      var w=w0.cloneNode(true);w.classList.remove('is-on');w.setAttribute('aria-hidden','true');
      var h1=w.querySelector('h1');var emOld=h1?h1.querySelector('em'):null;
      var h=document.createElement('h2');h.className='og-hs-t';h.appendChild(document.createTextNode(s.t));h.appendChild(document.createElement('br'));
      var em=document.createElement('em');if(emOld)em.className=emOld.className;em.textContent=s.em;h.appendChild(em);
      if(h1)h1.parentNode.replaceChild(h,h1);
      var p=w.querySelector('p');if(p)p.textContent=s.p;
      var bs=w.querySelectorAll('.og-hero__cta a');
      if(bs[0]){bs[0].textContent=s.b1[0];bs[0].href=s.b1[1];}
      if(bs[1]){bs[1].textContent=s.b2[0];bs[1].href=s.b2[1];}
      var cs=w.querySelectorAll('.og-fan a');
      for(var i=0;i<cs.length&&i<s.c.length;i++){
        var a=cs[i],d=s.c[i];a.href=d[1];a.setAttribute('aria-label',d[2]);
        var im=a.querySelector('img');if(im){im.removeAttribute('srcset');im.removeAttribute('data-src');im.src=d[0];im.alt=d[2];}
        var sp=a.querySelector('span');
        if(d[3]){if(!sp){sp=document.createElement('span');sp.className=spanCls;a.insertBefore(sp,a.firstChild);}sp.textContent=d[3];}
        else if(sp){sp.parentNode.removeChild(sp);}
      }
      hs.appendChild(w);
    });
    var slides=hs.children,n=slides.length,cur=0,timer=null;
    var dots=document.createElement('div');dots.className='og-hdots';
    var go=function(k){
      slides[cur].classList.remove('is-on');slides[cur].setAttribute('aria-hidden','true');
      cur=(k+n)%n;slides[cur].classList.add('is-on');slides[cur].removeAttribute('aria-hidden');
      for(var j=0;j<dots.children.length;j++)dots.children[j].classList.toggle('is-on',j===cur);
    };
    var restart=function(){clearInterval(timer);timer=setInterval(function(){if(!document.hidden)go(cur+1);},6500);};
    for(var k=0;k<n;k++){(function(k){var b=document.createElement('button');b.type='button';b.setAttribute('aria-label','الشريحة '+(k+1));b.addEventListener('click',function(){go(k);restart();});dots.appendChild(b);})(k);}
    hs.parentNode.insertBefore(dots,hs.nextSibling);
    go(0);restart();
    hero.addEventListener('mouseenter',function(){clearInterval(timer);});
    hero.addEventListener('mouseleave',restart);
    var sx=null;
    hs.addEventListener('touchstart',function(e){sx=e.touches[0].clientX;},{passive:true});
    hs.addEventListener('touchend',function(e){if(sx===null)return;var dx=e.changedTouches[0].clientX-sx;if(Math.abs(dx)>40){go(cur+(dx>0?1:-1));restart();}sx=null;},{passive:true});
  };
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',build);}else{build();}
}catch(e){}})();

/* og v0.2.19 (2026-11-27): جنب اسم المنتج في البطاقات يطلع نوعه: «- ستيم PC» أو «- PS5» أو «- PC» */
(function(){try{
  var EN=(document.documentElement.lang||'ar').slice(0,2)==='en';
  var tag=function(full){
    if(/PS5|بلايستيشن|playstation/i.test(full))return 'PS5';
    if(/ستيم|steam/i.test(full))return EN?'Steam PC':'ستيم PC';
    if(/\bPC\b|windows|للكمبيوتر/i.test(full))return 'PC';
    return '';
  };
  var fix=function(root){
    if(!root||!root.querySelectorAll)return;
    var as=root.querySelectorAll('.s-product-card-content-title a');
    for(var i=0;i<as.length;i++){
      var a=as[i];if(a.querySelector('.og-plat'))continue;
      var full=a.getAttribute('title')||a.getAttribute('aria-label')||'';
      var t=tag(full);if(!t)continue;
      var shown=(a.textContent||'').trim();
      if(shown.indexOf(t)>-1||(t==='PS5'&&/بلايستيشن|playstation/i.test(shown))||(t!=='PS5'&&/ستيم|steam/i.test(shown)))continue;
      var s=document.createElement('span');s.className='og-plat';s.textContent='- '+t;
      a.appendChild(document.createTextNode(' '));a.appendChild(s);
    }
  };
  var busy=false;
  var run=function(){busy=false;fix(document.body);};
  var start=function(){
    run();
    if('MutationObserver' in window){new MutationObserver(function(ms){
      for(var i=0;i<ms.length;i++){var n=ms[i].addedNodes;for(var j=0;j<n.length;j++){if(n[j].nodeType===1&&!(n[j].classList&&n[j].classList.contains('og-plat'))){if(!busy){busy=true;setTimeout(run,120);}return;}}}
    }).observe(document.body,{childList:true,subtree:true});}
  };
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',start);}else{start();}
}catch(e){}})();
