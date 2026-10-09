const fs = require('fs');
const path = require('path');

// 1x1 transparent/blue PNG data URI fallback converted to buffer
const png1x1Base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkWPjfDwAE3wH31k6VzQAAAABJRU5ErkJggg==';
const buf = Buffer.from(png1x1Base64, 'base64');

['icon16.png', 'icon32.png', 'icon48.png', 'icon128.png'].forEach(name => {
  fs.writeFileSync(path.join('D:/murmur/extension/public/icons', name), buf);
});
console.log('Icons written successfully');
