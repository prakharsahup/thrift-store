import { Marquee } from "@/components/motion/Marquee";
import { shipping } from "@/lib/config/shipping";
import { site } from "@/lib/config/site";
import { formatMoney } from "@/lib/utils/money";

// Phones: every message scrolls past in a Marquee (CSS only, so it's fine on store pages too).
// md+: the messages sit side by side. The current drop comes from the database in the drops phase.
export function AnnouncementBar() {
  const messages = [
    `Free shipping on orders of ${formatMoney(shipping.freeAbovePaise)}+`,
    ...site.announcements,
  ];

  return (
    <div className="surface-dark bg-fg text-bg">
      <Marquee
        items={messages}
        label="Announcements"
        speed={25}
        separator="✦"
        className="flex h-9 items-center text-xs font-medium md:hidden"
      />
      <ul className="site-container hidden h-9 items-center justify-center gap-8 text-xs font-medium md:flex">
        {messages.map((message) => (
          <li key={message}>{message}</li>
        ))}
      </ul>
    </div>
  );
}
