import { Colors } from '@/constants/theme';
import { Category, useBudget } from '@/context/BudgetContext';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';

// ============================================================================
// TYPES
// ============================================================================

interface TransactionFormData {
    id?: string;
    title: string;
    amount: number;
    categoryId: string;
    date: string;
    note?: string;
}

interface TransactionModalProps {
    visible: boolean;
    onClose: () => void;
    editTransactionId?: string | null;
}

// ============================================================================
// AMOUNT PARSER (NaN-Safe)
// ============================================================================

function parseAmount(input: string): number | null {
    if (!input || input === '.' || input === '-' || input === '-.') {
        return null;
    }
    const parsed = parseFloat(input);
    if (!Number.isFinite(parsed)) {
        return null;
    }
    return parsed;
}

function formatAmountDisplay(input: string): string {
    if (!input) return '0.00';
    // Remove leading zeros except for "0."
    let cleaned = input.replace(/^0+(?=\d)/, '');
    if (cleaned.startsWith('.')) cleaned = '0' + cleaned;
    return cleaned || '0.00';
}

// ============================================================================
// COMPONENT
// ============================================================================

export function TransactionModal({ visible, onClose, editTransactionId }: TransactionModalProps) {
    const colorScheme = useColorScheme();
    const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

    const {
        categories,
        transactions,
        addTransaction,
        updateTransaction,
        deleteTransaction
    } = useBudget();

    // Form state
    const [amountInput, setAmountInput] = useState('');
    const [title, setTitle] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [note, setNote] = useState('');

    // Derived state
    const isEditMode = !!editTransactionId;
    const editingTransaction = useMemo(() =>
        editTransactionId ? transactions.find(t => t.id === editTransactionId) : null,
        [editTransactionId, transactions]
    );

    // Reset form when modal opens/closes or edit target changes
    useEffect(() => {
        if (visible) {
            if (editingTransaction) {
                setAmountInput(Math.abs(editingTransaction.amount).toString());
                setTitle(editingTransaction.title);
                setSelectedCategoryId(editingTransaction.categoryId);
                setNote(editingTransaction.note || '');
            } else {
                setAmountInput('');
                setTitle('');
                setSelectedCategoryId(categories[0]?.id || null);
                setNote('');
            }
        }
    }, [visible, editingTransaction, categories]);

    // Cleanup on unmount (memory leak prevention)
    useEffect(() => {
        return () => {
            setAmountInput('');
            setTitle('');
            setSelectedCategoryId(null);
            setNote('');
        };
    }, []);

    const selectedCategory = useMemo(() =>
        categories.find(c => c.id === selectedCategoryId),
        [categories, selectedCategoryId]
    );

    const isFormValid = useMemo(() => {
        const amount = parseAmount(amountInput);
        return amount !== null && amount > 0 && title.trim().length > 0 && selectedCategoryId !== null;
    }, [amountInput, title, selectedCategoryId]);

    // ========================================================================
    // HANDLERS
    // ========================================================================

    const handleSave = useCallback(() => {
        const amount = parseAmount(amountInput);
        if (amount === null || amount <= 0 || !title.trim() || !selectedCategoryId) {
            return;
        }

        const transactionData = {
            title: title.trim(),
            amount: -Math.abs(amount), // Expenses are negative
            categoryId: selectedCategoryId,
            date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
            note: note.trim() || undefined,
        };

        if (isEditMode && editTransactionId) {
            updateTransaction(editTransactionId, transactionData);
        } else {
            addTransaction(transactionData);
        }

        onClose();
    }, [amountInput, title, selectedCategoryId, note, isEditMode, editTransactionId, updateTransaction, addTransaction, onClose]);

    const handleDelete = useCallback(() => {
        if (editTransactionId) {
            deleteTransaction(editTransactionId);
            onClose();
        }
    }, [editTransactionId, deleteTransaction, onClose]);

    const handleNumpadPress = useCallback((value: string) => {
        setAmountInput(prev => {
            if (value === 'backspace') {
                return prev.slice(0, -1);
            }
            if (value === '.') {
                if (prev.includes('.')) return prev;
                return prev + value;
            }
            // Limit decimal places to 2
            const parts = prev.split('.');
            if (parts[1] && parts[1].length >= 2) return prev;
            // Limit total length
            if (prev.length >= 10) return prev;
            return prev + value;
        });
    }, []);

    const handleClose = useCallback(() => {
        // State cleanup handled by useEffect
        onClose();
    }, [onClose]);

    // ========================================================================
    // RENDER HELPERS
    // ========================================================================

    const renderCategoryItem = useCallback(({ item }: { item: Category }) => {
        const isSelected = selectedCategoryId === item.id;
        return (
            <TouchableOpacity
                onPress={() => setSelectedCategoryId(item.id)}
                style={[
                    styles.categoryItem,
                    isSelected && { backgroundColor: item.color + '30' },
                ]}
            >
                <View style={[styles.categoryIcon, { backgroundColor: item.color + '20' }]}>
                    <Ionicons name={item.icon} size={24} color={item.color} />
                </View>
                <Text style={[styles.categoryName, { color: theme.text }]}>{item.name}</Text>
            </TouchableOpacity>
        );
    }, [selectedCategoryId, theme.text]);

    const renderNumpadKey = useCallback((key: string) => (
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
    ), [theme.background, theme.text, handleNumpadPress]);

    // ========================================================================
    // RENDER
    // ========================================================================

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
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
                        <TouchableOpacity onPress={handleSave} disabled={!isFormValid}>
                            <Text style={[
                                styles.addButton,
                                { color: isFormValid ? theme.tint : theme.textSecondary }
                            ]}>
                                {isEditMode ? 'Save' : 'Add'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Amount Display */}
                    <View style={styles.amountContainer}>
                        <Text style={[styles.currencySymbol, { color: theme.textSecondary }]}>$</Text>
                        <Text style={[styles.amountText, { color: theme.text }]}>
                            {formatAmountDisplay(amountInput)}
                        </Text>
                    </View>

                    {/* Title Input */}
                    <TextInput
                        style={[styles.titleInput, { backgroundColor: theme.background, color: theme.text }]}
                        placeholder="What did you buy?"
                        placeholderTextColor={theme.textSecondary}
                        value={title}
                        onChangeText={setTitle}
                        maxLength={100}
                    />

                    {/* Category Selection - Using FlatList for virtualization */}
                    <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Category</Text>
                    <FlatList
                        data={categories}
                        renderItem={renderCategoryItem}
                        keyExtractor={item => item.id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.categoryScroll}
                        contentContainerStyle={styles.categoryList}
                    />

                    {/* Numpad */}
                    <View style={styles.numpad}>
                        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'backspace'].map(renderNumpadKey)}
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

// ============================================================================
// STYLES
// ============================================================================

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
        maxHeight: 100,
    },
    categoryList: {
        paddingRight: 16,
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
