# Spec Delta

## Purpose

Defines synchronized CN/EN Guanzhi and Guocai MSDS outputs derived from one reviewed content model, with the two companies differing only in their Section 1 supplier details and footer company name.

## ADDED Requirements

### Requirement: Generate four synchronized language and company variants

The system SHALL create CN Guanzhi, CN Guocai, EN Guanzhi, and EN Guocai DOCX outputs from one reviewed semantic content model and the maintained CN/EN Guanzhi template structures. It MUST preserve section order, table geometry, labels, sequence text, typography, borders, merges, and page layout from the selected language template.

#### Scenario: Export all four variants

- **WHEN** source mapping is resolved and all required English translations are reviewed
- **THEN** the system generates exactly four separately named DOCX files and packages them for download without modifying the source DOCX or embedded templates

#### Scenario: Block export with incomplete reviewed content

- **WHEN** a source mapping, required value, translation, structural review, or audit remains unresolved
- **THEN** the system blocks the batch and identifies the affected variant and Section

### Requirement: Restrict company differences to supplier profile fields

The Guanzhi and Guocai variants of the same language MUST be semantically identical except for Section 1 supplier name, supplier address, telephone, fax, and the footer company name. Company overlays MUST use the approved profile values; they MUST NOT change product identity, safety content, section numbering, or any other output value.

#### Scenario: Apply the Guocai overlay

- **WHEN** the user selects a Guocai output variant
- **THEN** only the approved Section 1 supplier fields and footer company name change from the same-language Guanzhi variant

#### Scenario: Audit cross-company parity

- **WHEN** the four outputs are prepared for download
- **THEN** the system compares each same-language company pair after excluding the approved supplier/footer fields and blocks the batch if any other content differs

### Requirement: Persist product and company metadata in header and footer XML

The system MUST write the source-supported product model and the selected company footer value to their existing template-owned header/footer text slots while preserving their run/paragraph formatting and all unrelated package parts. The exported DOCX MUST contain those values after reopening.

#### Scenario: Reopen an exported company variant

- **WHEN** a generated DOCX is reopened after export
- **THEN** its title/header product model, footer product identifier, and footer company name match the reviewed model and selected company, and unchanged header/footer formatting remains template-equivalent
