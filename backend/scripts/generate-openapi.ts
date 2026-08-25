import * as fs from 'fs';
import * as path from 'path';
import jsYaml from 'js-yaml';

const backendRoot = path.resolve(__dirname, '..');
const pkgPath = path.join(backendRoot, 'package.json');
const openapiPath = path.join(backendRoot, 'openapi.json');

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

// Recursively find all TypeScript source files in backend/src
function scanDirectory(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      scanDirectory(filePath, fileList);
    } else if (file.endsWith('.ts') && !file.endsWith('.test.ts')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

// Parse @openapi JSDoc blocks from code files
function parseOpenApiAnnotations(): Record<string, any> {
  const srcDir = path.join(backendRoot, 'src');
  const files = scanDirectory(srcDir);
  const paths: Record<string, any> = {};

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf8');
    const blocks = content.split('@openapi');
    if (blocks.length <= 1) continue;

    for (let i = 1; i < blocks.length; i++) {
      const rawBlock = blocks[i];
      // Get text up to end of JSDoc comment */
      const commentText = rawBlock.split('*/')[0];
      
      // Clean JSDoc leading stars
      const lines = commentText
        .split('\n')
        .map((l) => l.replace(/^\s*\*\s?/, ''))
        .filter((l) => l.trim().length > 0);

      // Keep only YAML lines (starting with path slash or spaces or YAML keys)
      const yamlLines: string[] = [];
      for (const line of lines) {
        if (line.trim().startsWith('@') || line.trim().startsWith('v1Router') || line.trim().startsWith('authRouter')) {
          break;
        }
        yamlLines.push(line);
      }

      const yamlString = yamlLines.join('\n');
      if (!yamlString.trim()) continue;

      try {
        const parsed = jsYaml.load(yamlString) as Record<string, any>;
        if (parsed && typeof parsed === 'object') {
          for (const [pathKey, pathObj] of Object.entries(parsed)) {
            if (!paths[pathKey]) {
              paths[pathKey] = {};
            }
            Object.assign(paths[pathKey], pathObj);
          }
        }
      } catch (err: any) {
        console.error(`Error parsing @openapi block in ${filePath}:`, err.message);
      }
    }
  }

  return paths;
}

function main() {
  let spec: any = {};
  if (fs.existsSync(openapiPath)) {
    try {
      spec = JSON.parse(fs.readFileSync(openapiPath, 'utf8'));
    } catch (e) {
      spec = {};
    }
  }

  // Update top-level version to match package.json
  spec.openapi = spec.openapi || '3.0.3';
  if (!spec.info) spec.info = {};
  spec.info.version = pkg.version;

  spec.paths = spec.paths || {};

  // Merge code annotations into spec.paths
  const codePaths = parseOpenApiAnnotations();
  for (const [pKey, pVal] of Object.entries(codePaths)) {
    if (!spec.paths[pKey]) {
      spec.paths[pKey] = pVal;
    } else {
      Object.assign(spec.paths[pKey], pVal);
    }
  }

  // Write out formatted spec
  const formattedJson = JSON.stringify(spec, null, 2) + '\n';
  fs.writeFileSync(openapiPath, formattedJson);
  console.log(`Generated openapi.json (version ${pkg.version}) containing ${Object.keys(spec.paths).length} routes.`);
}

main();
