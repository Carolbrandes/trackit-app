import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useThemeContext } from '../contexts/ThemeContext';

export function Spinner() {
  const { theme } = useThemeContext();

  return (
    <ActivityIndicator
      size="small"
      color={theme.colors.white}
      style={styles.spinner}
    />
  );
}

const styles = StyleSheet.create({
  spinner: {
    marginRight: 8,
  },
});
