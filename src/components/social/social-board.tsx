"use client"

import { useState, useEffect, useTransition, useRef } from "react"
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Camera,
  Globe,
  Music2,
  Calendar,
  Hash,
  Lightbulb,
  LayoutGrid,
  List,
  GripVertical,
} from "lucide-react"
import { updatePostStatus } from "@/lib/actions/social"
import { useRouter } from "next/navigation"

interface Post {
  id: string
  title: string | null
  platform: string
  post_type: string
  caption: string | null
  hashtags: string[] | null
  scheduled_at: string | null
  status: string
  series_order: number | null
  event?: { id: string; title: string } | null
  concept?: { id: string; name: string } | null
}

const STATUSES = ["draft", "planned", "ready", "published"] as const
type PostStatus = typeof STATUSES[number]

const STATUS_CONFIG: Record<PostStatus, { label: string; color: string }> = {
  draft: { label: "Entwurf", color: "#6B7280" },
  planned: { label: "Geplant", color: "#3B82F6" },
  ready: { label: "Bereit", color: "#10B981" },
  published: { label: "Veröffentlicht", color: "#8B5CF6" },
}

const PLATFORM_ICON: Record<string, { icon: typeof Camera; color: string; label: string }> = {
  instagram: { icon: Camera, color: "#E1306C", label: "Instagram" },
  facebook: { icon: Globe, color: "#1877F2", label: "Facebook" },
  tiktok: { icon: Music2, color: "#000", label: "TikTok" },
}

type ViewMode = "board" | "list"
type FilterPlatform = "all" | "instagram" | "facebook" | "tiktok"

export function SocialBoard({ posts: initialPosts }: { posts: Post[] }) {
  const [posts, setPosts] = useState(initialPosts)
  const [view, setView] = useState<ViewMode>("board")
  const [filterPlatform, setFilterPlatform] = useState<FilterPlatform>("all")
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const filtered = filterPlatform === "all"
    ? posts
    : posts.filter((p) => p.platform === filterPlatform)

  const platformCounts = {
    instagram: posts.filter((p) => p.platform === "instagram").length,
    facebook: posts.filter((p) => p.platform === "facebook").length,
    tiktok: posts.filter((p) => p.platform === "tiktok").length,
  }

  return (
    <div className="space-y-4">
      {/* Compact Stats */}
      <div className="flex gap-2">
        {STATUSES.map((key) => {
          const config = STATUS_CONFIG[key]
          const count = posts.filter((p) => p.status === key).length
          return (
            <div
              key={key}
              className="flex items-center gap-2 rounded-lg border px-3 py-2 flex-1"
            >
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: config.color }} />
              <span className="text-lg font-bold text-[#2C2C2C] dark:text-gray-100">{count}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{config.label}</span>
            </div>
          )
        })}
      </div>

      {/* Filter & View Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5">
          <Button
            variant={filterPlatform === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterPlatform("all")}
            className={filterPlatform === "all" ? "bg-[#C5A572] hover:bg-[#A08050]" : ""}
          >
            Alle ({posts.length})
          </Button>
          {(["instagram", "facebook", "tiktok"] as const).map((key) => {
            const config = PLATFORM_ICON[key]
            const Icon = config.icon
            return (
              <Button
                key={key}
                variant={filterPlatform === key ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterPlatform(key)}
                className={filterPlatform === key ? "text-white" : ""}
                style={filterPlatform === key ? { backgroundColor: config.color } : {}}
              >
                <Icon className="mr-1 h-3.5 w-3.5" />
                {config.label} ({platformCounts[key]})
              </Button>
            )
          })}
        </div>
        <div className="flex gap-1 rounded-lg border p-0.5">
          <button
            type="button"
            onClick={() => setView("board")}
            className={`rounded p-1.5 transition-colors ${view === "board" ? "bg-[#C5A572] text-white" : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-400"}`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className={`rounded p-1.5 transition-colors ${view === "list" ? "bg-[#C5A572] text-white" : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-400"}`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {view === "board" ? (
        mounted ? (
          <DndBoardView posts={filtered} allPosts={posts} setPosts={setPosts} />
        ) : (
          <StaticBoardView posts={filtered} />
        )
      ) : (
        <ListView posts={filtered} />
      )}
    </div>
  )
}

/* ============================================================
   DnD Board View
   ============================================================ */
function DndBoardView({
  posts,
  allPosts,
  setPosts,
}: {
  posts: Post[]
  allPosts: Post[]
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>
}) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const router = useRouter()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const activePost = activeId ? posts.find((p) => p.id === activeId) : null

  function handleDragStart(e: DragStartEvent) { setActiveId(e.active.id as string) }
  function handleDragOver(e: DragOverEvent) { setOverId(e.over?.id as string | null) }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e
    setActiveId(null)
    setOverId(null)
    if (!over) return

    const postId = active.id as string
    const newStatus = over.id as PostStatus

    const post = allPosts.find((p) => p.id === postId)
    if (!post || post.status === newStatus) return

    // Optimistic
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, status: newStatus } : p)))

    startTransition(async () => {
      try {
        await updatePostStatus(postId, newStatus)
        router.refresh()
      } catch {
        setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, status: post.status } : p)))
      }
    })
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STATUSES.map((status) => {
          const config = STATUS_CONFIG[status]
          const columnPosts = posts.filter((p) => p.status === status)
          return (
            <DroppableColumn
              key={status}
              status={status}
              config={config}
              posts={columnPosts}
              isOver={overId === status}
              activeId={activeId}
            />
          )
        })}
      </div>
      <DragOverlay>
        {activePost ? <PostCardStatic post={activePost} overlay /> : null}
      </DragOverlay>
    </DndContext>
  )
}

