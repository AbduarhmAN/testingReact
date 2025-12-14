import { Colors, getCategoryColor } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { ColorPicker } from './ColorPicker';

type AddCategoryModalProps = {
    visible: boolean;
    onClose: () => void;
    onAdd: (category: { name: string; icon: keyof typeof Ionicons.glyphMap; color: string }) => void;
    categoryCount: number; // Used to calculate default color
};

const ICON_OPTIONS: (keyof typeof Ionicons.glyphMap)[] = [
    'cart-outline', 'home-outline', 'car-outline', 'fitness-outline', 'cafe-outline',
    'restaurant-outline', 'game-controller-outline', 'film-outline', 'musical-notes-outline', 'gift-outline',
    'medical-outline', 'school-outline', 'airplane-outline', 'paw-outline', 'shirt-outline',
    'phone-portrait-outline', 'wifi-outline', 'flash-outline', 'water-outline', 'leaf-outline',
    'briefcase-outline', 'card-outline', 'cash-outline', 'wallet-outline', 'trending-up-outline',
    'heart-outline', 'star-outline', 'sparkles-outline', 'diamond-outline', 'receipt-outline',
];

export function AddCategoryModal({ visible, onClose, onAdd, categoryCount }: AddCategoryModalProps) {
    const colorScheme = useColorScheme();
    const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

    const defaultColor = getCategoryColor(categoryCount);

    const [name, setName] = useState('');
    const [selectedIcon, setSelectedIcon] = useState<keyof typeof Ionicons.glyphMap>('cart-outline');
    const [selectedColor, setSelectedColor] = useState(defaultColor);

    const handleAdd = () => {
        if (name.trim()) {
            onAdd({ name: name.trim(), icon: selectedIcon, color: selectedColor });
            setName('');
            setSelectedIcon('cart-outline');
            setSelectedColor(getCategoryColor(categoryCount + 1));
            onClose();
        }
    };

    const handleClose = () => {
        setName('');
        setSelectedIcon('cart-outline');
        setSelectedColor(defaultColor);
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={[styles.modal, { backgroundColor: theme.card }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={handleClose}>
                            <Text style={[styles.headerButton, { color: theme.tint }]}>Cancel</Text>
                        </TouchableOpacity>
                        <Text style={[styles.headerTitle, { color: theme.text }]}>New Category</Text>
                        <TouchableOpacity onPress={handleAdd} disabled={!name.trim()}>
                            <Text style={[styles.headerButton, { color: name.trim() ? theme.tint : theme.textSecondary }]}>Add</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                        {/* Category Name */}
                        <Text style={[styles.label, { color: theme.textSecondary }]}>CATEGORY NAME</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.separator }]}
                            placeholder="e.g., Groceries"
                            placeholderTextColor={theme.textSecondary}
                            value={name}
                            onChangeText={setName}
                            autoFocus
                        />

                        {/* Icon Selection */}
                        <Text style={[styles.label, { color: theme.textSecondary }]}>ICON</Text>
                        <View style={styles.iconGrid}>
                            {ICON_OPTIONS.map((icon) => (
                                <TouchableOpacity
                                    key={icon}
                                    style={[
                                        styles.iconButton,
                                        { backgroundColor: selectedIcon === icon ? selectedColor : theme.background },
                                    ]}
                                    onPress={() => setSelectedIcon(icon)}
                                >
                                    <Ionicons name={icon} size={24} color={selectedIcon === icon ? '#FFF' : theme.text} />
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Color Selection */}
                        <Text style={[styles.label, { color: theme.textSecondary }]}>COLOR</Text>
                        <ColorPicker selectedColor={selectedColor} onSelectColor={setSelectedColor} />

                        {/* Preview */}
                        <Text style={[styles.label, { color: theme.textSecondary }]}>PREVIEW</Text>
                        <View style={[styles.preview, { backgroundColor: theme.background }]}>
                            <View style={[styles.previewIcon, { backgroundColor: selectedColor }]}>
                                <Ionicons name={selectedIcon} size={24} color="#FFF" />
                            </View>
                            <Text style={[styles.previewText, { color: theme.text }]}>{name || 'Category Name'}</Text>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modal: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    headerButton: {
        fontSize: 16,
        fontWeight: '500',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
    },
    content: {
        padding: 16,
        paddingBottom: 40,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
    },
    iconGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    iconButton: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    preview: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        gap: 12,
    },
    previewIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    previewText: {
        fontSize: 18,
        fontWeight: '600',
    },
});
