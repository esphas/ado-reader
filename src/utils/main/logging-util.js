const serializeArg = (arg) => {
  if (arg && typeof arg === "object") {
    try {
      return JSON.stringify(arg);
    } catch {
      return String(arg);
    }
  }
  return String(arg);
};

const installConsoleLogging = (
  log,
  target = console,
  streams = [process.stdout, process.stderr]
) => {
  // File transport remains active; avoid printing every message twice.
  log.transports.console.level = false;
  let terminalAvailable = true;
  const handleStreamError = (error) => {
    if (error.code !== "EPIPE") throw error;
    terminalAvailable = false;
  };
  for (const stream of streams) stream?.on("error", handleStreamError);
  for (const method of ["log", "info", "warn", "error"]) {
    const original = target[method].bind(target);
    const level = method === "log" ? "info" : method;
    target[method] = (...args) => {
      log[level](args.map(serializeArg).join(" "));
      if (!terminalAvailable) return;
      try {
        original(...args);
      } catch (error) {
        handleStreamError(error);
      }
    };
  }
};

module.exports = { installConsoleLogging };
