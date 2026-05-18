import projectService from "../services/projectService";

export const SITE_LOG_SUBMITTED_EVENT = "app:site-log-submitted";

export function notifySiteLogSubmitted(detail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SITE_LOG_SUBMITTED_EVENT, { detail }));
}

export async function syncMilestoneProgressFromSiteLog(projectId, log) {
  if (!projectId) return;
  const pct = Math.min(100, Math.max(0, Number(log?.progressPercent ?? 0)));
  // Send progressPercent explicitly; PM service redistributes all milestones.
  // Empty body would also work (PM fetches latest SiteOps log via Feign).
  await projectService.updateMilestoneProgress(projectId, { progressPercent: pct });
}
