const GUIDE = {
  cold: ['Nymph', 'Midge', 'Perdigon'],
  mild: ['Caddis', 'Mayfly', 'Nymph'],
  warm: ['Ant', 'Caddis', 'Mayfly'],
};

export function getRecommendedFlies({ month, weatherMain }) {
  if (month <= 3 || month >= 11) return GUIDE.cold;
  if (weatherMain === 'Rain' || weatherMain === 'Clouds') return GUIDE.mild;
  return GUIDE.warm;
}
