#!/usr/bin/env node

const fs = require('fs');
const https = require('https');
const path = require('path');

const VERSION = '1.0.0';
const API_BASE = 'https://score.get-scala.com/api/search';
const RATE_LIMIT_MS = 200;

function usage() {
  console.log(`
enrich-companies v${VERSION} — Enrich company data from 250M+ businesses

USAGE:
  enrich-companies input.csv [options]
  cat companies.csv | enrich-companies - [options]

OPTIONS:
  -o, --output FILE    Output file (default: stdout)
  -k, --key KEY        Score API key (or set SCORE_API_KEY env var)
  -c, --column NAME    Column name containing company names (default: auto-detect)
  --country CC         Filter by ISO country code (e.g., IT, US, DE)
  --delimiter CHAR     CSV delimiter (default: auto-detect , or ;)
  --format FORMAT      Output format: csv or json (default: csv)
  --limit N            Max results per lookup (default: 1)
  --fields FIELDS      Fields to add (default: revenue,employees,score,grade,country,city,sector_desc)
  --dry-run            Show what would be enriched without calling API
  -h, --help           Show this help
  -v, --version        Show version

EXAMPLES:
  enrich-companies leads.csv -o enriched.csv
  enrich-companies leads.csv --country IT --key sk_live_xxx
  enrich-companies leads.csv --format json -o enriched.json
  enrich-companies leads.csv --column "Company Name" --fields revenue,score,grade
  cat names.txt | enrich-companies - -o results.csv

FREE TIER: 50 lookups/month (no key needed)
Get API key: https://score.get-scala.com/api/free-key
More info: https://score.get-scala.com/api
`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    input: null,
    output: null,
    key: process.env.SCORE_API_KEY || null,
    column: null,
    country: null,
    delimiter: null,
    format: 'csv',
    limit: 1,
    fields: ['revenue', 'employees', 'score', 'grade', 'country', 'city', 'sector_desc'],
    dryRun: false,
  };

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '-h' || a === '--help') { usage(); process.exit(0); }
    if (a === '-v' || a === '--version') { console.log(VERSION); process.exit(0); }
    if (a === '-o' || a === '--output') { opts.output = args[++i]; continue; }
    if (a === '-k' || a === '--key') { opts.key = args[++i]; continue; }
    if (a === '-c' || a === '--column') { opts.column = args[++i]; continue; }
    if (a === '--country') { opts.country = args[++i]; continue; }
    if (a === '--delimiter') { opts.delimiter = args[++i]; continue; }
    if (a === '--format') { opts.format = args[++i]; continue; }
    if (a === '--limit') { opts.limit = parseInt(args[++i], 10); continue; }
    if (a === '--fields') { opts.fields = args[++i].split(','); continue; }
    if (a === '--dry-run') { opts.dryRun = true; continue; }
    if (!opts.input) { opts.input = a; continue; }
  }

  return opts;
}

function validateFormat(format) {
  if (format === 'csv' || format === 'json') return format;
  console.error(`Error: unsupported format "${format}". Use "csv" or "json".`);
  process.exit(1);
}

function detectDelimiter(line) {
  const semicolons = (line.match(/;/g) || []).length;
  const commas = (line.match(/,/g) || []).length;
  const tabs = (line.match(/\t/g) || []).length;
  if (tabs > commas && tabs > semicolons) return '\t';
  if (semicolons > commas) return ';';
  return ',';
}

function parseCSVLine(line, delimiter) {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (c === delimiter && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += c;
    }
  }
  fields.push(current.trim());
  return fields;
}

