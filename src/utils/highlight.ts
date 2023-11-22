type HighlightElement =
  | (HTMLElement & {
      saved: boolean;
      originalBorderStyle: string;
      originalCursorStyle: string;
      originalTitle: string;
    })
  | null;

export { type HighlightElement as Element };

export function saveOriginalValues(element: HighlightElement) {
  if (!element || element.saved) return;

  element.originalBorderStyle = element.style.border;
  element.originalTitle = element.title;
  element.saved = true;
}

export function setHovered(element: HighlightElement): void {
  if (!element || !element.saved) return;

  element.style.border = `2px solid blue`;
  element.style.cursor = "pointer";
  element.title = "Toca para escuchar el texto";
}

export function setPlaying(element: HighlightElement): void {
  if (!element || !element.saved) return;

  element.style.border = "2px solid red";
  element.style.cursor = "pointer";
  element.title = "Escuchando...";
}

export function restore(element: HighlightElement): void {
  if (!element || !element.saved) return;

  element.style.border = element.originalBorderStyle;
  element.style.cursor = "auto";
  element.title = element.originalTitle;
  element.saved = false;
}
