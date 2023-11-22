import { ChangeEvent, useEffect, useState } from "react";
import "./App.css";
import { TMessage } from "./background";

export default function App() {
  const [active, setActive] = useState(false);
  const [port, setPort] = useState<chrome.runtime.Port>();

  useEffect(() => {
    const port = chrome.runtime.connect({ name: "content-script" });

    const listener = (message: TMessage) => {
      if (message.type !== "response") return;
      setActive(message.data.enabled);
      port.onMessage.removeListener(listener);
    };

    port.onMessage.addListener(listener);

    port.postMessage({
      type: "action",
      action: "get",
    });

    setPort(port);

    return () => {
      port.onMessage.removeListener(listener);
      port.disconnect();
    };
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!port) return;

    setActive(e.target.checked);

    port.postMessage({
      type: "action",
      action: "set",
      data: { enabled: e.target.checked },
    });
  };

  return (
    <main>
      <h1>Web To Speech</h1>

      <div className="form-check form-switch">
        <input
          className="form-check-input"
          type="checkbox"
          role="switch"
          id="flexSwitchCheck"
          checked={active}
          onChange={handleChange}
          disabled={!port}
        />
        <label className="form-check-label" htmlFor="flexSwitchCheck">
          Activar o Desactivar
        </label>
      </div>
    </main>
  );
}
