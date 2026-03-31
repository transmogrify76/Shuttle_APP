import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

export default function Header({ title }) {
  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#ffffff',
  },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    letterSpacing: -0.5,
  },
});