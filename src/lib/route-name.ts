// Resonator display names are used verbatim as the /r/[name] route param, and the
// static export writes each param as a directory — so Windows-reserved filename
// characters (the colon in "Yangyang: Xuanling") break `next build` on NTFS even
// though the Linux CI builder accepts them. Route params therefore drop those
// characters; display names keep them. Names without reserved characters are
// unchanged, so pre-existing /r/ URLs stay stable.

const WINDOWS_RESERVED = /[<>:"/\\|?*]/g;

export function routeName(name: string): string {
  return name.replace(WINDOWS_RESERVED, "").replace(/\s+/g, " ").trim();
}

export function resonatorPath(name: string): string {
  return `/r/${encodeURIComponent(routeName(name))}`;
}
