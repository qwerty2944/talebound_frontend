import type { QuestObjective, QuestWithStatus } from "../types";

/** 목표를 사람이 읽는 문구로 변환 */
export function getObjectiveText(obj: QuestObjective, progress: { kill?: number }): string {
  switch (obj.type) {
    case "kill":
      return `처치 ${progress.kill ?? 0}/${obj.count ?? 1}`;
    case "collect":
      return `수집 ${obj.count ?? 1}개 (인벤토리 확인)`;
    case "visit":
      return `방문: 목표 지역으로 이동`;
    default:
      return "";
  }
}

/** 보상 수령(claim) 가능 여부 (서버가 최종 검증하지만 UI 힌트로 사용) */
export function canClaim(q: QuestWithStatus, currentMapId?: string): boolean {
  if (q.status === "claimed") return false;
  if (q.status === "completed") return true; // kill 완료
  if (q.status !== "accepted") return false;
  if (q.objective.type === "visit") return currentMapId === q.objective.mapId;
  if (q.objective.type === "collect") return true; // 서버가 인벤토리 확인
  return false;
}

export const QUEST_STATUS_LABEL: Record<QuestWithStatus["status"], string> = {
  available: "수락 가능",
  accepted: "진행 중",
  completed: "완료",
  claimed: "보상 수령됨",
};
