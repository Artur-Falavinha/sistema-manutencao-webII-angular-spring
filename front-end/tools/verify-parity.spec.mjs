import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { verifyParity } from './verify-parity.mjs';

const hash = (content) => createHash('sha256').update(content).digest('hex');
const canonicalHash = (content) => hash(content.replace(/\r\n/g, '\n'));

async function createFixture({
  content = 'export const value = 1;\n',
  destinationContent = content,
  filePath = 'src/example.ts',
  classification = 'IDENTICAL',
  reason,
  removalBy,
  visualTransform,
  referenceNormalizedSha256,
  finalFrontend = false,
  declared = true
} = {}) {
  const rootDir = await mkdtemp(path.join(tmpdir(), 'reference-parity-'));
  const destinationPath = path.join(rootDir, filePath);
  await mkdir(path.dirname(destinationPath), { recursive: true });
  await writeFile(destinationPath, destinationContent, 'utf8');

  const entry = {
    path: filePath,
    classification,
    referenceSha256: canonicalHash(content),
    expectedSha256: classification === 'IDENTICAL'
      ? canonicalHash(content)
      : canonicalHash(destinationContent)
  };

  if (reason) entry.reason = reason;
  if (removalBy) entry.removalBy = removalBy;
  if (visualTransform) entry.visualTransform = visualTransform;
  if (referenceNormalizedSha256) entry.referenceNormalizedSha256 = referenceNormalizedSha256;

  const manifest = {
    version: 1,
    reference: {
      repository: 'https://example.test/reference',
      commit: 'c6bf109951c06265cb6708c16676c297d0070161'
    },
    window: '2026-08-20',
    finalFrontend,
    files: declared ? [entry] : []
  };

  const manifestPath = path.join(rootDir, 'reference-parity.json');
  await writeFile(manifestPath, JSON.stringify(manifest), 'utf8');

  return { rootDir, manifestPath };
}

test('accepts a file identical to the reference hash', async () => {
  const fixture = await createFixture();
  const report = await verifyParity(fixture);

  assert.equal(report.counts.IDENTICAL, 1);
  assert.deepEqual(report.errors, []);
});

test('accepts CRLF checkout bytes when the canonical Git content uses LF', async () => {
  const fixture = await createFixture({
    content: 'export const value = 1;\n',
    destinationContent: 'export const value = 1;\r\n'
  });

  const report = await verifyParity(fixture);
  assert.equal(report.counts.IDENTICAL, 1);
});

test('rejects changed production TypeScript', async () => {
  const fixture = await createFixture({ destinationContent: 'export const value = 2;\n' });

  await assert.rejects(() => verifyParity(fixture), /hash.*src\/example\.ts/i);
});

test('rejects changed migrated HTML', async () => {
  const fixture = await createFixture({
    content: '<main>Original</main>\n',
    destinationContent: '<main>Alterado</main>\n',
    filePath: 'src/example.html'
  });

  await assert.rejects(() => verifyParity(fixture), /hash.*src\/example\.html/i);
});

test('accepts declared visual changes in CSS', async () => {
  const fixture = await createFixture({
    content: ':root { color: blue; }\n',
    destinationContent: ':root { color: orange; }\n',
    filePath: 'src/example.css',
    classification: 'VISUAL_ONLY',
    reason: 'Remapeamento exclusivo dos tokens visuais.'
  });

  const report = await verifyParity(fixture);
  assert.equal(report.counts.VISUAL_ONLY, 1);
});

test('accepts declared visual changes in image assets', async () => {
  const fixture = await createFixture({
    content: 'original-image',
    destinationContent: 'new-brand-image',
    filePath: 'src/assets/logo.png',
    classification: 'VISUAL_ONLY',
    reason: 'Substituicao exclusiva da identidade visual.'
  });

  const report = await verifyParity(fixture);
  assert.equal(report.counts.VISUAL_ONLY, 1);
});

test('accepts a declared brand rename in HTML', async () => {
  const referenceContent = '<img alt="Remont Logo"><p>Remont</p>\n';
  const destinationContent = '<img alt="Mant Logo"><p>Mant</p>\n';
  const normalizedContent = referenceContent.replace(/Remont|Mant/g, '{{BRAND_NAME}}');
  const fixture = await createFixture({
    content: referenceContent,
    destinationContent,
    filePath: 'src/example.html',
    classification: 'VISUAL_ONLY',
    reason: 'Troca exclusivamente apresentacional do nome da marca.',
    visualTransform: 'BRAND_RENAME',
    referenceNormalizedSha256: canonicalHash(normalizedContent)
  });

  const report = await verifyParity(fixture);
  assert.equal(report.counts.VISUAL_ONLY, 1);
});

test('rejects unrelated HTML changes declared as a brand rename', async () => {
  const referenceContent = '<p>Remont</p>\n';
  const normalizedContent = referenceContent.replace(/Remont|Mant/g, '{{BRAND_NAME}}');
  const fixture = await createFixture({
    content: referenceContent,
    destinationContent: '<button (click)="save()">Mant</button>\n',
    filePath: 'src/example.html',
    classification: 'VISUAL_ONLY',
    reason: 'Troca exclusivamente apresentacional do nome da marca.',
    visualTransform: 'BRAND_RENAME',
    referenceNormalizedSha256: canonicalHash(normalizedContent)
  });

  await assert.rejects(() => verifyParity(fixture), /diferença além da troca de marca/i);
});

test('rejects files not declared in the manifest', async () => {
  const fixture = await createFixture({ declared: false });

  await assert.rejects(() => verifyParity(fixture), /não declarado.*src\/example\.ts/i);
});

test('rejects a technical exception without a reason', async () => {
  const fixture = await createFixture({ classification: 'TECHNICAL_EXCEPTION' });

  await assert.rejects(() => verifyParity(fixture), /justificativa.*src\/example\.ts/i);
});

test('rejects a temporary scaffold without a removal date', async () => {
  const fixture = await createFixture({
    classification: 'TEMPORARY_SCAFFOLD',
    reason: 'Shell técnico temporário.'
  });

  await assert.rejects(() => verifyParity(fixture), /remoção.*src\/example\.ts/i);
});

test('rejects temporary scaffolds in the final frontend', async () => {
  const fixture = await createFixture({
    classification: 'TEMPORARY_SCAFFOLD',
    reason: 'Shell técnico temporário.',
    removalBy: '2026-08-27',
    finalFrontend: true
  });

  await assert.rejects(
    () => verifyParity({ ...fixture, today: '2026-08-27' }),
    /frontend final.*src\/example\.ts/i
  );
});

test('rejects a temporary scaffold after its removal deadline', async () => {
  const fixture = await createFixture({
    classification: 'TEMPORARY_SCAFFOLD',
    reason: 'Estrutura temporária da etapa atual.',
    removalBy: '2026-08-27'
  });

  await assert.rejects(
    () => verifyParity({ ...fixture, today: '2026-08-28' }),
    /prazo de remoção vencido.*src\/example\.ts/i
  );
});

test('rejects invalid Angular HTML', async () => {
  const fixture = await createFixture({
    content: '<main><span></main>\n',
    filePath: 'src/example.html'
  });

  await assert.rejects(() => verifyParity(fixture), /HTML inválido.*src\/example\.html/i);
});
