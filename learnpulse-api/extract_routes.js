const fs = require('fs');
const path = require('path');

const baseDir = 'e:\\\\codes\\\\Personal\\\\encuestapp\\\\encuestApp-backend\\\\learnpulse-api\\\\src\\\\modules';
const files = [];

function findFiles(dir) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      findFiles(fullPath);
    } else if (fullPath.endsWith('.controller.ts')) {
      files.push(fullPath);
    }
  }
}
findFiles(baseDir);

const results = [];
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  let controllerRoute = '';
  const controllerMatch = content.match(/@Controller\(['"]([^'"]+)['"]\)/);
  if (controllerMatch) {
    controllerRoute = controllerMatch[1];
  }
  
  const endpoints = [];
  const endpointRegex = /@(Get|Post|Put|Delete|Patch)\(['"]?([^'"]*)['"]?\)\s*[\s\S]*?(?:@ApiOperation\(\{.*?summary:\s*['"]([^'"]+)['"].*?\}\)\s*)?(?:@[a-zA-Z]+\(.*\)\s*)*async\s+([a-zA-Z0-9_]+)\(/g;
  
  let match;
  while ((match = endpointRegex.exec(content)) !== null) {
    const method = match[1];
    const route = match[2] || '';
    const summary = match[3] || 'No summary';
    const functionName = match[5];
    endpoints.push({ method, route: route ? `/${route}` : '', functionName, summary });
  }
  
  const tagsMatch = content.match(/@ApiTags\(['"]([^'"]+)['"]\)/);
  const tag = tagsMatch ? tagsMatch[1] : path.basename(file).replace('.controller.ts', '');
  
  results.push({
    file: path.basename(file),
    module: tag,
    controllerRoute: `/${controllerRoute}`,
    endpoints
  });
}

console.log(JSON.stringify(results, null, 2));
