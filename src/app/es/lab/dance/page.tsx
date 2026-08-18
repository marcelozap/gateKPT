import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/siteUrl";
import { DanceLab } from "../../../lab/dance/DanceLab";

export const metadata: Metadata = {
  title: "Dance Lab",
  description:
    "Un instrumento de timing: pose tracking en el navegador contra un reloj house. Un experimento, no una entrada del diario.",
  robots: { index: false },
  alternates: {
    canonical: `${getSiteUrl()}/es/lab/dance`,
  },
};

export default function DanceLabPageEs() {
  return <DanceLab locale="es" />;
}
