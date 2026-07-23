export interface AppStats {
  appId: string;
  ownerId: string;
  outboundClicks: number;
  cheers: number;
  firstClickedAt: Date | null;
  lastClickedAt: Date | null;
  firstCheeredAt: Date | null;
  updatedAt: Date;
}

export interface DashboardTotals {
  appCount: number;
  outboundClicks: number;
  cheers: number;
}
