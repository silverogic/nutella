const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const vendorDir = path.join(__dirname, 'public', 'vendor');
if (!fs.existsSync(vendorDir)) {
  fs.mkdirSync(vendorDir, { recursive: true });
}

const filesToDownload = [
  {
    url: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
    dest: path.join(vendorDir, 'pdf.min.js')
  },
  {
    url: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
    dest: path.join(vendorDir, 'pdf.worker.min.js')
  },
  {
    url: 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js',
    dest: path.join(vendorDir, 'pdf-lib.min.js')
  },
  {
    url: 'https://cdn.jsdelivr.net/npm/@pdf-lib/fontkit@1.1.1/dist/fontkit.umd.min.js',
    dest: path.join(vendorDir, 'fontkit.umd.min.js')
  },
  {
    url: 'https://cdn.jsdelivr.net/npm/lucide@0.344.0/dist/umd/lucide.min.js',
    dest: path.join(vendorDir, 'lucide.min.js')
  }
];

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const client = url.startsWith('https') ? https : http;
    
    const request = client.get(url, (response) => {
      // Handle redirects
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        return download(response.headers.location, dest).then(resolve).catch(reject);
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
        return;
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close(() => {
          console.log(`Downloaded: ${path.basename(dest)}`);
          resolve();
        });
      });
    });

    request.on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

async function main() {
  console.log('Downloading vendor scripts...');
  for (const item of filesToDownload) {
    try {
      await download(item.url, item.dest);
    } catch (err) {
      console.error(`Error downloading ${item.url}:`, err.message);
    }
  }
  console.log('Done downloading vendor scripts.');
}

main();
