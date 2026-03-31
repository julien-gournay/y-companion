const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("campusCompanion", {
  isDev: process.env.NODE_ENV === "development",
});

