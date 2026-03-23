/**
 * Flugtyp för kataloggruppering när flyType saknas i JSON.
 * Ordning på regler spelar roll (första träff vinner).
 */
export const FLY_TYPE_ORDER = [
  'Torrflugor',
  'Kläckare',
  'Nymfer',
  'Euronymfer',
  'Våtflugor',
  'Övrigt',
];

export function classifyFlyType(item) {
  if (item.flyType) {
    if (item.flyType === 'Dry & Dropper') return 'Övrigt';
    return item.flyType;
  }

  const s = `${item.name} ${item.catalogId}`.toLowerCase();

  if (
    /indi-|indi |dropper|indicator|indi-klink|indi-caddis|indi-black/.test(s)
  ) {
    return 'Övrigt';
  }

  if (
    /perdigon|tactical-ptn|gummy-nymph|squirmie|flashback-pheasant|copper-john|czech-weapon|french-nymph|grayling-slayer|killer-|pearl-hare|blood-heart-nymph|bootlace|funky-shrimp|flash-prince|copper-dreams|pliva-perdigon|red-butt-perdigon|double-legs|black-and-purple|baetis-quill|sweet-pheasant|the-favourite|the-pearl|dk-brown-flashback|pheasant-killer|killer-red-tag|killer-chocolate|killer-blue|czech-weapon-depthfinder|depthfinder|flashback-ptn|europea-12|the-pearl-hare|fire-butt-perdigon/.test(
      s,
    )
  ) {
    return 'Euronymfer';
  }

  if (
    /nymph|nymf|nymfe|stone|montana|prince-nymph|dragon-fly|damsel-nymph|scud|mop-dragon|superpuppan|gold-bead-hares|hares-ear|spider-midge|vulgata-nymph|ephemera-nymfe|montana-stone|dyret|ultra-damsel|rs-dragon/.test(
      s,
    )
  ) {
    return 'Nymfer';
  }

  if (
    /klekker|klink|emerger|midge|shuttlecock|buzzer|flexi-buzzer|biot-dun-emerger|cdc-biot-dun|hatching-midge|vespertina|ignita-flash|olive-flash|palomino|morgans-para|rena-midge|black-holotag|pliva-shuttlecock|runes-midge|cdc-midge|ephemerella|baetis-klekker|super-emerging|hatching|holotag|para-midge|cdc-flash-spinner|flash-spinner|biot-dun-|comparadun|cdc-biot-comparadun|klink-lt|klink-dk|klink-black|klinkhammer|streaking-caddis|gl-streaking|elk-caddis|cdc-elk|goddard-caddis|kronen-cdc|super-emerging-caddis|ismopuppan|f-ismo|foam-mayfly-emerger|baetis-medium|baetis-dark|aurivillii-14|biot-dun-aurivillii|leptoklekker|leptonymfa|marginata|ignita-16|comparadun-|profile-spinner|antonios-emerger|vespertina|pliva-shuttlecock/.test(
      s,
    )
  ) {
    return 'Kläckare';
  }

  if (
    /wet|streamer|woolly|zulu-double|march-brown-double|vi-menn|verre-enn|olsen-double|zulu-silver|silver-double/.test(s)
  ) {
    return 'Våtflugor';
  }

  if (
    /caddis|parachute|ant|hopper|beetle|gnat|mosquito|daddy|flying-ant|high-viz|gfa-hopper|griffiths|black-gnat|foam-|bibio|adams-|zulu-|red-tag|vulgata-dun|danica-dun|gl-vulgata|gl-danica|sulphurea|comparadun-sulphur|spent-spinner|comparadun-bwo|parachute-black|parachute-ant|parachute-long|flying-ant|lasius-flying|rufa-flying|rs-glue-ant|skogsmaur|stokkmaur|russer-flua|foam-beetle|foam-spider|tsjernobyl|gl-classic-long|cdc-daddy|cdc-and-foam|faux-mini|yellow-owl|antonios-quill|transparant-ant|foam-flying|mallard|black-flying-ant|hopper-bibio/.test(
      s,
    )
  ) {
    return 'Torrflugor';
  }

  return 'Övrigt';
}

export function groupByFlyType(items) {
  const map = new Map();
  for (const it of items) {
    const t = classifyFlyType(it);
    if (!map.has(t)) map.set(t, []);
    map.get(t).push(it);
  }
  for (const arr of map.values()) {
    arr.sort((a, b) => a.name.localeCompare(b.name, 'sv'));
  }
  return map;
}

/** Dela in i rader om 2 för grid */
export function chunkPairs(items, size = 2) {
  const rows = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
}
