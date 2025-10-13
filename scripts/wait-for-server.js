const http = require('http');

const waitForServer = (url, timeout = 30000) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const checkServer = () => {
      const req = http.get(url, res => {
        if (res.statusCode === 200 || res.statusCode === 404) {
          console.log(`✅ Servidor está respondendo em ${url}`);
          resolve();
        } else {
          setTimeout(checkServer, 1000);
        }
      });

      req.on('error', () => {
        if (Date.now() - startTime > timeout) {
          reject(new Error(`Timeout: Servidor não respondeu em ${timeout}ms`));
        } else {
          setTimeout(checkServer, 1000);
        }
      });
    };

    checkServer();
  });
};

const serverUrl = process.env.CYPRESS_BASE_URL || 'http://localhost:3000';

console.log(`🔄 Aguardando servidor em ${serverUrl}...`);

waitForServer(serverUrl)
  .then(() => {
    console.log('✅ Servidor está pronto!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Erro ao aguardar servidor:', error.message);
    process.exit(1);
  });
