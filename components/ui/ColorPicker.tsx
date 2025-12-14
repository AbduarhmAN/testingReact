import { CATEGORY_COLORS } from '@/constants/theme';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

type ColorPickerProps = {
    selectedColor: string;
    onSelectColor: (color: string) => void;
};

export function ColorPicker({ selectedColor, onSelectColor }: ColorPickerProps) {
    return (
        <View style={styles.container}>
            {CATEGORY_COLORS.map((color, index) => (
                <TouchableOpacity
                    key={index}
                    style={[
                        styles.colorCircle,
                        { backgroundColor: color },
                        selectedColor === color && styles.selected,
                    ]}
                    onPress={() => onSelectColor(color)}
                >
                    {selectedColor === color && (
                        <View style={styles.checkmark} />
                    )}
                </TouchableOpacity>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 16,
    },
    colorCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
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
