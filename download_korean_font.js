const fs = require('fs');
const path = require('path');
const https = require('https');

const fontPath = path.join(__dirname, 'public', 'vendor', 'KoreanFont.ttf');

const fontUrls = [
  'https://fonts.gstatic.com/s/nanumgothic/v23/PN_3123A81f0831557fB0a0dca0.ttf',
  'https://cdn.jsdelivr.net/gh/googlefonts/nanum-gothic@main/fonts/ttf/NanumGothic-Regular.ttf',
  'https://raw.githubusercontent.com/google/fonts/main/ofl/nanumgothic/NanumGothic-Regular.ttf'
];

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close(() => resolve());
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

async function main() {
  console.log('Downloading local Korean TTF font...');
  for (const url of fontUrls) {
    try {
      await downloadFile(url, fontPath);
      const stat = fs.statSync(fontPath);
      if (stat.size > 100000) {
        console.log(`Successfully saved local Korean font: ${stat.size} bytes`);
        return;
      }
    } catch (e) {
      console.warn(`Failed ${url}: ${e.message}`);
    }
  }
  console.error('All font URLs failed');
}

main();