function DroppableColumn({
  status,
  config,
  posts,
  isOver,
  activeId,
}: {
  status: string
  config: { label: string; color: string }
  posts: Post[]
  isOver: boolean
  activeId: string | null
}) {
  const { setNodeRef } = useDroppable({ id: status })
  return (
    <div ref={setNodeRef} className="min-w-[230px] flex-1">
      <div className="mb-3 flex items-center gap-2">
        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: config.color }} />
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{config.label}</h3>
        <Badge variant="secondary" className="text-xs">{posts.length}</Badge>
      </div>
      <div className={`space-y-2 min-h-[80px] rounded-lg p-1 transition-colors ${isOver ? "bg-[#C5A572]/10 ring-2 ring-[#C5A572]/30" : ""}`}>
        {posts.map((post) => (
          <DraggablePostCard key={post.id} post={post} isDragging={post.id === activeId} />
        ))}
        {posts.length === 0 && (
          <div className="rounded-lg border border-dashed p-4 text-center text-xs text-gray-400 dark:text-gray-500">Keine Posts</div>
        )}
      </div>
    </div>
  )
}

function DraggablePostCard({ post, isDragging }: { post: Post; isDragging: boolean }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: post.id })
  const didDrag = useRef(false)
  const router = useRouter()
  const style = transform ? { transform: `translate(${transform.x}px, ${transform.y}px)` } : undefined

  if (transform && (Math.abs(transform.x) > 3 || Math.abs(transform.y) > 3)) {
    didDrag.current = true
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => {
        if (!didDrag.current) router.push(`/social/${post.id}`)
        didDrag.current = false
      }}
    >
      <PostCardStatic post={post} isDragging={isDragging} />
    </div>
  )
}

/* ============================================================
   Static Board (SSR)
   ============================================================ */
