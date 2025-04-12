/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalEditor,
  LexicalNode,
  LexicalUpdateJSON,
  NodeKey,
  SerializedEditor,
  SerializedLexicalNode,
  Spread,
} from 'lexical';
import type {JSX} from 'react';

import {HashtagNode} from '@lexical/hashtag';
import {LinkNode} from '@lexical/link';
import {
  $applyNodeReplacement,
  createEditor,
  DecoratorNode,
  LineBreakNode,
  ParagraphNode,
  RootNode,
  TextNode,
} from 'lexical';
import * as React from 'react';

import {EmojiNode} from './EmojiNode';
import {KeywordNode} from './KeywordNode';

const ImageComponent = React.lazy(() => import('./ImageComponent'));

export interface ImagePayload {
  altText: string;
  caption?: LexicalEditor;
  height?: number;
  key?: NodeKey;
  maxWidth?: number;
  showCaption?: boolean;
  imgRounded?: boolean;
  imgZoomable?: boolean;
  src: string;
  width?: number;
  captionsEnabled?: boolean;
  title?: string;
  className?: string;
}

function isGoogleDocCheckboxImg(img: HTMLImageElement): boolean {
  return (
    img.parentElement != null &&
    img.parentElement.tagName === 'LI' &&
    img.previousSibling === null &&
    img.getAttribute('aria-roledescription') === 'checkbox'
  );
}

function $convertImageElement(domNode: Node): null | DOMConversionOutput {
  const img = domNode as HTMLImageElement;
  if (img.src.startsWith('file:///') || isGoogleDocCheckboxImg(img)) {
    return null;
  }
  const {alt: altText, src, width, height, className} = img;
  const node = $createImageNode({altText, height, src, width, className});
  return {node};
}

export type SerializedImageNode = Spread<
  {
    altText: string;
    caption: SerializedEditor;
    height?: number;
    maxWidth: number;
    showCaption: boolean;
    imgRounded: boolean;
    imgZoomable: boolean;
    src: string;
    width?: number;
    title: string;
    className: string;
  },
  SerializedLexicalNode
>;

export class ImageNode extends DecoratorNode<JSX.Element> {
  __src: string;
  __altText: string;
  __width: 'inherit' | number;
  __height: 'inherit' | number;
  __maxWidth: number;
  __showCaption: boolean;
  __imgRounded: boolean;
  __imgZoomable: boolean;
  __caption: LexicalEditor;
  // Captions cannot yet be used within editor cells
  __captionsEnabled: boolean;
  __title?: string;
  __className?: string;

  static getType(): string {
    return 'image';
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(
      node.__src,
      node.__altText,
      node.__maxWidth,
      node.__width,
      node.__height,
      node.__showCaption,
      node.__imgRounded,
      node.__imgZoomable,
      node.__caption,
      node.__captionsEnabled,
      node.__key,
      node.__title,
      node.__className,
    );
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    const {altText, height, width, maxWidth, src, showCaption, imgRounded, imgZoomable, title, className} = serializedNode;
    return $createImageNode({
      altText,
      height,
      maxWidth,
      showCaption,
      imgRounded,
      imgZoomable,
      src,
      width,
      title,
      className,
    }).updateFromJSON(serializedNode);
  }

  updateFromJSON(serializedNode: LexicalUpdateJSON<SerializedImageNode>): this {
    const node = super.updateFromJSON(serializedNode);
    const {caption} = serializedNode;

    const nestedEditor = node.__caption;
    const editorState = nestedEditor.parseEditorState(caption.editorState);
    if (!editorState.isEmpty()) {
      nestedEditor.setEditorState(editorState);
    }
    return node;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('img');
    element.setAttribute('src', this.__src);
    element.setAttribute('alt', this.__altText);
    element.setAttribute('width', this.__width.toString());
    element.setAttribute('height', this.__height.toString());
    element.setAttribute('title', this.__title || '');
    element.setAttribute('class', this.__className || '');
    element.setAttribute('data-rounded', this.__imgRounded ? "1" : "0");
    element.setAttribute('data-zoomable', this.__imgZoomable ? "1" : "0");
    return {element};
  }

