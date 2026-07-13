# Drop the glacier video here

The experience expects **`glacier-journey.mp4`** in this folder. It is the one
asset that is not generated — everything else in `/public/images` is a placeholder
you should replace with the real artwork.

## This file is no longer scrubbed

The scroll-controlled backdrop is an **image sequence painted into a canvas**
(`public/frames/`), not this video. A `<video>` element coalesces and throttles
`currentTime` seeks, which is what made fast and reverse scrolling stutter no
matter how the file was encoded.

So this mp4 now has two jobs, and neither of them involves seeking:

1. **It is the source the frames are extracted from.** Drop the real footage here,
   then run `npm run frames` and copy the printed counts into `frames` in
   `src/config/content.ts`.
2. **It is the `lite` background loop** — a muted, looping backdrop for Data Saver
   and low-memory devices, which plays normally from start to finish.

**The old `-g 1` (keyframe-on-every-frame) advice no longer applies.** It existed
purely to make seeking cheap, it inflated the file several times over, and nothing
seeks this file any more. Encode it normally:

```bash
ffmpeg -i source.mov \
  -an \                        # no audio: it is muted anyway
  -vf "scale=1920:-2,fps=30" \
  -c:v libx264 -profile:v high -crf 23 \
  -movflags +faststart \
  glacier-journey.mp4
```

Length matters more than bitrate now: the frame count is fixed (180 desktop / 96
mobile) and spread across the whole clip, so a longer video means a coarser scrub.
**10–15 seconds is the sweet spot.** Beyond about 20s, raise the frame counts in
`scripts/extract-frames.mjs` to keep the scrub smooth.

Then update the poster, which is what the canvas shows before the first frame
lands:

```bash
ffmpeg -i glacier-journey.mp4 -vframes 1 -q:v 3 ../images/video-poster.jpg
```

Without the video the site still works: the frame loader logs the failure, falls
back to the poster image, and keeps every product section and both call-to-action
buttons usable.
