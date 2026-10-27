import { describe, expect, it } from "vitest";
import { componentName, groupComponents, label, INCIDENT_STATUS, worst, type SpComponent } from "../src/lib/status";

const c = (id: string, name: string, extra: Partial<SpComponent> = {}): SpComponent => ({
  id, name, status: "operational", description: null, position: 0, group: false, group_id: null, only_show_if_degraded: false, ...extra,
});

describe("status", () => {
  it("groups components and hides only-if-degraded entries", () => {
    const list = [
      c("api", "API", { position: 1 }),
      c("voice", "Voice", { group: true, position: 2, components: ["ams", "fra"] }),
      c("ams", "Rotterdam", { group_id: "voice", position: 1 }),
      c("fra", "Europe", { group_id: "voice", position: 2, status: "partial_outage" }),
      c("hidden", "Secret", { only_show_if_degraded: true, position: 3 }),
    ];
    const g = groupComponents(list);
    expect(g.map((x) => x.id)).toEqual(["api", "voice"]);
    expect(g[1]!.children.map((x) => x.id)).toEqual(["ams", "fra"]);
    expect(g[1]!.status).toBe("partial_outage");
    list[4]!.status = "major_outage";
    expect(groupComponents(list).map((x) => x.id)).toContain("hidden");
  });
  it("picks the worst status", () => {
    expect(worst(["operational", "under_maintenance", "degraded_performance"])).toBe("degraded_performance");
    expect(worst([])).toBe("operational");
  });
  it("translates", () => {
    expect(componentName("US East", "de")).toBe("USA Ost");
    expect(componentName("US East", "en")).toBe("US East");
    expect(componentName("Brand New", "de")).toBe("Brand New");
    expect(label(INCIDENT_STATUS, "monitoring", "de")).toBe("Wird beobachtet");
    expect(label(INCIDENT_STATUS, "new_state", "en")).toBe("new state");
  });
});
