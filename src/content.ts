import { TMessage } from "./background";
import { HighlightUtils } from "./utils";

let enabled: boolean = false;
let activated: boolean = false;
let analyzingText: boolean = false;

let currentElementPlaying: HighlightUtils.Element;

const port = chrome.runtime.connect({ name: "content-script" });

port.onMessage.addListener((message: TMessage) => {
  if (message.type === "action") {
    if (message.action === "restore") {
      HighlightUtils.restore(currentElementPlaying);
      currentElementPlaying = null;
    }
  } else if (message.type === "response") {
    enabled = message.data.enabled;
  }
});

port.postMessage({
  type: "action",
  action: "get",
});

// To prevent port closure due to inactivity
setInterval(() => {
  port.postMessage({ type: "ping" });
}, 3000);

const utterance = new SpeechSynthesisUtterance();

utterance.onend = () => {
  if (!currentElementPlaying) return;

  HighlightUtils.restore(currentElementPlaying);
  currentElementPlaying = null;
};

utterance.onstart = () => {
  if (!currentElementPlaying) return;

  HighlightUtils.setPlaying(currentElementPlaying);
  analyzingText = false;
};

document.addEventListener("click", (e) => {
  if (!enabled) return;
  if (!activated) return;

  speechSynthesis.cancel();

  try {
    port.postMessage({
      type: "action",
      action: "restore",
    });
  } catch (error) {
    console.log(error);
  }

  if (currentElementPlaying) {
    HighlightUtils.restore(currentElementPlaying);
    currentElementPlaying = null;
  }

  const element = e.target as HighlightUtils.Element;

  if (!element || !element.textContent) return;

  utterance.text = element.textContent;
  utterance.rate = 2;

  speechSynthesis.speak(utterance);
  analyzingText = true;
  currentElementPlaying = element;
});

let currentElementHovered: HighlightUtils.Element;

/* To prevent possible bugs */
let lastElementHovered: HighlightUtils.Element;
let activatedElementHovered: HighlightUtils.Element;

document.addEventListener("mouseover", (e) => {
  if (!enabled) return;

  const element = e.target as HighlightUtils.Element;
  if (!element) return;

  if (analyzingText) {
    element.style.cursor = "wait";
  }

  lastElementHovered = currentElementHovered;
  currentElementHovered = element;

  if (!activated || currentElementHovered === currentElementPlaying) return;

  HighlightUtils.saveOriginalValues(currentElementHovered);
  HighlightUtils.setHovered(currentElementHovered);

  const handleMouseout = () => {
    if (
      !currentElementHovered ||
      currentElementHovered === currentElementPlaying
    )
      return;

    currentElementHovered.removeEventListener("mouseout", handleMouseout);

    HighlightUtils.restore(currentElementHovered);
    currentElementHovered = null;

    if (
      activatedElementHovered &&
      activatedElementHovered !== currentElementPlaying
    ) {
      HighlightUtils.restore(activatedElementHovered);
      activatedElementHovered = null;
    }
  };

  currentElementHovered.addEventListener("mouseout", handleMouseout);
});

document.addEventListener("keydown", (e) => {
  if (enabled && e.key === "z" && !activated) {
    activated = true;

    if (
      !currentElementHovered ||
      currentElementHovered === currentElementPlaying
    ) {
      return;
    }

    HighlightUtils.saveOriginalValues(currentElementHovered);
    HighlightUtils.setHovered(currentElementHovered);

    activatedElementHovered = currentElementHovered;
  }
});

document.addEventListener("keyup", (e) => {
  if (enabled && e.key === "z" && activated) {
    activated = false;

    if (lastElementHovered && lastElementHovered !== currentElementPlaying) {
      HighlightUtils.restore(lastElementHovered);
      lastElementHovered = null;
    }

    if (
      activatedElementHovered &&
      activatedElementHovered !== currentElementPlaying
    ) {
      HighlightUtils.restore(activatedElementHovered);
      activatedElementHovered = null;
    }

    if (
      currentElementHovered &&
      currentElementHovered !== currentElementPlaying
    ) {
      HighlightUtils.restore(currentElementHovered);
    }
  }
});
