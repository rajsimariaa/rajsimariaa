const fs = require('fs');
const file = 'c:/Users/rajsi/Downloads/Portfolio/main.js';
let lines = fs.readFileSync(file, 'utf8').split('\n');

const startLine = 84;
const endLine = 405; // Lines are 1-indexed for me, so startLine-1 to endLine

lines.splice(startLine - 1, endLine - startLine + 1);

fs.writeFileSync(file, lines.join('\n'));
console.log('Removed terminal logic lines from main.js');
