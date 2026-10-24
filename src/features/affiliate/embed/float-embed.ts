import { affiliateOffers, affiliateSlugs } from "../affiliate.config";

/**
 * 生成「悬浮广告」可嵌入脚本。
 *
 * 设计要点：
 * 1. **脚本托管在博客上**（/embed/float.js），其他网站只插一行 `<script>`；
 *    以后换推广链接只改 affiliate.config.ts，所有嵌入站点下一次请求就自动生效。
 * 2. **点击统一回到本站 `/go/:slug`**，再由 302 跳厂商 —— 无论广告显示在谁的网站上，
 *    收益归属与点击统计都还在我们这边。
 * 3. **样式全部带 `.aff-float` 前缀 + `!important` 重要项**，不污染宿主站点；
 *    只注入一次（`#aff-float-style`），多个页脚不会重复。
 * 4. **挑选是确定性的**（hash(hostname + 当天)），同一站点当天固定一条、
 *    不同站点之间自动散开，跨天会换 —— 既好排查又能轮流曝光 5 条链接。
 */

interface EmbedOffer {
  slug: string;
  /** 卡片标题：平台名 · 优惠名 */
  t: string;
  /** 读者视角的优惠点 */
  p: string;
}

function buildOffersPayload(): EmbedOffer[] {
  return affiliateSlugs.map((slug) => {
    const offer = affiliateOffers[slug];
    return {
      slug: offer.slug,
      t: `${offer.providerName} · ${offer.title}`,
      p: offer.perk,
    };
  });
}

/** JSON 放进 JS 之前把 `<` 转义，避免有人把脚本内联进 HTML 时出现 `</script>` 截断 */
function safeJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

const EMBED_CSS = [
  ".aff-float{position:fixed;right:16px;bottom:16px;z-index:2147483000;display:none;width:272px;max-width:calc(100vw - 32px);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;font-size:14px;line-height:1.5;color:#1f2328;text-align:left;direction:ltr}",
  "@media (min-width:1024px){.aff-float{display:block}}",
  ".aff-float.aff-float--left{right:auto;left:16px}",
  ".aff-float *{box-sizing:border-box}",
  ".aff-float__card{position:relative;overflow:hidden;border-radius:14px;border:1px solid rgba(0,0,0,.1);background:#fff;box-shadow:0 10px 30px rgba(0,0,0,.13)}",
  ".aff-float__a{display:flex;flex-direction:column;gap:2px;padding:12px 34px 12px 14px;text-decoration:none;color:inherit}",
  ".aff-float__a:hover{background:rgba(0,0,0,.03)}",
  ".aff-float__tag{align-self:flex-start;margin-bottom:2px;padding:0 5px;border-radius:4px;background:rgba(0,0,0,.06);color:#6a737d;font-size:10px;line-height:16px;letter-spacing:.04em}",
  ".aff-float__t{font-size:13px;font-weight:600;line-height:1.4;color:#1f2328}",
  ".aff-float__p{font-size:12px;line-height:1.45;color:#6a737d}",
  ".aff-float__c{margin-top:4px;font-size:12px;font-weight:600;color:#2f6fed}",
  ".aff-float__x{position:absolute;top:6px;right:6px;display:flex;align-items:center;justify-content:center;width:20px;height:20px;padding:0;border:0;border-radius:50%;background:transparent;color:#8b949e;font-size:15px;line-height:1;cursor:pointer}",
  ".aff-float__x:hover{background:rgba(0,0,0,.06);color:#1f2328}",
].join("");

const EMBED_TEXT = {
  zh: {
    tag: "广告",
    cta: "去看看 →",
    close: "关闭广告",
    label: "推广",
  },
  en: {
    tag: "Ad",
    cta: "View offer →",
    close: "Close ad",
    label: "Sponsored",
  },
};

/**
 * 生成完整的自包含脚本。
 * @param origin 本站源站（如 https://blog.1day.vip），点击回流用
 */
export function buildFloatEmbedScript(origin: string): string {
  const base = origin.replace(/\/+$/, "");

  return `(function(){
"use strict";
var tags=document.querySelectorAll('script[data-aff-float]');
var el=document.currentScript||tags[tags.length-1];
if(!el||el.getAttribute('data-aff-init')==='1')return;
el.setAttribute('data-aff-init','1');

var OFFERS=${safeJson(buildOffersPayload())};
var BASE=${safeJson(base)};
var TXT=${safeJson(EMBED_TEXT)};
var CSS=${safeJson(EMBED_CSS)};
var KEY='aff-float-dismissed';

var d=el.dataset||{};
var lang=String(d.lang||'zh').toLowerCase().slice(0,2)==='en'?'en':'zh';
var T=TXT[lang];

var days=parseInt(d.dismissDays||'3',10);
if(!(days>0))days=3;
var delay=parseInt(d.delay||'1500',10);
if(!(delay>=0))delay=1500;

try{
  var until=parseInt(localStorage.getItem(KEY)||'0',10);
  if(until>Date.now())return;
}catch(e){}

function hash(s){
  var h=2166136261;
  for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}
  return h>>>0;
}

var host='';
try{host=location.hostname||'';}catch(e){}

var offer=null;
var forced=d.offer||'';
for(var i=0;i<OFFERS.length;i++){
  if(OFFERS[i].slug===forced){offer=OFFERS[i];break;}
}
if(!offer){
  var now=new Date();
  var day=now.getFullYear()*10000+(now.getMonth()+1)*100+now.getDate();
  offer=OFFERS[hash(host+'|'+day)%OFFERS.length];
}
if(!offer)return;

var href=BASE+'/go/'+offer.slug+(host?'?src='+encodeURIComponent(host):'');

function mount(){
  if(!document.body)return;

  if(!document.getElementById('aff-float-style')){
    var st=document.createElement('style');
    st.id='aff-float-style';
    st.appendChild(document.createTextNode(CSS));
    document.head.appendChild(st);
  }

  var root=document.createElement('div');
  root.className='aff-float'+(String(d.position||'')==='left'?' aff-float--left':'');
  root.setAttribute('role','complementary');
  root.setAttribute('aria-label',T.label);

  var card=document.createElement('div');
  card.className='aff-float__card';

  var a=document.createElement('a');
  a.className='aff-float__a';
  a.href=href;
  a.target='_blank';
  a.rel='sponsored nofollow noopener';

  var tag=document.createElement('span');
  tag.className='aff-float__tag';
  tag.textContent=T.tag;

  var title=document.createElement('span');
  title.className='aff-float__t';
  title.textContent=offer.t;

  var perk=document.createElement('span');
  perk.className='aff-float__p';
  perk.textContent=offer.p;

  var cta=document.createElement('span');
  cta.className='aff-float__c';
  cta.textContent=T.cta;

  a.appendChild(tag);
  a.appendChild(title);
  a.appendChild(perk);
  a.appendChild(cta);

  var x=document.createElement('button');
  x.type='button';
  x.className='aff-float__x';
  x.setAttribute('aria-label',T.close);
  x.textContent='\\u00d7';
  x.onclick=function(){
    try{localStorage.setItem(KEY,String(Date.now()+days*86400000));}catch(e){}
    if(root.parentNode)root.parentNode.removeChild(root);
  };

  card.appendChild(a);
  card.appendChild(x);
  root.appendChild(card);
  document.body.appendChild(root);
}

if(document.body){
  setTimeout(mount,delay);
}else{
  document.addEventListener('DOMContentLoaded',function(){setTimeout(mount,delay);});
}
})();`;
}
