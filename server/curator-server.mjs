import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const env = loadEnv();
const port = Number(env.CURATOR_PORT ?? 8787);
const model = env.OPENROUTER_MODEL ?? 'openrouter/owl-alpha';
const apiKey = env.OPENROUTER_API_KEY;

const categories = ['The Unsaid Wing', 'The Unmade Wing'];
const artifactChoices = [
  ['folded-envelope', 'The Unsaid Wing', 'calls, texts, apologies, messages, letters'],
  ['postcard', 'The Unsaid Wing', 'friends, missing someone, hello, memory, unsent warmth'],
  ['travel-suitcase', 'The Unmade Wing', 'trips, flights, travel, leaving, booking'],
  ['moon-jar', 'The Unmade Wing', 'sleep, rest, night, quiet, choosing differently'],
  ['paper-plane', 'The Unmade Wing', 'writing, drafts, stories, notes, ideas'],
  ['teacup', 'The Unmade Wing', 'habits, routines, mornings, pauses, starts'],
  ['brass-key', 'The Unmade Wing', 'moving, doors, home, choices, change'],
  ['ticket-stub', 'The Unmade Wing', 'events, shows, dates, tickets, plans'],
  ['closed-book', 'The Unmade Wing', 'reading, learning, studying, classes'],
  ['paint-tube', 'The Unmade Wing', 'painting, drawing, art, design'],
  ['tiny-camera', 'The Unmade Wing', 'photos, videos, recording, capturing'],
  ['seed-packet', 'The Unmade Wing', 'growth, health, exercise, beginning'],
  ['map-pin', 'The Unmade Wing', 'places, walks, errands, exploring'],
  ['quiet-clock', 'The Unmade Wing', 'time, deadlines, delay, tomorrow'],
  ['recipe-card', 'The Unmade Wing', 'cooking, baking, dinner, recipes'],
];

const server = createServer(async (request, response) => {
  setCorsHeaders(response);

  if (request.method === 'OPTIONS') {
    response.writeHead(204);
    response.end();
    return;
  }

  if (request.method === 'GET' && request.url === '/health') {
    sendJson(response, 200, { ok: true, model });
    return;
  }

  if (request.method !== 'POST' || request.url !== '/curate') {
    sendJson(response, 404, { error: 'Not found' });
    return;
  }

  if (!apiKey || apiKey === 'replace_with_your_openrouter_key') {
    sendJson(response, 500, {
      error: 'Missing OPENROUTER_API_KEY in .env',
    });
    return;
  }

  try {
    const body = await readJson(request);
    const original = typeof body.original === 'string' ? body.original.trim() : '';

    if (!original) {
      sendJson(response, 400, { error: 'Missing original text' });
      return;
    }

    const curated = await curateWithOpenRouter(original);
    sendJson(response, 200, curated);
  } catch (error) {
    console.error(error);
    sendJson(response, 200, {
      ...fallbackCuratorOutput(
        typeof original === 'string' ? original : '',
        error instanceof Error ? error.message : 'Curator failed',
      ),
      _usage: null,
    });
  }
});

server.listen(port, () => {
  console.log(`Museum curator listening on http://localhost:${port}/curate`);
  console.log(`Using OpenRouter model ${model}`);
});

