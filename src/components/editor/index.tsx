'use client'

import { useCallback } from 'react'
import { BlockNoteEditor, PartialBlock } from '@blocknote/core'
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from '@blocknote/react'
import '@blocknote/core/style.css'

interface EditorProps {
  value?: string
  onChange?: (value: string) => void
  editable?: boolean
  language?: string
  height?: string
}

export function Editor({
  value,
  onChange,
  editable = true,
  language = 'plaintext',
  height = '200px'
}: EditorProps) {
  const handleChange = useCallback(
    (editor: BlockNoteEditor) => {
      onChange?.(JSON.stringify(editor.topLevelBlocks, null, 2))
    },
    [onChange]
  )

  const editor = useCreateBlockNote({
    editorConfig: {
      editableContent: editable
    },
    initialContent: value
      ? (JSON.parse(value) as PartialBlock[])
      : undefined,
    onEditorContentChange: handleChange
  })

  return (
    <div className={`min-h-[${height}] rounded-md border`}>
      <BlockNoteView
        editor={editor}
        theme="light"
      />
    </div>
  )
}
