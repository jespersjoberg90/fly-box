export function mapToInternalFlyCategory(category: string): string {
  const c = String(category || '').toLowerCase().trim();
  if (/nymph|perdigon|euro/.test(c)) return 'Nymfer';
  if (/emerger|klink|caddis pupa|hatch/.test(c)) return 'Kläckare';
  if (/dry|mayfly|caddis|dun|spinner|terrestrial|ant/.test(c)) {
    return 'Torrflugor';
  }
  if (/wet|streamer/.test(c)) return 'Våtflugor';
  return 'Övrigt';
}
