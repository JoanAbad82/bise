// The composer's chips as one Lexical node: an image `[Image #1]`, a long paste `▤ 1`, a quote
// `❝ 1`. Inline, one caret step wide, removed by one backspace (Lexical deletes an inline
// decorator next to the caret as one unit), kept in the draft's JSON (exportJSON/importJSON) so
// a put-away draft and a restart keep them. What a chip stands for (the image's path, the
// pasted or quoted text) is the node's data; message.ts turns it into the send.
import type { JSX } from 'react';
import { $applyNodeReplacement, DecoratorNode, type LexicalNode, type NodeKey, type SerializedLexicalNode, type Spread } from 'lexical';
import { chipLabel, type Chip } from './message';

export type SerializedChipNode = Spread<{ chip: Chip }, SerializedLexicalNode>;

export class ChipNode extends DecoratorNode<JSX.Element> {
  __chip: Chip;

  static override getType(): string {
    return 'bise-chip';
  }

  static override clone(node: ChipNode): ChipNode {
    return new ChipNode(node.__chip, node.__key);
  }

  static override importJSON(json: SerializedChipNode): ChipNode {
    return $createChipNode(json.chip);
  }

  constructor(chip: Chip, key?: NodeKey) {
    super(key);
    this.__chip = chip;
  }

  override exportJSON(): SerializedChipNode {
    return { ...super.exportJSON(), type: 'bise-chip', version: 1, chip: this.__chip };
  }

  getChip(): Chip {
    return this.getLatest().__chip;
  }

  override createDOM(): HTMLElement {
    const el = document.createElement('span');
    el.className = 'b-composer-chip';
    return el;
  }

  override updateDOM(): false {
    return false;
  }

  override isInline(): true {
    return true;
  }

  override isKeyboardSelectable(): boolean {
    return true;
  }

  /** What the clipboard and the plain text read: the chip's label. */
  override getTextContent(): string {
    return chipLabel(this.__chip);
  }

  override decorate(): JSX.Element {
    const c = this.__chip;
    return (
      <span className={`b-chip ${c.kind}`} data-testid={`composer.chip.${c.n}`} data-kind={c.kind} title={c.kind === 'image' ? c.name : undefined} contentEditable={false}>
        {chipLabel(c)}
      </span>
    );
  }
}

export function $createChipNode(chip: Chip): ChipNode {
  return $applyNodeReplacement(new ChipNode(chip));
}

export function $isChipNode(node: LexicalNode | null | undefined): node is ChipNode {
  return node instanceof ChipNode;
}
