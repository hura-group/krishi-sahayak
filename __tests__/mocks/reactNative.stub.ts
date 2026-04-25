// Minimal React Native stub for Jest (Node environment)
module.exports = {
  Platform:      { OS: 'ios', select: (obj: any) => obj.ios ?? obj.default },
  StyleSheet:    { create: (s: any) => s, flatten: (s: any) => s },
  Animated: {
    Value:    class { constructor(_v: any) {} },
    timing:   jest.fn(() => ({ start: jest.fn() })),
    spring:   jest.fn(() => ({ start: jest.fn() })),
    sequence: jest.fn(() => ({ start: jest.fn() })),
  },
  Linking: {
    openURL:    jest.fn().mockResolvedValue(undefined),
    canOpenURL: jest.fn().mockResolvedValue(true),
  },
  Alert:   { alert: jest.fn() },
  Dimensions: { get: jest.fn(() => ({ width: 375, height: 812 })) },
};
