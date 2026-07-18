import React from 'react';
import { View } from 'react-native';

function MapView(props) {
  return React.createElement(View, props, props.children);
}

MapView.Animated = MapView;

const Marker = (props) => React.createElement(View, props, props.children);
const Circle = (props) => React.createElement(View, props, props.children);
const Polygon = (props) => React.createElement(View, props, props.children);
const Polyline = (props) => React.createElement(View, props, props.children);
const Callout = (props) => React.createElement(View, props, props.children);

const PROVIDER_GOOGLE = 'google';
const PROVIDER_DEFAULT = null;

export default MapView;
export { Marker, Circle, Polygon, Polyline, Callout, PROVIDER_GOOGLE, PROVIDER_DEFAULT };
