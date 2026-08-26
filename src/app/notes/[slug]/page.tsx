import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function LegacyNotePage({ params }: Props) {
  const { slug } = await params;
  redirect(`/log/${slug}`);
}
