import fs from 'fs';

function cleanJSX(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    const lines = content.split('\n');
    const newLines = [];
    
    let inBlockComment = false;
    
    for (let line of lines) {
        const stripped = line.trim();
        
        // Handle block comments (assuming they don't share line with code)
        if (stripped.includes('/*') && !stripped.includes('*/') && !stripped.startsWith('{/*')) {
            inBlockComment = true;
            continue;
        }
        if (inBlockComment) {
            if (stripped.includes('*/')) {
                inBlockComment = false;
            }
            continue;
        }
        
        // 1. Skip entire single-line comments
        if (stripped.startsWith('//') && !stripped.includes('eslint-disable')) {
            continue;
        }
        
        // 2. JSX block comments
        if (stripped.startsWith('{/*') && stripped.endsWith('*/}')) {
            continue;
        }
        
        // 3. Strip inline comments
        if (line.includes('//') && !stripped.startsWith('//') && !line.includes('eslint-disable')) {
            if (!line.includes('http://') && !line.includes('https://') && !line.includes('blob:')) {
                line = line.split('//')[0].trimEnd();
            }
        }
        
        // Strip inline JSX comments
        if (line.includes('{/*') && line.includes('*/}')) {
            line = line.replace(/\{\/\*.*?\*\/\}/g, '');
        }
        
        newLines.push(line);
    }
    
    // Collapse multiple blank lines
    let finalContent = newLines.join('\n');
    finalContent = finalContent.replace(/\n{3,}/g, '\n\n');
    
    fs.writeFileSync(filePath, finalContent, 'utf-8');
}

function cleanCSS(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');
    content = content.replace(/\/\*[\s\S]*?\*\//g, '');
    content = content.replace(/\n\s*\n/g, '\n\n');
    fs.writeFileSync(filePath, content.trim() + '\n', 'utf-8');
}

cleanJSX('src/App.jsx');
cleanCSS('src/index.css');

console.log('Done cleaning JS and CSS');
