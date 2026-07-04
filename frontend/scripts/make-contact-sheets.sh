#!/bin/bash
# 캡처된 장비 스크린샷을 라벨 붙은 컨택트 시트로 합친다.
# 사용: bash scripts/make-contact-sheets.sh
set -euo pipefail
cd "$(dirname "$0")/.."

OUT=sheets
rm -rf "$OUT" && mkdir -p "$OUT"

# 카테고리별 크롭 영역 (1600x800 원본에서 아이템이 보이는 영역)
crop_for() {
  case "$1" in
    sword|axe|bow|spear|wand|dagger) echo "1000x800+100+0" ;; # 오른손: 왼쪽으로 뻗음
    shield) echo "1000x800+550+0" ;;                          # 왼손: 오른쪽으로 뻗음
    *) echo "700x800+450+0" ;;                                # 착용류: 중앙
  esac
}

for dir in capture/*/; do
  cat=$(basename "$dir")
  crop=$(crop_for "$cat")
  tmp=$(mktemp -d)

  # 크롭 + 축소 + 라벨
  for f in "$dir"*.png; do
    name=$(basename "$f" .png)
    magick "$f" -crop "$crop" +repage -resize 200x "$tmp/$name.png"
  done

  # 48장(6x8)씩 시트 생성
  magick montage "$tmp"/*.png -label '%t' -tile 6x8 \
    -geometry +4+4 -font /System/Library/Fonts/Supplemental/Arial.ttf -pointsize 13 -background '#202020' -fill white \
    "$OUT/${cat}_%d.png"

  rm -rf "$tmp"
  echo "$cat done"
done

ls -la "$OUT"
