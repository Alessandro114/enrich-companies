# enrich-companies

[![npm version](https://img.shields.io/npm/v/enrich-companies.svg)](https://www.npmjs.com/package/enrich-companies)
[![npm downloads](https://img.shields.io/npm/dm/enrich-companies.svg)](https://www.npmjs.com/package/enrich-companies)
[![license](https://img.shields.io/npm/l/enrich-companies.svg)](https://github.com/Alessandro114/enrich-companies/blob/master/LICENSE)
[![node version](https://img.shields.io/node/v/enrich-companies.svg)](https://nodejs.org)

Enrich a CSV of companies with revenue, credit score, employees, and financial data. Powered by the [Score API](https://score.get-scala.com/api) — 250M+ companies from 40+ countries.

```bash
npx enrich-companies leads.csv -o enriched.csv
```

That's it. No signup needed. Free tier: 50 lookups/month.

## Why?

ZoomInfo costs $15,000/yr. Clearbit is dead. D&B charges per lookup. This tool is free for 50 lookups/month.

| | enrich-companies | ZoomInfo | Clearbit | D&B |
|---|---|---|---|---|
| Price to start | **$0** | $15,000/yr | Shut down | Per-lookup |
| Company records | **250M+** | ~100M | Was ~44M | ~500M |
| Signup required | **No** | Yes | N/A | Yes |
| Self-hosted option | **Yes** | No | N/A | No |
| Open source | **Yes** | No | No | No |

## How It Works

1 command. 0 dependencies. Calls the [Score API](https://score.get-scala.com/api) (250M+ companies, 40+ countries). No signup needed.

1. You pass a CSV with a column of company names
2. Each name is looked up against the Score database
3. Matched records are appended as new columns to your CSV
4. Output goes to a file or stdout

## Installation

```bash
npm install -g enrich-companies
```

Or use directly with `npx` (no install needed):

```bash
npx enrich-companies input.csv -o output.csv
```

## Usage

```bash
# Basic: enrich a CSV file
enrich-companies companies.csv -o enriched.csv

# Filter by country
enrich-companies leads.csv --country IT -o italian-leads.csv

# Specify which column contains company names
enrich-companies data.csv --column "Company Name" -o enriched.csv

# Choose which fields to add
enrich-companies leads.csv --fields revenue,score,grade,employees -o enriched.csv

# Use with API key for higher limits
enrich-companies leads.csv -k sk_live_your_key -o enriched.csv

# Pipe from stdin
cat companies.txt | enrich-companies - -o results.csv

# Dry run (see what would be enriched)
enrich-companies leads.csv --dry-run
```

## What Gets Added

For each company in your CSV, enrich-companies adds:

| Field | Description |
|-------|-------------|
| `score_revenue` | Annual revenue (EUR) |
| `score_employees` | Employee count |
| `score_score` | Credit score 0-100 |
| `score_grade` | Letter grade (AA to E) |
| `score_country` | ISO country code |
| `score_city` | City |
| `score_sector_desc` | Industry description |

## Example

**Input (leads.csv):**
```csv
Company,Contact,Email
Tesla,John,john@tesla.com
Ferrero,Maria,maria@ferrero.com
SAP,Hans,hans@sap.com
```

**Output (enriched.csv):**
```csv
Company,Contact,Email,score_revenue,score_employees,score_score,score_grade,score_country,score_city,score_sector_desc
Tesla,John,john@tesla.com,96773000000,140000,85,A,US,Austin,Motor Vehicle Manufacturing
Ferrero,Maria,maria@ferrero.com,19300000000,48697,75,BBB,IT,Alba,Food Manufacturing
SAP,Hans,hans@sap.com,35000000000,107000,88,A,DE,Walldorf,Software Publishing
```

## Data Coverage

250M+ companies across 40+ countries. Top coverage:

Brazil 47M | USA 39M | Australia 20M | France 17M | UK 14M | Germany 10M | India 8M | Japan 7M | Italy 6M | Spain 5M

## Contributing

Found a bug? Want a feature? [Open an issue](https://github.com/Alessandro114/enrich-companies/issues).

Pull requests welcome — especially for new column auto-detection patterns and output format options.

## Related

- [Score API](https://score.get-scala.com/api) — Full REST API
- [scala-score](https://www.npmjs.com/package/scala-score) — Node.js SDK
- [scala-mcp-server](https://www.npmjs.com/package/scala-mcp-server) — MCP server for AI agents
- [Dataset on Kaggle](https://www.kaggle.com/datasets/yorkiealfbroth/global-company-data-994k) — Free 994K sample
- [Dataset on HuggingFace](https://huggingface.co/datasets/alf1990mi/global-company-database-1m) — Free 1M sample

## License

MIT — Built by [SCALA AI](https://get-scala.com)
