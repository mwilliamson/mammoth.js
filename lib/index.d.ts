interface Mammoth {
    convertToHtml: (input: Input, options?: Options) => Promise<Result>;
    extractRawText: (input: Input) => Promise<Result>;
    embedStyleMap: (input: Input, styleMap: string) => Promise<{
        toArrayBuffer: () => ArrayBuffer,
        toBuffer: () => Buffer,
    }>;
    images: Images;
}

type Input = NodeJsInput | BrowserInput;

type NodeJsInput = PathInput | BufferInput;

interface PathInput {
    path: string;
}

interface BufferInput {
    buffer: Buffer;
}

type BrowserInput = ArrayBufferInput;

interface ArrayBufferInput {
    arrayBuffer: ArrayBuffer;
}

interface Options {
    styleMap?: string | Array<string>;
    includeEmbeddedStyleMap?: boolean;
    includeDefaultStyleMap?: boolean;
    convertImage?: ImageConverter;
    ignoreEmptyParagraphs?: boolean;
    idPrefix?: string;
    externalFileAccess?: boolean;
    transformDocument?: (element: any) => any;
    /**
     * When true, tracked changes (insertions and deletions) are included in the output.
     * Insertions are wrapped in <ins> tags, deletions in <del> tags.
     * Both include data-change-id, data-author, and data-date attributes when available.
     * When false (default), deletions are ignored and insertions are treated as normal content.
     * @default false
     */
    includeTrackedChanges?: boolean;
}

interface ImageConverter {
    __mammothBrand: "ImageConverter";
}

interface Image {
    contentType: string;
    readAsArrayBuffer: () => Promise<ArrayBuffer>;
    readAsBase64String: () => Promise<string>;
    readAsBuffer: () => Promise<Buffer>;
    read: ImageRead;
}

interface ImageRead {
    (): Promise<Buffer>;
    (encoding: string): Promise<string>;
}

interface ImageAttributes {
    src: string;
}

interface Images {
    dataUri: ImageConverter;
    imgElement: (f: (image: Image) => Promise<ImageAttributes>) => ImageConverter;
}

interface Result {
    value: string;
    messages: Array<Message>;
}

type Message = Warning | Error;

interface Warning {
    type: "warning";
    message: string;
}

interface Error {
    type: "error";
    message: string;
    error: unknown;
}

declare const mammoth: Mammoth;

export = mammoth;
