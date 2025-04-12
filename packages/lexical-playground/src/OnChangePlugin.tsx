import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext'
import {useEffect} from 'react'
import {$generateHtmlFromNodes} from '@lexical/html'

export function OnChangePlugin({
  onHtmlChange,
  onStateChange,
}: {
  onHtmlChange?: (html: string) => void
  onStateChange?: (editorStateJSON: string) => void
}) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return editor.registerUpdateListener(({editorState}) => {
      editorState.read(() => {
        // HTML output
        if (onHtmlChange) {
          let htmlString = $generateHtmlFromNodes(editor);
          onHtmlChange(htmlString)
        }

        // Serialized editor state (as JSON string)
        if (onStateChange) {
          const jsonString = JSON.stringify(editorState.toJSON())
          //console.log(editorState.toJSON());
          onStateChange(jsonString)
        }
      })
    })
  }, [editor, onHtmlChange, onStateChange])

  return null
}
