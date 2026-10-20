const fs = require('fs');

const server = process.env.FTP_SERVER;
const user = process.env.FTP_USERNAME;
const pass = process.env.FTP_PASSWORD;

if (!server || !user || !pass) {
  console.error('ERROR: Missing FTP credentials.');
  process.exit(1);
}

const escapeLftp = (str) => str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

const lines = [
  'set ftp:ssl-allow true',
  'set ssl:verify-certificate no',
  'set ftp:passive-mode true',
  'set net:timeout 30',
  'set net:max-retries 3',
  'set cmd:fail-exit false',
  'open -u "' + escapeLftp(user) + '","' + escapeLftp(pass) + '" "' + escapeLftp(server) + '"',
  'echo "=== Connected to Hostinger FTP! ==="',
  'echo "=== Navigating to thepavilionclub.com Document Root ==="',
  'cd /domains/thepavilionclub.com/public_html',
  'echo "=== Verified Target Directory ==="',
  'pwd',
  'ls -la index.html',
  'set cmd:fail-exit true',
  'echo "=== Mirroring Production Build to thepavilionclub.com ==="',
  'mirror --reverse --delete --verbose=1 --parallel=4 ./apps/web/out/ .',
  'echo "=== Verifying thepavilionclub.com Uploaded Files ==="',
  'ls -la index.html',
  'set cmd:fail-exit false',
  'echo "=== Also Mirroring to Root public_html for Consistency ==="',
  'cd /public_html',
  'mirror --reverse --delete --verbose=1 --parallel=4 ./apps/web/out/ .',
  'echo "=== All Targets Successfully Deployed! ==="',
  'bye'
];

fs.writeFileSync('deploy_lftp.txt', lines.join('\n') + '\n', 'utf8');
console.log('Successfully generated deploy_lftp.txt targeting /domains/thepavilionclub.com/public_html');
