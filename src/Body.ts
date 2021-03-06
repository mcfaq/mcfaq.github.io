import marked from 'marked'
import DOMPrurify from 'dompurify'
import { Question } from './Questions'
import mcfunction from './mcfunction'

const hljs = require('highlight.js/lib/core');
hljs.registerLanguage('', () => ({}));
hljs.registerLanguage('json', require('highlight.js/lib/languages/json'));
hljs.registerLanguage('mcfunction', mcfunction);
marked.setOptions({
  highlight: function(code, lang) {
    return hljs.highlight(lang, code).value;
  }
});

export const Body = {
  async fetch(location: string): Promise<string> {
    const res = await fetch(`./database/${location}.md`)
    return await res.text()
  },

  async get(r: Question): Promise<string> {
    if (r.body === undefined) {
      if (r.answer.startsWith('@')) {
        r.body = await Body.fetch(`answers/${encodeURI(r.answer.slice(1))}`)
      } else {
        r.body = r.answer
      }
    }
    return r.body
  },

  sanitize(str: string): string {
    return DOMPrurify.sanitize(str)
  },

  format(str: string): string {
    return Body.sanitize(marked(str))
  },

  async answer(r: Question, preview = false): Promise<string> {
    let body = await this.get(r)
    const lines = body.split('\n').filter(l => l.trim().length > 0)
    const id = r.answer.startsWith('@') ? r.answer.slice(1) : r.question
    const formatted = this.format(preview ? lines[0] : body)
      .replace(/<a href="@(.+)">/, (_, a) => `<a href="?a=${encodeURI(a)}" data-answer="${encodeURI(a)}">`)
    return `<div class="result">
      <h3 class="question-title" data-answer="${encodeURI(id)}">
        ${Body.sanitize(r.question)}
      </h3>
      ${formatted}
      ${preview && lines.length > 1 ? `<a class="more" href="?a=${encodeURI(id)}" data-answer="${encodeURI(id)}">(more)</a>` : ''}
    </div>`
  }
}
