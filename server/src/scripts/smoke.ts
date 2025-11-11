import http from 'http';

function get(path: string) {
  return new Promise<string>((resolve, reject) => {
    http.get(`http://localhost:${process.env.PORT || 3001}${path}`, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => resolve(body));
    }).on('error', (e) => reject(e));
  });
}

async function run() {
  try {
    console.log('Running smoke tests against', `http://localhost:${process.env.PORT || 3001}`);
    const health = await get('/api/health');
    console.log('HEALTH:', health);

    const what = await get('/api/what-was-built');
    console.log('WHAT_WAS_BUILT (truncated 500 chars):', what.slice(0, 500));
  } catch (err: any) {
    console.error('Smoke test failed:', err.message || err);
    process.exit(1);
  }
}

run();
