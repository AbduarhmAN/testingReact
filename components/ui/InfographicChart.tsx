import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import * as d3 from 'd3-shape';
import React, { useCallback, useEffect, useMemo } from 'react';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';
import Animated, {
    Easing,
    Extrapolate,
    FadeIn,
    FadeOut,
    interpolate,
    SharedValue,
    SlideInDown,
    useAnimatedProps,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, G, LinearGradient, Path, Stop } from 'react-native-svg';

// ============================================================================
// CONSTANTS
// ============================================================================

const MIN_ICON_PERCENTAGE = 12;
const CORNER_RADIUS_MAX = 12;
const ANIMATION_DURATION = 600;
const SPRING_CONFIG = { damping: 15, stiffness: 100 };

// ============================================================================
// TYPES
// ============================================================================

interface CategoryData {
    id?: string;
    name: string;
    amount: number;
    color: string;
    icon: keyof typeof Ionicons.glyphMap;
}

interface SliceData extends d3.PieArcDatum<CategoryData> {
    iconPos: { x: number; y: number };
    percentage: number;
    path: string;
}

interface InfographicChartProps {
    data: CategoryData[];
    size?: number;
    onSelectCategory?: (index: number | null) => void;
    selectedIndex?: number | null;
    scrollY?: SharedValue<number>;
}

// ============================================================================
// ANIMATED COMPONENTS
// ============================================================================

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedView = Animated.View;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function polarToCartesian(cx: number, cy: number, r: number, angle: number): { x: number; y: number } {
    const adjustedAngle = angle - Math.PI / 2;
    return {
        x: cx + r * Math.cos(adjustedAngle),
        y: cy + r * Math.sin(adjustedAngle),
    };
}

function getStableKey(item: CategoryData, index: number): string {
    return item.id ?? `${item.name}-${index}`;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface AnimatedSliceProps {
    slice: SliceData;
    gradientId: string;
    isSelected: boolean;
    isOtherSelected: boolean;
    onPress: () => void;
    strokeColor: string;
    animationDelay: number;
}

const AnimatedSlice = React.memo(function AnimatedSlice({
    slice,
    gradientId,
    isSelected,
    isOtherSelected,
    onPress,
    strokeColor,
    animationDelay,
}: AnimatedSliceProps) {
    const progress = useSharedValue(0);
    const opacity = useSharedValue(1);

    useEffect(() => {
        progress.value = withDelay(
            animationDelay,
            withTiming(1, { duration: ANIMATION_DURATION, easing: Easing.out(Easing.cubic) })
        );
    }, [progress, animationDelay]);

    useEffect(() => {
        opacity.value = withTiming(isOtherSelected ? 0.4 : 1, { duration: 200 });
    }, [isOtherSelected, opacity]);

    const animatedProps = useAnimatedProps(() => ({
        opacity: opacity.value,
    }));

    return (
        <AnimatedPath
            d={slice.path}
            fill={`url(#${gradientId})`}
            stroke={strokeColor}
            strokeWidth={2}
            onPress={onPress}
            animatedProps={animatedProps}
        />
    );
});

interface AnimatedIconProps {
    slice: SliceData;
    index: number;
    isSelected: boolean;
    onPress: () => void;
}

const AnimatedIcon = React.memo(function AnimatedIcon({
    slice,
    index,
    isSelected,
    onPress,
}: AnimatedIconProps) {
    const scale = useSharedValue(0);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);

    useEffect(() => {
        const delay = index * 50 + 300;
        scale.value = withDelay(delay, withSpring(1, SPRING_CONFIG));
    }, [scale, index]);

    useEffect(() => {
        translateX.value = withSpring(slice.iconPos.x - 16, SPRING_CONFIG);
        translateY.value = withSpring(slice.iconPos.y - 16, SPRING_CONFIG);
    }, [slice.iconPos, translateX, translateY]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: scale.value * (isSelected ? 1.15 : 1) },
        ],
        opacity: interpolate(scale.value, [0, 1], [0, 1]),
    }));

    return (
        <AnimatedView
            style={[
                styles.iconCircle,
                { backgroundColor: slice.data.color },
                animatedStyle,
            ]}
            onTouchEnd={onPress}
            accessibilityRole="button"
            accessibilityLabel={`Select ${slice.data.name}`}
        >
            <Ionicons name={slice.data.icon} size={16} color="#FFF" />
        </AnimatedView>
    );
});

