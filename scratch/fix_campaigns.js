const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('const organizationId = session?.user?.organizationId;')) {
    content = content.replace('import { auth } from "@/auth";', 'import { auth } from "@/auth";\nimport { getActiveOrgId } from "@/lib/permissions";');
    content = content.replace('const organizationId = session?.user?.organizationId;', 'const organizationId = await getActiveOrgId();');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed', filePath);
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      replaceInFile(fullPath);
    }
  }
}

walk('d:/CRM/src/app/(dashboard)/campaigns');
