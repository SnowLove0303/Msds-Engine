import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import JSZip from 'jszip';
import { createTopologyPluginSlot } from '../src/topology-plugin-slot.js';
import { createWorkSession, reshapeTableRows, saveSession } from '../src/template-editor.js';
import { applyGlobalTypographyProjection } from '../src/universal-editor-primitives.js';
import { renderEditorTable } from '../src/render-utils.js';

async function buildArbitraryDocx(sectionCount = 5) {
  const zip = new JSZip();
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`);
  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);
  zip.file('word/_rels/document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>`);

  const makeTable = (secNum) => `
    <w:tbl>
      <w:tblPr><w:tblW w:w="9000" w:type="dxa"/><w:tblLayout w:type="fixed"/></w:tblPr>
      <w:tblGrid><w:gridCol w:w="2500"/><w:gridCol w:w="3500"/><w:gridCol w:w="3000"/></w:tblGrid>
      <w:tr>
        <w:tc><w:tcPr><w:gridSpan w:val="3"/><w:tcW w:w="9000" w:type="dxa"/></w:tcPr><w:p><w:r><w:rPr><w:rFonts w:eastAsia="微软雅黑" w:ascii="微软雅黑"/><w:sz w:val="22"/><w:b/></w:rPr><w:t>${secNum}. Custom Section ${secNum}</w:t></w:r></w:p></w:tc>
      </w:tr>
      <w:tr>
        <w:tc><w:tcPr><w:tcW w:w="2500" w:type="dxa"/><w:vMerge w:val="restart"/></w:tcPr><w:p><w:r><w:rPr><w:rFonts w:eastAsia="微软雅黑" w:ascii="微软雅黑"/><w:sz w:val="22"/><w:b/></w:rPr><w:t>${secNum}.1 Group：</w:t></w:r></w:p></w:tc>
        <w:tc><w:tcPr><w:tcW w:w="3500" w:type="dxa"/></w:tcPr><w:p><w:r><w:rPr><w:rFonts w:eastAsia="微软雅黑" w:ascii="微软雅黑"/><w:sz w:val="22"/></w:rPr><w:t>Item A</w:t></w:r></w:p></w:tc>
        <w:tc><w:tcPr><w:tcW w:w="3000" w:type="dxa"/></w:tcPr><w:p><w:r><w:rPr><w:rFonts w:eastAsia="微软雅黑" w:ascii="微软雅黑"/><w:sz w:val="22"/></w:rPr><w:t>Val A</w:t></w:r></w:p></w:tc>
      </w:tr>
      <w:tr>
        <w:tc><w:tcPr><w:tcW w:w="2500" w:type="dxa"/><w:vMerge/></w:tcPr><w:p/></w:tc>
        <w:tc><w:tcPr><w:tcW w:w="3500" w:type="dxa"/></w:tcPr><w:p><w:r><w:rPr><w:rFonts w:eastAsia="微软雅黑" w:ascii="微软雅黑"/><w:sz w:val="22"/></w:rPr><w:t>Item B</w:t></w:r></w:p></w:tc>
        <w:tc><w:tcPr><w:tcW w:w="3000" w:type="dxa"/></w:tcPr><w:p><w:r><w:rPr><w:rFonts w:eastAsia="微软雅黑" w:ascii="微软雅黑"/><w:sz w:val="22"/></w:rPr><w:t>Val B</w:t></w:r></w:p></w:tc>
      </w:tr>
    </w:tbl>`;

  const tablesXml = Array.from({ length: sectionCount }, (_, idx) => makeTable(idx + 1)).join('\n');
  zip.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>Custom Preamble Notice</w:t></w:r></w:p>
    ${tablesXml}
    <w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:bottom="1440" w:left="1440" w:right="1440"/></w:sectPr>
  </w:body>
