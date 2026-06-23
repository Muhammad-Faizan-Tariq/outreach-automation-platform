<script setup lang="ts">
import type { EmailTemplate } from '~/composables/useTemplates'

const toast = useToast()
const { templates, loading, fetchTemplates, deleteTemplate } = useTemplates()

onMounted(() => fetchTemplates({ is_active: true, page_size: 200 }))

const search = ref('')
const categoryFilter = ref('all')
const viewMode = ref<'grid' | 'list'>('grid')

// step_number → UI category
function stepToCategory(n: number): 'initial' | 'follow_up' | 'closing' {
  if (n === 1) return 'initial'
  if (n === 2) return 'follow_up'
  return 'closing'
}

const CATEGORIES = [
  { label: 'All', value: 'all' },
  { label: 'Initial', value: 'initial' },
  { label: 'Follow-up', value: 'follow_up' },
  { label: 'Closing', value: 'closing' },
]

const filtered = computed(() => {
  let list = templates.value
  if (categoryFilter.value !== 'all') {
    list = list.filter(t => stepToCategory(t.step_number) === categoryFilter.value)
  }
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(t => t.name.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q))
  }
  return list
})

type BadgeColor = 'primary' | 'info' | 'warning' | 'neutral'

const CAT_COLOR: Record<string, BadgeColor> = {
  initial: 'primary',
  follow_up: 'info',
  closing: 'warning',
}
const CAT_LABEL: Record<string, string> = {
  initial: 'Initial',
  follow_up: 'Follow-up',
  closing: 'Closing',
}
const CAT_ICON: Record<string, string> = {
  initial: 'i-lucide-mail',
  follow_up: 'i-lucide-reply',
  closing: 'i-lucide-mail-check',
}

function catColor(c: string): BadgeColor { return (CAT_COLOR[c] ?? 'neutral') as BadgeColor }
function catLabel(c: string): string { return CAT_LABEL[c] ?? c }
function catIcon(c: string): string { return CAT_ICON[c] ?? 'i-lucide-mail' }

function bodyPreview(html: string): string {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  return text.slice(0, 120) + (text.length > 120 ? '…' : '')
}

