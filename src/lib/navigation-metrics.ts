import { dashboardAnalysis, improvementAnalysis, orderStatus, shippingReadiness, uniqueOrderRows, type Part } from "./shortages";

/** Navigation totals use the whole board, independent of table filters and perspective. */
export function navigationMetrics(parts: Part[]) {
  return {
    dashboard: { count: dashboardAnalysis(parts, "open").critical.length, unit: "critical parts" },
    board: { count: parts.length, unit: "parts" },
    shipping: { count: uniqueOrderRows(parts).filter(({ order }) => orderStatus(order) !== "cancelled" && !shippingReadiness(order).ready).length, unit: "orders not ready" },
    improvement: { count: improvementAnalysis(parts).openActions, unit: "open follow-ups" },
  };
}