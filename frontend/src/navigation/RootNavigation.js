// This file creates a navigation reference that can be imported
// anywhere in the app to navigate without needing the navigation prop

import { createRef } from 'react';

export const navigationRef = createRef();

// Navigation functions that can be called from outside of React components
export function navigate(name, params) {
  if (navigationRef.current) {
    navigationRef.current.navigate(name, params);
  } else {
    console.warn('Navigation attempted before navigation is ready');
  }
}

export function reset(state) {
  if (navigationRef.current) {
    navigationRef.current.reset(state);
  } else {
    console.warn('Navigation reset attempted before navigation is ready');
  }
}

export function goBack() {
  if (navigationRef.current && navigationRef.current.canGoBack()) {
    navigationRef.current.goBack();
  } else {
    console.warn('Cannot go back or navigation is not ready');
  }
}