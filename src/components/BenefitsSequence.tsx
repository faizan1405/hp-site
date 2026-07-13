"use client";

import type { RefObject } from "react";
import { BenefitCard } from "@/components/BenefitCard";
import { benefits } from "@/config/content";

type BenefitsSequenceProps = {
  /** One entry per benefit, in order. Populated as the cards mount. */
  cardRefs: RefObject<(HTMLDivElement | null)[]>;
};

/**
 * Scene 7 — the benefits, one card at a time.
 *
 * Renders NOTHING today, and that is the point. Five benefit claims arrived with
 * the client's reference artwork — blood sugar, insulin sensitivity, digestion,
 * weight management, "rich in nutrients" — and every one of them is either a
 * medical claim or a mineral-content claim, so none of them can be published
 * without evidence behind it. `verifiedBenefits` in content.ts is empty, so this
 * component returns null and the benefits act consumes no scroll whatsoever: the
 * journey runs straight from the layer walk to the water finale.
 *
 * Add one verified benefit to content.ts and the card, its scroll window, and the
 * extra pin length it needs all appear on their own. Nothing here changes.
 */
export function BenefitsSequence({ cardRefs }: BenefitsSequenceProps) {
  if (benefits.length === 0) return null;

  return (
    <>
      {benefits.map((benefit, index) => (
        <BenefitCard
          key={benefit.id}
          ref={(node) => {
            cardRefs.current[index] = node;
          }}
          benefit={benefit}
          index={index}
          total={benefits.length}
        />
      ))}
    </>
  );
}
