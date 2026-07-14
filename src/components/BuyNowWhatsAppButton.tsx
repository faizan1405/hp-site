import { buyNowWhatsapp, buyNowWhatsappHref } from "@/config/content";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";

type BuyNowWhatsAppButtonProps = {
  className: string;
};

/**
 * Opens WhatsApp, in a new tab, with the client's pre-written order message.
 * `className` is required so each placement can match its own surrounding
 * layout (the device scene vs. the final CTA) without this component guessing.
 */
export function BuyNowWhatsAppButton({ className }: BuyNowWhatsAppButtonProps) {
  return (
    <a href={buyNowWhatsappHref} target="_blank" rel="noopener noreferrer" className={className}>
      <WhatsAppIcon className="h-4 w-4 shrink-0" />
      {buyNowWhatsapp.label}
    </a>
  );
}
