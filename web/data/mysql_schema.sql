-- ====================================================================
-- MSDS Studio Enterprise MySQL Schema & Category Benchmark Repository
-- ====================================================================

CREATE DATABASE IF NOT EXISTS `msds_studio` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `msds_studio`;

-- 1. 基准产出物规格表 (配合智能匹配引擎受控补充)
CREATE TABLE IF NOT EXISTS `benchmark_category_specs` (
    `category_code` VARCHAR(64) NOT NULL PRIMARY KEY COMMENT '产品大类编码，如 02-1, default',
    `category_name` VARCHAR(255) NOT NULL COMMENT '大类中文名称',
    `ppe_hand_specs_json` JSON NOT NULL COMMENT '手套材质与厚度穿透时间技术基准',
    `waste_disposal_specs_json` JSON NOT NULL COMMENT '废弃处置总则与回收规范',
    `regulatory_specs_json` JSON NOT NULL COMMENT '法定条例标准条目',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='同品类标杆合规参数基准表';

-- 2. 预设基准数据
INSERT INTO `benchmark_category_specs` 
(`category_code`, `category_name`, `ppe_hand_specs_json`, `waste_disposal_specs_json`, `regulatory_specs_json`, `updated_at`)
VALUES
('02-1', '单组份水性丙烯酸乳液 PA', 
 '{"standard": "EN 374-3", "fkm": "厚度≧0.4mm；穿透时间≧480min.", "fkm_en": "Thickness ≥ 0.4 mm; Breakthrough time ≥ 480 min", "iir": "厚度≧0.5mm；穿透时间≧480min.", "iir_en": "Thickness ≥ 0.5 mm; Breakthrough time ≥ 480 min", "nbr": "厚度≧0.35mm；穿透时间≧480min.", "nbr_en": "Thickness ≥ 0.35 mm; Breakthrough time ≥ 480 min", "recommendation": "及时更换受污染手套，脱手套后彻底洗手。", "recommendation_en": "Discard contaminated gloves and wash hands thoroughly.", "engineering_controls_en": "Provide adequate ventilation and local exhaust."}',
 '{"general_law_cn": "必须遵守适用的国标、国家或当地法规进行废弃。严格按照国家和地方危废与环保管理法规执行。", "general_law_en": "Dispose of in accordance with applicable national standards and national or local regulations.", "ewc_en": "Within the European Union, dispose of in accordance with the applicable provisions of the European Waste Catalogue (EWC).", "methods_supplement_cn": "尽可能将容器倒空（例如经倾倒，刮擦或排干直至“滴干”）。可根据化学工业现存的回收方案送往适当的收集点处理。容器应按照国家法令和环境相关法规进行回收。不能将废弃物通过废水排放。", "methods_supplement_en": "Empty containers as completely as possible (e. g., by pouring, scraping, or draining until \"drip-dry\"). They may be sent to an appropriate collection point under existing chemical industry recycling schemes. Recycle containers in accordance with national regulations and applicable environmental requirements. Do not discharge waste via wastewater."}',
 '{"regulations_cn": ["《危险化学品安全管理条例》（国务院令第591号）", "GB/T 16483-2008《化学品安全技术说明书 内容和项目顺序》", "GB 13690-2009《化学品分类和危险性公示 通则》", "GB 30000系列《化学品分类和标签规范》"], "regulations_en": ["Regulations on the Safety Management of Hazardous Chemicals, State Council Decree No. 591.", "GB/T 16483-2008 Safety data sheet for chemical products - Content and order of sections.", "GB 13690-2009 General rules for classification and hazard communication of chemicals.", "GB 30000.2-29 Rules for classification and labelling of chemicals."]}',
 NOW()),
('default', '通用化工水性树脂/乳液基准',
 '{"standard": "EN 374-3", "fkm": "厚度≧0.4mm；穿透时间≧480min.", "fkm_en": "Thickness ≥ 0.4 mm; Breakthrough time ≥ 480 min", "iir": "厚度≧0.5mm；穿透时间≧480min.", "iir_en": "Thickness ≥ 0.5 mm; Breakthrough time ≥ 480 min", "nbr": "厚度≧0.35mm；穿透时间≧480min.", "nbr_en": "Thickness ≥ 0.35 mm; Breakthrough time ≥ 480 min", "recommendation": "及时更换受污染手套，脱手套后彻底洗手。", "recommendation_en": "Discard contaminated gloves and wash hands thoroughly.", "engineering_controls_en": "Provide adequate ventilation and local exhaust."}',
 '{"general_law_cn": "必须遵守适用的国标、国家或当地法规进行废弃。严格按照国家和地方危废与环保管理法规执行。", "general_law_en": "Dispose of in accordance with applicable national standards and national or local regulations.", "ewc_en": "Within the European Union, dispose of in accordance with the applicable provisions of the European Waste Catalogue (EWC).", "methods_supplement_cn": "尽可能将容器倒空（例如经倾倒，刮擦或排干直至“滴干”）。可根据化学工业现存的回收方案送往适当的收集点处理。容器应按照国家法令和环境相关法规进行回收。不能将废弃物通过废水排放。", "methods_supplement_en": "Empty containers as completely as possible (e. g., by pouring, scraping, or draining until \"drip-dry\"). They may be sent to an appropriate collection point under existing chemical industry recycling schemes. Recycle containers in accordance with national regulations and applicable environmental requirements. Do not discharge waste via wastewater."}',
 '{"regulations_cn": ["《危险化学品安全管理条例》（国务院令第591号）", "GB/T 16483-2008《化学品安全技术说明书 内容和项目顺序》", "GB 13690-2009《化学品分类和危险性公示 通则》", "GB 30000系列《化学品分类和标签规范》"], "regulations_en": ["Regulations on the Safety Management of Hazardous Chemicals, State Council Decree No. 591.", "GB/T 16483-2008 Safety data sheet for chemical products - Content and order of sections.", "GB 13690-2009 General rules for classification and hazard communication of chemicals.", "GB 30000.2-29 Rules for classification and labelling of chemicals."]}',
 NOW())
ON DUPLICATE KEY UPDATE
`category_name`=VALUES(`category_name`),
`ppe_hand_specs_json`=VALUES(`ppe_hand_specs_json`),
`waste_disposal_specs_json`=VALUES(`waste_disposal_specs_json`),
`regulatory_specs_json`=VALUES(`regulatory_specs_json`),
`updated_at`=NOW();
