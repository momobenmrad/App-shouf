#!/bin/sh
# Generates the demo video (test pattern + tone) as an HLS ladder: 360p and 720p, H.264/AAC, 4 s segments.
set -eu
OUT=${1:-/media/hls}
mkdir -p "$OUT/360p" "$OUT/720p"
FONT=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf
LABEL=""
[ -f "$FONT" ] && LABEL=",drawtext=fontfile=$FONT:text='CHOUF DEMO':fontsize=h/8:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2:box=1:boxcolor=black@0.5"
ffmpeg -hide_banner -loglevel error -y \
  -f lavfi -i "testsrc2=size=1280x720:rate=25:duration=60" \
  -f lavfi -i "sine=frequency=330:duration=60" \
  -filter_complex "[0:v]format=yuv420p${LABEL},split=2[a][b];[a]scale=640:360[v360];[b]copy[v720]" \
  -map "[v360]" -map 1:a -map "[v720]" -map 1:a \
  -c:v libx264 -preset veryfast -profile:v main -g 50 -keyint_min 50 -sc_threshold 0 \
  -b:v:0 700k -maxrate:v:0 770k -bufsize:v:0 1400k \
  -b:v:1 2000k -maxrate:v:1 2200k -bufsize:v:1 4000k \
  -c:a aac -b:a 96k -ac 2 \
  -f hls -hls_time 4 -hls_playlist_type vod -hls_flags independent_segments \
  -hls_segment_filename "$OUT/%v/seg_%05d.ts" -master_pl_name master.m3u8 \
  -var_stream_map "v:0,a:0,name:360p v:1,a:1,name:720p" "$OUT/%v/index.m3u8"
ffmpeg -hide_banner -loglevel error -y -ss 1 -i "$OUT/720p/seg_00002.ts" -frames:v 1 -q:v 3 "$OUT/poster.jpg"
echo "demo HLS: $(ls "$OUT"/720p/*.ts | wc -l) segments per rendition"
