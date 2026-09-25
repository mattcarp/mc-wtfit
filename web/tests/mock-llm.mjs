// A fake OpenAI-compatible vision endpoint for end-to-end tests. Returns a canned verdict.
import http from 'node:http';
const verdict = {
  identified: true, name: 'Mini DisplayPort to VGA adapter', category: 'cable/adapter', era: 'c. 2011–2014', confidence: 94,
  condition: 'Looks fine; slight scuffing', valueLow: 4, valueHigh: 8, verdict: 'let_go',
  headline: 'A bridge between two eras, neither of which you live in.', reason: 'Nothing in your gear has a VGA port.',
  jobInYourLife: null, buildIdea: null, pairsWith: [], mightBeOnlyOne: false, hasStorageOrAccount: false, wipeChecklist: [], retakeTip: null,
  listing: { title: 'Mini DisplayPort to VGA adapter', description: 'Works as far as anyone knows. Judged from a photo.', suggestedPrice: 6, categoryHint: 'Computer cables' },
};
let last = null;
http.createServer((req, res) => {
  let body = ''; req.on('data', c => body += c); req.on('end', () => {
    if (req.url === '/last') { res.end(JSON.stringify(last)); return; }
    last = JSON.parse(body || '{}');
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ id: 'x', object: 'chat.completion', created: 1, model: 'mock', choices: [{ index: 0, finish_reason: 'stop', message: { role: 'assistant', content: JSON.stringify(verdict) } }], usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 } }));
  });
}).listen(4011, () => console.log('mock llm on 4011'));