function escapeCSV(val, delimiter) {
  if (val == null) return '';
  const s = String(val);
  if (s.includes(delimiter) || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function rowToObject(headers, row) {
  const obj = {};
  headers.forEach((header, idx) => {
    obj[header] = row[idx] != null ? row[idx] : '';
  });
  return obj;
}

function detectNameColumn(headers) {
  const patterns = [
    /^company$/i, /^company.?name$/i, /^name$/i, /^business$/i,
    /^business.?name$/i, /^organization$/i, /^org$/i, /^azienda$/i,
    /^ragione.?sociale$/i, /^empresa$/i, /^entreprise$/i, /^firma$/i,
    /^unternehmen$/i, /^nome$/i, /^denominazione$/i,
  ];

  for (const p of patterns) {
    const idx = headers.findIndex(h => p.test(h));
    if (idx >= 0) return idx;
  }
  return 0;
}

function apiSearch(query, country, key, limit) {
  return new Promise((resolve, reject) => {
    let url = `${API_BASE}?q=${encodeURIComponent(query)}&limit=${limit}`;
    if (country) url += `&country=${country}`;
    if (key) url += `&key=${key}`;

    https.get(url, { headers: { 'User-Agent': `enrich-companies/${VERSION}` } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.results && json.results.length > 0) {
            resolve(json.results[0]);
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function formatRevenue(val) {
  if (!val || val === 0) return '';
  if (val >= 1e9) return `€${(val / 1e9).toFixed(1)}B`;
  if (val >= 1e6) return `€${(val / 1e6).toFixed(1)}M`;
  if (val >= 1e3) return `€${(val / 1e3).toFixed(0)}K`;
  return `€${val}`;
}

async function main() {
  const opts = parseArgs();
  opts.format = validateFormat(opts.format);

  if (!opts.input) {
    console.error('Error: no input file specified. Use --help for usage.');
    process.exit(1);
  }

  let inputData;
  if (opts.input === '-') {
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    inputData = Buffer.concat(chunks).toString('utf-8');
  } else {
    if (!fs.existsSync(opts.input)) {
      console.error(`Error: file not found: ${opts.input}`);
      process.exit(1);
    }
    inputData = fs.readFileSync(opts.input, 'utf-8');
  }

  const lines = inputData.split('\n').filter(l => l.trim());
  if (lines.length < 2) {
    console.error('Error: CSV must have a header row and at least one data row.');
    process.exit(1);
  }

  const delimiter = opts.delimiter || detectDelimiter(lines[0]);
  const headers = parseCSVLine(lines[0], delimiter);
  const nameColIdx = opts.column
    ? headers.findIndex(h => h.toLowerCase() === opts.column.toLowerCase())
    : detectNameColumn(headers);

  if (nameColIdx < 0) {
    console.error(`Error: column "${opts.column}" not found. Available: ${headers.join(', ')}`);
    process.exit(1);
  }

  const enrichedHeaders = [...headers, ...opts.fields.map(f => `score_${f}`)];
  const outputLines = [enrichedHeaders.map(h => escapeCSV(h, delimiter)).join(delimiter)];
  const outputObjects = [];

  const total = lines.length - 1;
  let enriched = 0;
  let notFound = 0;

  process.stderr.write(`\nEnriching ${total} companies from column "${headers[nameColIdx]}"...\n`);
  if (!opts.key) {
    process.stderr.write('No API key — using free tier (50 lookups/month)\n');
    process.stderr.write('Get unlimited: https://score.get-scala.com/api/free-key\n');
  }
  process.stderr.write('\n');

  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i], delimiter);
    const companyName = row[nameColIdx];

    if (!companyName || !companyName.trim()) {
      const emptyRow = [...row, ...opts.fields.map(() => '')];
      outputLines.push(emptyRow.map(v => escapeCSV(v, delimiter)).join(delimiter));
      outputObjects.push(rowToObject(enrichedHeaders, emptyRow));
      continue;
    }

    process.stderr.write(`  [${i}/${total}] ${companyName.substring(0, 40).padEnd(40)} `);

    if (opts.dryRun) {
      process.stderr.write('(dry run)\n');
      const emptyRow = [...row, ...opts.fields.map(() => '')];
      outputLines.push(emptyRow.map(v => escapeCSV(v, delimiter)).join(delimiter));
      outputObjects.push(rowToObject(enrichedHeaders, emptyRow));
      continue;
    }

    const result = await apiSearch(companyName, opts.country, opts.key, opts.limit);

    if (result) {
      enriched++;
      const enrichedValues = opts.fields.map(f => {
        if (f === 'revenue') return result.revenue || '';
        return result[f] != null ? result[f] : '';
      });
      const enrichedRow = [...row, ...enrichedValues];
      outputLines.push(enrichedRow.map(v => escapeCSV(v, delimiter)).join(delimiter));
      outputObjects.push(rowToObject(enrichedHeaders, enrichedRow));
      process.stderr.write(`✓ ${result.name} (${result.country}) rev=${formatRevenue(result.revenue)}\n`);
    } else {
      notFound++;
      const emptyRow = [...row, ...opts.fields.map(() => '')];
      outputLines.push(emptyRow.map(v => escapeCSV(v, delimiter)).join(delimiter));
      outputObjects.push(rowToObject(enrichedHeaders, emptyRow));
      process.stderr.write('✗ not found\n');
    }

    await sleep(RATE_LIMIT_MS);
  }

  const output = opts.format === 'json'
    ? JSON.stringify(outputObjects, null, 2) + '\n'
    : outputLines.join('\n') + '\n';

  if (opts.output) {
    fs.writeFileSync(opts.output, output, 'utf-8');
    process.stderr.write(`\nDone! ${enriched}/${total} enriched, ${notFound} not found.\n`);
    process.stderr.write(`Output: ${opts.output}\n`);
  } else {
    process.stdout.write(output);
    process.stderr.write(`\n${enriched}/${total} enriched, ${notFound} not found.\n`);
  }

  process.stderr.write(`\n--- Score API by SCALA AI ---\n`);
  process.stderr.write(`250M+ companies | 40+ countries | Free tier available\n`);
  process.stderr.write(`https://score.get-scala.com/api\n\n`);
}

main().catch(e => { console.error(`Fatal: ${e.message}`); process.exit(1); });
