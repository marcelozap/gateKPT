import { redirect } from "next/navigation";

export default function LegacyYouAreNotARunnerPage() {
  redirect("/log/the-signal-and-the-noise");
}