async function curateWithOpenRouter(original) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:9000',
      'X-Title': 'Museum of Almosts',
    },
    body: JSON.stringify({
      model,
      temperature: 0.45,
      max_tokens: 420,
      messages: [
        {
          role: 'system',
          content: curatorSystemPrompt(),
        },
        {
          role: 'user',
          content: JSON.stringify({ original }),
        },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OpenRouter request failed: ${response.status} ${detail}`);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  const parsed = parseModelJson(content);

  return {
    ...normalizeCuratorOutput(parsed, original),
    _usage: payload.usage ?? null,
  };
}

function curatorSystemPrompt() {
  return [
    'You are the curator for a mobile app called Museum of Almosts.',
    'A user writes one small thing they almost did. Turn it into a tiny exhibit.',
    '',
    'Return only valid JSON with these exact keys:',
    '{ "title": string, "label": string, "category": string, "artifactImageKey": string }',
    '',
    `category must be one of: ${categories.join(', ')}`,
    'The Unsaid Wing is only for things almost spoken, sent, replied, confessed, invited, or apologized.',
    'The Unmade Wing is for everything else: plans, trips, habits, choices, chores, projects, rest, learning, making, going.',
    '',
    'artifactImageKey must be one of:',
    artifactChoices.map(([key, category, meaning]) => `- ${key}: ${category}; ${meaning}`).join('\n'),
    '',
    'Style rules:',
    '- title: 3 to 7 words, title case, quietly poetic but plain.',
    '- label: one sentence, 7 to 16 words.',
    '- label should sound intimate, specific, and human, not academic.',
    '- The label should describe the almost-moment, not repeat the user input.',
    '- Prefer a fresh angle: threshold, pause, almost-change, unsent courage, unfinished beginning, the second before action.',
    '- Use "you" only when it sounds natural; a gentle observation is often better.',
    '- Stay grounded in the user text.',
    '- Do not invent a reason, outcome, place, person, time, or emotion the user did not imply.',
    '- Do not narrate actions the user did not say, such as opening tools, closing files, typing, deleting, staring, choosing sleep, or holding a phone.',
    '- If the user gives little context, keep the label simple and slightly open.',
    '- Do not use museum jargon.',
    '- Do not use words like artifact, preserved, evidence, liminal, strange heaviness, vessel, relic, glow, darkness, quiet, little.',
    '- Do not diagnose feelings or give advice.',
    '- Avoid labels shaped like "You almost X, then Y."',
    '- Avoid copying more than two important words from the user input.',
    '- Handle quoted phrases correctly: in "I almost told her I love you", the phrase "I love you" is what would be said to her.',
    '- The best label feels like a small line from a diary someone would keep.',
    '- If the input is emotional, be tender but not dramatic.',
    '- If the input is practical, find the human hesitation inside the task.',
    '- If the input is vague, make a graceful label without pretending to know details.',
    '',
    'Bad labels:',
    '- "You almost told her you love you, then held it back."',
    '- "You almost sent the birthday words, then left them unsent."',
    '- "The landing page almost began tonight, then stayed unmade."',
    '- "You almost started moving, then let the moment pass."',
    '- "You almost cooked dinner, then ordered food."',
    '- "You almost went to the dentist, then did not go."',
    '',
    'Good examples:',
    'Input: "I almost texted her happy birthday"',
    '{"title":"The Birthday Left Unsent","label":"The greeting reached the edge of being real.","category":"The Unsaid Wing","artifactImageKey":"folded-envelope"}',
    'Input: "I almost called my dad back"',
    '{"title":"The Call That Waited","label":"The distance narrowed for a second, then widened again.","category":"The Unsaid Wing","artifactImageKey":"folded-envelope"}',
    'Input: "I almost apologized to my sister"',
    '{"title":"The Apology At The Door","label":"The repair came close enough to have a shape.","category":"The Unsaid Wing","artifactImageKey":"folded-envelope"}',
    'Input: "I almost replied with the truth"',
    '{"title":"The Truth At The Edge","label":"Honesty gathered itself, then stayed just behind the reply.","category":"The Unsaid Wing","artifactImageKey":"folded-envelope"}',
    'Input: "I almost said no"',
    '{"title":"The No That Stayed Inside","label":"A boundary formed, then remained behind your teeth.","category":"The Unsaid Wing","artifactImageKey":"folded-envelope"}',
    'Input: "I almost started designing the landing page tonight"',
    '{"title":"The Page That Waited","label":"The blank space kept its first mark for another day.","category":"The Unmade Wing","artifactImageKey":"paint-tube"}',
    'Input: "I almost finished the song"',
    '{"title":"The Song Without Its Ending","label":"The melody stopped with one last door still closed.","category":"The Unmade Wing","artifactImageKey":"paper-plane"}',
    'Input: "I almost painted the kitchen wall"',
    '{"title":"The Wall Before Color","label":"The color waited nearby, still separate from the room.","category":"The Unmade Wing","artifactImageKey":"paint-tube"}',
    'Input: "I almost cooked dinner instead of ordering"',
    '{"title":"The Dinner Almost Made","label":"The kitchen had a chance to become the evening.","category":"The Unmade Wing","artifactImageKey":"recipe-card"}',
    'Input: "I almost started my workout"',
    '{"title":"The Body Almost Began","label":"Momentum arrived briefly, asking to be followed.","category":"The Unmade Wing","artifactImageKey":"seed-packet"}',
    'Input: "I almost read before bed"',
    '{"title":"The Book Before Sleep","label":"The page waited beside the night, unopened.","category":"The Unmade Wing","artifactImageKey":"closed-book"}',
    'Input: "I almost booked the train ticket"',
    '{"title":"The Ticket That Waited","label":"A route appeared, then stayed outside the calendar.","category":"The Unmade Wing","artifactImageKey":"ticket-stub"}',
    'Input: "I almost chose the other apartment"',
    '{"title":"The Other Key","label":"Another life stood briefly at the threshold.","category":"The Unmade Wing","artifactImageKey":"brass-key"}',
    'Input: "I almost deleted all my old notes"',
    '{"title":"The Notes That Stayed","label":"The past came close to losing its handles.","category":"The Unmade Wing","artifactImageKey":"paper-plane"}',
    'Input: "I almost planted the basil seeds"',
    '{"title":"The Seeds Before Soil","label":"A small future waited in its paper packet.","category":"The Unmade Wing","artifactImageKey":"seed-packet"}',
    'Input: "I almost went for a walk before sunset"',
    '{"title":"The Walk Before Sunset","label":"The evening opened a door, and you stayed inside it.","category":"The Unmade Wing","artifactImageKey":"map-pin"}',
    'Input: "I almost slept early"',
    '{"title":"The Earlier Night","label":"Rest came close, then lost its place in the evening.","category":"The Unmade Wing","artifactImageKey":"moon-jar"}',
    'Input: "I almost made a budget"',
    '{"title":"The Numbers Left Waiting","label":"The future asked to be counted, then waited.","category":"The Unmade Wing","artifactImageKey":"quiet-clock"}',
    'Input: "I almost did it"',
    '{"title":"The Almost Without A Name","label":"Something came close enough to matter, then stayed unnamed.","category":"The Unmade Wing","artifactImageKey":"teacup"}',
    'Input: "I almost told her I love you"',
    '{"title":"The Words At The Edge","label":"Love reached the doorway of being said.","category":"The Unsaid Wing","artifactImageKey":"folded-envelope"}',
  ].join('\n');
}

function normalizeCuratorOutput(value, original) {
  if (!value || typeof value !== 'object') {
    throw new Error('Model did not return a JSON object');
  }

  const category = categories.includes(value.category)
    ? value.category
    : inferCategory(original);
  const artifactImageKey = artifactChoices.some(([key]) => key === value.artifactImageKey)
    ? value.artifactImageKey
    : fallbackArtifactFor(category);

  const title = cleanText(value.title, fallbackTitleFor(category), 64);
  const modelLabel = cleanText(value.label, fallbackLabelFor(original, category), 140);
  const label = isShallowLabel(modelLabel, original)
    ? fallbackLabelFor(original, category)
    : modelLabel;

  return {
    title,
    label,
    category,
    artifactImageKey,
  };
}

function fallbackCuratorOutput(original, reason) {
  const category = inferCategory(original);
  const artifactImageKey = inferArtifactImageKey(original, category);

  return {
    title: fallbackTitleFor(category),
    label: fallbackLabelFor(original, category),
    category,
    artifactImageKey,
    _fallback: reason,
  };
}

function inferCategory(original) {
  return /call|text|message|dm|apolog|reply|email|send|tell|told|say|said|ask|asked|invite|confess|love/i.test(original)
    ? 'The Unsaid Wing'
    : 'The Unmade Wing';
}

function fallbackArtifactFor(category) {
  return category === 'The Unsaid Wing' ? 'folded-envelope' : 'teacup';
}

function inferArtifactImageKey(original, category) {
  const lower = original.toLowerCase();

  if (category === 'The Unsaid Wing') {
    return /friend|miss|wish|birthday|hello/.test(lower) ? 'postcard' : 'folded-envelope';
  }

  if (/cook|dinner|meal|bake|recipe/.test(lower)) return 'recipe-card';
  if (/workout|exercise|run|gym|plant|seed|grow/.test(lower)) return 'seed-packet';
  if (/write|song|story|chapter|draft|note/.test(lower)) return 'paper-plane';
  if (/design|paint|draw|art|wall/.test(lower)) return 'paint-tube';
  if (/photo|video|record|camera|post/.test(lower)) return 'tiny-camera';
  if (/read|book|study|learn|course/.test(lower)) return 'closed-book';
  if (/trip|train|flight|ticket|travel|event|show|concert/.test(lower)) return 'ticket-stub';
  if (/walk|place|park|visit|restaurant|city|explore/.test(lower)) return 'map-pin';
  if (/sleep|rest|bed|night/.test(lower)) return 'moon-jar';
  if (/budget|money|time|deadline|late|tomorrow|schedule/.test(lower)) return 'quiet-clock';
  if (/move|door|home|apartment|choice|choose/.test(lower)) return 'brass-key';

  return fallbackArtifactFor(category);
}

function cleanText(value, fallback, maxLength) {
  if (typeof value !== 'string') {
    return fallback;
  }

  const cleaned = value.replace(/\s+/g, ' ').trim();
  return cleaned.length > 0 && cleaned.length <= maxLength ? cleaned : fallback;
}

function fallbackTitleFor(category) {
  return category === 'The Unsaid Wing' ? 'The Words At The Edge' : 'The Almost That Waited';
}

function fallbackLabelFor(original, category) {
  const lower = original.toLowerCase();

  if (/love/.test(lower) && /tell|told|say|said|confess/.test(lower)) {
    return 'Love reached the doorway of being said.';
  }

  if (/apolog|sorry/.test(lower)) {
    return 'The repair came close enough to have a shape.';
  }

  if (/truth|honest/.test(lower)) {
    return 'Honesty gathered itself, then stayed just behind the reply.';
  }

  if (/\bno\b|boundary/.test(lower)) {
    return 'A boundary formed, then remained behind your teeth.';
  }

  if (/birthday|congrat|wish/.test(lower)) {
    return 'The greeting reached the edge of being real.';
  }

  if (category === 'The Unsaid Wing') {
    return 'The words came close enough to change the air.';
  }

  if (/cook|dinner|meal|bake|recipe/.test(lower)) {
    return 'The kitchen had a chance to become the evening.';
  }

  if (/workout|exercise|run|gym|walk/.test(lower)) {
    return 'Momentum arrived briefly, asking to be followed.';
  }

  if (/write|song|story|chapter|draft|page|design|paint|draw/.test(lower)) {
    return 'The first mark waited on the other side of starting.';
  }

  if (/read|book|study|learn|course/.test(lower)) {
    return 'The page waited nearby, still unopened.';
  }

  if (/trip|train|flight|ticket|book|travel|visit/.test(lower)) {
    return 'A route appeared, then stayed outside the calendar.';
  }

  if (/sleep|rest|bed|night/.test(lower)) {
    return 'Rest came close, then lost its place in the evening.';
  }

  if (/budget|money|pay|number|bill/.test(lower)) {
    return 'The future asked to be counted, then waited.';
  }

  if (/plant|seed|grow/.test(lower)) {
    return 'A small future waited in its paper packet.';
  }

  return 'The beginning stayed just on the other side of doing.';
}

function isShallowLabel(label, original) {
  const labelWords = importantWords(label);
  const originalWords = importantWords(original);

  if (labelWords.length === 0 || originalWords.length === 0) {
    return false;
  }

  const overlap = labelWords.filter((word) => originalWords.includes(word));
  const overlapRatio = overlap.length / Math.min(labelWords.length, originalWords.length);

  return /^you almost\b/i.test(label) || overlap.length >= 4 || overlapRatio > 0.55;
}

function importantWords(text) {
  const stopWords = new Set([
    'almost',
    'then',
    'with',
    'that',
    'this',
    'they',
    'them',
    'your',
    'you',
    'her',
    'him',
    'his',
    'she',
    'the',
    'and',
    'for',
    'but',
    'not',
    'was',
    'were',
    'are',
    'did',
    'had',
    'have',
    'into',
    'from',
  ]);

  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word));
}

function parseModelJson(content) {
  if (typeof content !== 'string') {
    throw new Error('Model returned no text');
  }

  const withoutFence = content
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  return JSON.parse(withoutFence);
}

function readJson(request) {
  return new Promise((resolveJson, reject) => {
    let raw = '';

    request.on('data', (chunk) => {
      raw += chunk;
    });
    request.on('end', () => {
      try {
        resolveJson(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(error);
      }
    });
    request.on('error', reject);
  });
}

function sendJson(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(body));
}

function setCorsHeaders(response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function loadEnv() {
  const values = { ...process.env };
  const envPath = resolve('.env');

  try {
    const text = readFileSync(envPath, 'utf8');

    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      const equalsIndex = trimmed.indexOf('=');

      if (equalsIndex === -1) {
        continue;
      }

      const key = trimmed.slice(0, equalsIndex).trim();
      const value = trimmed.slice(equalsIndex + 1).trim();
      values[key] = value;
    }
  } catch {
    return values;
  }

  return values;
}
