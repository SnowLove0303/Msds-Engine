#!/usr/bin/env node

/**
 * 标准模板拓扑识别与构建 CLI 工具
 * 用法:
 *   node web/scripts/build_template_topology.mjs --template=<模板.docx路径> [--out=<输出.topology.json路径>]
 */

import path from 'node:path';
import { JSDOM } from 'jsdom';
import { createTopologyPluginSlot } from '../src/topology-plugin-slot.js';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const args = process.argv.slice(2);
const tplArg = args.find(a => a.startsWith('--template='))?.split('=', 2)[1]?.replace(/^["']|["']$/g, '');
const outArg = args.find(a => a.startsWith('--out='))?.split('=', 2)[1]?.replace(/^["']|["']$/g, '');

if (!tplArg) {
  console.error('用法: node web/scripts/build_template_topology.mjs --template=<模板.docx路径> [--out=<输出.topology.json路径>]');
  process.exit(1);
}

const slot = createTopologyPluginSlot();
await slot.mountTemplate(path.resolve(tplArg));
const bundle = slot.exportTopologyBundle(outArg ? path.resolve(outArg) : null);

if (outArg) {
  console.log(`✅ 标准拓扑构建结果已导出至: ${path.resolve(outArg)} (sections=${bundle.sectionsCount}, sha256=${bundle.sourceSha256?.slice(0, 12)})`);
} else {
  console.log(JSON.stringify(bundle, null, 2));
}
