import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { COLORS, GUTTER, SPACING } from '@/constants/theme';

interface BottomActionBarProps {
  onFood: () => void;
  onPlay: () => void;
}

export function BottomActionBar({ onFood, onPlay }: BottomActionBarProps) {
  return (
    <View style={styles.row}>
      <Button
        label="Еда"
        icon={<Ionicons name="restaurant" size={18} color={COLORS.onPrimary} />}
        onPress={onFood}
        style={styles.button}
      />
      <Button
        label="Играть"
        icon={<Ionicons name="tennisball-outline" size={18} color={COLORS.text} />}
        onPress={onPlay}
        variant="secondary"
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: GUTTER,
  },
  button: {
    flex: 1,
  },
});
