#!/usr/bin/env bash
set -euo pipefail
launchctl bootout "gui/$(id -u)/local.oncolife.server"
printf 'OncoLife 后台服务已停止。\n'
