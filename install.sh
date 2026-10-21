#!/usr/bin/env bash
# Link the unslop skill into an agent's skills folder, so `git pull` updates it in place.
#
#   ./install.sh               # Claude Code: ~/.claude/skills/unslop
#   ./install.sh --codex       # Codex:       ~/.codex/skills/unslop
#   ./install.sh --all-agents  # both
#   ./install.sh --uninstall   # remove the links this script made
set -euo pipefail

SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/skills/unslop"
targets=() mode=install
for arg in "$@"; do
  case "$arg" in
    --claude)     targets+=("$HOME/.claude/skills") ;;
    --codex)      targets+=("$HOME/.codex/skills") ;;
    --all-agents) targets+=("$HOME/.claude/skills" "$HOME/.codex/skills") ;;
    --uninstall)  mode=uninstall ;;
    -h|--help)    sed -n '2,8p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *)            echo "unknown option: $arg" >&2; exit 2 ;;
  esac
done
[[ ${#targets[@]} -eq 0 ]] && targets=("$HOME/.claude/skills")

for dir in "${targets[@]}"; do
  link="$dir/unslop"
  if [[ $mode == uninstall ]]; then
    if [[ -L $link && "$(readlink "$link")" == "$SRC" ]]; then rm "$link"; echo "removed $link"; fi
    continue
  fi
  mkdir -p "$dir"
  if [[ -e $link && ! -L $link ]]; then echo "skipped $link: a real folder is already there" >&2; continue; fi
  ln -sfn "$SRC" "$link"
  echo "linked $link -> $SRC"
done