</w:document>`);

  return zip.generateAsync({ type: 'nodebuffer' });
}

async function main() {
  const docxBuf = await buildArbitraryDocx(5);
  const slot = createTopologyPluginSlot();
  await slot.mountTemplate(docxBuf, { templateName: 'custom_5sec_3col.docx' });
  const bundle = slot.exportTopologyBundle();

  assert.equal(bundle.sectionsCount, 5, 'Should recognize 5 arbitrary sections');
  assert.equal(bundle.bodyFlow.preambleBlocks.length, 1, 'Should detect 1 preamble block');
  assert.deepEqual(bundle.sections[0].columnWidths, [2500, 3500, 3000], 'Should preserve 3-column grid');
  assert.equal(bundle.sections[0].vMergeGroups.length, 1, 'Should detect vertical merge group');

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'msds-dyn-editor-'));
  try {
    const session = await createWorkSession({
      docxBuffer: docxBuf,
      topologyBundle: bundle,
      templateName: 'custom_5sec_3col.docx',
      workingDir: tmpDir
    });

    assert.equal(session.isDynamicTopology, true);
    assert.equal(session.legacyCompat, false);
    assert.equal(session.templateProfile.geometryProfile.sectionsCount, 5);

    const record0 = session.engine.records.find(r => r.sectionNumber === 1);
    const html = renderEditorTable(record0, {
      topologySection: bundle.sections[0],
      typographyProfile: bundle.typographyProfile,
      docDefaults: bundle.docDefaults
    });

    assert.ok(html.includes('data-topology-section="1"'), 'Should tag rendered table with topology section');
    assert.ok(html.includes('table-layout:fixed'), 'Should apply topology tableLayout');
    assert.ok(html.includes('rowspan="2"'), 'Should apply vMergeGroups rowspan=2');
    assert.ok(html.includes('topology-locked-row'), 'Should mark lockedRowIndices row');
    assert.ok(html.includes('2500') || html.includes('27.778%'), 'Should render 3-column proportional colgroup');
    assert.ok(html.includes('微软雅黑'), 'Should project extracted font into WYSIWYG cell editor');

    const reshaped = reshapeTableRows(session, 1, 5);
    assert.equal(reshaped.newRowCount, 5, 'Should expand section 1 rows to 5');

    const shrunk = reshapeTableRows(session, 1, 1);
    assert.ok(shrunk.newRowCount >= 1, 'Should protect locked row 0 when shrinking');

    applyGlobalTypographyProjection(session.engine, false, bundle.typographyProfile, bundle.docDefaults);

    const outPath = path.join(tmpDir, 'out_5sec.docx');
    const saved = await saveSession(session, outPath);
    assert.equal(saved.success, true);
    assert.ok(fs.existsSync(outPath), 'Should save edited DOCX successfully');

    slot.unmountTemplate();
    assert.equal(slot.isMounted(), false, 'Should cleanly unmount topology slot');

    // Verify >16 sections (18 sections) and Section 11 3-col preservation in pure dynamic mode
    const docx18 = await buildArbitraryDocx(18);
    await slot.mountTemplate(docx18, { templateName: 'custom_18sec_3col.docx' });
    const bundle18 = slot.exportTopologyBundle();
    assert.equal(bundle18.sectionsCount, 18, 'Should recognize 18 sections (>16)');

    const session18 = await createWorkSession({
      docxBuffer: docx18,
      topologyBundle: bundle18,
      templateName: 'custom_18sec_3col.docx',
      workingDir: tmpDir
    });
    assert.equal(session18.templateProfile.geometryProfile.sectionsCount, 18);
    const sec11Rec = session18.engine.records.find(r => r.sectionNumber === 11);
    assert.equal(sec11Rec.rows[1].cells.length, 3, 'Dynamic mode must preserve 3-col Section 11 without legacy removal');
    const sec18Rec = session18.engine.records.find(r => r.sectionNumber === 18);
    assert.ok(sec18Rec, 'Section 18 must be present and editable');
    slot.unmountTemplate();
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  console.log('✓ test_dynamic_editor_topology.mjs all assertions passed');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