interface LabelPillProps {
    slice: SliceData;
    index: number;
    isSelected: boolean;
    showPercentage: boolean;
    onPress: () => void;
    theme: typeof Colors.light;
}

const LabelPill = React.memo(function LabelPill({
    slice,
    index,
    isSelected,
    showPercentage,
    onPress,
    theme,
}: LabelPillProps) {
    const animatedStyle = useAnimatedStyle(() => ({
        backgroundColor: withTiming(isSelected ? slice.data.color : theme.card, { duration: 200 }),
    }));

    return (
        <AnimatedView
            entering={FadeIn.delay(index * 30)}
            style={[
                styles.labelPill,
                { borderColor: slice.data.color },
                animatedStyle,
            ]}
            onTouchEnd={onPress}
            accessibilityRole="button"
            accessibilityLabel={`${slice.data.name}, ${slice.percentage.toFixed(0)} percent. ${isSelected ? 'Selected' : 'Tap to select'}`}
        >
            <View style={[styles.labelDot, { backgroundColor: slice.data.color }]} />
            <Text style={[styles.labelText, { color: isSelected ? '#FFF' : theme.text }]}>
                {slice.data.name}
            </Text>
            {showPercentage && (
                <Text style={[styles.labelPercent, { color: isSelected ? '#FFF' : slice.data.color }]}>
                    {slice.percentage.toFixed(0)}%
                </Text>
            )}
        </AnimatedView>
    );
});

interface DetailCardProps {
    slice: SliceData;
    theme: typeof Colors.light;
}

