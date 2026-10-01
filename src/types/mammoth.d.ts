declare module 'mammoth' {
  export interface MammothResult {
    value: string;
    messages: Array<{
      type: string;
      message: string;
    }>;
  }

  export interface ExtractRawTextOptions {
    arrayBuffer?: ArrayBuffer;
    buffer?: Buffer;
    path?: string;
  }

  export function extractRawText(options: ExtractRawTextOptions): Promise<MammothResult>;
  export function convertToHtml(options: ExtractRawTextOptions): Promise<MammothResult>;
}
