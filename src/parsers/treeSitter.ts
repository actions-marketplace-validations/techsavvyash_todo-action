import Parser, { type Language, type SyntaxNode } from "tree-sitter";

export type { SyntaxNode };

// tree-sitter's Parser.parse reads a string through a fixed-size read
// buffer whose default is 32 KiB. Inputs larger than that throw a bare
// "Invalid argument", which previously failed the whole action on any
// PR touching a file over 32 KiB. Size the buffer to the input's UTF-8
// byte length (tree-sitter counts bytes, not chars) plus headroom so a
// file of any size parses. See tree-sitter/node-tree-sitter.
const MIN_BUFFER_SIZE = 32 * 1024;
const BUFFER_HEADROOM = 1024;

export function parseContent(content: string, language: Language): SyntaxNode {
  const parser = new Parser();
  parser.setLanguage(language);
  const bufferSize = Math.max(
    MIN_BUFFER_SIZE,
    Buffer.byteLength(content, "utf8") + BUFFER_HEADROOM,
  );
  return parser.parse(content, undefined, { bufferSize }).rootNode;
}

export function collectCommentNodes(root: SyntaxNode): SyntaxNode[] {
  const comments: SyntaxNode[] = [];
  const stack: SyntaxNode[] = [root];

  while (stack.length > 0) {
    const node = stack.pop();
    if (!node) {
      continue;
    }

    if (node.type === "comment") {
      comments.push(node);
    }

    for (let index = node.childCount - 1; index >= 0; index -= 1) {
      const child = node.child(index);
      if (child) {
        stack.push(child);
      }
    }
  }

  return comments;
}
