# LLM Descriptions in Bulgarian and English–Bulgarian LLM Terminology Dictionary

**Version:** 31 October 2026  
**Licence:** [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)  
**Search interface:** <https://ifgpt.dcl.bas.bg/llm-descriptions/>  
**Developed by:** Department of Computational Linguistics, Institute for Bulgarian Language "Prof. Lyubomir Andreychin", Bulgarian Academy of Sciences

This folder contains two linked resources:

1. **A catalogue of large language model (LLM) descriptions in Bulgarian** – 453 models from 38 model families and a group of 19 individual models, described under a common metadata schema.
2. **An English–Bulgarian terminology dictionary of LLM-related concepts** – 358 entries in nine thematic domains, with definitions in both languages, the verification status of each Bulgarian term and the sources that attest it.

The terms used in the descriptions are taken from the dictionary. In the search interface, the occurrences of dictionary terms in the descriptions are linked to their dictionary entries.

## Contents

```
LLMDescription-2026-10-31/
├── README.md
├── descriptions/
│   ├── llm_descriptions.tsv        all 453 descriptions in one file
│   ├── llm_descriptions.json       the same data in JSON (list fields as arrays)
│   └── by_family/                  one TSV file per model family (39 files; other_family.tsv = individual models)
└── dictionary/
    ├── LLM_Dictionary.xlsx         the complete dictionary (all sheets below)
    ├── dictionary.tsv              dictionary entries (358)
    ├── validation_sources.tsv      sources used to attest the Bulgarian terms, with type and strength
    ├── attested_variants.tsv       Bulgarian variants found in the sources
    ├── entry_notes.tsv             notes on individual entries (decisions and their reasons)
    └── change_log.tsv              log of changes to the dictionary
```

All text files are UTF-8, tab-separated, with a header row.

## 1. LLM descriptions

Each row describes one model release or size variant (e.g., *Llama 3.1 (8B)* and *Llama 3.1 (70B)* are separate entries). Descriptive values are in Bulgarian; English terms and abbreviations are given in brackets after the Bulgarian term. In the TSV files, list fields are separated by `|`.

| Field | Content |
|---|---|
| `family` | Model family (e.g., Llama, Gemma, Qwen, BgGPT; `Other` for individual models) |
| `name` | Display name including the size variant – unique identifier |
| `abbreviation` | Short name |
| `full_name` | Official identifier (technical report, API, Hugging Face) |
| `creator` | Developer(s) |
| `license` | Licence name, with conditions in brackets |
| `published_date` | Release date, `YYYY.MM.DD` (partial dates: `YYYY.MM`, `YYYY`) |
| `modality` | Input and output modalities in words |
| `input_modality_details`, `output_modality_details` | List of input / output types |
| `parameters` | Number of parameters (e.g., `8B`, `671B`) or `неоповестен` (not disclosed) |
| `parameters_description` | Details: total and active parameters, layers, training tokens |
| `architecture` | Architecture |
| `context_length` | Maximum context window |
| `includes_bulgarian` | Support for Bulgarian (see below) |
| `languages_description`, `languages_details` | Supported languages |
| `applications_description`, `applications_details` | Intended uses |
| `training_data` | Training data |
| `training_methods` | Training methods (pre-training, post-training, alignment) |
| `benchmarks_description`, `benchmarks_details` | Evaluation results |
| `unique_methods_description`, `unique_methods_details` | Distinctive methods and features |
| `publications_description`, `publications_details` | Primary sources; BibTeX records |
| `other_details` | Release notes, pricing, successor models, conflicting information |
| `fine_tuning` | Whether fine-tuning is permitted and under what licence |
| `base_model` | Base model for derived models |
| `url`, `ollama_link`, `github_link`, `huggingface_link` | Links |
| `chat_access`, `api_access`, `download_access` | `безплатен` (free), `платен` (paid), `не` (none) |
| `last_accessed` | Date of the last check of the sources |
| `verified` | `VERIFIED` (checked against primary sources) or `UNVERIFIED` |

**Values of `includes_bulgarian`:** `да+` – the model is focused on Bulgarian; `да` – Bulgarian is supported; `не` – not supported; `неизвестно` – not documented by the developer. A value may be followed by details in brackets, e.g., `да (ограничено)`.

Information that developers do not publish is recorded as `неоповестен` / `не е оповестено` (not disclosed) and is not estimated. When primary sources disagree, the values are given in `other_details` and the entry is marked `UNVERIFIED`.

## 2. Dictionary

| Field | Content |
|---|---|
| `ID` | Entry identifier (`domain.number`) |
| `Domain` | Thematic domain (English / Bulgarian) |
| `EN term` | English term |
| `EN abbreviation` | English abbreviation (only if available) |
| `EN URL` | Primary reference URL |
| `EN BibTeX` | Citation key of the defining publication |
| `EN Definition` | Definition in English |
| `BG term` | Preferred Bulgarian term; English abbreviation in brackets |
| `BG Status` | `потвърден` – attested in a Bulgarian source; `проверен` – proposed and verified by an expert; `*` – unverified |
| `BG sources` | Codes of the sources that attest the term (see `validation_sources.tsv`) |
| `BG URL` | URL of the first attesting source |
| `BG BibTeX` | Citation key of a Bulgarian source |
| `BG Definition` | Definition in Bulgarian |
| `BG variants` | Other Bulgarian forms that are attested or compete with the preferred term |
| `Indexing` | Models whose descriptions use the term (first 15) |
| `Frequency` | Number of models whose descriptions use the term |

**Status of the Bulgarian terms:** 111 attested (97 of them in at least one strong source), 194 proposed and verified by an expert, 53 unverified. Strong sources are university and research publications, official documents and legislation, Bulgarian technical documentation and reports for public bodies; weak sources are company glossaries, media, encyclopedias and project glossaries.

**Domains:** 1 Model architecture · 2 Parameters and scale · 3 Pre-training · 4 Post-training · 5 Inference and deployment · 6 Capabilities and modalities · 7 Evaluation · 8 Access, licensing and distribution · 9 General terms.

## Licence

The data are released under the [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/) licence. The model descriptions summarise and translate information published by the model developers; the original sources are given in each entry.

## Citation

If you use the data, please cite:

> Stoyanova, I. (2026). System for Describing Large Language Models in Bulgarian. *Data* (MDPI), under review.

## Funding

The work is funded by the project *IfGPT: Infrastructure for Fine-tuning Pre-trained Large Language Models*, Grant Agreement No. ПВУ-55 from 12.12.2024 (BG-RRP-2.017-0030-C01).

## Contact

Department of Computational Linguistics, Institute for Bulgarian Language, Bulgarian Academy of Sciences – <https://dcl.bas.bg>
