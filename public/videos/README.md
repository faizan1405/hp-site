# Drop the glacier video here

The experience expects **`glacier-journey.mp4`** in this folder. It is the one
asset that is not generated — everything else in `/public/images` is a
placeholder you should replace with the real artwork.

Without it the site still works: `GlacierExperience` logs the failure, falls
back to the poster image and keeps every product section and both call-to-action
buttons usable.

## Encoding it for scrubbing

Scroll-scrubbing sets `video.currentTime` many times a second. A normally
encoded video only has a keyframe every few seconds, so every seek forces the
browser to decode from the last keyframe — which is what makes scrubbed video
feel like a slideshow. Re-encode with a keyframe on **every frame**:

```bash
ffmpeg -i source.mov \
  -an \                        # no audio: it is muted anyway
  -vf "scale=1920:-2,fps=30" \
  -c:v libx264 -profile:v high -crf 24 \
  -g 1 -keyint_min 1 -sc_threshold 0 \
  -movflags +faststart \
  glacier-journey.mp4
```

- `-g 1` — every frame is a keyframe, so any seek is instant.
- `-movflags +faststart` — metadata sits at the front of the file, so `duration`
  (and therefore the loading screen) resolves on the first few kilobytes.
- `-an` — drops the audio track.

Expect the file to be considerably larger than a normal export. Keep it under
roughly 15 MB: 15–25 seconds at 1920×1080 is the usual sweet spot. For mobile,
serving a 1280×720 variant is worth the extra build step.

Then update `public/images/video-poster.jpg` to the video's real first frame:

```bash
ffmpeg -i glacier-journey.mp4 -vframes 1 -q:v 3 ../images/video-poster.jpg
```
