import { describe, expect, it } from "vitest";
import { affiliateSlugs } from "../affiliate.config";
import { buildFloatEmbedScript } from "./float-embed";

const ORIGIN = "https://blog.1day.vip";
const script = buildFloatEmbedScript(ORIGIN);

describe("悬浮广告嵌入脚本", () => {
  it("包含配置表里的全部推广位", () => {
    for (const slug of affiliateSlugs) {
      expect(script).toContain(`"slug":"${slug}"`);
    }
  });

  it("点击回流到本站 /go/:slug，而不是直连厂商", () => {
    expect(script).toContain(`${ORIGIN}/go/`);
    // 原始推广链接不应出现在脚本里，否则绕过统计
    expect(script).not.toContain("userCode=");
    expect(script).not.toContain("cps_key=");
  });

  it("origin 末尾带斜杠也不会拼出双斜杠", () => {
    const withSlash = buildFloatEmbedScript("https://blog.1day.vip/");
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

  it("只挂在 body 上、样式带命名空间，避免污染宿主站点", () => {
    expect(script).toContain("document.body.appendChild(root)");
    expect(script).toContain(".aff-float{");
    expect(script).toContain("aff-float-style");
  });

  it("不出现返佣类字样（平台规则与合规要求）", () => {
    expect(script).not.toMatch(/返佣|返利|返现/);
  });

  it("支持 data-offer 指定、data-position 换边", () => {
    expect(script).toContain("d.offer");
    expect(script).toContain("aff-float--left");
  });
});
