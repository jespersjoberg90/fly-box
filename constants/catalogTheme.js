/**
 * Tema för katalogen: lugn natur/skogs känsla, läsbart utomhus.
 */
export const catalogTheme = {
  bg: '#EEF2ED',
  bgDeep: '#E2E9E0',
  card: '#FEFDF9',
  cardBorder: '#D4E0D6',
  primary: '#2A4D3F',
  primaryLight: '#3D6B56',
  accent: '#B8953C',
  accentSoft: '#E8DCC4',
  text: '#1A2E24',
  textSecondary: '#3D5248',
  textMuted: '#6B7F76',
  onPrimary: '#FEFDF9',
  shadow: 'rgba(26, 46, 36, 0.08)',
  searchBg: '#FEFDF9',
  iconBg: '#D8E8DC',
  ripple: 'rgba(42, 77, 63, 0.08)',
};

export function categoryIconName(flyType) {
  const map = {
    Torrflugor: 'water-outline',
    Kläckare: 'arrow-up-circle-outline',
    Nymfer: 'layers-outline',
    Euronymfer: 'git-network-outline',
    Våtflugor: 'rainy-outline',
    Övrigt: 'leaf-outline',
  };
  return map[flyType] ?? 'ellipse-outline';
}
