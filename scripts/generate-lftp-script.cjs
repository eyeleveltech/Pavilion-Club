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
  'echo "=== [1] INITIAL DIRECTORY ==="',
  'pwd',
  'ls -la',
  'echo "=== [2] PARENT DIRECTORY (..) ==="',
  'cd ..',
  'pwd',
  'ls -la',
  'echo "=== [3] ROOT DIRECTORY (/) ==="',
  'cd /',
  'pwd',
  'ls -la',
  'echo "=== [4] DOMAINS DIRECTORY (/domains) ==="',
  'cd /domains || cd domains',
  'pwd',
  'ls -la',
  'echo "=== [5] FINDING ALL FOLDERS ==="',
  'cls -l -d 2 /',
  'bye'
];

fs.writeFileSync('deploy_lftp.txt', lines.join('\n') + '\n', 'utf8');
console.log('Generated discovery script successfully.');
