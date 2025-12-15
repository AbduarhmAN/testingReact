import { Colors, getCategoryColor } from '@/constants/theme';
import { useBudget } from '@/context/BudgetContext';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { ColorPicker } from './ColorPicker';

// ============================================================================
// CONSTANTS
// ============================================================================

const ICON_OPTIONS: (keyof typeof Ionicons.glyphMap)[] = [
    'cart-outline', 'home-outline', 'car-outline', 'fitness-outline', 'cafe-outline',
    'restaurant-outline', 'game-controller-outline', 'film-outline', 'musical-notes-outline', 'gift-outline',
    'medical-outline', 'school-outline', 'airplane-outline', 'paw-outline', 'shirt-outline',
    'phone-portrait-outline', 'wifi-outline', 'flash-outline', 'water-outline', 'leaf-outline',
    'briefcase-outline', 'card-outline', 'cash-outline', 'wallet-outline', 'trending-up-outline',
    'heart-outline', 'star-outline', 'sparkles-outline', 'diamond-outline', 'receipt-outline',
];

const DEFAULT_ICON: keyof typeof Ionicons.glyphMap = 'cart-outline';

// ============================================================================
// TYPES
// ============================================================================

interface AddCategoryModalProps {
    visible: boolean;
    onClose: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function AddCategoryModal({ visible, onClose }: AddCategoryModalProps) {
    const colorScheme = useColorScheme();
    const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

    const { addCategory, categories, nextColorIndex } = useBudget();

    // ========================================================================
    // STATE
    // ========================================================================

    const [name, setName] = useState('');
    const [selectedIcon, setSelectedIcon] = useState<keyof typeof Ionicons.glyphMap>(DEFAULT_ICON);
    const [selectedColor, setSelectedColor] = useState<string>('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Track if component is mounted to prevent state updates after unmount
    const isMountedRef = useRef(true);

    // Store the initial default color when modal opens (prevents recalculation issue)
    const initialDefaultColorRef = useRef<string>('');

    // ========================================================================
    // DERIVED STATE
    // ========================================================================

    // Calculate default color from context's nextColorIndex (fresh on every render)
    const defaultColor = getCategoryColor(nextColorIndex);

    // ========================================================================
    // EFFECTS
    // ========================================================================

    // Track mount status for cleanup
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // Reset form when modal opens (using FRESH nextColorIndex from context)
    useEffect(() => {
        if (visible) {
            // Capture the default color at modal open time (prevents recalculation issue)
            const freshColor = getCategoryColor(nextColorIndex);
            initialDefaultColorRef.current = freshColor;

            setName('');
            setSelectedIcon(DEFAULT_ICON);
            setSelectedColor(freshColor);
            setError('');
            setIsSubmitting(false);
        }
    }, [visible, nextColorIndex]);

    // ========================================================================
    // HANDLERS
    // ========================================================================

    const handleAdd = useCallback(() => {
        // GUARD: Prevent rapid double-submit
        if (isSubmitting) {
            return;
        }

        const trimmedName = name.trim();

        // Validation
        if (!trimmedName) {
            setError('Name is required');
            return;
        }
        if (trimmedName.length > 30) {
            setError('Name must be 30 characters or less');
            return;
        }

        // Uniqueness check - READ FRESH from context (categories is from useBudget, updates on every render)
        const nameExists = categories.some(
            c => c.name.toLowerCase() === trimmedName.toLowerCase()
        );
        if (nameExists) {
            setError('Category name already exists');
            return;
        }

        // LOCK: Set submitting immediately to block rapid taps
        setIsSubmitting(true);

        // Determine if user selected a custom color or using default
        // Compare against the initial default color captured when modal opened
        // This prevents issues if context updates mid-form
        const isUsingDefaultColor = selectedColor === initialDefaultColorRef.current;

        // Add category (context handles UUID and color fallback)
        addCategory({
            name: trimmedName,
            icon: selectedIcon,
            color: isUsingDefaultColor ? undefined : selectedColor,
        });

        // Close modal only after state is set
        // Check if still mounted before updating state
        if (isMountedRef.current) {
            onClose();
        }
    }, [isSubmitting, name, categories, selectedColor, defaultColor, selectedIcon, addCategory, onClose]);

    const handleClose = useCallback(() => {
        // Don't allow close during submission
        if (isSubmitting) {
            return;
        }
        onClose();
    }, [isSubmitting, onClose]);

    const handleNameChange = useCallback((text: string) => {
        setName(text);
        setError('');
    }, []);

    const handleIconSelect = useCallback((icon: keyof typeof Ionicons.glyphMap) => {
        setSelectedIcon(icon);
    }, []);

    // ========================================================================
    // COMPUTED
    // ========================================================================

    const isAddDisabled = !name.trim() || isSubmitting;

    // ========================================================================
    // RENDER
    // ========================================================================

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.modal, { backgroundColor: theme.card }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={handleClose} disabled={isSubmitting}>
                            <Text style={[
                                styles.headerButton,
                                { color: isSubmitting ? theme.textSecondary : theme.tint }
                            ]}>
                                Cancel
                            </Text>
                        </TouchableOpacity>
                        <Text style={[styles.headerTitle, { color: theme.text }]}>New Category</Text>
                        <TouchableOpacity onPress={handleAdd} disabled={isAddDisabled}>
                            <Text style={[
                                styles.headerButton,
                                { color: isAddDisabled ? theme.textSecondary : theme.tint }
                            ]}>
                                {isSubmitting ? 'Adding...' : 'Add'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                        {/* Error Message */}
                        {error ? (
                            <Text style={[styles.errorText, { color: theme.expense }]}>{error}</Text>
                        ) : null}

                        {/* Category Name */}
                        <Text style={[styles.label, { color: theme.textSecondary }]}>CATEGORY NAME</Text>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: theme.background,
                                    color: theme.text,
                                    borderColor: error ? theme.expense : theme.separator
                                }
                            ]}
                            placeholder="e.g., Groceries"
                            placeholderTextColor={theme.textSecondary}
                            value={name}
                            onChangeText={handleNameChange}
                            autoFocus
                            editable={!isSubmitting}
                            maxLength={30}
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
                                    onPress={() => handleIconSelect(icon)}
                                    disabled={isSubmitting}
                                >
                                    <Ionicons
                                        name={icon}
                                        size={24}
                                        color={selectedIcon === icon ? '#FFF' : theme.text}
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Color Selection */}
                        <Text style={[styles.label, { color: theme.textSecondary }]}>COLOR</Text>
                        <ColorPicker
                            selectedColor={selectedColor}
                            onSelectColor={setSelectedColor}
                            disabled={isSubmitting}
                        />

                        {/* Preview */}
                        <Text style={[styles.label, { color: theme.textSecondary }]}>PREVIEW</Text>
                        <View style={[styles.preview, { backgroundColor: theme.background }]}>
                            <View style={[styles.previewIcon, { backgroundColor: selectedColor }]}>
                                <Ionicons name={selectedIcon} size={24} color="#FFF" />
                            </View>
                            <Text style={[styles.previewText, { color: theme.text }]}>
                                {name || 'Category Name'}
                            </Text>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

// ============================================================================
// STYLES
// ============================================================================

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
    errorText: {
        marginBottom: 10,
        textAlign: 'center',
        fontSize: 14,
        fontWeight: '500',
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
