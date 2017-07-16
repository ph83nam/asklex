// simple logger to log to console
const logger = {
  trace: console.trace.bind(console),
  debug: (console.debug || console.info).bind(console, '[DEBUG]'),
  info: console.log.bind(console, '[INFO]'),
  warn: console.warn.bind(console, '[WARN]'),
  error: console.error.bind(console, '[ERROR]'),
};

export default logger;
