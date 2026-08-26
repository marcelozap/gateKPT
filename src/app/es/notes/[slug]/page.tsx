import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function LegacySpanishNotePage({ params }: Props) {
  const { slug } = await params;
  redirect(`/es/log/${slug}`);
}
