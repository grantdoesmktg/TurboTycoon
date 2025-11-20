
import React from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Path, Line, Circle, G, Text as SvgText } from 'react-native-svg';
import { CONFIG } from '../../lib/turboTycoon/gameConfig';

interface SpeedometerProps {
  rpm: number;
  gear: number;
  isRedlining: boolean;
  showPerfectShift: boolean;
  isOverheating: boolean;
}

const Speedometer: React.FC<SpeedometerProps> = ({ rpm, gear, isRedlining, showPerfectShift, isOverheating }) => {
  const radius = 120;
  const stroke = 15;
  const normalizedRPM = Math.min(rpm, CONFIG.MAX_RPM);
  const maxRPM = CONFIG.MAX_RPM;

  const startAngle = -135;
  const endAngle = 135;
  const totalAngle = endAngle - startAngle;
  const currentAngle = startAngle + (normalizedRPM / maxRPM) * totalAngle;

  const polarToCartesian = (cx: number, cy: number, r: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: cx + (r * Math.cos(angleInRadians)),
      y: cy + (r * Math.sin(angleInRadians))
    };
  };

  const cx = 150;
  const cy = 150;

  // Background Arc
  const start = polarToCartesian(cx, cy, radius, startAngle);
  const end = polarToCartesian(cx, cy, radius, endAngle);
  const largeArcFlag = totalAngle <= 180 ? "0" : "1";
  const dBg = [
    "M", start.x, start.y,
    "A", radius, radius, 0, largeArcFlag, 1, end.x, end.y
  ].join(" ");

  // Redline Arc (7000-8000)
  const redlineStartAngle = startAngle + (CONFIG.REDLINE / maxRPM) * totalAngle;
  const redlineStart = polarToCartesian(cx, cy, radius, redlineStartAngle);
  const dRedline = [
    "M", redlineStart.x, redlineStart.y,
    "A", radius, radius, 0, 0, 1, end.x, end.y
  ].join(" ");

  // Ticks
  const ticks = Array.from({ length: 9 }).map((_, i) => {
    const tickRPM = i * 1000;
    const tickAngle = startAngle + (tickRPM / maxRPM) * totalAngle;
    const p1 = polarToCartesian(cx, cy, radius - 20, tickAngle);
    const p2 = polarToCartesian(cx, cy, radius - 30, tickAngle);
    return (
      <Line
        key={i}
        x1={p1.x} y1={p1.y}
        x2={p2.x} y2={p2.y}
        stroke={i >= 7 ? "#ef4444" : "#94a3b8"}
        strokeWidth="2"
      />
    );
  });

  // Needle Animation Logic
  // Note: For 100ms tick rate, standard state update is smooth enough.
  // Complex reanimated logic skipped for simplicity/performance in this specific context
  const needleTransform = `rotate(${currentAngle}, ${cx}, ${cy})`;

  return (
    <View style={styles.container}>
      {isOverheating && <View style={styles.glowRed} />}
      <Svg height="240" width="300" viewBox="0 0 300 220">
        {/* Gauge Background */}
        <Path d={dBg} fill="none" stroke="#1e293b" strokeWidth={stroke} strokeLinecap="round" />
        
        {/* Redline Zone */}
        <Path 
          d={dRedline} 
          fill="none" 
          stroke="#ef4444" 
          strokeWidth={stroke} 
          strokeLinecap="round"
          opacity={isOverheating ? 1 : 0.6}
        />

        {/* Ticks */}
        {ticks}

        {/* Needle */}
        <G transform={needleTransform}>
          <Line x1={cx} y1={cy} x2={cx} y2={cy - radius + 10} stroke={isRedlining ? "#00FFD9" : "#ef4444"} strokeWidth="4" strokeLinecap="round" />
          <Circle cx={cx} cy={cy} r="8" fill="#0f172a" stroke={isRedlining ? "#00FFD9" : "#ef4444"} strokeWidth="2" />
        </G>

        {/* Gear Text */}
        <SvgText
          x={cx}
          y={cy + 50}
          textAnchor="middle"
          fill="white"
          fontSize="48"
          fontWeight="bold"
          fontFamily="monospace"
        >
          {gear}
        </SvgText>
        <SvgText
          x={cx}
          y={cy + 70}
          textAnchor="middle"
          fill="#64748b"
          fontSize="12"
          fontWeight="bold"
        >
          GEAR
        </SvgText>
      </Svg>

      {showPerfectShift && (
        <View style={styles.perfectShiftContainer}>
           <Text style={styles.perfectShiftText}>PERFECT SHIFT!</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 240,
  },
  glowRed: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(239,68,68,0.2)',
  },
  perfectShiftContainer: {
    position: 'absolute',
    top: 60,
    alignItems: 'center',
  },
  perfectShiftText: {
    color: '#00FFD9',
    fontSize: 20,
    fontWeight: '900',
    fontStyle: 'italic',
    textShadowColor: 'rgba(0, 255, 217, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  }
});

export default Speedometer;
