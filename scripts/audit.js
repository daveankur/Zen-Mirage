const fs = require('fs');
const path = require('path');

const providersDir = path.join(__dirname, '../providers');
const reportPath = path.join(__dirname, '../pii-audit-report.md');

const PII_PATTERNS = {
  EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  PHONE: /\b(\+?\d{1,2}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g,
  IP_ADDRESS: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g
};

const issuesFound = [];

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const relativePath = path.relative(path.join(__dirname, '..'), filePath);

  lines.forEach((line, index) => {
    // Basic heuristic: check to see if the match is inside a quoted string
    // Even if it isn't strictly necessary, it helps reduce false positives.
    for (const [type, regex] of Object.entries(PII_PATTERNS)) {
      let match;
      // Reset regex state since we use 'g' flag
      regex.lastIndex = 0; 
      
      while ((match = regex.exec(line)) !== null) {
        // We only care about potential literals, but let's just log every hit for safety!
        issuesFound.push({
          file: relativePath,
          lineNum: index + 1,
          type: type,
          value: match[0],
          fullLine: line.trim()
        });
      }
    }
  });
}

function scanDirRecursive(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      scanDirRecursive(fullPath);
    } else if (fullPath.endsWith('.js')) {
      scanFile(fullPath);
    }
  }
}

function generateReport() {
  console.log(`⏳ Running PII Audit on ${providersDir}...`);
  scanDirRecursive(providersDir);

  if (issuesFound.length === 0) {
    console.log(`✅ Success! No PII detected in generated files.`);
    if (fs.existsSync(reportPath)) {
      fs.unlinkSync(reportPath); // Clean up old report
    }
    return;
  }

  let reportMarkdown = `# 🚨 PII Audit Report\n\n`;
  reportMarkdown += `**Warning:** Potential Personally Identifiable Information (PII) was detected in the static strings of your generated mock endpoints.\n\n`;
  reportMarkdown += `💡 **Action Required:** Update your raw JSON in \`input-data/\` or manually update these .js files to use dynamic \`faker\` commands instead of these static strings.\n\n---\n\n`;

  // Group by file
  const groupedIssues = issuesFound.reduce((acc, issue) => {
    if (!acc[issue.file]) acc[issue.file] = [];
    acc[issue.file].push(issue);
    return acc;
  }, {});

  for (const [file, issues] of Object.entries(groupedIssues)) {
    reportMarkdown += `### 📄 File: \`${file}\`\n\n`;
    issues.forEach(issue => {
      reportMarkdown += `- **${issue.type}** found on Line **${issue.lineNum}** -> \`${issue.value}\`\n`;
      reportMarkdown += `  - Code: \`${issue.fullLine}\`\n`;
    });
    reportMarkdown += `\n`;
  }

  fs.writeFileSync(reportPath, reportMarkdown, 'utf8');
  console.log(`🚨 Found ${issuesFound.length} potential PII leaks!`);
  console.log(`📄 Report written to: ${path.relative(path.join(__dirname, '..'), reportPath)}`);
}

generateReport();
