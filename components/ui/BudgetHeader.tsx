import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SharedValue } from 'react-native-reanimated';
import { InfographicChart } from './InfographicChart';

type Tab = 'Plan' | 'Remaining' | 'Insights';

type CategorySpending = {
    name: string;
    amount: number;
    color: string;
    icon?: keyof typeof Ionicons.glyphMap;
};

type BudgetHeaderProps = {
    monthlyBudget: number;
    totalSpent: number;
    categoryBreakdown: CategorySpending[];
    onTabChange?: (tab: Tab) => void;
    scrollY?: SharedValue<number>; // Reanimated SharedValue
};

// Map category names to icons
const categoryIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
    'Groceries': 'cart',
    'Coffee': 'cafe',
    'Transport': 'car',
    'Food': 'restaurant',
    'Shopping': 'bag',
    'Health': 'fitness',
    'Subscription': 'tv',
    'Entertainment': 'game-controller',
};

export function BudgetHeader({ monthlyBudget, totalSpent, categoryBreakdown, onTabChange, scrollY }: BudgetHeaderProps) {
    const colorScheme = useColorScheme();
    const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
    const [activeTab, setActiveTab] = useState<Tab>('Remaining');
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

    const remaining = monthlyBudget - Math.abs(totalSpent);

    const handleTabPress = (tab: Tab) => {
        setActiveTab(tab);
        setSelectedCategory(null);
        onTabChange?.(tab);
    };

    // Prepare data for infographic chart with icons
    const chartData = categoryBreakdown.map(cat => ({
        ...cat,
        icon: cat.icon || categoryIcons[cat.name] || 'ellipse',
    }));

    // Content for each tab
    const renderContent = () => {
        switch (activeTab) {
            case 'Plan':
                return (
                    <View style={styles.planContainer}>
                        <View style={styles.balanceContainer}>
                            <Text style={[styles.currencySymbol, { color: theme.textSecondary }]}>$</Text>
                            <Text style={[styles.balanceAmount, { color: theme.text }]}>
                                {monthlyBudget.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </Text>
                        </View>
                        <Text style={[styles.balanceLabel, { color: theme.textSecondary }]}>
                            Monthly Budget
                        </Text>

                        {/* Progress Bar */}
                        <View style={styles.progressContainer}>
                            <View style={[styles.progressBar, { backgroundColor: theme.separator }]}>
                                <View
                                    style={[
                                        styles.progressFill,
                                        {
                                            backgroundColor: remaining >= 0 ? theme.income : theme.expense,
                                            width: `${Math.min((Math.abs(totalSpent) / monthlyBudget) * 100, 100)}%`
                                        }
                                    ]}
                                />
                            </View>
                            <View style={styles.progressLabels}>
                                <Text style={[styles.progressText, { color: theme.expense }]}>
                                    Spent: ${Math.abs(totalSpent).toFixed(2)}
                                </Text>
                                <Text style={[styles.progressText, { color: theme.income }]}>
                                    Left: ${Math.max(remaining, 0).toFixed(2)}
                                </Text>
                            </View>
                        </View>
                    </View>
                );
            case 'Remaining':
                const remainingColor = remaining >= 0 ? theme.income : theme.expense;
                const percentUsed = Math.min((Math.abs(totalSpent) / monthlyBudget) * 100, 100);
                return (
                    <>
                        <View style={styles.balanceContainer}>
                            <Text style={[styles.currencySymbol, { color: theme.textSecondary }]}>$</Text>
                            <Text style={[styles.balanceAmount, { color: remainingColor }]}>
                                {Math.abs(remaining).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </Text>
                        </View>
                        <Text style={[styles.balanceLabel, { color: theme.textSecondary }]}>
                            {remaining >= 0 ? 'Left to spend' : 'Over budget!'}
                        </Text>
                        <Text style={[styles.subLabel, { color: theme.textSecondary }]}>
                            {percentUsed.toFixed(0)}% of budget used
                        </Text>
                    </>
                );
            case 'Insights':
                return (
                    <View style={styles.insightsContainer}>
                        {chartData.length > 0 ? (
                            <InfographicChart
                                data={chartData}
                                size={300} // Fixed max size, scaling handled internally
                                selectedIndex={selectedCategory}
                                onSelectCategory={setSelectedCategory}
                                scrollY={scrollY}
                            />
                        ) : (
                            <View style={styles.emptyState}>
                                <View style={[styles.emptyCircle, { borderColor: theme.separator }]}>
                                    <Ionicons name="pie-chart-outline" size={40} color={theme.textSecondary} />
                                </View>
                                <Text style={[styles.emptyTitle, { color: theme.text }]}>
                                    No spending yet
                                </Text>
                                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                                    Add transactions to see insights
                                </Text>
                            </View>
                        )}
                    </View>
                );
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Top Tabs with Pill Design */}
            <View style={[styles.tabContainer, { backgroundColor: theme.card }]}>
                {(['Plan', 'Remaining', 'Insights'] as Tab[]).map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        onPress={() => handleTabPress(tab)}
                        style={[
                            styles.tab,
                            activeTab === tab && { backgroundColor: theme.tint }
                        ]}
                    >
                        <Text
                            style={[
                                styles.tabText,
                                { color: activeTab === tab ? '#FFFFFF' : theme.textSecondary },
                            ]}
                        >
                            {tab}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Dynamic Content Based on Active Tab */}
            {renderContent()}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingTop: 50,
        paddingBottom: 20,
        alignItems: 'center',
    },
    tabContainer: {
        flexDirection: 'row',
        marginBottom: 24,
        borderRadius: 20,
        padding: 4,
    },
    tab: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 16,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
    },
    balanceContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    currencySymbol: {
        fontSize: 24,
        fontWeight: '600',
        marginTop: 8,
        marginRight: 4,
    },
    balanceAmount: {
        fontSize: 48,
        fontWeight: '700',
        letterSpacing: -1,
    },
    balanceLabel: {
        fontSize: 16,
        fontWeight: '500',
    },
    subLabel: {
        fontSize: 13,
        marginTop: 4,
    },
    planContainer: {
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 24,
    },
    progressContainer: {
        width: '100%',
        marginTop: 24,
    },
    progressBar: {
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    progressLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    progressText: {
        fontSize: 13,
        fontWeight: '500',
    },
    insightsContainer: {
        alignItems: 'center',
        paddingBottom: 20,
    },
    emptyState: {
        alignItems: 'center',
        padding: 32,
    },
    emptyCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 2,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    emptyText: {
        fontSize: 13,
    },
});
