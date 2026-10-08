import { tokens } from './tokens';

export function useTheme() {
  return {
    colors: tokens.colors,
    isDark: false,
  };
}
