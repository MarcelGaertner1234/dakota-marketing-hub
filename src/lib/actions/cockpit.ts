"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { CockpitAnlass, CockpitMonth, CockpitSetting, CockpitWoche } from "@/types/database"
import { DEFAULT_SETTINGS, type Settings } from "@/lib/cockpit/calc"

type Result = { success: true } | { success: false; error: string }

function revalidate() {
  revalidatePath("/cockpit")
  revalidatePath("/cockpit/wochen")
  revalidatePath("/cockpit/forecast")
  revalidatePath("/cockpit/ziel")
}

/** true, wenn die Cockpit-Tabellen noch nicht angelegt sind (Migration 008 fehlt) */
function fehltTabelle(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  return error.code === "42P01" || /does not exist|schema cache/i.test(error.message ?? "")
}

const num = (fd: FormData, key: string, fallback = 0): number => {
  const raw = (fd.get(key) as string | null)?.toString().replace(/['’\s]/g, "").replace(",", ".")
  if (raw == null || raw === "") return fallback
  const n = Number(raw)
  return Number.isFinite(n) ? n : fallback
}
const str = (fd: FormData, key: string): string | null => {
  const v = (fd.get(key) as string | null)?.toString().trim()
  return v ? v : null
}

export async function getSettings(): Promise<Settings> {
  const supabase = createServerClient()
  const { data, error } = await supabase.from("cockpit_settings").select("*")
  if (error && !fehltTabelle(error)) throw error
  const s: Settings = { ...DEFAULT_SETTINGS }
  for (const row of (data ?? []) as CockpitSetting[]) s[row.key] = Number(row.value)
  return s
}

export async function getSettingRows(): Promise<CockpitSetting[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase.from("cockpit_settings").select("*").order("key")
  if (error && !fehltTabelle(error)) throw error
  return (data ?? []) as CockpitSetting[]
}

export async function getMonths(from?: string, to?: string): Promise<CockpitMonth[]> {
  const supabase = createServerClient()
  let q = supabase.from("cockpit_months").select("*").order("monat")
  if (from) q = q.gte("monat", from)
  if (to) q = q.lte("monat", to)
  const { data, error } = await q
  if (error && !fehltTabelle(error)) throw error
  return (data ?? []) as CockpitMonth[]
}

export async function getWochen(): Promise<CockpitWoche[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase.from("cockpit_wochen").select("*").order("bis", { ascending: false })
  if (error && !fehltTabelle(error)) throw error
  return (data ?? []) as CockpitWoche[]
}

export async function getAnlaesse(): Promise<CockpitAnlass[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase.from("cockpit_anlaesse").select("*").order("datum")
  if (error && !fehltTabelle(error)) throw error
  return (data ?? []) as CockpitAnlass[]
}

// ---------- Wochen (Ist) ----------

export async function saveWoche(formData: FormData): Promise<Result> {
  try {
    const von = str(formData, "von"), bis = str(formData, "bis")
    if (!von || !bis || !/^\d{4}-\d{2}-\d{2}$/.test(von) || !/^\d{4}-\d{2}-\d{2}$/.test(bis)) return { success: false, error: "Von und Bis brauchen ein Datum" }
    if (bis < von) return { success: false, error: "Bis liegt vor Von" }
    const row = {
      kw: Math.round(num(formData, "kw")),
      von, bis,
      restaurant_netto: num(formData, "restaurant_netto"),
      food: formData.get("food") ? num(formData, "food") : null,
      beverage: formData.get("beverage") ? num(formData, "beverage") : null,
      trinkgeld: formData.get("trinkgeld") ? num(formData, "trinkgeld") : null,
      fruehstueck: num(formData, "fruehstueck"),
      halbpension: num(formData, "halbpension"),
      personen: Math.round(num(formData, "personen")),
      kapitel_menues: Math.round(num(formData, "kapitel_menues")),
      anlaesse_anzahl: Math.round(num(formData, "anlaesse_anzahl")),
      anlass_umsatz: num(formData, "anlass_umsatz"),
      ausfalltage: Math.round(num(formData, "ausfalltage")),
      bemerkung: str(formData, "bemerkung"),
      erfasst_von: str(formData, "erfasst_von"),
      updated_at: new Date().toISOString(),
    }
    const supabase = createServerClient()
    const id = str(formData, "id")
    const { error } = id
      ? await supabase.from("cockpit_wochen").update(row).eq("id", id)
      : await supabase.from("cockpit_wochen").upsert(row, { onConflict: "bis" })
    if (error) return { success: false, error: error.message }
    revalidate()
    return { success: true }
  } catch {
    return { success: false, error: "Unbekannter Fehler beim Speichern" }
  }
}

export async function deleteWoche(id: string): Promise<Result> {
  const supabase = createServerClient()
  const { error } = await supabase.from("cockpit_wochen").delete().eq("id", id)
  if (error) return { success: false, error: error.message }
  revalidate()
  return { success: true }
}

// ---------- Anlässe (Forecast) ----------

export async function saveAnlass(formData: FormData): Promise<Result> {
  try {
    const datum = str(formData, "datum"), anlass = str(formData, "anlass")
    if (!datum || !/^\d{4}-\d{2}-\d{2}$/.test(datum)) return { success: false, error: "Datum fehlt" }
    if (!anlass) return { success: false, error: "Anlass / Gruppe fehlt" }
    const status = str(formData, "status") === "fix" ? "fix" : "option"
    const row = {
      datum, anlass, status,
      personen: Math.round(num(formData, "personen")),
      preis: num(formData, "preis"),
      bemerkung: str(formData, "bemerkung"),
      updated_at: new Date().toISOString(),
    }
    const supabase = createServerClient()
    const id = str(formData, "id")
    const { error } = id
      ? await supabase.from("cockpit_anlaesse").update(row).eq("id", id)
      : await supabase.from("cockpit_anlaesse").insert(row)
    if (error) return { success: false, error: error.message }
    revalidate()
    return { success: true }
  } catch {
    return { success: false, error: "Unbekannter Fehler beim Speichern" }
  }
}

export async function setAnlassStatus(id: string, status: "fix" | "option"): Promise<Result> {
  const supabase = createServerClient()
  const { error } = await supabase.from("cockpit_anlaesse").update({ status, updated_at: new Date().toISOString() }).eq("id", id)
  if (error) return { success: false, error: error.message }
  revalidate()
  return { success: true }
}

export async function deleteAnlass(id: string): Promise<Result> {
  const supabase = createServerClient()
  const { error } = await supabase.from("cockpit_anlaesse").delete().eq("id", id)
  if (error) return { success: false, error: error.message }
  revalidate()
  return { success: true }
}

// ---------- Monate (Forecast-Eingaben, Referenz) ----------

const MONTH_FIELDS = ["betriebstage", "offene_tage", "verdichtung", "hp_einzel_pers", "hp_gruppe_pers", "logiernaechte", "gaeste_woche", "bon", "kapitel_menues", "ist_restaurant", "ist_food", "ist_beverage", "ist_fruehstueck", "ist_hp", "ist_personen"] as const

export async function saveMonth(monat: string, values: Partial<Record<(typeof MONTH_FIELDS)[number], number | null>> & { quelle?: string | null; notiz?: string | null; geschaetzt?: boolean }): Promise<Result> {
  if (!/^\d{4}-\d{2}-01$/.test(monat)) return { success: false, error: "Monat ungültig" }
  const row: Record<string, unknown> = { monat, updated_at: new Date().toISOString() }
  for (const f of MONTH_FIELDS) {
    if (f in values) {
      const v = values[f]
      row[f] = v == null || Number.isNaN(Number(v)) ? null : Number(v)
    }
  }
  if ("quelle" in values) row.quelle = values.quelle ?? null
  if ("notiz" in values) row.notiz = values.notiz ?? null
  if ("geschaetzt" in values) row.geschaetzt = !!values.geschaetzt
  const supabase = createServerClient()
  const { error } = await supabase.from("cockpit_months").upsert(row, { onConflict: "monat" })
  if (error) return { success: false, error: error.message }
  revalidate()
  return { success: true }
}

export async function saveSetting(key: string, value: number): Promise<Result> {
  if (!/^[a-z_]+$/.test(key) || !Number.isFinite(value)) return { success: false, error: "Ungültig" }
  const supabase = createServerClient()
  const { error } = await supabase.from("cockpit_settings").upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" })
  if (error) return { success: false, error: error.message }
  revalidate()
  return { success: true }
}
