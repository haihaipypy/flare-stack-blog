import { describe, expect, it } from "vitest";
import { DEFAULT_AFFILIATE_OFFERS } from "../affiliate.defaults";
import { buildFloatEmbedScript } from "./float-embed";

const ORIGIN = "https://blog.1day.vip";
const script = buildFloatEmbedScript(ORIGIN, DEFAULT_AFFILIATE_OFFERS);

describe("悬浮广告嵌入脚本", () => {
  it("包含当前配置里的全部推广位", () => {
    for (const offer of DEFAULT_AFFILIATE_OFFERS) {
      expect(script).toContain(`"slug":"${offer.slug}"`);
      expect(script).toContain(offer.provider);
    }
  });

  it("点击回流到本站 /go/:slug，而不是直连厂商", () => {
    expect(script).toContain(`${ORIGIN}/go/`);
    // 原始推广链接不应出现在脚本里，否则绕过统计
    expect(script).not.toContain("userCode=");
    expect(script).not.toContain("cps_key=");
  });

  it("没有可用推广位时下发空脚本，宿主站不会报错", () => {
    const empty = buildFloatEmbedScript(ORIGIN, []);
    expect(empty).toBe("(function(){})();");
    expect(empty).not.toContain("/go/");
  });

  it("origin 末尾带斜杠也不会拼出双斜杠", () => {
    const withSlash = buildFloatEmbedScript(
      "https://blog.1day.vip/",
      DEFAULT_AFFILIATE_OFFERS,
    );
    expect(withSlash).toContain('"https://blog.1day.vip"');
    expect(withSlash).not.toContain("https://blog.1day.vip//go/");
  });

  it("可以安全内联进 HTML（不会提前闭合 script）", () => {
    expect(script.toLowerCase()).not.toContain("</script");
  });

  it("中英文案都在，靠 data-lang 切换", () => {
    expect(script).toContain('"tag":"广告"');
    expect(script).toContain('"tag":"Ad"');
    expect(script).toContain("去看看");
    expect(script).toContain("View offer");
  });

  it("带广告可识别性与外链安全属性", () => {
    expect(script).toContain("sponsored nofollow noopener");
    expect(script).toContain("target='_blank'");
  });

  it("样式全部带 .aff-float 命名空间，不污染宿主站点", () => {
    expect(script).toContain(".aff-float{");
    expect(script).toContain("aff-float-style");
  });

  it("不依赖插入位置：head / body / footer / 动态注入都能挂载", () => {
    // 挂载点带兜底，body 缺失时退到 documentElement
    expect(script).toContain("document.body||document.documentElement");
    // body 已存在就直接跑；只有 body 还没解析出来才等 DOMContentLoaded
    expect(script).toContain(
      "if(document.body||document.readyState!=='loading')",
    );
    expect(script).toContain("DOMContentLoaded");
    // 样式表注入也兜底
    expect(script).toContain("(document.head||document.documentElement)");
  });

  it("同一页插入多份代码也只出一个卡片", () => {
    expect(script).toContain("window.__affFloatInit");
  });

  it("内层样式用双段选择器，压得住宿主 .footer a 这类规则", () => {
    expect(script).toContain(".aff-float .aff-float__a{");
    expect(script).toContain(".aff-float .aff-float__t{");
    expect(script).toContain(".aff-float .aff-float__x{");
  });

  it("覆盖可继承属性，避免被宿主页脚样式带歪", () => {
    for (const prop of [
      "letter-spacing:normal",
      "text-transform:none",
      "text-indent:0",
      "line-height:1.5",
      "text-align:left",
    ]) {
      expect(script).toContain(prop);
    }
  });

  it("未指定 data-lang 时跟随宿主页面 html lang", () => {
    expect(script).toContain("document.documentElement.lang");
  });

  it("不出现返佣类字样（平台规则与合规要求）", () => {
    expect(script).not.toMatch(/返佣|返利|返现/);
  });

  it("支持 data-offer 指定、data-position 换边", () => {
    expect(script).toContain("d.offer");
    expect(script).toContain("aff-float--left");
  });

  it("体积控制在 10KB 内", () => {
    expect(Buffer.byteLength(script)).toBeLessThan(10 * 1024);
  });
});
