import { scheduleEvaluation } from "../tab-manager/evaluation.ts";

export function onDetached(
  _tabId: number,
  detachInfo: { oldWindowId: number; oldPosition: number },
) {
  scheduleEvaluation(detachInfo.oldWindowId);
}
