const fs = require('fs');

const replacements = [
  {
    path: 'src/app/signup/index.tsx',
    fix: (content) => {
      // Switch 및 View 추가 안내
      content = content.replace(
        /<input type="checkbox" checked=\{showPassword\} onChange=\{\(event\) => setShowPassword\(event\.target\.checked\)\} \/>/g,
        '<Switch value={showPassword} onValueChange={setShowPassword} />'
      );
      content = content.replace(
        /<input type="checkbox" checked=\{checked\} onChange=\{\(event\) => onChange\(event\.target\.checked\)\} className="mt-1" \/>/g,
        '<Switch value={checked} onValueChange={onChange} className="mt-1" />'
      );
      return content;
    }
  },
  {
    path: 'src/app/login/index.tsx',
    fix: (content) => {
      content = content.replace(
        /<input type="checkbox" checked=\{showPassword\} onChange=\{\(event\) => setShowPassword\(event\.target\.checked\)\} \/>/g,
        '<Switch value={showPassword} onValueChange={setShowPassword} />'
      );
      return content;
    }
  },
  {
    path: 'src/components/resources/resource-board.tsx',
    fix: (content) => {
      content = content.replace(
        /<input type="checkbox" checked=\{editor\.pinned\} onChange=\{\(event\) => setEditor\(\{ \.\.\.editor, pinned: event\.target\.checked \}\)\} \/>/g,
        '<Switch value={editor.pinned} onValueChange={(val) => setEditor({ ...editor, pinned: val })} />'
      );
      return content;
    }
  },
  {
    path: 'src/app/jobs/import/index.tsx',
    fix: (content) => {
      content = content.replace(
        /<input type="checkbox" checked=\{selected\} onChange=\{\(event\) => onToggle\(event\.target\.checked\)\} \/>/g,
        '<Switch value={selected} onValueChange={onToggle} />'
      );
      // <a href> -> <Pressable onPress={() => Linking.openURL(...)}>
      content = content.replace(
        /<a href=\{job\.source_url\} target="_blank" rel="noreferrer" className="([^"]*)">([\s\S]*?)<\/a>/g,
        '<Pressable onPress={() => Linking.openURL(job.source_url)} className="$1">$2</Pressable>'
      );
      return content;
    }
  },
  {
    path: 'src/app/applications/[applicationId]/index.tsx',
    fix: (content) => {
      // <a href> -> <Pressable onPress={() => Linking.openURL(...)}>
      content = content.replace(
        /<a href=\{record\.application_url\} target="_blank" rel="noreferrer" className="([^"]*)">([\s\S]*?)<\/a>/g,
        '<Pressable onPress={() => Linking.openURL(record.application_url)} className="$1">$2</Pressable>'
      );
      return content;
    }
  }
];

replacements.forEach(({ path, fix }) => {
  if (fs.existsSync(path)) {
    let content = fs.readFileSync(path, 'utf8');
    let updated = fix(content);
    if (content !== updated) {
      fs.writeFileSync(path, updated, 'utf8');
      console.log(`[Fixed Web Tags] ${path}`);
    }
  }
});
