const fs = require('fs');
const path = require('path');

const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.html'));

files.forEach(file => {
    if (file === 'index.html') return; // already done

    let content = fs.readFileSync(file, 'utf8');

    // Remove the tailwind CDN and config
    content = content.replace(/<script src="https:\/\/cdn\.tailwindcss\.com"><\/script>[\s\S]*?<\/script>/, '');

    // Replace the style.css link with output.css, or add output.css before </head> if style.css is not present
    if (content.includes('<link rel="stylesheet" href="style.css">')) {
        content = content.replace('<link rel="stylesheet" href="style.css">', '<link rel="preload" href="output.css" as="style">\n    <link rel="stylesheet" href="output.css">');
    } else if (!content.includes('output.css')) {
        content = content.replace('</head>', '    <link rel="preload" href="output.css" as="style">\n    <link rel="stylesheet" href="output.css">\n</head>');
    }

    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
});
