// =============================================================================
// IfGPT — Neo4j Cypher Queries
// Database: neo4j+s://8fab59d8.databases.neo4j.io
// Node label: LLM
// All queries filter on n.verified IN ['VERIFIED'] unless stated otherwise
// =============================================================================


// =============================================================================
// SECTION 1 — INITIALISATION QUERIES (run on page load)
// =============================================================================

// 1.1 — Load all distinct model families for the Family checkbox list.
//        Results are sorted alphabetically; UI moves "Other" to the end.
MATCH (n:LLM)
WHERE n.verified IN ['VERIFIED']
RETURN DISTINCT n.family AS fam
ORDER BY fam;


// 1.2 — Load all distinct license strings so they can be grouped into
//        display categories (MIT, Apache, Creative Commons, Свободен, Платен, Друг…).
//        The classification is done in JavaScript (classifyLicense function),
//        not inside Cypher, so raw strings are returned here.
MATCH (n:LLM)
WHERE n.verified IN ['VERIFIED']
  AND n.license IS NOT NULL
RETURN DISTINCT n.license AS lic;


// 1.3 — Load all model names and their parameter counts for the
//        "Model name" dropdown (<select>).
//        Ordered by family then name so the list is grouped visually.
MATCH (n:LLM)
WHERE n.verified IN ['VERIFIED']
RETURN n.name AS name, n.parameters AS params
ORDER BY n.family, n.name;


// =============================================================================
// SECTION 2 — COUNT QUERY (run before fetching the first results page)
// =============================================================================

// 2.1 — Count total LLM nodes that match the current filter combination.
//        The WHERE clause is built dynamically in JavaScript (buildQuery).
//        This drives the "Намерени модела" stat and pagination calculations.
MATCH (n:LLM)
WHERE
  -- always applied --
  n.verified IN ['VERIFIED']

  -- FILTER: family (multi-select checkboxes) --
  -- AND n.family IN $families

  -- FILTER: model name (dropdown exact/contains match) --
  -- AND toLower(n.name) CONTAINS toLower($name)

  -- FILTER: license group (OR across selected groups) --
  -- AND (
  --   toLower(n.license) CONTAINS toLower($lic0)
  --   OR toLower(n.license) CONTAINS toLower($lic1)
  -- )

  -- FILTER: download / API access (checks link fields) --
  -- AND (
  --   n.ollama_link IS NOT NULL
  --   OR n.huggingface_link IS NOT NULL
  --   OR n.github_link IS NOT NULL
  -- )

  -- FILTER: chat access (stored as plain string in property) --
  -- AND n.chat_access IN ['безплатен', 'платен', 'не']

  -- FILTER: API access (stored as plain string in property) --
  -- AND n.api_access IN ['безплатен', 'платен', 'не']

  -- FILTER: download access (stored as plain string in property) --
  -- AND n.download_access IN ['безплатен', 'платен', 'не']

  -- FILTER: input modality (list property, OR across selected values) --
  -- AND (
  --   $mod0 IN n.input_modality_details
  --   OR $mod1 IN n.input_modality_details
  -- )

  -- FILTER: output modality (list property, OR across selected values) --
  -- AND (
  --   $omod0 IN n.output_modality_details
  --   OR $omod1 IN n.output_modality_details
  -- )

  -- FILTER: model size by parameter count (OR across selected bands) --
  -- very-small: under 1B
  -- AND (
  --   n.parameters IS NOT NULL
  --   AND toFloat(replace(replace(n.parameters,'B',''),'T','')) < 1
  --   AND NOT n.parameters ENDS WITH 'T'
  -- )
  -- small: 1B – 7B
  -- AND (
  --   n.parameters IS NOT NULL
  --   AND toFloat(replace(n.parameters,'B','')) >= 1
  --   AND toFloat(replace(n.parameters,'B','')) < 7
  --   AND NOT n.parameters ENDS WITH 'T'
  -- )
  -- medium: 7B – 70B
  -- AND (
  --   n.parameters IS NOT NULL
  --   AND toFloat(replace(n.parameters,'B','')) >= 7
  --   AND toFloat(replace(n.parameters,'B','')) < 70
  --   AND NOT n.parameters ENDS WITH 'T'
  -- )
  -- large: 70B – 400B
  -- AND (
  --   n.parameters IS NOT NULL
  --   AND toFloat(replace(n.parameters,'B','')) >= 70
  --   AND toFloat(replace(n.parameters,'B','')) < 400
  --   AND NOT n.parameters ENDS WITH 'T'
  -- )
  -- very-large: over 400B or expressed in trillions (T)
  -- AND (
  --   n.parameters IS NOT NULL
  --   AND (
  --     n.parameters ENDS WITH 'T'
  --     OR toFloat(replace(n.parameters,'B','')) >= 400
  --   )
  -- )

  -- FILTER: publication year range --
  -- published_date stores a human-readable string; year is extracted from
  -- the last 4 characters (e.g. "March 2024" → 2024)
  -- AND toInteger(substring(n.published_date, size(n.published_date)-4, 4)) >= $yf
  -- AND toInteger(substring(n.published_date, size(n.published_date)-4, 4)) <= $yt

  -- FILTER: Bulgarian language support --
  -- AND (
  --   toLower(n.includes_bulgarian) CONTAINS 'да'
  --   OR toLower(n.includes_bulgarian) CONTAINS 'yes'
  -- )

