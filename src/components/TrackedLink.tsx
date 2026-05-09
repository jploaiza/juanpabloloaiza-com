"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { trackEvent, type EventName } from "@/lib/track";

interface Props extends ComponentProps<typeof Link> {
  trackingEvent: { name: EventName; props?: Record<string, unknown> };
}

export default function TrackedLink({ trackingEvent, onClick, ...props }: Props) {
  return (
    <Link
      {...props}
      onClick={(e) => {
        trackEvent(trackingEvent.name, trackingEvent.props);
        onClick?.(e);
      }}
    />
  );
}
