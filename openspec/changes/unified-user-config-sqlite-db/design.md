# Design: Dedicated User-Config SQLite Database (`user_config.db`)

```text
[Web UI / Kit CLI / Agent]
        │
        ▼ (REST API / Direct Store)
[web/src/user-config-db.js]  <-- Protected by .gitignore (web/data/user_config.db*) & LINT-UCFG-PURE-01
  ├── user_templates (id, name, language, file_name, sha256, docx_blob, topology_json, completeness_ok, sections_count, is_default)
  ├── user_presets (id, name, entity, language, target_template_id, header_footer_json, field_overrides_json, enabled, is_default)
  └── user_naming_patterns (id, name, pattern, description, is_default)  [seeded only with generic {docId}_{lang}_{preset}]
```
