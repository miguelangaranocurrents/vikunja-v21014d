import type {Fragment, Node as ProseMirrorNode} from '@tiptap/pm/model'

const LIST_TYPES = ['bulletList', 'orderedList', 'taskList']

// Renders a list marker for each item and keeps nested lists indented, so that
// copying a list as plain text keeps its structure.
function listLines(list: ProseMirrorNode): string[] {
	const lines: string[] = []
	let index = 0
	list.forEach(item => {
		let marker = '- '
		if (list.type.name === 'orderedList') {
			marker = `${Number(list.attrs.start ?? 1) + index}. `
		} else if (list.type.name === 'taskList') {
			marker = `- [${item.attrs.checked ? 'x' : ' '}] `
		}
		index++

		const itemLines = childrenLines(item)
		if (itemLines.length === 0) {
			lines.push(marker.trimEnd())
			return
		}
		itemLines.forEach((line, i) => {
			lines.push(i === 0 ? marker + line : ' '.repeat(marker.length) + line)
		})
	})
	return lines
}

function blockLines(node: ProseMirrorNode): string[] {
	if (LIST_TYPES.includes(node.type.name)) {
		return listLines(node)
	}
	if (node.isTextblock) {
		return [node.textContent]
	}
	return childrenLines(node)
}

function childrenLines(node: ProseMirrorNode | Fragment): string[] {
	const lines: string[] = []
	node.forEach(child => {
		lines.push(...blockLines(child))
	})
	return lines
}

/**
 * Plain text for the clipboard that keeps list markers ("- " or "1. ") instead of
 * dropping them like the default text serializer does.
 */
export function serializeClipboardText(content: Fragment): string {
	return childrenLines(content).join('\n')
}
