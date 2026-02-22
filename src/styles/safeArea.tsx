import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

type SafeAreaEdges = 'top' | 'bottom' | 'left' | 'right';

interface SafeAreaProps {
  children: React.ReactNode;
  edges?: SafeAreaEdges[];
  style?: ViewStyle;
  /** Use SafeAreaView (default) or apply insets as padding to a regular View */
  asPadding?: boolean;
}

/**
 * Wraps content respecting device safe areas (notch, status bar, home indicator).
 * Use asPadding when you need a View with padding instead of SafeAreaView (e.g. for ScrollView).
 */
export function SafeArea({
  children,
  edges = ['top', 'bottom', 'left', 'right'],
  style,
  asPadding = false,
}: SafeAreaProps) {
  if (asPadding) {
    return (
      <SafeAreaInsetsPadding edges={edges} style={style}>
        {children}
      </SafeAreaInsetsPadding>
    );
  }

  return (
    <SafeAreaView style={[styles.flex, style]} edges={edges}>
      {children}
    </SafeAreaView>
  );
}

function SafeAreaInsetsPadding({
  children,
  edges,
  style,
}: {
  children: React.ReactNode;
  edges: SafeAreaEdges[];
  style?: ViewStyle;
}) {
  const insets = useSafeAreaInsets();

  const paddingStyle = {
    paddingTop: edges.includes('top') ? insets.top : 0,
    paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
    paddingLeft: edges.includes('left') ? insets.left : 0,
    paddingRight: edges.includes('right') ? insets.right : 0,
  };

  return <View style={[styles.flex, paddingStyle, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});

export { useSafeAreaInsets };
