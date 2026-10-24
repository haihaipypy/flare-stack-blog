import type { AffiliateOffer } from "../affiliate.schema";

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

function buildOffersPayload(offers: readonly AffiliateOffer[]): EmbedOffer[] {
  return offers.map((offer) => ({
    slug: offer.slug,
    t: `${offer.provider} · ${offer.title}`,
    p: offer.perk,
  }));
}

/** JSON 放进 JS 之前把 `<` 转义，避免有人把脚本内联进 HTML 时出现 `</script>` 截断 */
function safeJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

const EMBED_CSS = [
  // 所有可能被宿主继承的属性一律显式覆盖：宿主 <footer> 常见 text-align:center、
  // letter-spacing、text-transform、line-height 等，不写死就会把卡片带歪。
  ".aff-float{position:fixed;right:16px;bottom:16px;z-index:2147483000;display:none;width:272px;max-width:calc(100vw - 32px);margin:0;padding:0;border:0;background:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;font-size:14px;font-weight:400;font-style:normal;line-height:1.5;letter-spacing:normal;word-spacing:normal;text-align:left;text-indent:0;text-transform:none;text-shadow:none;white-space:normal;word-break:normal;overflow-wrap:normal;direction:ltr;color:#1f2328;visibility:visible;opacity:1}",
  "@media (min-width:1024px){.aff-float{display:block}}",
  ".aff-float.aff-float--left{right:auto;left:16px}",
  ".aff-float,.aff-float *{box-sizing:border-box}",
  // 内层统一用「.aff-float + 类名」双段选择器（特异性 0,2,0），
  // 否则宿主 `.footer a{...}` 这类（0,1,1）能压过我们的单类规则。
  ".aff-float .aff-float__card{position:relative;overflow:hidden;margin:0;padding:0;border-radius:14px;border:1px solid rgba(0,0,0,.1);background:#fff;box-shadow:0 10px 30px rgba(0,0,0,.13)}",
  ".aff-float .aff-float__a{display:flex;flex-direction:column;gap:2px;margin:0;padding:12px 34px 12px 14px;border:0;background:none;text-decoration:none;color:inherit}",
  ".aff-float .aff-float__a:hover{background:rgba(0,0,0,.03)}",
  ".aff-float .aff-float__tag{align-self:flex-start;margin:0 0 2px;padding:0 5px;border:0;border-radius:4px;background:rgba(0,0,0,.06);color:#6a737d;font-size:10px;font-weight:400;line-height:16px;letter-spacing:.04em}",
  ".aff-float .aff-float__t{display:block;margin:0;padding:0;font-size:13px;font-weight:600;line-height:1.4;letter-spacing:normal;color:#1f2328}",
  ".aff-float .aff-float__p{display:block;margin:0;padding:0;font-size:12px;font-weight:400;line-height:1.45;letter-spacing:normal;color:#6a737d}",
  ".aff-float .aff-float__c{display:block;margin:4px 0 0;padding:0;font-size:12px;font-weight:600;line-height:1.4;letter-spacing:normal;color:#2f6fed}",
  ".aff-float .aff-float__x{position:absolute;top:6px;right:6px;display:flex;align-items:center;justify-content:center;width:20px;height:20px;margin:0;padding:0;border:0;border-radius:50%;background:transparent;color:#8b949e;font-size:15px;font-weight:400;line-height:1;text-align:center;cursor:pointer;appearance:none;-webkit-appearance:none}",
  ".aff-float .aff-float__x:hover{background:rgba(0,0,0,.06);color:#1f2328}",
  // 宿主站是深色时白卡会很跳，跟系统偏好走一次
  "@media (prefers-color-scheme:dark){.aff-float .aff-float__card{border-color:rgba(255,255,255,.14);background:#26262b;box-shadow:0 10px 30px rgba(0,0,0,.5)}.aff-float .aff-float__a:hover{background:rgba(255,255,255,.06)}.aff-float .aff-float__tag{background:rgba(255,255,255,.1);color:#a0a6ad}.aff-float .aff-float__t{color:#f0f1f3}.aff-float .aff-float__p{color:#a0a6ad}.aff-float .aff-float__c{color:#7ea7ff}.aff-float .aff-float__x{color:#a0a6ad}.aff-float .aff-float__x:hover{background:rgba(255,255,255,.1);color:#f0f1f3}}",
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
 * @param offers 当前启用中的推广位（来自后台配置）；为空则下发空脚本
 */
export function buildFloatEmbedScript(
  origin: string,
  offers: readonly AffiliateOffer[],
): string {
  const base = origin.replace(/\/+$/, "");
  const payload = buildOffersPayload(offers);

  // 后台把悬浮位关了、或一条可用广告都没有：下发一个空 IIFE。
  // 不用 404，否则宿主站控制台会一直报红，还容易被当成坏链。
  if (payload.length === 0) {
    return "(function(){})();";
  }

  return `(function(){
"use strict";
/* aff-float embed v2 */
// 全页只允许初始化一次。宿主可能把同一段代码同时贴在 head、footer 模板和
// 后台「页脚代码」三个地方，靠标签上的 data-aff-init 拦不住不同的标签实例。
if(window.__affFloatInit){return;}
window.__affFloatInit=1;

var tags=document.querySelectorAll('script[data-aff-float]');
var el=document.currentScript||tags[tags.length-1]||null;
var d=(el&&el.dataset)||{};
if(el&&el.getAttribute('data-aff-init')==='1')return;
if(el)el.setAttribute('data-aff-init','1');

var OFFERS=${safeJson(payload)};
var BASE=${safeJson(base)};
var TXT=${safeJson(EMBED_TEXT)};
var CSS=${safeJson(EMBED_CSS)};
var KEY='aff-float-dismissed';

var langSrc=d.lang||(document.documentElement&&document.documentElement.lang)||'zh';
var lang=String(langSrc).toLowerCase().slice(0,2)==='en'?'en':'zh';
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
  // body 一律存在（脚本在 head/footer 都在 body 解析中或之后执行），
  // 但 body 被框架清空、或文档以非 HTML 方式呈现时仍可能有 null，兜底到 documentElement。
  var shell=document.body||document.documentElement;
  if(!shell)return;

  if(!document.getElementById('aff-float-style')){
    var st=document.createElement('style');
    st.id='aff-float-style';
    st.appendChild(document.createTextNode(CSS));
    (document.head||document.documentElement).appendChild(st);
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
  shell.appendChild(root);
}

// body 已存在（放在 footer / 页脚代码 / 被 JS 动态插入）就直接排程，不必等解析完；
// 只有放在 <head> 里同步执行、body 还没出现时，才等 DOMContentLoaded。
function start(){
  setTimeout(mount,delay);
}
if(document.body||document.readyState!=='loading'){
  start();
}else{
  document.addEventListener('DOMContentLoaded',start,{once:true});
}
})();`;
}
