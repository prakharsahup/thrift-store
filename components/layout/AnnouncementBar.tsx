import { Marquee } from "@/components/motion/Marquee";
import { site } from "@/lib/config/site";

// Phones: every message scrolls past in a Marquee (CSS only, so it's fine on store pages too).
// md+: the messages sit side by side. The current drop comes from the database in the drops phase.
export function AnnouncementBar() {
  // No sale or free-shipping promos here (owner decision).
  const messages = site.announcements;

  return (
    <div className="surface-dark bg-surface text-fg">
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
