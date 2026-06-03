import { sampleReport } from "./sampleData";
import type { DiscoveryReport } from "./types";

export async function loadDiscoveryReport(): Promise<DiscoveryReport> {
  const baseUrl = import.meta.env.BASE_URL || "./";
  const dataUrl = `${baseUrl}data/latest.json`;

  try {
    const response = await fetch(dataUrl, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to load discovery data: ${response.status}`);
    }

    const report = (await response.json()) as DiscoveryReport;
    if (!Array.isArray(report.items)) {
      throw new Error("Discovery data is missing items");
    }

    return report;
  } catch (error) {
    console.warn(error);
    return sampleReport;
  }
}
