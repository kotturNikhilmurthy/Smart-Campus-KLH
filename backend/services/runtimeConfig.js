export const isDatabaseEnabled = process.env.USE_DATABASE === "true";

export const dataMode = isDatabaseEnabled ? "database" : "memory";
