import { notFound } from "next/navigation";

import { Quiz } from "@/components/Quiz";
import { Shell } from "@/components/Shell";
import { UNITS, getUnit } from "@/content";

export function generateStaticParams() {
  return UNITS.map((u) => ({ unitId: u.id }));
}

export default async function QuizPage({
  params,
}: {
  params: Promise<{ unitId: string }>;
}) {
  const { unitId } = await params;
  const unit = getUnit(unitId);
  if (!unit) notFound();

  return (
    <Shell backHref={`/unit/${unit.id}`}>
      <Quiz unit={unit} />
    </Shell>
  );
}
