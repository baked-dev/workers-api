#!/usr/bin/env node --experimental-vm-modules

const commands: [string, Promise<{ default: () => any }>][] = [
  ["build", import("./bin/build.mjs")],
  ["dev", import("./bin/dev.mjs")],
];

const [, , command] = process.argv;

const [, action] = commands.find(([cmd]) => cmd === command) || [];

if (!action)
  throw new Error(
    `Unknown command: "${command}". Available commands: ${commands
      .map(([command]) => command)
      .join(", ")}`
  );

(await action).default();

export {};
