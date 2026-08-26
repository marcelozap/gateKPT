import type { Metadata } from "next";
import LogPage from "@/app/log/page";
import { getSiteUrl } from "@/lib/siteUrl";

export const metadata: Metadata = {
  title: "The Record",
  description: "Marcelo Zapata's journal entries on technology, systems, music, curiosity, and the world around the model.",
  alternates: {
    canonical: `${getSiteUrl()}/notes`,
    languages: {
      en: `${getSiteUrl()}/notes`,
      es: `${getSiteUrl()}/es/notes`,
    },
  },
};

export default LogPage;
