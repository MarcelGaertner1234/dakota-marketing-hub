import { getConcept } from "@/lib/actions/concepts"
import { notFound } from "next/navigation"
import { ConceptDetail } from "./concept-detail"

export default async function ConceptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const concept = await getConcept(id).catch(() => null)
  if (!concept) notFound()

  return <ConceptDetail concept={concept} />
}
