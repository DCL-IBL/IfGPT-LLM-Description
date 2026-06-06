# IfGPT-LLM-Description

## Objective of the IfGPT project

The project aims to develop a freely accessible infrastructure for the selection and pre-processing of large datasets for Bulgarian as well as tailored data for particular industries and fine-tuning suitable freely available large language models for specific purposes.

## IfGPT-LLM Description

A structured knowledge base of Large Language Models (LLMs) stored in a Neo4j graph database. The dataset captures rich descriptive metadata for each model – from architecture and training methods to access types and language support, and provides ready-to-use tools to query and visualise it.


- **Metadata schema** — full property definitions for LLM nodes (types, index status, relationships) as returned by `apoc.meta.schema()`
- **Cypher queries** — annotated `.cypher` file covering initialisation, filtering, pagination, export, and ad-hoc reporting queries
- **JavaScript code** — a browser-based search and visualisation interface connecting directly to the Neo4j instance via the official JS driver

__________________________________________

This work is part of the project **Infrastructure for Fine-tuning Pre-trained Large Language Models**, Grant Agreement No. ПВУ – 55 from 12.12.2024 /BG-RRP-2.017-0030-C01/.

https://ifgpt.dcl.bas.bg/en/
