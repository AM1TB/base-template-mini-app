"use client";

import dynamic from "next/dynamic";
import { ClientOnly } from "~/components/ClientOnly";

// note: dynamic import is required for components that use the Frame SDK
const GratitudeJournal = dynamic(() => import("~/components/GratitudeJournal"), {
  ssr: false,
});

export default function App() {
  return (
    <ClientOnly>
      <GratitudeJournal />
    </ClientOnly>
  );
}
