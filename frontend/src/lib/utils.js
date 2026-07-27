export function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function getFontFallback(fontName) {
  if (!fontName) return 'sans-serif';
  const lowerName = fontName.toLowerCase();
  if (lowerName.includes('serif') || lowerName.includes('times') || lowerName.includes('georgia')) {
    return 'serif';
  }
  if (lowerName.includes('mono') || lowerName.includes('courier') || lowerName.includes('consolas')) {
    return 'monospace';
  }
  return 'sans-serif';
}

export function getContrastColor(hexColor) {
  let hex = hexColor.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map((char) => char + char).join('');
  }
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#111111' : '#f3f4f6';
}
