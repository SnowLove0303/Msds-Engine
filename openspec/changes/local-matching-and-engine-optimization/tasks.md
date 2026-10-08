# Tasks

## 1. Section 9 理化测试条件前置解耦 (Pre-Matching Qualifier Decoupling)

- [x] 1.1 实现 `preExtractConditionQualifier`，在进行槽位相似度匹配前先行剥离圆括号限定词（如 `（1%水溶液）`、`（25℃，4号转子）`），以纯化后的属性名（如 `pH值`）参与别名索引。
- [x] 1.2 将提取到的限定词附加在匹配元数据中，在向模板注入标签时保持限定词回填。
- [x] 1.3 扩充理化特性字典，补充离子性、固体含量等特定理化插槽别名。

## 2. Section 14 非危险品多槽位下沉分流器 (Transport Cascade Engine)

- [x] 2.1 实现 Section 14 运输非危险品检测器，识别“公路/海运/空运：非危险品”及“非危险货物”特征。
- [x] 2.2 实现非危险品多槽位联动派发：自动为 UN号填入“不适用”、正确运输名称填入“非危险品”、类别填入“非危险品”、包装组填入“不适用”、海洋污染物填入“否”。
- [x] 2.3 将作业与储存温控说明智能提取并绑定至 `special_precautions` (运输注意事项)。

## 3. Section 15 & 16 列表汇聚与免责长文本归集器 (List & Narrative Aggregator)

- [x] 3.1 实现法规标准清单汇集器，将 Section 15 中列出的法规条例（危险化学品安全管理条例、GB/T 16483、GB 13690 等）自动聚合为单槽位规范文本块并绑定至 `safety_regulations`。
- [x] 3.2 实现免责声明段落捕获器，将 Section 16 中无标签的长篇免责陈述智能绑定至 `other_info`。

## 4. 散文型无标签孤行关键字路由器 (Semantic Prose Router)

- [x] 4.1 实现 Section 5 消防散文特征识别（“燃烧释放/烟尘” -> `special_hazards`，“消防人员自供气呼吸器” -> `protective_actions`，“不合适灭火剂” -> `extinguishing_media`）。
- [x] 4.2 实现 Section 6 泄漏散文特征识别（“防护设备/通风” -> `personal_precautions`，“吸收材料/密闭容器” -> `cleanup_methods`）。
- [x] 4.3 实现 Section 10 反应性特征识别（“危害反应/危险反应” -> `hazardous_reactions`）。
- [x] 4.4 实现 Section 11 毒理学特征识别（“主要粘膜刺激/眼睛刺激” -> `eye_damage`，“皮肤试验/无过敏” -> `sensitization`）。
- [x] 4.5 实现 Section 13 废弃处置特征识别（“倒空容器/回收” -> `contaminated_packaging`，“法规废弃” -> `waste_treatment_methods`）。

## 5. Section 8 PPE 手套聚合器 (PPE Hand Protection Clustering)

- [x] 5.1 实现 Section 8 手套材质与厚度/穿透时间（FKM、IIR、NBR）提取器。
- [x] 5.2 聚合并格式化手套材质列表，完整注入 `hand_protection` (手部防护)。

## 6. Section 3/4 结构化抽取与跨章节流转 (Component & First-Aid Separation)

- [x] 6.1 实现成分/组成表格多列（化学品名称、CAS号、百分比）解析，支持成分数据提取。
- [x] 6.2 识别 Section 3 尾部误排的急救措施（误服、接触皮肤、吸入等），自动流转至 Section 4 急救措施槽位。

## 7. 全双语高覆盖别名字典网络 (Full Bilingual Alias Matrix)

- [x] 7.1 全面吸收 `AI-Agent 3.26` 中英双语别名库，扩充全部 16 章节的英文别名覆盖。
- [x] 7.2 支持英文 Section 标题、GHS 危害与理化英文属性的精准对齐。

## 8. 真实样本自动化回归与系统构建 (Real-Sample Regression & Build)

- [x] 8.1 将 `diagnose_samples.mjs` 中的真实样本用例（`PU-1007`、`PU-1036 CN/EN`、`PU-202A`）纳入自动化测试断言，验证匹配成功率显著提高（未匹配项大幅下降，核心字段 100% 注入）。
- [x] 8.2 执行 `npm run test:smoke` 和 `npm run build`，确保回归全绿且生产打包无误。