RETURN count(n) AS total;


// =============================================================================
// SECTION 3 — PAGINATED RESULTS QUERY (run on every page change)
// =============================================================================

// 3.1 — Fetch one page of LLM nodes matching all active filters.
//        $skip = (currentPage - 1) * 15
//        $limit = 15  (PAGE_SIZE constant)
//        Results are sorted by family then name.
//        The full node is returned; all property rendering is done in JavaScript.
MATCH (n:LLM)
WHERE
  n.verified IN ['VERIFIED']
  -- <same dynamic conditions as Section 2>
RETURN n
ORDER BY n.family, n.name
SKIP $skip
LIMIT $limit;


// =============================================================================
// SECTION 4 — JSON EXPORT QUERY (run in batches of 100 for full export)
// =============================================================================

// 4.1 — Same shape as the paginated query but with a larger batch size (100).
//        Called in a loop until all matching nodes are fetched.
//        Integer properties (Neo4j Long) are converted to JS numbers client-side.
MATCH (n:LLM)
WHERE
  n.verified IN ['VERIFIED']
  -- <same dynamic conditions as Section 2>
RETURN n
ORDER BY n.family, n.name
SKIP $skip
LIMIT $limit;   -- $limit = 100 during export


// =============================================================================
// SECTION 5 — STANDALONE / AD-HOC QUERIES (useful for debugging or reporting)
// =============================================================================

// 5.1 — Return all properties of every verified LLM as a flat map.
//        Useful for a quick full-dump without pagination.
MATCH (n:LLM)
WHERE n.verified IN ['VERIFIED']
RETURN properties(n) AS props
ORDER BY n.family, n.name;


// 5.2 — Count verified LLMs grouped by model family.
MATCH (n:LLM)
WHERE n.verified IN ['VERIFIED']
RETURN n.family AS family, count(n) AS total
ORDER BY total DESC;


// 5.3 — Count verified LLMs grouped by license string.
MATCH (n:LLM)
WHERE n.verified IN ['VERIFIED']
RETURN n.license AS license, count(n) AS total
ORDER BY total DESC;


// 5.4 — Count verified LLMs grouped by chat access type.
MATCH (n:LLM)
WHERE n.verified IN ['VERIFIED']
RETURN n.chat_access AS chat_access, count(n) AS total
ORDER BY total DESC;


// 5.5 — Count verified LLMs that include Bulgarian language support.
MATCH (n:LLM)
WHERE n.verified IN ['VERIFIED']
  AND (
    toLower(n.includes_bulgarian) CONTAINS 'да'
    OR toLower(n.includes_bulgarian) CONTAINS 'yes'
  )
RETURN count(n) AS total_with_bulgarian;


