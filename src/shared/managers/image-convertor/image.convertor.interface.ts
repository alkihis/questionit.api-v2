export interface IImageConvertorWorkerSendMessage {
  path: string;
  mime: string;
  dimensions?: TImageDimensions;
}

export type TImageDimensions = {
  couldResize: boolean,
} | {
  fixed: [number, number]
};

export interface IImageConvertorWorkerEndMessage {
  status: 'success' | 'error';
  path?: string;
  error?: string;
}