function relTime(ts: string) {
  const diff = Date.now() - new Date(ts).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days}d ago`
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

async function remove(t: EmailTemplate) {
  try {
    await deleteTemplate(t.id)
    templates.value = templates.value.filter(x => x.id !== t.id)
    toast.add({ title: 'Template deleted', color: 'neutral', icon: 'i-lucide-trash-2' })
  }
  catch (e: any) {
    toast.add({ title: 'Delete failed', description: e?.data?.detail ?? 'Error', color: 'error', icon: 'i-lucide-x-circle' })
  }
}

// required_variables comes as ['first_name'] — display as {{first_name}}
function fmtVar(v: string) { return `{{${v}}}` }
</script>

<template>
  <div class="max-w-7xl mx-auto px-6 py-8">

    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-highlighted">Templates</h1>
        <p class="mt-0.5 text-sm text-muted">{{ templates.length }} email templates</p>
      </div>
      <NuxtLink to="/templates/create">
        <UButton icon="i-lucide-plus">New template</UButton>
      </NuxtLink>
    </div>

    <!-- Filters + view toggle -->
    <div class="flex items-center justify-between gap-4 mb-5">
      <div class="flex items-center gap-3 flex-1">
        <UInput
          v-model="search"
          icon="i-lucide-search"
          placeholder="Search templates…"
          class="max-w-xs"
        />
        <div class="flex gap-1">
          <UButton
            v-for="cat in CATEGORIES"
            :key="cat.value"
            size="sm"
            :color="categoryFilter === cat.value ? 'primary' : 'neutral'"
            :variant="categoryFilter === cat.value ? 'solid' : 'ghost'"
            @click="categoryFilter = cat.value"
          >
            {{ cat.label }}
          </UButton>
        </div>
      </div>
      <div class="flex items-center gap-1 border border-default rounded-lg p-0.5">
        <UButton
          icon="i-lucide-layout-grid"
          size="xs"
          :color="viewMode === 'grid' ? 'primary' : 'neutral'"
          :variant="viewMode === 'grid' ? 'solid' : 'ghost'"
          @click="viewMode = 'grid'"
        />
        <UButton
          icon="i-lucide-list"
          size="xs"
          :color="viewMode === 'list' ? 'primary' : 'neutral'"
          :variant="viewMode === 'list' ? 'solid' : 'ghost'"
          @click="viewMode = 'list'"
        />
      </div>
    </div>

    <AppPageLoader v-if="loading" label="Loading templates…" />

    <!-- Empty state -->
    <div v-else-if="filtered.length === 0" class="py-20 text-center">
      <UIcon name="i-lucide-file-text" class="w-12 h-12 text-muted mx-auto mb-3" />
      <p class="text-base font-semibold text-highlighted mb-1">No templates found</p>
      <p class="text-sm text-muted mb-4">
        {{ search || categoryFilter !== 'all' ? 'Try a different search or filter.' : 'Create your first email template.' }}
      </p>
      <NuxtLink v-if="!search && categoryFilter === 'all'" to="/templates/create">
        <UButton icon="i-lucide-plus">New template</UButton>
      </NuxtLink>
    </div>

    <!-- GRID VIEW -->
    <div v-else-if="viewMode === 'grid'" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      <UCard
        v-for="t in filtered"
        :key="t.id"
        class="flex flex-col group hover:shadow-md transition-shadow"
      >
        <div class="flex items-start justify-between gap-2 mb-3">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <UBadge :color="catColor(stepToCategory(t.step_number))" variant="subtle" size="xs">
                {{ catLabel(stepToCategory(t.step_number)) }}
              </UBadge>
              <span class="text-xs text-muted capitalize">{{ t.campaign_type.replace('_', ' ') }}</span>
            </div>
            <h3 class="text-sm font-semibold text-highlighted truncate">{{ t.name }}</h3>
          </div>
          <UDropdownMenu
            :items="[[
              { label: 'Edit', icon: 'i-lucide-pencil', to: `/templates/${t.id}` },
              { label: 'Delete', icon: 'i-lucide-trash-2', color: 'error' as const, onSelect: () => remove(t) },
            ]]"
          >
            <UButton
              icon="i-lucide-more-horizontal"
              color="neutral"
              variant="ghost"
              size="xs"
              class="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            />
          </UDropdownMenu>
        </div>

        <div class="mb-3 px-3 py-2 bg-elevated rounded-lg">
          <p class="text-xs text-muted uppercase tracking-wide font-medium mb-0.5">Subject</p>
          <p class="text-sm text-default font-medium leading-snug">{{ t.subject }}</p>
        </div>

        <p class="text-xs text-muted leading-relaxed flex-1 mb-3">
          {{ bodyPreview(t.body_html ?? '') }}
        </p>

        <div v-if="(t.required_variables ?? []).length > 0" class="flex flex-wrap gap-1 mb-3">
          <span
            v-for="v in (t.required_variables ?? [])"
            :key="v"
            class="inline-flex items-center px-1.5 py-0.5 rounded bg-primary/10 text-primary text-xs font-mono"
          >
            {{ fmtVar(v) }}
          </span>
        </div>

        <div class="flex items-center justify-between pt-3 border-t border-default">
          <span class="text-xs text-muted">Updated {{ relTime(t.updated_at) }}</span>
          <NuxtLink :to="`/templates/${t.id}`">
            <UButton size="xs" color="neutral" variant="subtle" icon="i-lucide-pencil">Edit</UButton>
          </NuxtLink>
        </div>
      </UCard>
    </div>

    <!-- LIST VIEW -->
    <div v-else class="space-y-2">
      <div
        v-for="t in filtered"
        :key="t.id"
        class="flex items-start gap-4 p-4 rounded-xl border border-default bg-default hover:bg-elevated transition-colors group"
      >
        <div
          class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          :class="{
            'bg-primary/10': stepToCategory(t.step_number) === 'initial',
            'bg-info-50 dark:bg-info-900/30': stepToCategory(t.step_number) === 'follow_up',
            'bg-warning-50 dark:bg-warning-900/30': stepToCategory(t.step_number) === 'closing',
          }"
        >
          <UIcon
            :name="catIcon(stepToCategory(t.step_number))"
            class="w-4.5 h-4.5"
            :class="{
              'text-primary': stepToCategory(t.step_number) === 'initial',
              'text-info-600': stepToCategory(t.step_number) === 'follow_up',
              'text-warning-600': stepToCategory(t.step_number) === 'closing',
            }"
          />
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-0.5">
            <h3 class="text-sm font-semibold text-highlighted truncate">{{ t.name }}</h3>
            <UBadge :color="catColor(stepToCategory(t.step_number))" variant="subtle" size="xs">
              {{ catLabel(stepToCategory(t.step_number)) }}
            </UBadge>
            <span class="text-xs text-muted capitalize">{{ t.campaign_type.replace('_', ' ') }}</span>
          </div>
          <p class="text-xs text-muted truncate">{{ t.subject }}</p>
          <div class="flex items-center gap-3 mt-1.5">
            <div class="flex gap-1">
              <span
                v-for="v in (t.required_variables ?? []).slice(0, 3)"
                :key="v"
                class="inline-flex px-1.5 py-0.5 rounded bg-primary/10 text-primary text-xs font-mono"
              >
                {{ fmtVar(v) }}
              </span>
              <span v-if="(t.required_variables ?? []).length > 3" class="text-xs text-muted">+{{ (t.required_variables ?? []).length - 3 }}</span>
            </div>
            <span class="text-xs text-muted">·</span>
            <span class="text-xs text-muted">Updated {{ relTime(t.updated_at) }}</span>
          </div>
        </div>

        <div class="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <NuxtLink :to="`/templates/${t.id}`">
            <UButton size="xs" color="neutral" variant="subtle" icon="i-lucide-pencil">Edit</UButton>
          </NuxtLink>
          <UDropdownMenu
            :items="[[
              { label: 'Delete', icon: 'i-lucide-trash-2', color: 'error' as const, onSelect: () => remove(t) },
            ]]"
          >
            <UButton icon="i-lucide-more-horizontal" color="neutral" variant="ghost" size="xs" />
          </UDropdownMenu>
        </div>
      </div>
    </div>

  </div>
</template>
