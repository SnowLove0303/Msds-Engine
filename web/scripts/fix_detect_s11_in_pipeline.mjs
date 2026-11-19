import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetPath = path.resolve(__dirname, '../src/pipeline-engine.js');
const proposedPath = path.resolve(__dirname, '../data/proposed_pipeline-engine.js');

let content = fs.readFileSync(targetPath, 'utf8');

// 1. Fix detectSection11Paradigm
const oldDetect = `export function detectSection11Paradigm(section11FactsOrRecords) {
  if (!section11FactsOrRecords) return 'PARADIGM_2_STANDARD_SLOTS';
  
  if (section11FactsOrRecords.isMultiComponentComposite || section11FactsOrRecords.isMultiComponentS11) {
    return 'PARADIGM_1_FULL_WIDTH_MERGED';
  }

  let rawText = '';
  if (typeof section11FactsOrRecords === 'string') {
    rawText = section11FactsOrRecords;
  } else if (Array.isArray(section11FactsOrRecords)) {
    rawText = section11FactsOrRecords.map(item => (typeof item === 'string' ? item : item?.text || '')).join(' ');
  } else if (section11FactsOrRecords.rows && Array.isArray(section11FactsOrRecords.rows)) {
    rawText = section11FactsOrRecords.rows.map(r => (r.cells || []).map(c => c.text || '').join(' ')).join(' ');
  } else if (section11FactsOrRecords.node && typeof section11FactsOrRecords.node.textContent === 'string') {
    rawText = section11FactsOrRecords.node.textContent;
  } else {
    try {
      rawText = JSON.stringify(section11FactsOrRecords, (key, value) => {
        if (key === 'node' || key === 'record' || key === 'table' || key === 'parent') return undefined;
        return value;
      });
    } catch {
      rawText = String(section11FactsOrRecords);
    }
  }`;

const newDetect = `export function detectSection11Paradigm(section11FactsOrRecords) {
  if (!section11FactsOrRecords) return 'PARADIGM_2_STANDARD_SLOTS';
  
  if (section11FactsOrRecords.isMultiComponentComposite || section11FactsOrRecords.isMultiComponentS11) {
    return 'PARADIGM_1_FULL_WIDTH_MERGED';
  }

  let rawText = '';
  if (typeof section11FactsOrRecords === 'string') {
    rawText = section11FactsOrRecords;
  } else if (Array.isArray(section11FactsOrRecords)) {
    rawText = section11FactsOrRecords.map(item => (typeof item === 'string' ? item : (item?.text || (item?.rows ? item.rows.map(r => (r.cells || []).map(c => c.text || '').join(' ')).join(' ') : '')))).join(' ');
  } else if (section11FactsOrRecords.text && typeof section11FactsOrRecords.text === 'string') {
    rawText = section11FactsOrRecords.text;
  } else if (section11FactsOrRecords.rows && Array.isArray(section11FactsOrRecords.rows)) {
    rawText = section11FactsOrRecords.rows.map(r => (r.cells || []).map(c => c.text || '').join(' ')).join(' ');
  } else {
    try {
      rawText = JSON.stringify(section11FactsOrRecords, (key, value) => {
        if (key === 'node' || key === 'record' || key === 'table' || key === 'parent' || key === 'engine' || key === 'records') return undefined;
        return value;
      });
    } catch {
      rawText = String(section11FactsOrRecords);
    }
  }`;

content = content.replace(oldDetect, newDetect);

// 2. In buildBaseChineseEngine, pass all section 11 records to detectSection11Paradigm
const oldDispatch = `  const isMultiComponent = Boolean(facts.isMultiComponentComposite || facts.isMultiComponentS11);
  const s11Paradigm = isMultiComponent ? 'PARADIGM_1_FULL_WIDTH_MERGED' : detectSection11Paradigm(facts?.section11 || srcEngine?.records?.find(r => r.sectionNumber === 11) || null);`;

const newDispatch = `  const isMultiComponent = Boolean(facts.isMultiComponentComposite || facts.isMultiComponentS11);
  const s11Recs = srcEngine?.records?.filter(r => r.sectionNumber === 11) || [];
  const s11Paradigm = isMultiComponent ? 'PARADIGM_1_FULL_WIDTH_MERGED' : detectSection11Paradigm(facts?.section11 || s11Recs);`;

content = content.replace(oldDispatch, newDispatch);

fs.writeFileSync(proposedPath, content, 'utf8');
console.log('Proposed pipeline-engine.js updated with detectSection11Paradigm fix.');
