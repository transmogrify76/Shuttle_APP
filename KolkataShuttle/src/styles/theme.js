import { DefaultTheme } from 'react-native-paper';

export const darkTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#C9A84C',        // gold accent
    background: '#0A0A0F',     // dark background (matches C.bg)
    surface: '#13131A',        // card background (matches C.surface)
    text: '#F0EFE8',           // white text (matches C.textPrimary)
    onSurface: '#F0EFE8',      // text on surface
    disabled: '#5C5A65',       // muted (matches C.textMuted)
    placeholder: '#9997A0',    // secondary text
    backdrop: 'rgba(0,0,0,0.8)',
    notification: '#C9A84C',   // gold for notifications
    error: '#E05252',          // red
  },
  roundness: 12,
};