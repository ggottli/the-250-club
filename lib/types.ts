export interface GroupMeta {
  id: string;
  name: string;
  goal: number;
  joinCode: string;
  isPublic: boolean;
  createdAt: number;
}

export interface LeaderboardEntry {
  memberId: string;
  name: string;
  count: number;
}

export interface TickerEvent {
  name: string;
  ts: number;
  type: "beer" | "undo";
}

export interface MilestoneHit {
  title: string;
  fact: string;
  isFinale: boolean;
}

export interface GroupState {
  meta: GroupMeta;
  total: number;
  leaderboard: LeaderboardEntry[];
  events: TickerEvent[];
}

export interface PublicGroupSummary {
  id: string;
  name: string;
  total: number;
  goal: number;
  memberCount: number;
}