const DetailCard = React.memo(function DetailCard({ slice, theme }: DetailCardProps) {
    return (
        <AnimatedView
            entering={SlideInDown.duration(300).springify()}
            exiting={FadeOut.duration(150)}
            style={[styles.detailCard, { backgroundColor: theme.card }]}
        >
            <View style={[styles.detailIcon, { backgroundColor: slice.data.color + '20' }]}>
                <Ionicons name={slice.data.icon} size={24} color={slice.data.color} />
            </View>
            <View>
                <Text style={[styles.detailName, { color: theme.text }]}>{slice.data.name}</Text>
                <Text style={[styles.detailAmount, { color: slice.data.color }]}>
                    ${Math.abs(slice.data.amount).toFixed(2)}
                </Text>
            </View>
        </AnimatedView>
    );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function InfographicChartInner({
    data,
    size = 300,
    onSelectCategory,
    selectedIndex = null,
    scrollY,
}: InfographicChartProps) {
    const colorScheme = useColorScheme();
    const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

    // ========================================================================
    // MEMOIZED CALCULATIONS
    // ========================================================================

    const dimensions = useMemo(() => {
        const cx = size / 2;
        const cy = size / 2;
        const innerRadius = size * 0.18;
        const outerRadius = size * 0.44;
        const cornerRadius = Math.min(size * 0.04, CORNER_RADIUS_MAX);
        return { cx, cy, innerRadius, outerRadius, cornerRadius };
    }, [size]);

    // Animated Styles
    const containerAnimatedStyle = useAnimatedStyle(() => {
        if (!scrollY) return {};
        const scale = interpolate(scrollY.value, [0, 150], [1, 0.6], Extrapolate.CLAMP);
        const translateY = interpolate(scrollY.value, [0, 150], [0, -30], Extrapolate.CLAMP);

        return {
            transform: [
                { scale },
                { translateY }
            ]
        };
    });

    const contentOpacityStyle = useAnimatedStyle(() => {
        if (!scrollY) return { opacity: 1 };
        const opacity = interpolate(scrollY.value, [0, 50], [1, 0], Extrapolate.CLAMP);
        return { opacity };
    });

    const pieGenerator = useMemo(() =>
        d3.pie<CategoryData>()
            .value(d => Math.abs(d.amount))
            .padAngle(0.03)
            .sort(null),
        []);

    const arcGenerator = useMemo(() =>
        d3.arc<d3.PieArcDatum<CategoryData>>()
            .innerRadius(dimensions.innerRadius)
            .outerRadius(dimensions.outerRadius)
            .cornerRadius(dimensions.cornerRadius),
        [dimensions]);

    const validData = useMemo(() =>
        data.filter(d => Number.isFinite(d.amount) && Math.abs(d.amount) > 0.01),
        [data]);

    const total = useMemo(() =>
        validData.reduce((sum, item) => sum + Math.abs(item.amount), 0),
        [validData]);

    const slices = useMemo((): SliceData[] => {
        if (validData.length === 0) return [];

        const pieData = pieGenerator(validData);

        return pieData.map((slice) => {
            const midAngle = (slice.startAngle + slice.endAngle) / 2;
            const iconRadius = (dimensions.innerRadius + dimensions.outerRadius) / 2;
            const iconPos = polarToCartesian(dimensions.cx, dimensions.cy, iconRadius, midAngle);
            const percentage = total > 0 ? (Math.abs(slice.data.amount) / total) * 100 : 0;
            const path = arcGenerator(slice) || '';

            return { ...slice, iconPos, percentage, path };
        });
    }, [validData, pieGenerator, arcGenerator, dimensions, total]);

    // ========================================================================
    // HANDLERS
    // ========================================================================

    const handleSelectCategory = useCallback((index: number) => {
        onSelectCategory?.(selectedIndex === index ? null : index);
    }, [onSelectCategory, selectedIndex]);

    // ========================================================================
    // EMPTY STATE
    // ========================================================================

    if (slices.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="pie-chart-outline" size={48} color={theme.textSecondary} />
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                    No spending data
                </Text>
            </View>
        );
    }

    // ========================================================================
    // RENDER
    // ========================================================================

    const showIcons = true;
    const showCenterText = true;
    const showPercentages = true; // Always show percentages in labels with this simplified logic

    const selectedSlice = selectedIndex !== null && selectedIndex < slices.length
        ? slices[selectedIndex]
        : null;

    return (
        <AnimatedView style={[styles.container, containerAnimatedStyle]}>
            <View style={styles.chartContainer}>
                <Svg
                    width={size}
                    height={size}
                    viewBox={`0 0 ${size} ${size}`}
                    accessibilityRole="image"
                    accessibilityLabel={`Pie chart with ${slices.length} categories`}
                >
                    <Defs>
                        {slices.map((slice, index) => (
                            <LinearGradient
                                key={getStableKey(slice.data, index)}
                                id={`gradient-${getStableKey(slice.data, index)}`}
                                x1="0%"
                                y1="0%"
                                x2="100%"
                                y2="100%"
                            >
                                <Stop offset="0%" stopColor={slice.data.color} stopOpacity={1} />
                                <Stop offset="100%" stopColor={slice.data.color} stopOpacity={0.75} />
                            </LinearGradient>
                        ))}
                    </Defs>

                    <Circle
                        cx={dimensions.cx}
                        cy={dimensions.cy}
                        r={dimensions.outerRadius + 15}
                        fill="none"
                        stroke={theme.separator}
                        strokeWidth={1}
                        strokeDasharray="4,6"
                        opacity={0.4}
                    />

                    <G x={dimensions.cx} y={dimensions.cy}>
                        {slices.map((slice, index) => (
                            <AnimatedSlice
                                key={getStableKey(slice.data, index)}
                                slice={slice}
                                index={index}
                                gradientId={`gradient-${getStableKey(slice.data, index)}`}
                                isSelected={selectedIndex === index}
                                isOtherSelected={selectedIndex !== null && selectedIndex !== index}
                                onPress={() => handleSelectCategory(index)}
                                strokeColor={theme.background}
                                animationDelay={index * 50}
                            />
                        ))}
                    </G>

                    <Circle
                        cx={dimensions.cx}
                        cy={dimensions.cy}
                        r={dimensions.innerRadius - 4}
                        fill={theme.card}
                        stroke={theme.separator}
                        strokeWidth={2}
                    />
                </Svg>

                {showIcons && slices.map((slice, index) => {
                    if (slice.percentage < MIN_ICON_PERCENTAGE) return null;
                    return (
                        <AnimatedView key={`icon-wrapper-${getStableKey(slice.data, index)}`} style={contentOpacityStyle} pointerEvents="none">
                            <AnimatedIcon
                                key={`icon-${getStableKey(slice.data, index)}`}
                                slice={slice}
                                index={index}
                                isSelected={selectedIndex === index}
                                onPress={() => handleSelectCategory(index)}
                            />
                        </AnimatedView>
                    );
                })}

                {showCenterText && (
                    <AnimatedView style={[styles.centerContent, contentOpacityStyle, {
                        left: dimensions.cx - 30,
                        top: dimensions.cy - 20
                    }]}>
                        <Text style={[styles.centerNumber, { color: theme.text }]}>
                            {validData.length}
                        </Text>
                        <Text style={[styles.centerLabel, { color: theme.textSecondary }]}>
                            Categories
                        </Text>
                    </AnimatedView>
                )}
            </View>

            <View style={styles.labelsRow}>
                {slices.map((slice, index) => (
                    <LabelPill
                        key={`label-${getStableKey(slice.data, index)}`}
                        slice={slice}
                        index={index}
                        isSelected={selectedIndex === index}
                        showPercentage={showPercentages}
                        onPress={() => handleSelectCategory(index)}
                        theme={theme}
                    />
                ))}
            </View>

            {selectedSlice && (
                <DetailCard slice={selectedSlice} theme={theme} />
            )}
        </AnimatedView>
    );
}

// ============================================================================
// MEMOIZED EXPORT
// ============================================================================

export const InfographicChart = React.memo(InfographicChartInner, (prevProps, nextProps) => {
    return (
        prevProps.data === nextProps.data &&
        prevProps.size === nextProps.size &&
        prevProps.selectedIndex === nextProps.selectedIndex &&
        prevProps.scrollY === nextProps.scrollY // Check SharedValue ref equality
    );
});

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
    container: {
        alignItems: 'center'
    },
    chartContainer: {
        position: 'relative'
    },
    iconCircle: {
        position: 'absolute',
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    centerContent: {
        position: 'absolute',
        width: 60,
        alignItems: 'center'
    },
    centerNumber: {
        fontSize: 24,
        fontWeight: '700'
    },
    centerLabel: {
        fontSize: 10
    },
    labelsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8,
        marginTop: 20,
        paddingHorizontal: 8
    },
    labelPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
        gap: 6
    },
    labelDot: {
        width: 8,
        height: 8,
        borderRadius: 4
    },
    labelText: {
        fontSize: 12,
        fontWeight: '500'
    },
    labelPercent: {
        fontSize: 12,
        fontWeight: '700'
    },
    detailCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginTop: 16,
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
    },
    detailIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center'
    },
    detailName: {
        fontSize: 16,
        fontWeight: '600'
    },
    detailAmount: {
        fontSize: 20,
        fontWeight: '700'
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    emptyText: {
        marginTop: 12,
        fontSize: 14,
    },
});
