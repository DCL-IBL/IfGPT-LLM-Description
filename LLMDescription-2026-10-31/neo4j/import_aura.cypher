// Import into Neo4j Aura with LOAD CSV (version 2026-10-31).
// Run each statement separately in the Aura query window (paste, then Run).
// BASE = https://raw.githubusercontent.com/DCL-IBL/IfGPT-LLM-Description/main/LLMDescription-2026-10-31/neo4j
// If the branch is not "main", change it in the URLs below.

// 1. Constraints
CREATE CONSTRAINT llm_name IF NOT EXISTS FOR (n:LLM) REQUIRE n.name IS UNIQUE;
CREATE CONSTRAINT term_id IF NOT EXISTS FOR (t:Term) REQUIRE t.id IS UNIQUE;
CREATE CONSTRAINT family_name IF NOT EXISTS FOR (f:Family) REQUIRE f.name IS UNIQUE;

// 2. LLM descriptions (453); list fields are stored as lists
LOAD CSV WITH HEADERS FROM 'https://raw.githubusercontent.com/DCL-IBL/IfGPT-LLM-Description/main/LLMDescription-2026-10-31/neo4j/llm_nodes.csv' AS row
MERGE (n:LLM {name: row.name})
SET n += apoc.map.clean(row, [], [''])
WITH n, row
UNWIND ['input_modality_details','output_modality_details','languages_details','applications_details','applications_details_linked','benchmarks_details','unique_methods_details','unique_methods_details_linked','publications_details'] AS k
CALL apoc.create.setProperty(n, k, CASE WHEN row[k] IS NULL OR row[k] = '' THEN null ELSE split(row[k], '§§') END) YIELD node
RETURN count(DISTINCT node) AS llm_nodes;

// 3. Dictionary terms (358)
LOAD CSV WITH HEADERS FROM 'https://raw.githubusercontent.com/DCL-IBL/IfGPT-LLM-Description/main/LLMDescription-2026-10-31/neo4j/term_nodes.csv' AS row
MERGE (t:Term {id: row.id})
SET t += apoc.map.clean(row, [], ['']), t.frequency = toInteger(row.frequency)
RETURN count(t) AS term_nodes;

// 4. Families
MATCH (n:LLM) MERGE (f:Family {name: n.family}) MERGE (n)-[:BELONGS_TO]->(f)
RETURN count(DISTINCT f) AS families;

// 5. Links between descriptions and terms (3902)
LOAD CSV WITH HEADERS FROM 'https://raw.githubusercontent.com/DCL-IBL/IfGPT-LLM-Description/main/LLMDescription-2026-10-31/neo4j/llm_term_links.csv' AS row
MATCH (n:LLM {name: row.model}) MATCH (t:Term {id: row.term})
MERGE (n)-[:MENTIONS_TERM]->(t)
RETURN count(*) AS links;

// 6. Check: expected LLM 453, Term 358, Family 39, MENTIONS_TERM 3902
MATCH (n) WHERE n:LLM OR n:Term OR n:Family RETURN labels(n) AS label, count(*) AS total;
MATCH ()-[r:MENTIONS_TERM]->() RETURN count(r) AS mentions_term;
