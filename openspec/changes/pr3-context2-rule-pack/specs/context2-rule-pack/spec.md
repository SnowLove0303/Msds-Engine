# Spec: Context 2 Rule Pack

## ADDED Requirements

### Requirement: Pluggable Normative Rule Packs
`buildStructuredContext2` SHALL accept `options.rulePack` (`PURE_SOURCE_PRESERVATION` | `CN_GB_MSDS_DEFAULT` | custom object) to decouple source-faithful structural classification from industry/customer-specific Section 2 and Section 8 rewrites.

#### Scenario: Pure source preservation preserves original Section 2 numbering and headers
- **WHEN** `buildStructuredContext2` is called with `{ rulePack: 'PURE_SOURCE_PRESERVATION' }` on a Section 2 containing `2.0` or custom `(1)` labels without `2.1`/`2.2`
- **THEN** it SHALL NOT inject `2.1 物质或混合物的分类` or `2.2 标签要素`, SHALL NOT renumber `2.0` to `2.1`, and SHALL classify lines via generic structural features.

### Requirement: Generic Feature Classification and Role Overrides
`classifyLineByGenericFeatures` SHALL classify outline lines into `PARENT_HEADER`, `SUB_LABEL_KV`, or `VALUE_LINE` using numbering/colon syntax or explicit `options.roleOverrides` without hardcoded product keywords.

#### Scenario: Role override takes precedence over heuristic classification
- **WHEN** `options.roleOverrides` specifies a custom `subRole` for a line
- **THEN** `buildStructuredContext2` applies the overridden role and `indentDxa`.
