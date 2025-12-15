import { useCallback, useMemo, useState } from 'react';
import {
  ListRenderItem,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View
} from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';

import { AddCategoryModal } from '@/components/ui/AddCategoryModal';
import { TransactionModal } from '@/components/ui/AddTransactionModal';
import { BudgetHeader } from '@/components/ui/BudgetHeader';
import { Card } from '@/components/ui/Card';
import { TransactionRow } from '@/components/ui/TransactionRow';
import { Colors } from '@/constants/theme';
import { Transaction, useBudget } from '@/context/BudgetContext';
import { Ionicons } from '@expo/vector-icons';

// ============================================================================
// TYPES
// ============================================================================

interface TransactionGroup {
  date: string;
  displayDate: string;
  transactions: Transaction[];
  total: number;
}

// ============================================================================
// DATE HELPERS
// ============================================================================

function getDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatDisplayDate(dateString: string): string {
  const today = getDateString(new Date());
  const yesterday = getDateString(new Date(Date.now() - 86400000));

  if (dateString === today) return 'Today';
  if (dateString === yesterday) return 'Yesterday';

  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const {
    budget,
    transactions,
    categories,
    totalSpent,
    categoryBreakdown,
    getCategoryById,
    deleteTransaction,
  } = useBudget();

  // UI State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);

  // Reanimated Shared Value for smooth scroll
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // ========================================================================
  // MEMOIZED DATA
  // ========================================================================

  // Group transactions by date
  const transactionGroups = useMemo((): TransactionGroup[] => {
    const groups = new Map<string, Transaction[]>();

    // Sort transactions by createdAt (newest first)
    const sorted = [...transactions].sort((a, b) => b.createdAt - a.createdAt);

    sorted.forEach(t => {
      const existing = groups.get(t.date) || [];
      existing.push(t);
      groups.set(t.date, existing);
    });

    return Array.from(groups.entries())
      .map(([date, txs]) => ({
        date,
        displayDate: formatDisplayDate(date),
        transactions: txs,
        total: txs.reduce((sum, t) => sum + t.amount, 0),
      }))
      .sort((a, b) => b.date.localeCompare(a.date)); // Newest date first
  }, [transactions]);

  // Transform categoryBreakdown for BudgetHeader
  const categoryBreakdownForHeader = useMemo(() => {
    return categoryBreakdown.map(cat => ({
      name: cat.name,
      amount: cat.amount,
      color: cat.color,
      icon: cat.icon,
    }));
  }, [categoryBreakdown]);

  // ========================================================================
  // HANDLERS (Memoized)
  // ========================================================================

  // Scroll handler replaced by Reanimated
  // const handleScroll = ...

  const handleEditTransaction = useCallback((transactionId: string) => {
    setEditingTransactionId(transactionId);
    setIsModalVisible(true);
  }, []);

  const handleAddNew = useCallback(() => {
    setEditingTransactionId(null);
    setIsModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalVisible(false);
    setEditingTransactionId(null);
  }, []);

  const handleAddCategory = useCallback(() => {
    setIsCategoryModalVisible(true);
  }, []);

  const handleCloseCategoryModal = useCallback(() => {
    setIsCategoryModalVisible(false);
  }, []);

  // ========================================================================
  // RENDER HELPERS
  // ========================================================================

  const renderTransactionItem = useCallback((
    transaction: Transaction,
    index: number,
    totalCount: number
  ) => {
    const category = getCategoryById(transaction.categoryId);

    return (
      <TouchableOpacity
        key={transaction.id}
        onPress={() => handleEditTransaction(transaction.id)}
        activeOpacity={0.7}
      >
        <TransactionRow
          title={transaction.title}
          subtitle={category?.name || 'Unknown'}
          amount={transaction.amount}
          iconName={category?.icon || 'help-outline'}
          iconColor={category?.color || '#888'}
        />
        {index < totalCount - 1 && (
          <View style={[styles.separator, { backgroundColor: theme.separator }]} />
        )}
      </TouchableOpacity>
    );
  }, [getCategoryById, handleEditTransaction, theme.separator]);

  const renderGroup: ListRenderItem<TransactionGroup> = useCallback(({ item: group }) => (
    <Card>
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>{group.displayDate}</Text>
        <Text style={[styles.cardTotal, { color: theme.expense }]}>
          -${Math.abs(group.total).toFixed(2)}
        </Text>
      </View>
      {group.transactions.map((t, idx) =>
        renderTransactionItem(t, idx, group.transactions.length)
      )}
    </Card>
  ), [theme.text, theme.expense, renderTransactionItem]);

  const ListHeaderComponent = useMemo(() => (
    <BudgetHeader
      monthlyBudget={budget}
      totalSpent={totalSpent}
      categoryBreakdown={categoryBreakdownForHeader}
      scrollY={scrollY}
    />
  ), [budget, totalSpent, categoryBreakdownForHeader]);

  const ListEmptyComponent = useMemo(() => (
    <Card>
      <View style={styles.emptyState}>
        <Ionicons name="wallet-outline" size={48} color={theme.textSecondary} />
        <Text style={[styles.emptyTitle, { color: theme.text }]}>No Transactions Yet</Text>
        <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
          Tap the + button to add your first expense
        </Text>
      </View>
    </Card>
  ), [theme.text, theme.textSecondary]);

  const keyExtractor = useCallback((item: TransactionGroup) => item.date, []);

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Virtualized List */}
      <Animated.FlatList
        data={transactionGroups}
        renderItem={renderGroup}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={ListEmptyComponent}
        contentContainerStyle={styles.scrollContent}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={true}
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        windowSize={10}
        initialNumToRender={3}
      />

      {/* Floating Action Buttons */}
      <TouchableOpacity
        style={[styles.fab, styles.fabSecondary, { backgroundColor: theme.card }]}
        onPress={handleAddCategory}
        activeOpacity={0.8}
      >
        <Ionicons name="pricetag-outline" size={24} color={theme.text} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.tint }]}
        onPress={handleAddNew}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Transaction Modal */}
      <TransactionModal
        visible={isModalVisible}
        onClose={handleCloseModal}
        editTransactionId={editingTransactionId}
      />

      {/* Add Category Modal */}
      <AddCategoryModal
        visible={isCategoryModalVisible}
        onClose={handleCloseCategoryModal}
      />
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  cardTotal: {
    fontSize: 16,
    fontWeight: '600',
  },
  separator: {
    height: 1,
    marginLeft: 56,
    marginVertical: 4,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  fabSecondary: {
    bottom: 90, // Positioned above the main FAB
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});
