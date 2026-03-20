const fs = require('fs');

let text = fs.readFileSync('research/build-breakdown.md', 'utf8');

text = text.replace('## Phase 1 — Richer Dithering & Visual Depth', '## Phase 1 (v0.4.x) — Richer Dithering & Visual Depth');
text = text.replace('## Phase 2 — Animation & Motion', '## Phase 2 (v0.5.x) — Animation & Motion');
text = text.replace('## Phase 3 — Workflow, Integrations & Reach', '## Phase 3 (v0.6.x) — Workflow, Integrations & Reach');
text = text.replace('## Phase 4 — UX Polish & Persistence', '## Phase 4 (v0.7.x) — UX Polish & Persistence');
text = text.replace('## Phase 5 — Cloud & Community', '## Phase 5 (v1.0.x) — Cloud & Community');

const mappings = {
    'P1.A': 'v0.4.0', 'P1.B': 'v0.4.1', 'P1.C': 'v0.4.2', 'P1.D': 'v0.4.3', 'P1.E': 'v0.4.4', 'P1.F': 'v0.4.5', 'P1.G': 'v0.4.6',
    'P2.A': 'v0.5.0', 'P2.B': 'v0.5.1', 'P2.C': 'v0.5.2',
    'P3.A': 'v0.6.0', 'P3.B': 'v0.6.1', 'P3.C': 'v0.6.2', 'P3.D': 'v0.6.3', 'P3.E': 'v0.6.4',
    'P4.A': 'v0.7.0', 'P4.B': 'v0.7.1', 'P4.C': 'v0.7.2',
    'P5.A': 'v1.0.0'
};

for (const [old, newStr] of Object.entries(mappings)) {
    // Headers e.g. ### P1.A Pre-Processing...
    text = text.replace(new RegExp('### ' + old + ' ', 'g'), '### ' + newStr + ' — ');
    
    // Table rows e.g. | P1.A1 |
    text = text.replace(new RegExp('\\\\| ' + old, 'g'), '| ' + newStr + '.');
}

// Fix alignment
let lines = text.split('\n');
for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    if (line.startsWith('| v') && line.includes('|', Math.max(0, line.indexOf('|') + 1))) {
        // Find the second pipe
        let firstPipe = line.indexOf('|');
        let secondPipe = line.indexOf('|', firstPipe + 1);
        if (secondPipe !== -1) {
            let chunkCol = line.substring(0, secondPipe);
            // pad out to | v0.4.0.12 |
            chunkCol = chunkCol.padEnd(13, ' ');
            lines[i] = chunkCol + line.substring(secondPipe);
        }
    }
}

fs.writeFileSync('research/build-breakdown.md', lines.join('\n'));
console.log('Done');
