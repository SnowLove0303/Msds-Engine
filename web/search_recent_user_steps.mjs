import fs from 'fs';

const lines = fs.readFileSync('C:/Users/Administrator/.gemini/antigravity/brain/7f4d4b46-78e6-435a-aa29-f0d6ec194caa/.system_generated/logs/transcript.jsonl', 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
  if (!lines[i].trim()) continue;
  try {
    const obj = JSON.parse(lines[i]);
    if (obj.step_index >= 10500 && obj.step_index <= 11400 && obj.source === 'USER_EXPLICIT') {
      console.log(`\n=== USER STEP ${obj.step_index} (${obj.created_at}) ===`);
      console.log(obj.content);
    }
  } catch (e) {}
}
