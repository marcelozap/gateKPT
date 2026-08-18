import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/siteUrl";
import { DanceLab } from "./DanceLab";

export const metadata: Metadata = {
  title: "Dance Lab",
  description:
    "A timing instrument: browser pose tracking scored against a house clock. An experiment, not a journal entry.",
  robots: { index: false },
  alternates: {
    canonical: `${getSiteUrl()}/lab/dance`,
  },
};

export default function DanceLabPage() {
  return <DanceLab locale="en" />;
}
