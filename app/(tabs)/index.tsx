import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';

import { TransactionData, TransactionModal } from '@/components/ui/AddTransactionModal';
import { BudgetHeader } from '@/components/ui/BudgetHeader';
import { Card } from '@/components/ui/Card';
import { TransactionRow } from '@/components/ui/TransactionRow';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

type Transaction = {
  id: string;
  title: string;
  subtitle: string;
  amount: number;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  date: string;
};

const MONTHLY_BUDGET = 2500; // This could be user-configurable later

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionData | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: '1', title: 'Whole Foods', subtitle: 'Groceries', amount: -64.20, iconName: 'cart', iconColor: '#FF9500', date: 'Today' },
    { id: '2', title: 'Starbucks', subtitle: 'Coffee', amount: -5.40, iconName: 'cafe', iconColor: '#AF52DE', date: 'Today' },
    { id: '3', title: 'Uber', subtitle: 'Transport', amount: -14.90, iconName: 'car', iconColor: '#5AC8FA', date: 'Today' },
    { id: '4', title: 'Netflix', subtitle: 'Shopping', amount: -12.00, iconName: 'film', iconColor: '#34C759', date: 'Yesterday' },
    { id: '5', title: 'Gym', subtitle: 'Health', amount: -20.00, iconName: 'fitness', iconColor: '#5856D6', date: 'Yesterday' },
  ]);

  // Calculate total spent
  const totalSpent = useMemo(() => {
    return transactions.reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  // Calculate category breakdown for insights
  const categoryBreakdown = useMemo(() => {
    const categoryMap = new Map<string, { amount: number; color: string }>();

    transactions.forEach(t => {
      const existing = categoryMap.get(t.subtitle);
      if (existing) {
        existing.amount += Math.abs(t.amount);
      } else {
        categoryMap.set(t.subtitle, { amount: Math.abs(t.amount), color: t.iconColor });
      }
    });

    return Array.from(categoryMap.entries())
      .map(([name, data]) => ({ name, amount: data.amount, color: data.color }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  const handleSaveTransaction = (transaction: TransactionData) => {
    if (transaction.id) {
      // Edit existing transaction
      setTransactions(prev => prev.map(t =>
        t.id === transaction.id
          ? {
            ...t,
            title: transaction.title,
            subtitle: transaction.category,
            amount: transaction.amount,
            iconName: transaction.iconName as keyof typeof Ionicons.glyphMap,
            iconColor: transaction.iconColor,
          }
          : t
      ));
    } else {
      // Add new transaction
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        title: transaction.title,
        subtitle: transaction.category,
        amount: transaction.amount,
        iconName: transaction.iconName as keyof typeof Ionicons.glyphMap,
        iconColor: transaction.iconColor,
        date: 'Today',
      };
      setTransactions(prev => [newTransaction, ...prev]);
    }
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    setEditingTransaction(null);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction({
      id: transaction.id,
      title: transaction.title,
      amount: transaction.amount,
      category: transaction.subtitle,
      iconName: transaction.iconName,
      iconColor: transaction.iconColor,
    });
    setIsModalVisible(true);
  };

  const handleAddNew = () => {
    setEditingTransaction(null);
    setIsModalVisible(true);
  };

  const todayTransactions = transactions.filter(t => t.date === 'Today');
  const yesterdayTransactions = transactions.filter(t => t.date === 'Yesterday');

  const todayTotal = todayTransactions.reduce((sum, t) => sum + t.amount, 0);
  const yesterdayTotal = yesterdayTransactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Single ScrollView - Everything scrolls together (Cards Pattern) */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        onScroll={(e) => setScrollY(e.nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={true}
      >
        {/* Card 1: Header with Tabs + Chart */}
        <BudgetHeader
          monthlyBudget={MONTHLY_BUDGET}
          totalSpent={totalSpent}
          categoryBreakdown={categoryBreakdown}
          scrollY={scrollY}
        />

        {/* Card 2: Today's Transactions */}
        {todayTransactions.length > 0 && (
          <Card>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Today</Text>
              <Text style={[styles.cardTotal, { color: theme.expense }]}>
                -${Math.abs(todayTotal).toFixed(2)}
              </Text>
            </View>

            {todayTransactions.map((transaction, index) => (
              <TouchableOpacity
                key={transaction.id}
                onPress={() => handleEditTransaction(transaction)}
                activeOpacity={0.7}
              >
                <TransactionRow
                  title={transaction.title}
                  subtitle={transaction.subtitle}
                  amount={transaction.amount}
                  iconName={transaction.iconName}
                  iconColor={transaction.iconColor}
                />
                {index < todayTransactions.length - 1 && (
                  <View style={[styles.separator, { backgroundColor: theme.separator }]} />
                )}
              </TouchableOpacity>
            ))}
          </Card>
        )}

        {/* Yesterday's Transactions */}
        {yesterdayTransactions.length > 0 && (
          <Card>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Yesterday</Text>
              <Text style={[styles.cardTotal, { color: theme.expense }]}>
                -${Math.abs(yesterdayTotal).toFixed(2)}
              </Text>
            </View>

            {yesterdayTransactions.map((transaction, index) => (
              <TouchableOpacity
                key={transaction.id}
                onPress={() => handleEditTransaction(transaction)}
                activeOpacity={0.7}
              >
                <TransactionRow
                  title={transaction.title}
                  subtitle={transaction.subtitle}
                  amount={transaction.amount}
                  iconName={transaction.iconName}
                  iconColor={transaction.iconColor}
                />
                {index < yesterdayTransactions.length - 1 && (
                  <View style={[styles.separator, { backgroundColor: theme.separator }]} />
                )}
              </TouchableOpacity>
            ))}
          </Card>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.tint }]}
        onPress={handleAddNew}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Transaction Modal (Add/Edit) */}
      <TransactionModal
        visible={isModalVisible}
        onClose={() => {
          setIsModalVisible(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveTransaction}
        onDelete={handleDeleteTransaction}
        editTransaction={editingTransaction}
      />
    </View>
  );
}

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
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
});
