<script setup lang="ts">
const { mediaList, total, loading, error, fetchMedia, uploadMedia, deleteMedia, formatBytes } = useWaMedia()
const { accounts, fetchAccounts } = useWaAccounts()
const toast = useToast()

const typeFilter = ref('all')
const accountFilter = ref('all')
const uploading = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const typeOptions = [
  { label: 'All types', value: 'all' },
  { label: 'Image', value: 'image' },
  { label: 'Video', value: 'video' },
  { label: 'Document', value: 'document' },
  { label: 'Audio', value: 'audio' },
]

const accountOptions = computed(() => [
  { label: 'All accounts', value: 'all' },
  ...accounts.value.map(a => ({ label: a.name, value: a.id })),
])

watch(typeFilter, () => reload())
watch(accountFilter, () => reload())

async function reload() {
  await fetchMedia({
    media_type: typeFilter.value,
    account_id: accountFilter.value !== 'all' ? accountFilter.value : undefined,
    pageSize: 100,
  })
}

onMounted(async () => {
  await Promise.all([fetchAccounts(), reload()])
})

function typeIcon(type: string) {
  const map: Record<string, string> = {
    image: 'i-lucide-image',
    video: 'i-lucide-film',
    audio: 'i-lucide-music',
    document: 'i-lucide-file-text',
  }
  return map[type] ?? 'i-lucide-file'
}

function triggerUpload() {
  fileInput.value?.click()
}

async function handleFileSelected(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  uploading.value = true
  try {
    const uploaded = await uploadMedia(file)
    mediaList.value.unshift(uploaded)
    total.value += 1
    toast.add({ title: 'Media uploaded', description: file.name, color: 'success', icon: 'i-lucide-upload' })
  }
  catch (err: any) {
    toast.add({ title: 'Upload failed', description: err?.data?.detail ?? 'Could not upload file.', color: 'error', icon: 'i-lucide-x-circle' })
  }
  finally {
    uploading.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

const deletingId = ref<string | null>(null)
async function handleDelete(id: string, filename: string) {
  deletingId.value = id
  try {
    await deleteMedia(id)
    mediaList.value = mediaList.value.filter(m => m.id !== id)
    total.value = Math.max(0, total.value - 1)
    toast.add({ title: 'Media deleted', description: filename, color: 'success', icon: 'i-lucide-trash-2' })
  }
  catch (err: any) {
    toast.add({ title: 'Delete failed', description: err?.data?.detail ?? 'Error.', color: 'error', icon: 'i-lucide-x-circle' })
  }
  finally { deletingId.value = null }
}

const isFirstLoad = computed(() => loading.value && mediaList.value.length === 0)
</script>

<template>
  <div class="px-6 py-8 max-w-6xl mx-auto">

    <!-- Hidden file input -->
    <input ref="fileInput" type="file" accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx" class="hidden" @change="handleFileSelected" />

    <!-- Header -->
    <div class="flex items-center justify-between mb-6 gap-4">
      <div>
        <h1 class="text-2xl font-semibold text-highlighted">WA Media Library</h1>
        <p class="text-sm text-muted mt-0.5">Upload and manage media files for WhatsApp templates and campaigns</p>
      </div>
      <UButton icon="i-lucide-upload" color="primary" :loading="uploading" @click="triggerUpload">
        Upload Media
      </UButton>
    </div>

    <!-- Error -->
    <div v-if="error" class="mb-4 px-4 py-3 bg-error-50 dark:bg-error-950/30 border border-error-200 dark:border-error-800 rounded-xl text-sm text-error-600 dark:text-error-400">
      {{ error }}
    </div>

    <!-- Filters -->
    <div class="flex items-center gap-3 mb-6 flex-wrap">
      <USelect v-model="typeFilter" :items="typeOptions" value-key="value" label-key="label" class="w-44" />
      <USelect v-model="accountFilter" :items="accountOptions" value-key="value" label-key="label" class="w-44" />
      <span class="text-sm text-muted ml-auto">{{ total }} file{{ total !== 1 ? 's' : '' }}</span>
    </div>

    <AppPageLoader v-if="isFirstLoad" label="Loading media…" />

    <!-- Empty -->
    <div v-else-if="mediaList.length === 0" class="text-center py-20 text-muted">
      <UIcon name="i-lucide-image-off" class="w-12 h-12 mx-auto mb-3 opacity-40" />
      <p class="text-sm font-medium">No media uploaded yet.</p>
      <button class="text-xs text-primary hover:underline mt-1" @click="triggerUpload">Upload your first file</button>
    </div>

    <!-- Grid -->
    <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      <div
        v-for="m in mediaList"
        :key="m.id"
        class="group relative bg-default border border-default rounded-xl overflow-hidden hover:border-primary/50 transition-colors"
      >
        <!-- Icon area -->
        <div class="h-24 flex items-center justify-center bg-elevated">
          <UIcon :name="typeIcon(m.media_type)" class="w-10 h-10 text-muted" />
        </div>

        <!-- Info -->
        <div class="px-3 py-2">
          <p class="text-xs font-medium text-default truncate">{{ m.filename }}</p>
          <div class="flex items-center justify-between mt-0.5">
            <p class="text-[11px] text-muted capitalize">{{ m.media_type }}</p>
            <p class="text-[11px] text-muted">{{ formatBytes(m.file_size_bytes) }}</p>
          </div>
          <p class="text-[10px] text-muted mt-0.5">{{ new Date(m.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }}</p>
        </div>

        <!-- Delete overlay -->
        <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <UButton
            icon="i-lucide-trash-2"
            color="error"
            size="xs"
            :loading="deletingId === m.id"
            @click="handleDelete(m.id, m.filename)"
          />
        </div>

        <!-- Alots ID badge -->
        <div class="absolute bottom-16 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <p class="text-[9px] font-mono text-muted bg-black/40 rounded px-1.5 py-0.5 truncate">{{ m.alots_media_id }}</p>
        </div>
      </div>
    </div>

  </div>
</template>
