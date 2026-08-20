import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseTemplate } from '@angular/compiler';

const CLASSIFICATIONS = [
  'IDENTICAL',
  'VISUAL_ONLY',
  'TECHNICAL_EXCEPTION',
  'TEMPORARY_SCAFFOLD',
  'FORBIDDEN_DIFFERENCE'
];

const IGNORED_DIRECTORIES = new Set([
  '.angular',
  'coverage',
  'dist',
  'node_modules',
  'out-tsc',
  'tmp'
]);

const BINARY_EXTENSIONS = new Set([
  '.gif',
  '.ico',
  '.jpeg',
  '.jpg',
  '.pdf',
  '.png',
  '.webp',
  '.woff',
  '.woff2'
]);

const normalizePath = (filePath) => filePath.split(path.sep).join('/');

function sha256(content, filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const canonicalContent = BINARY_EXTENSIONS.has(extension)
    ? content
    : Buffer.from(content.toString('utf8').replace(/\r\n/g, '\n'), 'utf8');

  return createHash('sha256').update(canonicalContent).digest('hex');
}

async function listFiles(rootDir, relativeDirectory = '') {
  const directory = path.join(rootDir, relativeDirectory);
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const relativePath = path.join(relativeDirectory, entry.name);

    if (entry.isDirectory()) {
      if (!IGNORED_DIRECTORIES.has(entry.name)) {
        files.push(...await listFiles(rootDir, relativePath));
      }
      continue;
    }

    if (entry.isFile() && normalizePath(relativePath) !== 'reference-parity.json') {
      files.push(normalizePath(relativePath));
    }
  }

  return files.sort();
}

function validateManifestEntry(entry, finalFrontend, errors) {
  if (!CLASSIFICATIONS.includes(entry.classification)) {
    errors.push(`Classificação inválida em ${entry.path}.`);
    return;
  }

  if (!entry.expectedSha256) {
    errors.push(`Hash esperado ausente em ${entry.path}.`);
  }

  if (entry.classification === 'IDENTICAL') {
    if (!entry.referenceSha256) {
      errors.push(`Hash da referência ausente em ${entry.path}.`);
    } else if (entry.referenceSha256 !== entry.expectedSha256) {
      errors.push(`Arquivo IDENTICAL possui hashes diferentes em ${entry.path}.`);
    }
  }

  if (entry.classification === 'VISUAL_ONLY') {
    if (path.extname(entry.path).toLowerCase() !== '.css') {
      errors.push(`VISUAL_ONLY é permitido somente para CSS: ${entry.path}.`);
    }
    if (!entry.reason) {
      errors.push(`Justificativa ausente em ${entry.path}.`);
    }
  }

  if (entry.classification === 'TECHNICAL_EXCEPTION' && !entry.reason) {
    errors.push(`Exceção técnica sem justificativa em ${entry.path}.`);
  }

  if (entry.classification === 'TEMPORARY_SCAFFOLD') {
    if (!entry.reason) {
      errors.push(`Scaffold sem justificativa em ${entry.path}.`);
    }
    if (!entry.removalBy) {
      errors.push(`Data de remoção ausente em ${entry.path}.`);
    }
    if (finalFrontend) {
      errors.push(`Frontend final não pode conter scaffold: ${entry.path}.`);
    }
  }

  if (entry.classification === 'FORBIDDEN_DIFFERENCE') {
    errors.push(`Diferença funcional proibida declarada em ${entry.path}.`);
  }
}

function validateHtml(content, filePath, errors) {
  const parsed = parseTemplate(content.toString('utf8'), filePath, {
    preserveWhitespaces: true
  });

  if (parsed.errors?.length) {
    const details = parsed.errors.map((error) => error.msg).join('; ');
    errors.push(`HTML inválido em ${filePath}: ${details}`);
  }
}

export async function verifyParity({
  rootDir = process.cwd(),
  manifestPath = path.join(rootDir, 'reference-parity.json')
} = {}) {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const errors = [];
  const counts = Object.fromEntries(CLASSIFICATIONS.map((classification) => [classification, 0]));
  const declaredPaths = new Set();

  for (const entry of manifest.files ?? []) {
    const normalizedEntryPath = normalizePath(entry.path);
    entry.path = normalizedEntryPath;

    if (declaredPaths.has(normalizedEntryPath)) {
      errors.push(`Arquivo declarado mais de uma vez: ${normalizedEntryPath}.`);
      continue;
    }

    declaredPaths.add(normalizedEntryPath);
    validateManifestEntry(entry, manifest.finalFrontend, errors);

    if (CLASSIFICATIONS.includes(entry.classification)) {
      counts[entry.classification] += 1;
    }

    const absolutePath = path.resolve(rootDir, normalizedEntryPath);
    const relativeToRoot = path.relative(rootDir, absolutePath);
    if (relativeToRoot.startsWith('..') || path.isAbsolute(relativeToRoot)) {
      errors.push(`Caminho fora da raiz: ${normalizedEntryPath}.`);
      continue;
    }

    try {
      const content = await readFile(absolutePath);
      const actualHash = sha256(content, normalizedEntryPath);

      if (actualHash !== entry.expectedSha256) {
        errors.push(`Hash divergente em ${normalizedEntryPath}: esperado ${entry.expectedSha256}, obtido ${actualHash}.`);
      }

      if (entry.classification === 'IDENTICAL' && actualHash !== entry.referenceSha256) {
        errors.push(`Hash da referência divergente em ${normalizedEntryPath}.`);
      }

      if (path.extname(normalizedEntryPath).toLowerCase() === '.html') {
        validateHtml(content, normalizedEntryPath, errors);
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        errors.push(`Arquivo declarado não encontrado: ${normalizedEntryPath}.`);
      } else {
        throw error;
      }
    }
  }

  for (const filePath of await listFiles(rootDir)) {
    if (!declaredPaths.has(filePath)) {
      errors.push(`Arquivo não declarado no manifesto: ${filePath}.`);
    }
  }

  const report = {
    reference: manifest.reference,
    window: manifest.window,
    finalFrontend: manifest.finalFrontend,
    counts,
    errors
  };

  if (errors.length) {
    throw new Error(`Verificação de paridade falhou:\n- ${errors.join('\n- ')}`);
  }

  return report;
}

function printReport(report) {
  console.log(`Referência: ${report.reference.repository}@${report.reference.commit}`);
  console.log(`Janela: ${report.window}`);
  for (const classification of CLASSIFICATIONS) {
    console.log(`${classification}: ${report.counts[classification]}`);
  }
  console.log('FORBIDDEN_DIFFERENCE encontrado: 0');
}

const isCommandLine = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isCommandLine) {
  verifyParity()
    .then(printReport)
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
