import { Image, StyleSheet, View } from 'react-native';

export function RoomBackground() {
  return (
    <View style={StyleSheet.absoluteFill}>
      <Image source={require('../../../assets/images/backyard.png')} style={styles.backgroundImage} resizeMode="cover" />
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
});
