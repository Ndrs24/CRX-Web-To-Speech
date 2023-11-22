export type TData = { enabled: boolean };
export type TMessage =
  | {
      type: "ping";
    }
  | {
      type: "action";
      action: "get";
    }
  | {
      type: "action";
      action: "set";
      data: TData;
    }
  | {
      type: "action";
      action: "restore";
    }
  | {
      type: "response";
      data: TData;
    };

type TPort = chrome.runtime.Port & { connected: boolean };
const ports: TPort[] = [];

const ACTIONS_DICT = {
  get: async (message: TMessage, port: TPort) => {
    if (message.type !== "action" || message.action !== "get") return;

    const chromeLocalStorage = await chrome.storage.local.get();

    let wtsData: TData = { enabled: false };

    if (!chromeLocalStorage.wts) {
      await chrome.storage.local.set({
        wts: wtsData,
      });
    } else {
      wtsData = chromeLocalStorage.wts;
    }

    if (!port.connected) return;

    port.postMessage({
      type: "response",
      data: wtsData,
    });
  },
  set: async (message: TMessage, port: TPort) => {
    if (message.type !== "action" || message.action !== "set") return;

    await chrome.storage.local.set({
      wts: message.data,
    });

    ports.forEach((port) => {
      if (!port.connected) return;

      port.postMessage({
        type: "response",
        data: message.data,
      });
    });
  },
  restore: (message: TMessage, port: TPort) => {
    if (message.type !== "action" || message.action !== "restore") return;

    ports.forEach((p) => {
      if (!p.connected || p === port) return;

      p.postMessage({
        type: "action",
        action: "restore",
      });
    });
  },
};

chrome.runtime.onConnect.addListener((portSource) => {
  const port = portSource as TPort;

  if (port.name !== "content-script") return;
  ports.push(port);

  port.connected = true;

  port.onMessage.addListener((message: TMessage, p: chrome.runtime.Port) => {
    if (message.type === "ping") return;
    if (message.type !== "action") return;
    ACTIONS_DICT[message.action](message, p as TPort);
  });

  port.onDisconnect.addListener(() => {
    port.connected = false;
    ports.splice(ports.indexOf(port), 1);
  });
});
