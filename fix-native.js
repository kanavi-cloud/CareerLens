const fs = require('fs');
const path = require('path');

function walkSync(dir, filelist = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      filelist = walkSync(filePath, filelist);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      filelist.push(filePath);
    }
  });
  return filelist;
}

const files = walkSync('./src');
let modifiedCount = 0;

files.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // 1. Pressable / Button 웹 속성 제거 및 변환
  content = content.replace(/type="button"/g, '');
  content = content.replace(/onClick=\{([^}]+)\}/g, 'onPress={$1}');

  // 2. inline-flex -> flex-row items-center
  content = content.replace(/\binline-flex\b/g, 'flex-row items-center');

  // 3. inline-grid -> flex-row
  content = content.replace(/\binline-grid\b/g, 'flex-row');

  // 4. block 클래스 제거 (React Native 기본은 flex/block 구분 없음)
  content = content.replace(/\bblock\b/g, '');

  // 5. grid grid-cols-N 패턴을 flex-row로 기본 교체 힌트
  content = content.replace(/\bgrid grid-cols-2\b/g, 'flex-row gap-2');
  content = content.replace(/\bgrid grid-cols-3\b/g, 'flex-row gap-2');
  content = content.replace(/\bgrid grid-cols-4\b/g, 'flex-row gap-2');
  content = content.replace(/\bgrid\b/g, 'flex');

  // 6. html label 태그 변환 힌트 (기본 View 대체)
  content = content.replace(/<label\b/g, '<View');
  content = content.replace(/<\/label>/g, '</View>');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[Fixed] ${filePath}`);
    modifiedCount++;
  }
});

console.log(`\n총 ${modifiedCount}개 파일 일괄 수정 완료!`);
