import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import * as d3 from 'd3-shape';
import { StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, Stop } from 'react-native-svg';

type CategoryData = {
    name: string;
    amount: number;
    color: string;
    icon: keyof typeof Ionicons.glyphMap;
};

type InfographicChartProps = {
    data: CategoryData[];
    totalSpent: number;
    size?: number;
    onSelectCategory?: (index: number | null) => void;
    selectedIndex?: number | null;
};

const polarToCartesian = (cx: number, cy: number, r: number, angle: number) => {
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
};

export function InfographicChart({
    data,
    totalSpent,
    size = 300,
    onSelectCategory,
    selectedIndex
}: InfographicChartProps) {
    const colorScheme = useColorScheme();
    const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

    const cx = size / 2;
    const cy = size / 2;
    const innerRadius = size * 0.18;
    const outerRadius = size * 0.44;
    const cornerRadius = Math.max(4, size * 0.04); // Scale corner radius with size

    // Compact mode when chart is shrunk
    const isCompact = size < 200;

    const total = data.reduce((sum, item) => sum + Math.abs(item.amount), 0);

    // Create pie generator
    const pieGenerator = d3.pie<CategoryData>()
        .value(d => Math.abs(d.amount))
        .padAngle(0.03) // Gap between slices
        .sort(null); // Keep original order

    // Create arc generator with cornerRadius for curved blade effect
    const arcGenerator = d3.arc<d3.PieArcDatum<CategoryData>>()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius)
        .cornerRadius(cornerRadius);

    // Generate pie slices
    const pieData = pieGenerator(data);

    // Calculate icon positions
    const slices = pieData.map((slice, index) => {
        const midAngle = (slice.startAngle + slice.endAngle) / 2 - Math.PI / 2;
        const iconRadius = (innerRadius + outerRadius) / 2;
        const iconPos = polarToCartesian(cx, cy, iconRadius, midAngle);
        const percentage = total > 0 ? (Math.abs(slice.data.amount) / total) * 100 : 0;

        return {
            ...slice,
            iconPos,
            percentage,
            path: arcGenerator(slice) || '',
        };
    });

    return (
        <View style={styles.container}>
            <View style={styles.chartContainer}>
                <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    <Defs>
                        {slices.map((slice, index) => (
                            <LinearGradient key={`grad-${index}`} id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                <Stop offset="0%" stopColor={slice.data.color} stopOpacity="1" />
                                <Stop offset="100%" stopColor={slice.data.color} stopOpacity="0.75" />
                            </LinearGradient>
                        ))}
                    </Defs>

                    {/* Outer dashed ring */}
                    <Circle cx={cx} cy={cy} r={outerRadius + 15} fill="none" stroke={theme.separator} strokeWidth={1} strokeDasharray="4,6" opacity={0.4} />

                    {/* Pie slices with curved corners (d3-shape) */}
                    <G x={cx} y={cy}>
                        {slices.map((slice, index) => (
                            <Path
                                key={index}
                                d={slice.path}
                                fill={`url(#gradient-${index})`}
                                stroke={theme.background}
                                strokeWidth={2}
                                opacity={selectedIndex !== null && selectedIndex !== index ? 0.5 : 1}
                                onPress={() => onSelectCategory?.(selectedIndex === index ? null : index)}
                            />
                        ))}
                    </G>

                    {/* Center circle */}
                    <Circle cx={cx} cy={cy} r={innerRadius - 4} fill={theme.card} stroke={theme.separator} strokeWidth={3} />
                    <Circle cx={cx} cy={cy} r={innerRadius - 12} fill="none" stroke={theme.tint} strokeWidth={2} opacity={0.15} />
                </Svg>

                {/* Icons - hidden when compact OR when segment is too small */}
                {!isCompact && slices.map((slice, index) => {
                    // Only show icon if segment is large enough (>= 12%)
                    if (slice.percentage < 12) return null;
                    return (
                        <TouchableOpacity
                            key={`icon-${index}`}
                            style={[styles.iconCircle, { left: slice.iconPos.x - 16, top: slice.iconPos.y - 16, backgroundColor: slice.data.color }]}
                            onPress={() => onSelectCategory?.(selectedIndex === index ? null : index)}
                        >
                            <Ionicons name={slice.data.icon} size={16} color="#FFF" />
                        </TouchableOpacity>
                    );
                })}

                {/* Center text */}
                <View style={[styles.centerContent, { left: cx - 30, top: cy - 20 }]}>
                    {!isCompact && <Text style={[styles.centerNumber, { color: theme.text }]}>{data.length}</Text>}
                    {!isCompact && <Text style={[styles.centerLabel, { color: theme.textSecondary }]}>Categories</Text>}
                </View>
            </View>

            {/* Labels - simplified when compact */}
            <View style={styles.labelsRow}>
                {slices.map((slice, index) => (
                    <TouchableOpacity
                        key={`label-${index}`}
                        style={[styles.labelPill, { backgroundColor: selectedIndex === index ? slice.data.color : theme.card, borderColor: slice.data.color }]}
                        onPress={() => onSelectCategory?.(selectedIndex === index ? null : index)}
                    >
                        <View style={[styles.labelDot, { backgroundColor: slice.data.color }]} />
                        <Text style={[styles.labelText, { color: selectedIndex === index ? '#FFF' : theme.text }]}>{slice.data.name}</Text>
                        {!isCompact && (
                            <Text style={[styles.labelPercent, { color: selectedIndex === index ? '#FFF' : slice.data.color }]}>{slice.percentage.toFixed(0)}%</Text>
                        )}
                    </TouchableOpacity>
                ))}
            </View>

            {selectedIndex !== null && selectedIndex !== undefined && slices[selectedIndex] && (() => {
                const selectedSlice = slices[selectedIndex];
                return (
                    <View style={[styles.detailCard, { backgroundColor: theme.card }]}>
                        <View style={[styles.detailIcon, { backgroundColor: selectedSlice.data.color + '20' }]}>
                            <Ionicons name={selectedSlice.data.icon} size={24} color={selectedSlice.data.color} />
                        </View>
                        <View>
                            <Text style={[styles.detailName, { color: theme.text }]}>{selectedSlice.data.name}</Text>
                            <Text style={[styles.detailAmount, { color: selectedSlice.data.color }]}>${Math.abs(selectedSlice.data.amount).toFixed(2)}</Text>
                        </View>
                    </View>
                );
            })()}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { alignItems: 'center' },
    chartContainer: { position: 'relative' },
    iconCircle: { position: 'absolute', width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 4 },
    centerContent: { position: 'absolute', width: 60, alignItems: 'center' },
    centerNumber: { fontSize: 24, fontWeight: '700' },
    centerLabel: { fontSize: 9 },
    labelsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 20, paddingHorizontal: 8 },
    labelPill: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, gap: 6 },
    labelDot: { width: 8, height: 8, borderRadius: 4 },
    labelText: { fontSize: 12, fontWeight: '500' },
    labelPercent: { fontSize: 12, fontWeight: '700' },
    detailCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginTop: 16, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
    detailIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
    detailName: { fontSize: 16, fontWeight: '600' },
    detailAmount: { fontSize: 20, fontWeight: '700' },
});
