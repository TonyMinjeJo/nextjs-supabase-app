import { ImageResponse } from "next/og";

// 사이트 공통 공유 미리보기 이미지 (카톡 등에 링크를 붙였을 때 보이는 그림).
// 한글 글리프가 있는 폰트가 필요해서 Noto Sans KR을 필요한 글자만 부분집합으로 받아 씁니다.
// 폰트를 받지 못하면 한글이 깨지므로 영문 문구로 대체해 이미지는 항상 생성되게 합니다.

export const alt = "모임 이벤트 - 공지, 참석, 출석을 링크 하나로";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const TITLE_KO = "모임 이벤트";
const TAGLINE_KO = "공지, 참석, 출석을 링크 하나로";
const TITLE_EN = "Meetup Events";
const TAGLINE_EN = "Notices, RSVPs and attendance in one link";

// 받은 폰트는 서버 인스턴스 안에서 재사용합니다. (요청마다 Google Fonts를 다시 받지 않도록)
// 요청별 상태가 아니라 변하지 않는 정적 파일이라 전역에 두어도 안전하고, 실패는 저장하지 않아 다음 요청에 재시도합니다.
let cachedFont: ArrayBuffer | null = null;

/** 글자 부분집합 폰트(TTF)를 받습니다. 실패하면 null */
async function loadKoreanFont(text: string): Promise<ArrayBuffer | null> {
  if (cachedFont) return cachedFont;
  try {
    const cssUrl = `https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@700&text=${encodeURIComponent(text)}`;
    // User-Agent를 보내지 않으면 Google Fonts가 ttf 주소를 돌려줍니다. (ImageResponse는 woff2 미지원)
    const css = await (await fetch(cssUrl)).text();
    const fontUrl = css.match(
      /src: url\((.+?)\) format\('(?:opentype|truetype)'\)/,
    )?.[1];
    if (!fontUrl) return null;
    const res = await fetch(fontUrl);
    if (!res.ok) return null;
    cachedFont = await res.arrayBuffer();
    return cachedFont;
  } catch {
    return null;
  }
}

export default async function Image() {
  const font = await loadKoreanFont(`${TITLE_KO}${TAGLINE_KO}`);
  const title = font ? TITLE_KO : TITLE_EN;
  const tagline = font ? TAGLINE_KO : TAGLINE_EN;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "0 96px",
        background: "linear-gradient(135deg, #0a0a0a 0%, #1f2937 100%)",
        color: "#ffffff",
      }}
    >
      <div
        style={{
          display: "flex",
          width: 96,
          height: 8,
          borderRadius: 4,
          background: "#34d399",
          marginBottom: 40,
        }}
      />
      <div style={{ display: "flex", fontSize: 112, fontWeight: 700 }}>
        {title}
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 48,
          marginTop: 24,
          color: "#d1d5db",
        }}
      >
        {tagline}
      </div>
    </div>,
    {
      ...size,
      fonts: font
        ? [{ name: "Noto Sans KR", data: font, weight: 700, style: "normal" }]
        : undefined,
    },
  );
}
