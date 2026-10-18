# Spec Delta

## Purpose

Defines how the template editor replaces editable text inside a single table cell so the user's input remains one logical value across browser editing and DOCX export.

## ADDED Requirements

### Requirement: Editable cell values are replaced atomically

The editor MUST treat all editable text nodes belonging to one cell value as a single logical value. It MUST NOT distribute replacement characters according to the number, length, or position of the source runs or paragraphs. When the replacement contains no line break, the resulting value MUST remain continuous within the same cell in the editor and exported DOCX.

#### Scenario: Replace a multi-paragraph Section 11 value with continuous text

- **WHEN** a user replaces the editable value in a multi-paragraph Section 11 cell with `123` and does not enter a line break
- **THEN** the editor model and exported/reopened DOCX contain `123` as one continuous value without splitting its characters across the source paragraphs

#### Scenario: Preserve user-entered line breaks inside one cell

- **WHEN** a user enters a value containing an explicit line break
- **THEN** the editor and exported DOCX preserve that break within the same cell, and do not add breaks based on the source node count

#### Scenario: Preserve protected cell content while replacing a value

- **WHEN** an editable value shares a cell with protected labels or non-text content
- **THEN** the editor replaces only the editable value as one logical value and retains the protected labels and non-text content

#### Scenario: Numeric content in a value column remains editable

- **WHEN** an exported DOCX is reopened and a non-label value cell contains only digits such as `123`
- **THEN** the editor treats the text as a cell value rather than a sequence prefix and keeps the cell editable
