const fs = require('fs');

const server = process.env.FTP_SERVER;
const user = process.env.FTP_USERNAME;
const pass = process.env.FTP_PASSWORD;
const dir = process.env.FTP_SERVER_DIR || '';

if (!server || !user || !pass) {
  console.error('ERROR: Missing FTP_SERVER, FTP_USERNAME, or FTP_PASSWORD environment variables.');
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
  'pwd',
  'ls -la'
];

if (dir && dir.trim() !== '') {
  lines.push('cd "' + escapeLftp(dir.trim()) + '"');
} else {
  lines.push('cd domains/thepavilionclub.com/public_html || cd public_html || cd domains/thepavilionclub.in/public_html || cd /public_html || pwd');
}

lines.push(
  'echo "=== Target Deployment Directory ==="',
  'pwd',
  'set cmd:fail-exit true',
  'echo "=== Starting High-Speed Mirror Upload ==="',
  'mirror --reverse --delete --verbose=1 --parallel=2 ./apps/web/out/ .',
  'echo "=== Verifying Deployment Files ==="',
  'ls -la index.html',
  'echo "=== FTP Upload Completed Successfully! ==="',
  'bye'
);

fs.writeFileSync('deploy_lftp.txt', lines.join('\n') + '\n', 'utf8');
console.log('Successfully generated deploy_lftp.txt with ' + lines.length + ' commands.');
