const React = require('react');
const { View } = require('react-native');

const MapView = () => React.createElement(View, null);
MapView.Animated = () => React.createElement(View, null);

const Marker = () => React.createElement(View, null);
const Circle = () => React.createElement(View, null);
const Polygon = () => React.createElement(View, null);
const Polyline = () => React.createElement(View, null);
const Callout = () => React.createElement(View, null);

const PROVIDER_GOOGLE = 'google';
const PROVIDER_DEFAULT = null;

module.exports = {
  __esModule: true,
  default: MapView,
  Marker,
  Circle,
  Polygon,
  Polyline,
  Callout,
  PROVIDER_GOOGLE,
  PROVIDER_DEFAULT,
};