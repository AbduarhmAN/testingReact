import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';

type Category = {
    name: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
};

export const CATEGORIES: Category[] = [
    { name: 'Groceries', icon: 'cart', color: '#FF9500' },
    { name: 'Coffee', icon: 'cafe', color: '#AF52DE' },
    { name: 'Transport', icon: 'car', color: '#5AC8FA' },
    { name: 'Food', icon: 'restaurant', color: '#FF3B30' },
    { name: 'Shopping', icon: 'bag', color: '#34C759' },
    { name: 'Health', icon: 'fitness', color: '#5856D6' },
];

export type TransactionData = {
    id?: string;
    title: string;
    amount: number;
    category: string;
    iconName: string;
    iconColor: string;
};

type TransactionModalProps = {
    visible: boolean;
    onClose: () => void;
    onSave: (transaction: TransactionData) => void;
    onDelete?: (id: string) => void;
    editTransaction?: TransactionData | null;
};

export function TransactionModal({ visible, onClose, onSave, onDelete, editTransaction }: TransactionModalProps) {
    const colorScheme = useColorScheme();
    const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

    const [amount, setAmount] = useState('');
    const [title, setTitle] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

    const isEditMode = !!editTransaction;

    // Pre-fill form when editing
    useEffect(() => {
        if (editTransaction) {
            setAmount(Math.abs(editTransaction.amount).toString());
            setTitle(editTransaction.title);
            const cat = CATEGORIES.find(c => c.name === editTransaction.category);
            setSelectedCategory(cat || null);
        } else {
            setAmount('');
            setTitle('');
            setSelectedCategory(null);
        }
    }, [editTransaction, visible]);

    const handleSave = () => {
        if (!amount || !title || !selectedCategory) return;

        onSave({
            id: editTransaction?.id,
            title,
            amount: -Math.abs(parseFloat(amount)),
            category: selectedCategory.name,
            iconName: selectedCategory.icon,
            iconColor: selectedCategory.color,
        });

        // Reset form
        setAmount('');
        setTitle('');
        setSelectedCategory(null);
        onClose();
    };

    const handleDelete = () => {
        if (editTransaction?.id && onDelete) {
            onDelete(editTransaction.id);
            onClose();
        }
    };

    const handleNumpadPress = (value: string) => {
        if (value === 'backspace') {
            setAmount(prev => prev.slice(0, -1));
        } else if (value === '.') {
            if (!amount.includes('.')) {
                setAmount(prev => prev + value);
            }
        } else {
            setAmount(prev => prev + value);
        }
    };

    const handleClose = () => {
        setAmount('');
        setTitle('');
        setSelectedCategory(null);
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalOverlay}
            >
                <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                    {/* Header */}
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={handleClose}>
                            <Text style={[styles.cancelButton, { color: theme.expense }]}>Cancel</Text>
                        </TouchableOpacity>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>
                            {isEditMode ? 'Edit Expense' : 'Add Expense'}
                        </Text>
                        <TouchableOpacity onPress={handleSave}>
                            <Text style={[styles.addButton, { color: theme.tint }]}>
                                {isEditMode ? 'Save' : 'Add'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Amount Display */}
                    <View style={styles.amountContainer}>
                        <Text style={[styles.currencySymbol, { color: theme.textSecondary }]}>$</Text>
                        <Text style={[styles.amountText, { color: theme.text }]}>
                            {amount || '0.00'}
                        </Text>
                    </View>

                    {/* Title Input */}
                    <TextInput
                        style={[styles.titleInput, { backgroundColor: theme.background, color: theme.text }]}
                        placeholder="What did you buy?"
                        placeholderTextColor={theme.textSecondary}
                        value={title}
                        onChangeText={setTitle}
                    />

                    {/* Category Selection */}
                    <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Category</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                        {CATEGORIES.map((cat) => (
                            <TouchableOpacity
                                key={cat.name}
                                onPress={() => setSelectedCategory(cat)}
                                style={[
                                    styles.categoryItem,
                                    selectedCategory?.name === cat.name && { backgroundColor: cat.color + '30' },
                                ]}
                            >
                                <View style={[styles.categoryIcon, { backgroundColor: cat.color + '20' }]}>
                                    <Ionicons name={cat.icon} size={24} color={cat.color} />
                                </View>
                                <Text style={[styles.categoryName, { color: theme.text }]}>{cat.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Numpad */}
                    <View style={styles.numpad}>
                        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'backspace'].map((key) => (
                            <TouchableOpacity
                                key={key}
                                style={[styles.numpadKey, { backgroundColor: theme.background }]}
                                onPress={() => handleNumpadPress(key)}
                            >
                                {key === 'backspace' ? (
                                    <Ionicons name="backspace-outline" size={24} color={theme.text} />
                                ) : (
                                    <Text style={[styles.numpadText, { color: theme.text }]}>{key}</Text>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Delete Button (only in edit mode) */}
                    {isEditMode && (
                        <TouchableOpacity
                            style={[styles.deleteButton, { backgroundColor: theme.expense + '20' }]}
                            onPress={handleDelete}
                        >
                            <Ionicons name="trash-outline" size={20} color={theme.expense} />
                            <Text style={[styles.deleteText, { color: theme.expense }]}>Delete Transaction</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    cancelButton: {
        fontSize: 16,
        fontWeight: '500',
    },
    addButton: {
        fontSize: 16,
        fontWeight: '600',
    },
    amountContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    currencySymbol: {
        fontSize: 24,
        fontWeight: '600',
        marginTop: 8,
    },
    amountText: {
        fontSize: 48,
        fontWeight: '700',
    },
    titleInput: {
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
    },
    categoryScroll: {
        marginBottom: 20,
    },
    categoryItem: {
        alignItems: 'center',
        marginRight: 16,
        padding: 8,
        borderRadius: 12,
    },
    categoryIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    categoryName: {
        fontSize: 12,
        fontWeight: '500',
    },
    numpad: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 12,
    },
    numpadKey: {
        width: 70,
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    numpadText: {
        fontSize: 24,
        fontWeight: '600',
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        marginTop: 20,
        gap: 8,
    },
    deleteText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
