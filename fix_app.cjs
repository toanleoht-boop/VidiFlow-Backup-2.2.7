const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `  const [imageStyle, setImageStyle] = useState<string>("commercial cinematic storytelling, 4k concept art, atmospheric shadows");`;
const replacementStr = `  const [imageStyle, setImageStyle] = useState<string>(() => {
    try {
      const saved = localStorage.getItem("cc_selectedStyle_v2");
      if (saved) return saved;
    } catch (e) {}
    return "commercial cinematic storytelling, 4k concept art, atmospheric shadows";
  });

  useEffect(() => {
    try {
      localStorage.setItem("cc_selectedStyle_v2", imageStyle);
    } catch (e) {}
  }, [imageStyle]);`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replacementStr);
  fs.writeFileSync('src/App.tsx', code, 'utf8');
  console.log('Successfully updated imageStyle in App.tsx');
} else {
  console.error('Target string not found in App.tsx');
}
