// simple logger to log to console
const logger = {
  trace: console.trace.bind(console),
  debug: (console.debug || console.info).bind(console),
  info: console.log.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
};

export default logger;
