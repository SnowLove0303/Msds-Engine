import fs from 'node:fs/promises';

async function searchTranscript() {
  const file = 'C:/Users/Administrator/.gemini/antigravity/brain/7f4d4b46-78e6-435a-aa29-f0d6ec194caa/.system_generated/logs/transcript.jsonl';
  const content = await fs.readFile(file, 'utf8');
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (l.includes('USER_INPUT') && (l.includes('section3') || l.includes('section 3') || l.includes('序号') || l.includes('对齐'))) {
      try {
        const obj = JSON.parse(l);
        console.log(`[Step ${obj.step_index}]:`, obj.content?.slice(0, 300));
      } catch (e) {}
    }
  }
}

searchTranscript().catch(console.error);