function StaticBoardView({ posts }: { posts: Post[] }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {STATUSES.map((status) => {
        const config = STATUS_CONFIG[status]
        const columnPosts = posts.filter((p) => p.status === status)
        return (
          <div key={status} className="min-w-[230px] flex-1">
            <div className="mb-3 flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: config.color }} />
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{config.label}</h3>
              <Badge variant="secondary" className="text-xs">{columnPosts.length}</Badge>
            </div>
            <div className="space-y-2 min-h-[80px] rounded-lg p-1">
              {columnPosts.map((post) => (
                <PostCardStatic key={post.id} post={post} />
              ))}
              {columnPosts.length === 0 && (
                <div className="rounded-lg border border-dashed p-4 text-center text-xs text-gray-400 dark:text-gray-500">Keine Posts</div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ============================================================
   List View (grouped by month)
   ============================================================ */
function ListView({ posts }: { posts: Post[] }) {
  const MONTH_NAMES = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"]

  const grouped = posts.reduce<Record<string, Post[]>>((acc, post) => {
    const date = post.scheduled_at ? new Date(post.scheduled_at) : null
    const key = date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}` : "ungeplant"
    if (!acc[key]) acc[key] = []
    acc[key].push(post)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {Object.keys(grouped).sort().map((key) => {
        const items = grouped[key]
        const label = key === "ungeplant" ? "Ungeplant" : (() => { const [y, m] = key.split("-").map(Number); return `${MONTH_NAMES[m - 1]} ${y}` })()
        return (
          <div key={key}>
            <h3 className="mb-3 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label} ({items.length})</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((post) => (
                <a key={post.id} href={`/social/${post.id}`} className="block">
                  <PostCardStatic post={post} />
                </a>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ============================================================
   Post Card (shared)
   ============================================================ */
function PostCardStatic({ post, isDragging, overlay }: { post: Post; isDragging?: boolean; overlay?: boolean }) {
  const platform = PLATFORM_ICON[post.platform] || PLATFORM_ICON.facebook
  const status = STATUS_CONFIG[post.status as PostStatus] || STATUS_CONFIG.draft
  const Icon = platform.icon

  return (
    <Card className={`overflow-hidden transition-shadow hover:shadow-md ${isDragging ? "opacity-30" : ""} ${overlay ? "shadow-xl ring-2 ring-[#C5A572] rotate-1 w-[230px]" : ""}`}>
      <div className="h-1" style={{ backgroundColor: platform.color }} />
      <CardContent className="p-3 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            {!overlay && <GripVertical className="h-4 w-4 text-gray-300 mt-0.5 shrink-0" />}
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded"
              style={{ backgroundColor: platform.color + "15" }}
            >
              <Icon className="h-3.5 w-3.5" style={{ color: platform.color }} />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{post.title || "Ohne Titel"}</p>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 capitalize">{post.post_type}</span>
              {post.series_order ? <span className="text-[10px] text-gray-400 dark:text-gray-500"> · Teil {post.series_order}</span> : null}
            </div>
          </div>
          <Badge
            className="shrink-0 text-[10px] px-1.5 py-0"
            style={{ backgroundColor: status.color + "20", color: status.color, border: "none" }}
          >
            {status.label}
          </Badge>
        </div>
        {post.caption && <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 ml-[3.25rem]">{post.caption.replace(/\[URL:[^\]]*\]/g, '').trim()}</p>}
        <div className="flex flex-wrap items-center gap-1.5 ml-[3.25rem]">
          {post.scheduled_at && (
            <span className="flex items-center gap-0.5 text-[10px] text-gray-400 dark:text-gray-500">
              <Calendar className="h-3 w-3" />
              {new Date(post.scheduled_at).toLocaleDateString("de-CH", { day: "numeric", month: "short" })}
            </span>
          )}
          {post.concept && (
            <span className="flex items-center gap-0.5 text-[10px] text-gray-400 dark:text-gray-500">
              <Lightbulb className="h-3 w-3" />
              {post.concept.name}
            </span>
          )}
          {post.hashtags && post.hashtags.length > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-gray-400 dark:text-gray-500">
              <Hash className="h-3 w-3" />{post.hashtags.length}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
