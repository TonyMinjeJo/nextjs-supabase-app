// Claude Code PostToolUse 훅 - Edit/Write 직후 변경된 파일을 Prettier로 포맷
//
// stdin으로 전달되는 훅 입력(JSON)에서 파일 경로를 읽어 prettier --write를 실행한다.
// .prettierignore에 걸리는 파일과 지원하지 않는 확장자는 건너뛴다.
// 포맷 실패가 Claude의 작업을 막지 않도록 항상 exit 0으로 종료한다.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectDir = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const prettierBin = resolve(projectDir, "node_modules/prettier/bin/prettier.cjs");

let input = "";
for await (const chunk of process.stdin) input += chunk;

try {
  const filePath = JSON.parse(input)?.tool_input?.file_path;

  if (filePath && existsSync(prettierBin) && existsSync(filePath)) {
    spawnSync(
      process.execPath,
      [prettierBin, "--write", "--ignore-unknown", "--log-level", "silent", filePath],
      { cwd: projectDir, stdio: "ignore" },
    );
  }
} catch {
  // 입력 파싱 등 어떤 오류도 작업을 막지 않는다
}

process.exit(0);
