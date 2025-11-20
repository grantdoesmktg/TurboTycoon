
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { calculatePartCost, formatHP } from '../../lib/turboTycoon/gameLogic';
import { MANUAL_UPGRADE_BASE_COST, MANUAL_UPGRADE_SCALING } from '../../lib/turboTycoon/gameConfig';

interface ManualUpgradeCardProps {
  type: 'throttle' | 'ecu';
  level: number;
  currentHp: bigint;
  onBuy: () => void;
}

const ManualUpgradeCard: React.FC<ManualUpgradeCardProps> = ({ type, level, currentHp, onBuy }) => {
  const cost = calculatePartCost(MANUAL_UPGRADE_BASE_COST, MANUAL_UPGRADE_SCALING, level);
  const canAfford = currentHp >= cost;
  
  const title = type === 'throttle' ? 'Throttle' : 'ECU Chip';
  const effect = type === 'throttle' ? '+5 HP/Click' : '+5 RPM/Click';

  return (
    <TouchableOpacity
      disabled={!canAfford}
      onPress={onBuy}
      style={[styles.card, !canAfford && styles.cardDisabled]}
    >
      <View style={styles.header}>
         {/* Icon placeholder could go here */}
         <View style={styles.badge}>
            <Text style={styles.badgeText}>Lvl {level}</Text>
         </View>
      </View>
      
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.effect}>{effect}</Text>
      <Text style={styles.cost}>{formatHP(cost)} HP</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 6,
  },
  cardDisabled: {
    opacity: 0.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  badge: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  badgeText: {
    color: '#cbd5e1',
    fontSize: 10,
    fontWeight: 'bold',
  },
  title: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 2,
  },
  effect: {
    color: '#94a3b8',
    fontSize: 10,
    marginBottom: 4,
  },
  cost: {
    color: '#FBBF24', // Yellow
    fontFamily: 'monospace', // iOS default mono
    fontSize: 12,
    fontWeight: 'bold',
  }
});

export default ManualUpgradeCard;
