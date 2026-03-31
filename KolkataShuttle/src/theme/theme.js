import { DefaultTheme } from 'react-native-paper';

export const darkTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#10b981',        // green accent
    background: '#000000',     // black background
    surface: '#1a1a1a',        // card background
    text: '#ffffff',           // white text
    onSurface: '#ffffff',      // text on surface
    disabled: '#666666',
    placeholder: '#aaaaaa',
    backdrop: 'rgba(0,0,0,0.8)',
    notification: '#10b981',
    error: '#ef4444',
  },
  roundness: 12,
};