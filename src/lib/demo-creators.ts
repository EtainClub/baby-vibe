import { demoApps, type DemoApp } from "@/lib/mock-data";
import type { PublicUserProfile } from "@/types/user";

export interface DemoCreator {
  profile: PublicUserProfile;
  apps: DemoApp[];
}

export const demoCreators: DemoCreator[] = [
  {
    profile: {
      username: "etime",
      displayName: "E-time",
      bio: "생활과 호기심을 작은 앱으로 만들고 있어요.",
      photoURL: null,
    },
    apps: demoApps,
  },
  {
    profile: {
      username: "seoyun",
      displayName: "서윤",
      bio: "매일의 귀찮음을 다정한 도구로 바꿔요.",
      photoURL: null,
    },
    apps: [
      {
        id: "fridge-note",
        name: "Fridge Note",
        description: "냉장고 속 재료를 잊지 않도록 사진 한 장으로 기록해요",
        tool: "Lovable",
        toolTone: "pink",
        status: "live",
        cover: "quiet",
        clicks: 96,
        cheers: 21,
        isFirst: true,
        url: "/?from=fridge-note",
        isPublished: true,
      },
      {
        id: "tiny-garden",
        name: "Tiny Garden",
        description: "반려 식물의 물 주는 날과 작은 변화를 함께 모아요",
        tool: "Claude Code",
        toolTone: "blue",
        status: "building",
        cover: "alien",
        clicks: 18,
        cheers: 7,
        url: null,
        isPublished: true,
      },
    ],
  },
  {
    profile: {
      username: "minjae",
      displayName: "민재",
      bio: "친구들과 더 자주 움직일 방법을 실험합니다.",
      photoURL: null,
    },
    apps: [
      {
        id: "mood-weather",
        name: "Mood Weather",
        description: "오늘의 기분을 날씨처럼 표현하고 한 달의 흐름을 살펴봐요",
        tool: "v0",
        toolTone: "orange",
        status: "live",
        cover: "coin",
        clicks: 143,
        cheers: 38,
        isFirst: true,
        url: "/?from=mood-weather",
        isPublished: true,
      },
      {
        id: "run-buddy",
        name: "Run Buddy",
        description: "친구와 가볍게 달리기 약속을 잡고 서로의 완주를 응원해요",
        tool: "Cursor",
        toolTone: "blue",
        status: "live",
        cover: "quiet",
        clicks: 72,
        cheers: 19,
        url: "/?from=run-buddy",
        isPublished: true,
      },
    ],
  },
  {
    profile: {
      username: "haru",
      displayName: "하루",
      bio: "좋아하는 전시와 문장을 작은 화면에 담고 있어요.",
      photoURL: null,
    },
    apps: [
      {
        id: "one-line-museum",
        name: "One Line Museum",
        description: "마음에 남은 작품과 한 줄 감상을 나만의 작은 전시로 만들어요",
        tool: "Claude Code",
        toolTone: "blue",
        status: "live",
        cover: "alien",
        clicks: 61,
        cheers: 16,
        isFirst: true,
        url: "/?from=one-line-museum",
        isPublished: true,
      },
    ],
  },
];
