import { redirect } from "next/navigation";

export default function LegacyNotePage() {
  redirect("/notes/wall-e");
}
