
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';

interface RevButtonProps {
  onRev: () => void;
}

const RevButton: React.FC<RevButtonProps> = ({ onRev }) => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onRev();
  };

  return (
    <View style={styles.container}>
       {/* Note: We mostly handle taps globally in the speedometer area in the new design, 
           but keeping this component if needed for specific layouts */}
       <TouchableOpacity
          activeOpacity={0.8}
          onPress={handlePress}
          style={styles.button}
       >
          <Text style={styles.text}>REV</Text>
          <Text style={styles.subText}>TAP TO BUILD RPM</Text>
       </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 20,
  },
  button: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#ef4444', // Red
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 8,
    borderColor: '#0f172a',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  text: {
    fontSize: 40,
    fontWeight: '900',
    fontStyle: 'italic',
    color: 'white',
  },
  subText: {
    color: '#fecaca',
    fontSize: 10,
    marginTop: 4,
  }
});

export default RevButton;
