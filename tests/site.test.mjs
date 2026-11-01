import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = fileURLToPath(new URL('../', import.meta.url));
const pages = ['index.html', 'ranking.html', 'player.html', 'compare.html', 'stats.html', 'about.html'];
const attribute = (tag, name) => tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];

function assertLocalFile(relativePath, origin) {
  const target = path.resolve(path.dirname(origin), relativePath.split(/[?#]/)[0]);
  assert.ok(fs.existsSync(target), `Missing file: ${relativePath}`);
  // GitHub Pages is case-sensitive, unlike a typical Windows checkout.
  const directory = path.dirname(target);
  assert.ok(fs.readdirSync(directory).includes(path.basename(target)), `Wrong filename case: ${relativePath}`);
}

test('six pages have document metadata, landmarks, unique IDs and no development notices', () => {
  const titles = new Set();
  for (const page of pages) {
    const html = fs.readFileSync(path.join(root, page), 'utf8');
    assert.match(html, /<!DOCTYPE html>/i, page);
    assert.match(html, /<html lang="ru">/, page);
    assert.match(html, /<meta charset="UTF-8">/i, page);
    assert.match(html, /name="viewport"/, page);
    assert.match(html, /name="description"/, page);
    titles.add(html.match(/<title>([^<]+)<\/title>/)[1]);
    for (const tag of ['main', 'header', 'footer', 'h1']) {
      assert.equal((html.match(new RegExp(`<${tag}(?:\\s|>)`, 'g')) || []).length, 1, `${page}: ${tag}`);
    }
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
    assert.equal(ids.length, new Set(ids).size, `${page}: duplicate IDs`);
    assert.doesNotMatch(html, /Этап\s+\d|Раздел готовится|на следующем этапе|Здесь появятся|Prepared container/i, page);
  }
  assert.equal(titles.size, pages.length);
});

test('navigation is consistent and each page marks its own active section', () => {
  for (const page of pages) {
    const html = fs.readFileSync(path.join(root, page), 'utf8');
    const navigation = html.match(/<nav class="site-nav"[\s\S]*?<\/nav>/)[0];
    const links = [...navigation.matchAll(/<a\b[^>]*>/g)].map((match) => match[0]);
    assert.deepEqual(links.map((link) => attribute(link, 'href')), pages);
    assert.equal(links.filter((link) => attribute(link, 'aria-current') === 'page').length, 1);
    assert.equal(attribute(links.find((link) => attribute(link, 'aria-current') === 'page'), 'href'), page);
  }
});

test('local references, anchors and ARIA relationships resolve', () => {
  for (const page of pages) {
    const origin = path.join(root, page);
    const html = fs.readFileSync(origin, 'utf8');
    const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
    for (const [, url] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (url.startsWith('#')) assert.ok(ids.has(url.slice(1)), `${page}: ${url}`);
      else if (!/^(?:https?:|mailto:)/.test(url)) assertLocalFile(url, origin);
    }
    for (const [, references] of html.matchAll(/aria-(?:labelledby|describedby|controls)="([^"]+)"/g)) {
      for (const id of references.split(/\s+/)) assert.ok(ids.has(id), `${page}: ARIA ${id}`);
    }
  }
});

test('visible search and selection fields have explicit labels', () => {
  for (const page of pages) {
    const html = fs.readFileSync(path.join(root, page), 'utf8');
    const labels = new Set([...html.matchAll(/<label\b[^>]*for="([^"]+)"[^>]*>[^<]+<\/label>/g)].map((match) => match[1]));
    for (const [tag] of html.matchAll(/<(?:input|select)\b[^>]*>/g)) {
      if (attribute(tag, 'type') === 'hidden') continue;
      const id = attribute(tag, 'id');
      assert.ok(id && labels.has(id), `${page}: unlabeled field ${id}`);
    }
  }
});

test('JavaScript module imports point to existing local files', () => {
  for (const file of fs.readdirSync(path.join(root, 'js')).filter((name) => name.endsWith('.js'))) {
    const origin = path.join(root, 'js', file);
    const source = fs.readFileSync(origin, 'utf8');
    for (const [, reference] of source.matchAll(/from\s+['"]([^'"]+)['"]/g)) assertLocalFile(reference, origin);
  }
});

// Exercise the existing private UI helper without changing production data or
// introducing a browser dependency. The fixture models only its DOM surface.
function disclosureFixture(count, limit, noun) {
  const source = fs.readFileSync(path.join(root, 'js/stats.js'), 'utf8').replaceAll('\r\n', '\n');
  const definition = source.match(/function createDistributionDisclosure\([\s\S]*?\n}\n/)[0];
  const createDisclosure = vm.runInNewContext(`(${definition})`);
  const list = { children: Array.from({ length: count }, (_, index) => ({ hidden: false, index })) };
  const listeners = new Map();
  const attributes = new Map();
  const button = {
    parentElement: { hidden: false },
    textContent: '',
    addEventListener: (name, callback) => listeners.set(name, callback),
    setAttribute: (name, value) => attributes.set(name, value),
    scrollIntoView: () => {},
  };
  const update = createDisclosure(list, button, limit, noun);
  return { list, button, update, attributes, click: () => listeners.get('click')() };
}

test('country/team disclosures respect their thresholds and preserve row identities', () => {
  for (const [count, limit, noun] of [[6, 6, 'команд'], [7, 6, 'команд'], [8, 8, 'стран'], [18, 8, 'стран']]) {
    const fixture = disclosureFixture(count, limit, noun);
    const { list, button, attributes } = fixture;
    const originalRows = [...list.children];
    assert.equal(list.children.filter((row) => !row.hidden).length, Math.min(count, limit));
    assert.equal(button.parentElement.hidden, count <= limit);
    if (count <= limit) continue;
    assert.equal(button.textContent, `Показать все ${count} ${noun}`);
    fixture.click();
    assert.equal(list.children.filter((row) => !row.hidden).length, count);
    assert.equal(button.textContent, 'Свернуть');
    assert.equal(attributes.get('aria-expanded'), 'true');
    fixture.click();
    assert.equal(list.children.filter((row) => !row.hidden).length, limit);
    assert.equal(attributes.get('aria-expanded'), 'false');
    assert.ok(list.children.every((row, index) => row === originalRows[index]));
  }
});

test('expanded team disclosure survives a new sort order and collapses the new first six', () => {
  const fixture = disclosureFixture(7, 6, 'команд');
  fixture.click();
  fixture.list.children.reverse();
  fixture.update();
  assert.equal(fixture.attributes.get('aria-expanded'), 'true');
  assert.ok(fixture.list.children.every((row) => !row.hidden));
  fixture.click();
  assert.deepEqual(fixture.list.children.filter((row) => !row.hidden).map((row) => row.index), [6, 5, 4, 3, 2, 1]);
  assert.equal(fixture.list.children[6].hidden, true);
});
