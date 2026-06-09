<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'

const props = defineProps<{
  modelValue: string
  placeholder?: string
  minHeight?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit,
    Link.configure({ openOnClick: false, HTMLAttributes: { rel: 'noopener noreferrer' } }),
    Placeholder.configure({ placeholder: props.placeholder ?? 'Write your email body here…' }),
  ],
  onUpdate: ({ editor: e }) => {
    emit('update:modelValue', e.getHTML())
  },
  editorProps: {
    attributes: { class: 'tiptap-body focus:outline-none' },
  },
})

watch(() => props.modelValue, (val) => {
  if (editor.value && editor.value.getHTML() !== val) {
    editor.value.commands.setContent(val, false)
  }
})

onBeforeUnmount(() => editor.value?.destroy())

// Exposed so parent can insert variables at cursor position
function insertContent(text: string) {
  editor.value?.chain().focus().insertContent(text).run()
}

defineExpose({ insertContent })

// ── toolbar helpers ────────────────────────────────────────────────────
function setLink() {
  const prev = editor.value?.getAttributes('link').href as string | undefined
  const url = window.prompt('Enter URL', prev ?? 'https://')
  if (!url) { editor.value?.chain().focus().extendMarkToLink({ href: '' }).unsetLink().run(); return }
  editor.value?.chain().focus().extendMarkToLink({ href: '' }).setLink({ href: url }).run()
}

type ToolbarBtn = {
  icon: string
  title: string
  action: () => void
  isActive?: () => boolean
}

const toolbar = computed<ToolbarBtn[]>(() => {
  if (!editor.value) return []
  return [
    { icon: 'i-lucide-bold', title: 'Bold', action: () => editor.value?.chain().focus().toggleBold().run(), isActive: () => editor.value?.isActive('bold') ?? false },
    { icon: 'i-lucide-italic', title: 'Italic', action: () => editor.value?.chain().focus().toggleItalic().run(), isActive: () => editor.value?.isActive('italic') ?? false },
    { icon: 'i-lucide-list', title: 'Bullet list', action: () => editor.value?.chain().focus().toggleBulletList().run(), isActive: () => editor.value?.isActive('bulletList') ?? false },
    { icon: 'i-lucide-list-ordered', title: 'Numbered list', action: () => editor.value?.chain().focus().toggleOrderedList().run(), isActive: () => editor.value?.isActive('orderedList') ?? false },
    { icon: 'i-lucide-link', title: 'Link', action: setLink, isActive: () => editor.value?.isActive('link') ?? false },
    { icon: 'i-lucide-undo', title: 'Undo', action: () => editor.value?.chain().focus().undo().run() },
    { icon: 'i-lucide-redo', title: 'Redo', action: () => editor.value?.chain().focus().redo().run() },
  ]
})
</script>

<template>
  <div class="rounded-xl border border-default overflow-hidden bg-default">
    <!-- Toolbar -->
    <div class="flex items-center gap-0.5 px-2 py-1.5 border-b border-default bg-elevated flex-wrap">
      <template v-for="(btn, i) in toolbar" :key="i">
        <!-- Separator before undo group -->
        <div v-if="i === 5" class="w-px h-4 bg-border-default mx-1" />
        <UTooltip :text="btn.title">
          <button
            type="button"
            class="w-7 h-7 flex items-center justify-center rounded transition-colors"
            :class="btn.isActive?.()
              ? 'bg-primary/10 text-primary'
              : 'text-muted hover:bg-elevated hover:text-highlighted'"
            @click="btn.action"
          >
            <UIcon :name="btn.icon" class="w-4 h-4" />
          </button>
        </UTooltip>
      </template>
    </div>

    <!-- Editor content area -->
    <ClientOnly>
      <EditorContent
        :editor="editor"
        class="tiptap-editor"
        :style="{ minHeight: minHeight ?? '220px' }"
      />
      <template #fallback>
        <div class="px-4 py-3 text-sm text-muted" :style="{ minHeight: minHeight ?? '220px' }">
          Loading editor…
        </div>
      </template>
    </ClientOnly>
  </div>
</template>

<style>
/* Tiptap editor body styles — global so EditorContent inner elements are styled */
.tiptap-editor .tiptap-body {
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  line-height: 1.625;
  color: var(--ui-text);
  min-height: inherit;
}
.tiptap-editor .tiptap-body p { margin-bottom: 0.625rem; }
.tiptap-editor .tiptap-body p:last-child { margin-bottom: 0; }
.tiptap-editor .tiptap-body strong { font-weight: 600; }
.tiptap-editor .tiptap-body em { font-style: italic; }
.tiptap-editor .tiptap-body ul { list-style: disc; padding-left: 1.25rem; margin-bottom: 0.625rem; }
.tiptap-editor .tiptap-body ol { list-style: decimal; padding-left: 1.25rem; margin-bottom: 0.625rem; }
.tiptap-editor .tiptap-body li { margin-bottom: 0.25rem; }
.tiptap-editor .tiptap-body a { color: var(--ui-primary); text-decoration: underline; }
.tiptap-editor .tiptap-body p.is-empty::before {
  content: attr(data-placeholder);
  color: var(--ui-text-muted);
  float: left;
  height: 0;
  pointer-events: none;
}
</style>
