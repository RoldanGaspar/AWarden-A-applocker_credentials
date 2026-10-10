export const motion = {
  duration: {
    press: 120,
    backdrop: 180,
    modal: 280,
    close: 180,
    screen: 220,
  },
  pressScale: 0.975,
  pressOpacity: 0.88,
  screenOffset: 10,
  spring: {
    tension: 240,
    friction: 20,
  },
} as const;