// 5.6 — List all verified LLMs that have an Ollama link (downloadable locally).
MATCH (n:LLM)
WHERE n.verified IN ['VERIFIED']
  AND n.ollama_link IS NOT NULL
RETURN n.name, n.family, n.parameters, n.ollama_link
ORDER BY n.family, n.name;


// 5.7 — List verified LLMs with a HuggingFace link.
MATCH (n:LLM)
WHERE n.verified IN ['VERIFIED']
  AND n.huggingface_link IS NOT NULL
RETURN n.name, n.family, n.parameters, n.huggingface_link
ORDER BY n.family, n.name;


// 5.8 — List verified LLMs published in a specific year (e.g. 2024).
MATCH (n:LLM)
WHERE n.verified IN ['VERIFIED']
  AND toInteger(substring(n.published_date, size(n.published_date)-4, 4)) = 2024
RETURN n.name, n.family, n.published_date
ORDER BY n.published_date;


// 5.9 — List all verified multimodal LLMs (accept image as input).
MATCH (n:LLM)
WHERE n.verified IN ['VERIFIED']
  AND 'изображение' IN n.input_modality_details
RETURN n.name, n.family, n.input_modality_details
ORDER BY n.family, n.name;


// 5.10 — List small verified models (1B–7B) with a free chat interface.
MATCH (n:LLM)
WHERE n.verified IN ['VERIFIED']
  AND n.parameters IS NOT NULL
  AND toFloat(replace(n.parameters,'B','')) >= 1
  AND toFloat(replace(n.parameters,'B','')) < 7
  AND NOT n.parameters ENDS WITH 'T'
  AND n.chat_access = 'безплатен'
RETURN n.name, n.family, n.parameters, n.chat_access
ORDER BY toFloat(replace(n.parameters,'B',''));


// 5.11 — Return the full property set for a single LLM by exact name.
//         Useful for inspecting one record in detail.
MATCH (n:LLM)
WHERE n.name = 'Llama 3.1'   -- replace with target model name
RETURN properties(n);


// 5.12 — Find verified LLMs whose license is openly permissive
//         (MIT, Apache, OpenRAIL, or contains 'open'/'free').
MATCH (n:LLM)
WHERE n.verified IN ['VERIFIED']
  AND (
    toLower(n.license) CONTAINS 'mit'
    OR toLower(n.license) CONTAINS 'apache'
    OR toLower(n.license) CONTAINS 'openrail'
    OR toLower(n.license) CONTAINS 'open'
    OR toLower(n.license) CONTAINS 'free'
  )
RETURN n.name, n.family, n.license
ORDER BY n.license, n.name;


// 5.13 — Find verified LLMs that support both free API and free download.
MATCH (n:LLM)
WHERE n.verified IN ['VERIFIED']
  AND n.api_access = 'безплатен'
  AND n.download_access = 'безплатен'
RETURN n.name, n.family, n.api_access, n.download_access
ORDER BY n.family, n.name;


// 5.14 — Distribution of verified LLMs by parameter size band.
//         Mirrors the five size categories in the UI filter.
MATCH (n:LLM)
WHERE n.verified IN ['VERIFIED']
  AND n.parameters IS NOT NULL
RETURN
  CASE
    WHEN n.parameters ENDS WITH 'T'
         OR toFloat(replace(n.parameters,'B','')) >= 400
      THEN 'very-large (>400B / T)'
    WHEN toFloat(replace(n.parameters,'B','')) >= 70
         AND toFloat(replace(n.parameters,'B','')) < 400
      THEN 'large (70B–400B)'
    WHEN toFloat(replace(n.parameters,'B','')) >= 7
         AND toFloat(replace(n.parameters,'B','')) < 70
      THEN 'medium (7B–70B)'
    WHEN toFloat(replace(n.parameters,'B','')) >= 1
         AND toFloat(replace(n.parameters,'B','')) < 7
      THEN 'small (1B–7B)'
    ELSE 'very-small (<1B)'
  END AS size_band,
  count(n) AS total
ORDER BY total DESC;
