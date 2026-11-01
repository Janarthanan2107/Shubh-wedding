const TAG = /<\/?[^>]+>/g;

export function sanitizeText(input: unknown, max = 4000) {
  if (typeof input !== "string") return "";
  return input.replace(TAG, "").replace(/\u0000/g, "").trim().slice(0, max);
}

export function sanitizeInlineSvg(svg: string) {
  return svg
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "");
}
