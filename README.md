# enrich-csv

Enrich a CSV of companies with revenue, credit score, employees, and financial data. Powered by the [Score API](https://score.get-scala.com/api) — 272M+ companies from 265 countries.

**The Clearbit / ZoomInfo / D&B alternative that costs €0 to start.**

## Quick Start

```bash
npx enrich-csv leads.csv -o enriched.csv
```

That's it. No signup needed. Free tier: 50 lookups/month.

## Installation

```bash
npm install -g enrich-csv
```

Or use directly with `npx` (no install needed):

```bash
npx enrich-csv input.csv -o output.csv
```

## Usage

```bash
# Basic: enrich a CSV file
enrich-csv companies.csv -o enriched.csv

# Filter by country
enrich-csv leads.csv --country IT -o italian-leads.csv

# Specify which column contains company names
enrich-csv data.csv --column "Company Name" -o enriched.csv

# Choose which fields to add
enrich-csv leads.csv --fields revenue,score,grade,employees -o enriched.csv

# Use with API key for higher limits
enrich-csv leads.csv -k sk_live_your_key -o enriched.csv

# Pipe from stdin
cat companies.txt | enrich-csv - -o results.csv

# Dry run (see what would be enriched)
enrich-csv leads.csv --dry-run
```

## What Gets Added

For each company in your CSV, enrich-csv adds:

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

## API Pricing

| Plan | Lookups/month | Price |
|------|--------------|-------|
| Free | 50 | €0 |
| Starter | 500 | €19/mo |
| Growth | 5,000 | €49/mo |
| Enterprise | 50,000 | €149/mo |

Get your free API key: https://score.get-scala.com/api/free-key

## Data Coverage

272,116,630 companies across 265 countries. Top coverage:

🇧🇷 Brazil 47M · 🇺🇸 USA 39M · 🇦🇺 Australia 20M · 🇫🇷 France 17M · 🇬🇧 UK 14M · 🇩🇪 Germany 10M · 🇮🇳 India 8M · 🇯🇵 Japan 7M · 🇮🇹 Italy 6M · 🇪🇸 Spain 5M

## Related

- [Score API](https://score.get-scala.com/api) — Full REST API
- [scala-score](https://www.npmjs.com/package/scala-score) — Node.js SDK
- [scala-mcp-server](https://www.npmjs.com/package/scala-mcp-server) — MCP server for AI agents
- [Dataset on Kaggle](https://www.kaggle.com/datasets/yorkiealfbroth/global-company-data-994k) — Free 994K sample
- [Dataset on HuggingFace](https://huggingface.co/datasets/alf1990mi/global-company-database-1m) — Free 1M sample

## License

MIT — Built by [SCALA AI](https://get-scala.com)
