export type AppStatus = "live" | "building" | "paused";

export type DemoApp = {
  id: string;
  name: string;
  description: string;
  tool: string;
  toolTone: "blue" | "pink" | "orange";
  status: AppStatus;
  cover: "alien" | "coin" | "quiet";
  clicks: number;
  cheers: number;
  isFirst?: boolean;
  imageURL?: string | null;
  faviconURL?: string | null;
  url?: string | null;
  isPublished?: boolean;
};

export const demoApps: DemoApp[] = [
  {
    id: "alien-index",
    name: "Alien Index",
    description: "당신이 얼마나 외계인에 가까운지 1분 만에 알아보는 재미있는 테스트",
    tool: "Claude Code",
    toolTone: "blue",
    status: "live",
    cover: "alien",
    clicks: 128,
    cheers: 24,
    isFirst: true,
    url: "/?from=alien-index",
    isPublished: true,
  },
  {
    id: "coin-collector",
    name: "Coin Collector",
    description: "여행에서 모은 동전들을 사진과 이야기로 차곡차곡 기록해요",
    tool: "Lovable",
    toolTone: "pink",
    status: "live",
    cover: "coin",
    clicks: 84,
    cheers: 18,
    url: "/?from=coin-collector",
    isPublished: true,
  },
  {
    id: "quiet-minute",
    name: "Quiet Minute",
    description: "복잡한 하루 사이, 딱 1분만 숨을 고르는 작은 호흡 앱",
    tool: "v0",
    toolTone: "orange",
    status: "building",
    cover: "quiet",
    clicks: 31,
    cheers: 9,
    url: null,
    isPublished: true,
  },
];

export const statusLabel: Record<AppStatus, string> = {
  live: "지금 사용할 수 있어요",
  building: "아직 만들고 있어요",
  paused: "잠시 쉬고 있어요",
};
