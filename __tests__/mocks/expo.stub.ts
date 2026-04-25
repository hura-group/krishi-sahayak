// Generic Expo module stub
module.exports = {
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getCurrentPositionAsync:           jest.fn().mockResolvedValue({ coords: { latitude: 23.0, longitude: 72.5 } }),
  getPermissionsAsync:               jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync:           jest.fn().mockResolvedValue({ status: 'granted' }),
  getExpoPushTokenAsync:             jest.fn().mockResolvedValue({ data: 'ExponentPushToken[test]' }),
  setNotificationHandler:            jest.fn(),
  setNotificationChannelAsync:       jest.fn(),
  AndroidImportance:                 { HIGH: 4 },
  isDevice:                          true,
};
