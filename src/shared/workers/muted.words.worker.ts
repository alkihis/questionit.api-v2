import fs from 'fs';
import { WorkerChild } from 'worker-thread-manager';
import type { IMutedWordsWorkerEndMessage, IMutedWordsWorkerSendMessage } from '../managers/muted-words/muted.words.interface';

function onTask(msg: IMutedWordsWorkerSendMessage) : IMutedWordsWorkerEndMessage {
  try {
    const mutedWordsSet: string[] = msg.options.matchMuted ? msg.mutedWordsList : [];

    return {
      status: 'success',
      muted: msg.content.some(item => testForMuted(item, mutedWordsSet, msg.options)),
    };
  } catch (e) {
    return { error: e.stack, status: 'error', muted: false };
  }
}

/* -- Utility functions -- */

function testForMuted(content: string, mutedWordsList: string[], options: { matchMuted: boolean, matchSafe: boolean }) {
  const words = content.split(/\p{P}|\s/ug).filter(e => e.trim().length);

  if (options.matchSafe && words.some(w => tree.matchWord(w))) {
    return true;
  }
  if (options.matchMuted) {
    const checker = new RegExp('\\b(' + mutedWordsList.map(escapeRegExp).join('|') + ')\\b', 'i');
    // Return true if a word in content matches
    return checker.test(content);
  }
  return false;
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

// Starts the tree
const tree = new class MutedWordsTree {
  index: { [firstLetter: string]: string[] } = {};

  async loadIndex(path: string) {
    const data: string[] = JSON.parse(await fs.promises.readFile(path, 'utf-8')).words;

    this.index = {};

    for (const word of data) {
      const w = word.toLowerCase();
      const firstLetter = w[Symbol.iterator]().next().value;

      if (firstLetter in this.index) {
        this.index[firstLetter].push(w);
      } else {
        this.index[firstLetter] = [w];
      }
    }
  }

  match(char: string) {
    return char in this.index ? this.index[char] : [];
  }

  matchWord(word: string) {
    let matchers: Iterator<string>[] = [];

    if (!word.length)
      return false;

    let first = true;

    for (const char of word) {
      const c = char.toLowerCase();

      if (first) {
        first = false;

        const items = this.match(char);

        if (!items.length) {
          return false;
        }

        matchers = items.map(e => {
          const it = e[Symbol.iterator]();

          // Skip first letter
          it.next();
          return it;
        });

        continue;
      }

      matchers = matchers.filter(it => {
        const val = it.next();
        return !val.done && val.value === c;
      });
    }

    // test if remains matchers after filtering
    // if no one remains, word matches
    if (matchers.length) {
      const doneAfterChar = matchers.filter(it => it.next().done);

      // If a word is found, so there's a match!
      return doneAfterChar.length > 0;
    }

    return false;
  }
};

// Starts the child
// It take WorkerSendMessage as input, returns a WorkerEndMessage
new WorkerChild<IMutedWordsWorkerSendMessage, IMutedWordsWorkerEndMessage, string>({
  onTask,
  async onStartup(path) {
    await tree.loadIndex(path);
  },
  onMessage(data: { refresh?: string }) {
    if (data.refresh) {
      tree.loadIndex(data.refresh)
        .catch(err => console.error(err));
    }
  }
}).listen();
