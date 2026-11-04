// 요청 시점의 현재 시각(ms).
// 컴포넌트 밖에 두어 순수성 린트(react-hooks/purity)를 피합니다.
// Cache Components에서는 호출 전에 `await connection()`(next/server)으로
// 요청 시점 렌더링을 보장해야 합니다.
export function getNowMs(): number {
  return Date.now();
}
