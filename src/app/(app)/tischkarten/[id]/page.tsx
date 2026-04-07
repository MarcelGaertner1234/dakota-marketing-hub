import { getTischkarte } from "@/lib/actions/tischkarten"
import { notFound } from "next/navigation"
import { TischkarteDetail } from "./tischkarte-detail"
import type { Tischkarte } from "@/types/database"

export const dynamic = "force-dynamic"

export default async function TischkarteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const tischkarte = (await getTischkarte(id).catch(
    () => null
  )) as Tischkarte | null
  if (!tischkarte) notFound()

  return <TischkarteDetail tischkarte={tischkarte} />
}
