import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FONTS, GUTTER, TEXT_ON_ART } from '@/constants/theme';
import { formatDateTime, greetingFor } from '@/domain/time';
import type { TimeOfDay } from '@/domain/types';

interface TopStatusBarProps {
  timeOfDay: TimeOfDay;
}

export function TopStatusBar({ timeOfDay }: TopStatusBarProps) {
  const [greeting] = useState(() => greetingFor(timeOfDay));
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>{greeting}</Text>
      <Text style={styles.datetime}>{formatDateTime(now)}</Text>
    </View>
  );
}

// Kept deliberately quiet: the pet's name is the focal point on this screen, so the
// greeting reads as a caption over the sky rather than a headline.
const styles = StyleSheet.create({
  container: {
    paddingHorizontal: GUTTER,
  },
  greeting: {
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
    color: '#FFFFFF',
    ...TEXT_ON_ART,
  },
  datetime: {
    fontFamily: FONTS.bodyMedium,
    // 13, not 12: the smallest readable size on a phone, and this sits over a picture.
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.88,
    marginTop: 1,
    ...TEXT_ON_ART,
  },
});
