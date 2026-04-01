import React from 'react';
import { Appbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
export default function Header({ title }) {
  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: '#000' }}>
      <Appbar.Header style={{ backgroundColor: '#000', elevation: 0 }}>
        <Appbar.Content title={title} titleStyle={{ color: '#fff', fontWeight: 'bold' }} />
      </Appbar.Header>
    </SafeAreaView>
  );
}