  static importDOM(): DOMConversionMap | null {
    return {
      img: (node: Node) => ({
        conversion: $convertImageElement,
        priority: 0,
      }),
    };
  }

  constructor(
    src: string,
    altText: string,
    maxWidth: number,
    width?: 'inherit' | number,
    height?: 'inherit' | number,
    showCaption?: boolean,
    imgRounded?: boolean,
    imgZoomable?: boolean,
    caption?: LexicalEditor,
    captionsEnabled?: boolean,
    key?: NodeKey,
    title?: string,
    className?: string,
  ) {
    super(key);
    this.__src = src;
    this.__altText = altText;
    this.__maxWidth = maxWidth;
    this.__width = width || 'inherit';
    this.__height = height || 'inherit';
    this.__showCaption = showCaption || false;
    this.__imgRounded = imgRounded || false;
    this.__imgZoomable = imgZoomable || false;
    this.__caption =
      caption ||
      createEditor({
        namespace: 'Playground/ImageNodeCaption',
        nodes: [
          RootNode,
          TextNode,
          LineBreakNode,
          ParagraphNode,
          LinkNode,
          EmojiNode,
          HashtagNode,
          KeywordNode,
        ],
      });
    this.__captionsEnabled = captionsEnabled || captionsEnabled === undefined;
    this.__title = title;
    this.__className = className;
  }

  exportJSON(): SerializedImageNode {
    return {
      ...super.exportJSON(),
      altText: this.getAltText(),
      caption: this.__caption.toJSON(),
      height: this.__height === 'inherit' ? 0 : this.__height,
      maxWidth: this.__maxWidth,
      showCaption: this.__showCaption,
      imgRounded: this.__imgRounded,
      imgZoomable: this.__imgZoomable,
      src: this.getSrc(),
      width: this.__width === 'inherit' ? 0 : this.__width,
      title: this.__title || '',
      className: this.__className || '',
    };
  }

  setWidthAndHeight(
    width: 'inherit' | number,
    height: 'inherit' | number,
  ): void {
    const writable = this.getWritable();
    writable.__width = width;
    writable.__height = height;
  }

  setShowCaption(showCaption: boolean): void {
    const writable = this.getWritable();
    writable.__showCaption = showCaption;
  }
  
  setImgRounded(imgRounded: boolean): void {
    const writable = this.getWritable();
    writable.__imgRounded = imgRounded;
  }
  setImgZoomable(imgZoomable: boolean): void {
    const writable = this.getWritable();
    writable.__imgZoomable = imgZoomable;
  }

  // View

  createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement('span');
    const theme = config.theme;
    const className = theme.image;
    if (className !== undefined) {
      span.className = className;
    }
    return span;
  }

  updateDOM(): false {
    return false;
  }

  getSrc(): string {
    return this.__src;
  }

  getAltText(): string {
    return this.__altText;
  }

  decorate(): JSX.Element {
    return (
      <ImageComponent
        src={this.__src}
        altText={this.__altText}
        width={this.__width}
        height={this.__height}
        maxWidth={this.__maxWidth}
        nodeKey={this.getKey()}
        showCaption={this.__showCaption}
        imgRounded={this.__imgRounded}
        imgZoomable={this.__imgZoomable}
        caption={this.__caption}
        captionsEnabled={this.__captionsEnabled}
        title={this.__title}
        className={this.__className}
        resizable={true}
      />
    );
  }
}

export function $createImageNode({
  altText,
  height,
  maxWidth = 500,
  captionsEnabled,
  src,
  width,
  showCaption,
  imgRounded,
  imgZoomable,
  caption,
  key,
  title,
  className
}: ImagePayload): ImageNode {
  return $applyNodeReplacement(
    new ImageNode(
      src,
      altText,
      maxWidth,
      width,
      height,
      showCaption,
      imgRounded,
      imgZoomable,
      caption,
      captionsEnabled,
      key,
      title,
      className
    ),
  );
}

export function $isImageNode(
  node: LexicalNode | null | undefined,
): node is ImageNode {
  return node instanceof ImageNode;
}
