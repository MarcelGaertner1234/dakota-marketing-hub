"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Plus, Pencil, Trash2 } from "lucide-react"
import type { TeamMember } from "@/types/database"
import {
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
} from "@/lib/actions/team"

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  manager: "Manager",
  member: "Mitglied",
}

const COLOR_OPTIONS = [
  "#C5A572",
  "#3B82F6",
  "#8B5CF6",
  "#EF4444",
  "#10B981",
  "#F59E0B",
  "#EC4899",
  "#6366F1",
]

export default function TeamSettings({ team }: { team: TeamMember[] }) {
  const [isPending, startTransition] = useTransition()
  const [createOpen, setCreateOpen] = useState(false)
  const [editMember, setEditMember] = useState<TeamMember | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<TeamMember | null>(null)

  // Create form state
  const [newName, setNewName] = useState("")
  const [newRole, setNewRole] = useState("member")
  const [newColor, setNewColor] = useState("#3B82F6")

  // Edit form state
  const [editName, setEditName] = useState("")
  const [editRole, setEditRole] = useState("")
  const [editColor, setEditColor] = useState("")

  function openEdit(member: TeamMember) {
    setEditMember(member)
    setEditName(member.name)
    setEditRole(member.role)
    setEditColor(member.color)
  }

  function handleCreate() {
    const formData = new FormData()
    formData.set("name", newName.trim())
    formData.set("role", newRole)
    formData.set("color", newColor)
    startTransition(async () => {
      await createTeamMember(formData)
      setCreateOpen(false)
      setNewName("")
      setNewRole("member")
      setNewColor("#3B82F6")
    })
  }

  function handleUpdate() {
    if (!editMember) return
    startTransition(async () => {
      await updateTeamMember(editMember.id, {
        name: editName.trim(),
        role: editRole,
        color: editColor,
      })
      setEditMember(null)
    })
  }

  function handleDelete() {
    if (!deleteConfirm) return
    startTransition(async () => {
      await deleteTeamMember(deleteConfirm.id)
      setDeleteConfirm(null)
    })
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Team-Mitglieder</CardTitle>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus data-icon="inline-start" className="size-4" />
            Neues Mitglied
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {team?.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full text-white font-bold shrink-0"
                  style={{ backgroundColor: m.color }}
                >
                  {m.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{m.name}</p>
                  <p className="text-xs text-gray-500">
                    {ROLE_LABELS[m.role] || m.role}
                  </p>
                </div>
                <Badge variant="outline" className="capitalize shrink-0">
                  {ROLE_LABELS[m.role] || m.role}
                </Badge>
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => openEdit(m)}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setDeleteConfirm(m)}
                  >
                    <Trash2 className="size-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            {(!team || team.length === 0) && (
              <p className="text-sm text-gray-500 text-center py-4">
                Noch keine Team-Mitglieder vorhanden.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neues Team-Mitglied</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="create-name">Name</Label>
              <Input
                id="create-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Name eingeben"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-role">Rolle</Label>
              <select
                id="create-role"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="member">Mitglied</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Farbe</Label>
              <div className="flex gap-2 flex-wrap">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewColor(c)}
                    className={`h-8 w-8 rounded-full border-2 transition-all ${
                      newColor === c
                        ? "border-foreground scale-110"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Abbrechen
            </DialogClose>
            <Button
              onClick={handleCreate}
              disabled={!newName.trim() || isPending}
            >
              {isPending ? "Speichern..." : "Erstellen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={!!editMember}
        onOpenChange={(open) => !open && setEditMember(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mitglied bearbeiten</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Name eingeben"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-role">Rolle</Label>
              <select
                id="edit-role"
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="member">Mitglied</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Farbe</Label>
              <div className="flex gap-2 flex-wrap">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setEditColor(c)}
                    className={`h-8 w-8 rounded-full border-2 transition-all ${
                      editColor === c
                        ? "border-foreground scale-110"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Abbrechen
            </DialogClose>
            <Button
              onClick={handleUpdate}
              disabled={!editName.trim() || isPending}
            >
              {isPending ? "Speichern..." : "Speichern"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mitglied entfernen</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Bist du sicher, dass du{" "}
            <span className="font-semibold text-foreground">
              {deleteConfirm?.name}
            </span>{" "}
            aus dem Team entfernen willst? Diese Aktion kann nicht
            rueckgaengig gemacht werden.
          </p>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Abbrechen
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? "Entfernen..." : "Entfernen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
