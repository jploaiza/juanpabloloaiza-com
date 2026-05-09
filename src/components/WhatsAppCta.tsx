"use client";

import { trackEvent } from "@/lib/track";

interface Props {
  location: string;
  className?: string;
  children: React.ReactNode;
}

export default function WhatsAppCta({ location, className, children }: Props) {
  return (
    <a
      href="https://api.whatsapp.com/send?phone=56962081884"
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => trackEvent("whatsapp_click", { location })}
    >
      {children}
    </a>
  );
}
