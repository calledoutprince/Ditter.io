import re
import sys

def clean_file(filepath, is_css=False):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if is_css:
        content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
        content = re.sub(r'\n\s*\n', '\n\n', content)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content.strip() + '\n')
        return

    # JS/JSX cleaning
    lines = content.split('\n')
    new_lines = []
    
    in_block_comment = False

    for line in lines:
        stripped = line.strip()
        
        # block comments logic (naively assuming no multiple block comments on one line)
        if '/*' in stripped and '*/' not in stripped and not stripped.startswith('{/*'):
            in_block_comment = True
            continue
        if in_block_comment:
            if '*/' in stripped:
                in_block_comment = False
            continue
            
        # 1. Skip lines that are entirely single-line comment
        if stripped.startswith('//') and 'eslint-disable' not in stripped:
            continue
            
        if stripped.startswith('{/*') and stripped.endswith('*/}'):
            continue
            
        # 2. Strip inline comments
        if '//' in line and not stripped.startswith('//') and 'eslint-disable' not in line:
            if 'http://' not in line and 'https://' not in line:
                parts = line.split('//')
                line = parts[0].rstrip()
                
        # 3. Strip inline JSX comments: {/* ... */}
        if '{/*' in line and '*/}' in line:
            line = re.sub(r'\{/\*.*?\*/\}', '', line)
            
        new_lines.append(line)

    # collapse multiple blank lines
    final_content = '\n'.join(new_lines)
    # final_content = re.sub(r'\n\s*\n', '\n\n', final_content)
    # wait, leaving some blank lines is fine, but more than 2 is ugly
    final_content = re.sub(r'\n{3,}', '\n\n', final_content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(final_content)

clean_file('src/App.jsx')
clean_file('src/index.css', is_css=True)
print("Done")
