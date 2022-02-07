export interface IMutedWordsWorkerSendMessage {
  content: string[];
  mutedWordsList: string[];
  options: { matchMuted: boolean, matchSafe: boolean };
}

export interface IMutedWordsWorkerEndMessage {
  status: 'success' | 'error';
  error?: string;
  muted: boolean;
}
