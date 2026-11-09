#!/usr/bin/env bash
# publish.sh — create the GitHub repo, push, and enable GitHub Pages
set -euo pipefail
GH=/c/HermesProject/_tools/gh/bin/gh.exe
cd /c/HermesProject/kelas_tools

USER=$($GH api user --jq .login)
echo "user: $USER"

if ! $GH repo view "$USER/kelas-tools" >/dev/null 2>&1; then
  $GH repo create kelas-tools --public --description "Alat gratis untuk guru: roda putar nama, pembagi kelompok, timer kelas" --source=. --remote=origin --push
else
  git remote remove origin 2>/dev/null || true
  git remote add origin "https://github.com/$USER/kelas-tools.git"
  git push -u origin main || git push -u origin master
fi

# enable Pages from the default branch root
if ! $GH api "repos/$USER/kelas-tools/pages" >/dev/null 2>&1; then
  BRANCH=$(git rev-parse --abbrev-ref HEAD)
  $GH api -X POST "repos/$USER/kelas-tools/pages" \
    -f "source[branch]=$BRANCH" -f "source[path]=/" >/dev/null
  echo "pages enabled on $BRANCH"
else
  echo "pages already enabled"
fi

echo "URL: https://$USER.github.io/kelas-tools/"
