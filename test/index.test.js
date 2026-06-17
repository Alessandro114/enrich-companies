const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const {
  buildApiUrl,
  detectDelimiter,
  detectNameColumn,
  formatRevenue,
  parseCSVLine,
} = require('../index.js');

describe('detectNameColumn', () => {
  it('detects common company column names case-insensitively', () => {
    assert.equal(detectNameColumn(['Email', 'Company Name', 'Country']), 1);
    assert.equal(detectNameColumn(['Contact', 'azienda', 'Revenue']), 1);
  });

  it('falls back to the first column when no known name is present', () => {
    assert.equal(detectNameColumn(['Lead', 'Country']), 0);
  });
});

describe('formatRevenue', () => {
  it('formats revenue with compact euro suffixes', () => {
    assert.equal(formatRevenue(950), '€950');
    assert.equal(formatRevenue(12500), '€13K');
    assert.equal(formatRevenue(2500000), '€2.5M');
    assert.equal(formatRevenue(1200000000), '€1.2B');
  });

  it('returns an empty string for empty values', () => {
    assert.equal(formatRevenue(0), '');
    assert.equal(formatRevenue(null), '');
  });
});

describe('buildApiUrl', () => {
  it('constructs the search URL with encoded query and limit', () => {
    assert.equal(
      buildApiUrl('ACME & Sons', null, null, 3),
      'https://score.get-scala.com/api/search?q=ACME%20%26%20Sons&limit=3',
    );
  });

  it('adds optional country and key parameters', () => {
    assert.equal(
      buildApiUrl('Ferrero', 'IT', 'test-key', 1),
      'https://score.get-scala.com/api/search?q=Ferrero&limit=1&country=IT&key=test-key',
    );
  });
});

describe('CSV parsing', () => {
  it('detects comma, semicolon, and tab delimiters', () => {
    assert.equal(detectDelimiter('name,email,country'), ',');
    assert.equal(detectDelimiter('name;email;country'), ';');
    assert.equal(detectDelimiter('name\temail\tcountry'), '\t');
  });

  it('parses quoted CSV fields and escaped quotes', () => {
    assert.deepEqual(
      parseCSVLine('"ACME, Inc.","Jane ""JJ"" Doe",IT', ','),
      ['ACME, Inc.', 'Jane "JJ" Doe', 'IT'],
    );
  });
});
