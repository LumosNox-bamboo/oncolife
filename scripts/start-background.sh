#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p .runtime
node_path="$(command -v node)"
service="gui/$(id -u)/local.oncolife.server"
if launchctl print "$service" >/dev/null 2>&1; then
  launchctl kickstart "$service"
else
  python3 - "$PWD" "$node_path" <<'PY'
import pathlib, plistlib, sys
root = pathlib.Path(sys.argv[1])
config = {
    'Label': 'local.oncolife.server',
    'ProgramArguments': [sys.argv[2], str(root / 'node_modules/vite/bin/vite.js'), '--host', '127.0.0.1', '--port', '5188', '--strictPort'],
    'WorkingDirectory': str(root),
    'RunAtLoad': True,
    'KeepAlive': True,
    'ThrottleInterval': 10,
    'StandardOutPath': str(root / '.runtime/server.log'),
    'StandardErrorPath': str(root / '.runtime/server-error.log'),
}
with (root / '.runtime/server.plist').open('wb') as f:
    plistlib.dump(config, f)
PY
  launchctl bootstrap "gui/$(id -u)" "$PWD/.runtime/server.plist"
fi
printf 'OncoLife 后台服务已启动：http://127.0.0.1:5188/\n退出登录或重启电脑后，需要再次运行此脚本。\n'
