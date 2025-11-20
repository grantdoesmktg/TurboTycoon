
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { PartDefinition } from '../../lib/turboTycoon/types';
import { calculatePartCost, calculatePartOutput, formatHP } from '../../lib/turboTycoon/gameLogic';

interface PartCardProps {
  part: PartDefinition;
  level: number;
  currentHp: bigint;
  onBuy: (part: PartDefinition) => void;
}

const PartCard: React.FC<PartCardProps> = ({ part, level, currentHp, onBuy }) => {
  const cost = calculatePartCost(part.baseCost, part.costScaling, level);
  const currentOutput = calculatePartOutput(part.baseOutput, part.outputScaling, level);
  const nextOutput = calculatePartOutput(part.baseOutput, part.outputScaling, level + 1);
  const canAfford = currentHp >= cost;

  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <View style={styles.headerRow}>
          <Text style={styles.name}>{part.name}</Text>
          <View style={styles.levelBadge}>
             <Text style={styles.levelText}>L{level}</Text>
          </View>
        </View>
        
        <Text style={styles.stats}>
          <Text style={{ color: level > 0 ? 'white' : '#64748b' }}>{formatHP(BigInt(currentOutput))}/s</Text>
          <Text style={styles.nextStats}> → {formatHP(BigInt(nextOutput))}/s</Text>
        </Text>
      </View>

      <TouchableOpacity
        disabled={!canAfford}
        onPress={() => onBuy(part)}
        style={[styles.button, !canAfford && styles.buttonDisabled]}
      >
        <Text style={[styles.cost, !canAfford && styles.costDisabled]}>
          {formatHP(cost)}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)', // glass-panel equivalent
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  info: {
    flex: 1,
    marginRight: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    marginRight: 8,
  },
  levelBadge: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  levelText: {
    color: '#cbd5e1',
    fontSize: 10,
    fontWeight: 'bold',
  },
  stats: {
    fontSize: 12,
    color: '#94a3b8',
  },
  nextStats: {
    color: '#10B981', // neon green
    fontSize: 11,
  },
  button: {
    backgroundColor: 'rgba(0, 255, 217, 0.1)',
    borderColor: 'rgba(0, 255, 217, 0.5)',
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  cost: {
    color: '#00FFD9',
    fontWeight: 'bold',
    fontSize: 12,
  },
  costDisabled: {
    color: '#64748b',
  },
});

export default PartCard;
