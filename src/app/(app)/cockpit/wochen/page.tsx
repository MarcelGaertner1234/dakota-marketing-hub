export const dynamic = "force-dynamic"

import { WochenEingabe } from "@/components/cockpit/woche-form"
import { getWochen } from "@/lib/actions/cockpit"

export default async function WochenPage() {
  const wochen = await getWochen()
  return <WochenEingabe wochen={wochen} />
}
