import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';
import { recognizeDocumentUniversal, serializeUniversalToMarkdown } from '../src/recognition-engine.js';
import { recognizeSourceDocx } from '../src/msds-source-semantic-adapter.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CN_TEMPLATE_PATH = path.resolve(__dirname, '../public/templates/正式模板_MSDS_CN_冠志(1).docx');

async function buildRich20SectionDocx() {
  const zip = new JSZip();
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-officedocument.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>
  <Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>
</Types>`);
  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);
  zip.file('word/_rels/document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdH1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>
  <Relationship Id="rIdF1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>
</Relationships>`);
  zip.file('word/header1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:p><w:r><w:t>Universal Header Title</w:t></w:r></w:p>
</w:hdr>`);
  zip.file('word/footer1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:p><w:r><w:t>Page </w:t></w:r><w:r><w:instrText> PAGE </w:instrText></w:r></w:p>
</w:ftr>`);

  const tablesXml = Array.from({ length: 20 }, (_, i) => {
    const n = i + 1;
    return `
      <w:tbl>
        <w:tblPr><w:tblW w:w="9000" w:type="dxa"/></w:tblPr>
        <w:tblGrid><w:gridCol w:w="3000"/><w:gridCol w:w="6000"/></w:tblGrid>
        <w:tr>
          <w:tc><w:tcPr><w:gridSpan w:val="2"/></w:tcPr><w:p><w:r><w:rPr><w:rFonts w:ascii="Calibri"/><w:sz w:val="22"/><w:b/></w:rPr><w:t>${n}. Arbitrary Module ${n}</w:t></w:r></w:p></w:tc>
        </w:tr>
        <w:tr>
          <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Field ${n}：</w:t></w:r></w:p></w:tc>
          <w:tc><w:p><w:r><w:t>Value ${n}</w:t></w:r></w:p></w:tc>
        </w:tr>
      </w:tbl>`;
  }).join('\n');

  zip.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>Document Preamble Line</w:t></w:r></w:p>
    ${tablesXml}
    <w:p><w:r><w:t>Document Trailing Line</w:t></w:r></w:p>
    <w:sectPr>
      <w:headerReference w:type="default" r:id="rIdH1" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/>
      <w:footerReference w:type="default" r:id="rIdF1" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/>
    </w:sectPr>
  </w:body>
</w:document>`);

  return zip.generateAsync({ type: 'nodebuffer' });
}

async function main() {
  const buf20 = await buildRich20SectionDocx();
  const uni20 = await recognizeDocumentUniversal(buf20, { sourceName: 'rich_20sec.docx' });

  assert.equal(uni20.schemaVersion, '2.0.0');
  assert.equal(uni20.tables.length, 20, 'Should extract all 20 tables without 1..16 cap');
  assert.equal(uni20.dynamicSections.length, 20, 'Should discover all 20 arbitrary sections');
  assert.equal(uni20.dynamicSections[19].sectionNumber, 20);
  assert.equal(uni20.bodyParagraphs.length, 2, 'Should extract preamble and trailing body paragraphs');
  assert.equal(uni20.headerFooter.headers.length, 1);
  assert.equal(uni20.headerFooter.footers.length, 1);
  assert.ok(uni20.fieldCandidates.some(fc => fc.label === 'Field 20' && fc.value === 'Value 20'), 'Should extract KV candidate from section 20');
  assert.ok(uni20.sourceOoxml['word/document.xml'], 'Should retain raw document.xml');
  assert.ok(uni20.sourceOoxml['word/footer1.xml'], 'Should retain raw footer1.xml');
  assert.equal(uni20.coverage.tableCountMatches, true);
  assert.ok(uni20.recognitionWarnings.some(w => w.element === 'w:instrText'), 'Should flag unnormalized instrText');
  assert.ok(Array.isArray(uni20.tables[0].rows[0].cells[0].paragraphs), 'Should preserve per-cell paragraphs array');
  const md20 = serializeUniversalToMarkdown(uni20);
  assert.ok(md20.includes('<table>') && md20.includes('colspan="2"'), 'serializeUniversalToMarkdown should emit 1:1 HTML tables with colspan');

  const pureFromSource = await recognizeSourceDocx(buf20, { sourceName: 'rich_20sec.docx', universalOnly: true });
  assert.equal(pureFromSource.tables.length, 20);
  assert.equal(pureFromSource.ghs, undefined, 'universalOnly mode must not inject legacy domain schemas');

  const cnUni = await recognizeDocumentUniversal(CN_TEMPLATE_PATH, { sourceName: '正式模板_MSDS_CN_冠志(1).docx' });
  assert.equal(cnUni.tables.length, 16);
  assert.ok(cnUni.coverage.normalizedCellCount > 100);
  assert.ok(cnUni.sourceOoxml['word/styles.xml']);

  console.log('✓ test_universal_recognition.mjs all assertions passed');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
