const { EventEmitter } = require("events");
const { installConsoleLogging } = require("./logging-util");

const setup = () => {
  const output = new EventEmitter();
  const terminal = { log: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() };
  const file = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), transports: { console: {} } };
  const original = { ...terminal };
  installConsoleLogging(file, terminal, [output]);
  return { output, terminal, file, original };
};
test("a synchronous broken pipe stops terminal writes but keeps file logs", () => {
  const { terminal, file, original } = setup();
  original.warn.mockImplementation(() => { throw Object.assign(new Error("broken pipe"), { code: "EPIPE" }); });
  expect(() => terminal.warn("first")).not.toThrow();
  terminal.warn("second");
  expect(original.warn).toHaveBeenCalledTimes(1);
  expect(file.warn.mock.calls).toEqual([["first"], ["second"]]);
  expect(file.transports.console.level).toBe(false);
});
test("asynchronous EPIPE is handled without disabling file logging", () => {
  const { terminal, output, file, original } = setup();
  expect(() => output.emit("error", { code: "EPIPE" })).not.toThrow();
  terminal.error("still recorded");
  expect(original.error).not.toHaveBeenCalled();
  expect(file.error).toHaveBeenCalledWith("still recorded");
});
test("unrelated errors are not swallowed", () => {
  const { terminal, output, original } = setup();
  const error = Object.assign(new Error("I/O failure"), { code: "EIO" });
  expect(() => output.emit("error", error)).toThrow(error);
  original.log.mockImplementation(() => { throw error; });
  expect(() => terminal.log("message")).toThrow(error);
});
