const { AsyncLocalStorage } = require('async_hooks');
const als = new AsyncLocalStorage();

async function acquire(val) {
  await new Promise(r => setTimeout(r, 10));
  als.enterWith(val);
  return () => console.log('Released', val);
}

async function main() {
  const release = await acquire(42);
  console.log('Store after acquire:', als.getStore());
  await new Promise(r => setTimeout(r, 10));
  console.log('Store after async delay:', als.getStore());
}

main();
