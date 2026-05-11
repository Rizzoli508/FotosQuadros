import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const assetsDir = path.resolve('attached_assets');

// Apenas imagens usadas no site (importadas no Home.tsx)
const images = [
  'review_maefilha.png',
  'filhapaireview.png',
  'review3quadro.png',
  'quadrodogreview.png',
  'maefilha2review.png',
  'casal_pb.png',
  'casal_color.png',
  'maebb1_pb.png',
  'maebb1_color.png',
  'maebb2_pb.png',
  'maebb2_color.png',
  'maefilha_classico_pb.png',
  'maefilha_classico_color.png',
  'maefilha_intimo_pb.png',
  'maefilha_intimo_color.png',
  'paifilha_classico_pb.png',
  'paifilha_classico_color.png',
  'paifilha_intimo_pb.png',
  'paifilha_intimo_color.png',
  'maefilho_classico_pb.png',
  'maefilho_classico_color.png',
  'maefilho_intimo_pb.png',
  'maefilho_intimo_color.png',
  'paifilho_classico_pb.png',
  'paifilho_classico_color.png',
  'paifilho_intimo_pb.png',
  'paifilho_intimo_color.png',
  'familia3_e1_pb.png',
  'familia3_e1_color.png',
  'familia3_e2_pb_v2.png',
  'familia3_e2_color_v2.png',
  'familia3_e3_pb.png',
  'familia3_e3_color.png',
  'familia3_e4_pb.png',
  'familia3_e4_color.png',
  'familia4_e1_pb.png',
  'familia4_e1_color.png',
  'familia4_e2_pb.png',
  'familia4_e2_color.png',
  'familia4_e3_pb.png',
  'familia4_e3_color.png',
  'familia4_e4_pb.png',
  'familia4_e4_color.png',
  'pet1_pb.png',
  'pet1_color.png',
  'pet2_pb.png',
  'pet2_color.png',
  'pet3_pb.png',
  'pet3_color.png',
];

let totalOriginal = 0;
let totalConverted = 0;

for (const filename of images) {
  const srcPath = path.join(assetsDir, filename);
  const outFilename = filename.replace('.png', '.jpg');
  const outPath = path.join(assetsDir, outFilename);

  if (!fs.existsSync(srcPath)) {
    console.log(`⚠️  Não encontrado: ${filename}`);
    continue;
  }

  const originalSize = fs.statSync(srcPath).size;

  await sharp(srcPath)
    .jpeg({ quality: 85, progressive: true })
    .toFile(outPath);

  const newSize = fs.statSync(outPath).size;
  const reduction = Math.round((1 - newSize / originalSize) * 100);

  totalOriginal += originalSize;
  totalConverted += newSize;

  console.log(`✅ ${filename} → ${outFilename} | ${(originalSize/1024).toFixed(0)}KB → ${(newSize/1024).toFixed(0)}KB (-${reduction}%)`);
}

console.log(`\n🎉 Total: ${(totalOriginal/1024/1024).toFixed(1)}MB → ${(totalConverted/1024/1024).toFixed(1)}MB (-${Math.round((1 - totalConverted/totalOriginal)*100)}%)`);
