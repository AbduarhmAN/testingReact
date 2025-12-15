import { CATEGORY_COLORS } from '@/constants/theme';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

// ============================================================================
// TYPES
// ============================================================================

interface ColorPickerProps {
    selectedColor: string;
    onSelectColor: (color: string) => void;
    disabled?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ColorPicker({ selectedColor, onSelectColor, disabled = false }: ColorPickerProps) {
    return (
        <View style={[styles.container, disabled && styles.containerDisabled]}>
            {CATEGORY_COLORS.map((color, index) => (
                <TouchableOpacity
                    key={index}
                    style={[
                        styles.colorCircle,
                        { backgroundColor: color },
                        selectedColor === color && styles.selected,
                        disabled && styles.colorCircleDisabled,
                    ]}
                    onPress={() => onSelectColor(color)}
                    disabled={disabled}
                    activeOpacity={disabled ? 1 : 0.7}
                >
                    {selectedColor === color && (
                        <View style={styles.checkmark} />
                    )}
                </TouchableOpacity>
            ))}
        </View>
    );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 16,
    },
    containerDisabled: {
        opacity: 0.6,
    },
    colorCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    colorCircleDisabled: {
        transform: [{ scale: 0.95 }],
    },
    selected: {
        borderWidth: 3,
        borderColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    checkmark: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#FFFFFF',
    },
});
