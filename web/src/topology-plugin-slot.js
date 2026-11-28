/**
 * MSDS-Engine 插拔式模板拓扑槽位管理器 (topology-plugin-slot.js)
 *
 * 严格隔离通用层与用户数据层：
 * 1. 未载入模板时处于纯净默认状态 (mounted=false, topology=null, profile=null)；
 * 2. mountTemplate(): 一次插拔式载入用户模板，执行识别与 StandardTopology 构建并缓存；
 * 3. getMountedTopology() / getMountedProfile(): 支持构建结果的多次无损复用；
 * 4. unmountTemplate() / resetToDefault(): 拔出模板，彻底清空用户模板数据并恢复至未载入默认状态。
 */

import fs from 'node:fs';
import crypto from 'node:crypto';
import { recognizeTemplateTopology, buildTemplateProfile } from './template-topology-recognizer.js';

export function createTopologyPluginSlot() {
  let state = {
    mounted: false,
    templateKey: null,
    sourceSha256: null,
    mountedAt: null,
    reuseCount: 0,
    topology: null,
    profile: null
  };

  return {
    isMounted() {
      return state.mounted;
    },

    getStatus() {
      return {
        mounted: state.mounted,
        templateKey: state.templateKey,
        sourceSha256: state.sourceSha256,
        mountedAt: state.mountedAt,
        reuseCount: state.reuseCount,
        sectionsCount: state.profile?.sectionsCount ?? 0
      };
    },

    async mountTemplate(templateSource, options = {}) {
      const buf = Buffer.isBuffer(templateSource)
        ? templateSource
        : (typeof templateSource === 'string' && fs.existsSync(templateSource) ? fs.readFileSync(templateSource) : null);
      const sourceSha256 = buf ? crypto.createHash('sha256').update(buf).digest('hex') : null;

      const topology = await recognizeTemplateTopology(templateSource, options);
      const profile = buildTemplateProfile(topology);

      state = {
        mounted: true,
        templateKey: topology.templateKey,
        sourceSha256,
        mountedAt: new Date().toISOString(),
        reuseCount: 0,
        topology: Object.freeze(topology),
        profile: Object.freeze(profile)
      };

      return this.getStatus();
    },

    getMountedTopology() {
      if (!state.mounted || !state.topology) {
        throw new Error('[TOPOLOGY_SLOT_UNMOUNTED] 当前未载入任何用户模板，请先调用 mountTemplate()！');
      }
      state.reuseCount += 1;
      return state.topology;
    },

    getMountedProfile() {
      if (!state.mounted || !state.profile) {
        throw new Error('[TOPOLOGY_SLOT_UNMOUNTED] 当前未载入任何用户模板，请先调用 mountTemplate()！');
      }
      state.reuseCount += 1;
      return state.profile;
    },

    /**
     * 导出标准的、可重复使用的拓扑构建结果对象 (StandardTopology JSON)
     */
    exportTopologyBundle(outPath = null) {
      if (!state.mounted || !state.profile) {
        throw new Error('[TOPOLOGY_SLOT_UNMOUNTED] 当前未载入任何用户模板，无法导出标准拓扑结果！');
      }
      const bundle = {
        schemaVersion: state.profile.schemaVersion || '2.0.0',
        kind: 'MsdsEngineStandardTopology',
        templateKey: state.templateKey,
        sourceSha256: state.sourceSha256,
        builtAt: state.mountedAt,
        docDefaults: state.profile.docDefaults,
        pageFormat: state.profile.pageFormat,
        typographyProfile: state.profile.typographyProfile,
        stylePrototypes: state.profile.stylePrototypes,
        headerFooterTopology: state.profile.headerFooterTopology,
        sectionsCount: state.profile.sectionsCount,
        sections: state.profile.sections,
        diagnostics: state.profile.diagnostics || []
      };
      if (outPath) {
        fs.writeFileSync(outPath, JSON.stringify(bundle, null, 2) + '\n', 'utf8');
      }
      return bundle;
    },

    /**
     * 直接挂载已导出的标准拓扑 JSON（无需重复解析 DOCX，支持一次构建多次复用）
     */
    mountTopologyBundle(bundleOrPath) {
      const bundle = typeof bundleOrPath === 'string'
        ? JSON.parse(fs.readFileSync(bundleOrPath, 'utf8'))
        : bundleOrPath;
      if (!bundle || bundle.kind !== 'MsdsEngineStandardTopology' || !Array.isArray(bundle.sections)) {
        throw new Error('[TOPOLOGY_BUNDLE_INVALID] 非法的 StandardTopology JSON 对象！');
      }
      state = {
        mounted: true,
        templateKey: bundle.templateKey || 'CACHED_TOPOLOGY',
        sourceSha256: bundle.sourceSha256 || null,
        mountedAt: bundle.builtAt || new Date().toISOString(),
        reuseCount: 0,
        topology: Object.freeze(bundle),
        profile: Object.freeze(bundle)
      };
      return this.getStatus();
    },

    unmountTemplate() {
      state = {
        mounted: false,
        templateKey: null,
        sourceSha256: null,
        mountedAt: null,
        reuseCount: 0,
        topology: null,
        profile: null
      };
      return this.getStatus();
    },

    resetToDefault() {
      return this.unmountTemplate();
    }
  };
}

// 默认全局单槽位实例（初始绝对未载入任何用户数据）
export const defaultTopologySlot = createTopologyPluginSlot();
