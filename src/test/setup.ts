// Suppress Lit Dev Mode warning by filtering console.warn
const originalWarn = console.warn;
console.warn = (...args) => {
  if (
    args[0] &&
    typeof args[0] === 'string' &&
    args[0].includes('Lit is in dev mode')
  ) {
    return;
  }
  originalWarn(...args);
};
