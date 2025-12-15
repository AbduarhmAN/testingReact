import { getCategoryColor } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import * as Crypto from 'expo-crypto';
import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface Category {
    id: string;
    name: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    createdAt: number; // For ordering and color assignment
}

export interface Transaction {
    id: string;
    title: string;
    amount: number; // Negative = expense, Positive = income
    date: string; // ISO date string (YYYY-MM-DD)
    categoryId: string;
    note?: string;
    createdAt: number;
}

export interface CategorySpending {
    id: string;
    name: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    amount: number;
}

interface BudgetContextType {
    // Budget
    budget: number;
    setBudget: (budget: number) => void;

    // Categories
    categories: Category[];
    addCategory: (category: Omit<Category, 'id' | 'createdAt' | 'color'> & { color?: string }) => void;
    updateCategory: (id: string, updates: Partial<Omit<Category, 'id' | 'createdAt'>>) => void;
    deleteCategory: (id: string) => void;
    getCategoryById: (id: string) => Category | undefined;
    nextColorIndex: number;

    // Transactions
    transactions: Transaction[];
    addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
    updateTransaction: (id: string, updates: Partial<Omit<Transaction, 'id' | 'createdAt'>>) => void;
    deleteTransaction: (id: string) => void;

    // Computed
    totalSpent: number;
    categoryBreakdown: CategorySpending[];
    getTransactionsByDate: (date: string) => Transaction[];
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

// ============================================================================
// DEFAULT CATEGORIES (seeded on first load)
// ============================================================================

const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'createdAt'>[] = [
    { name: 'Groceries', icon: 'cart-outline', color: getCategoryColor(0) },
    { name: 'Health', icon: 'fitness-outline', color: getCategoryColor(1) },
    { name: 'Transport', icon: 'car-outline', color: getCategoryColor(2) },
    { name: 'Shopping', icon: 'bag-handle-outline', color: getCategoryColor(3) },
    { name: 'Coffee', icon: 'cafe-outline', color: getCategoryColor(4) },
    { name: 'Entertainment', icon: 'game-controller-outline', color: getCategoryColor(5) },
    { name: 'Dining', icon: 'restaurant-outline', color: getCategoryColor(6) },
    { name: 'Utilities', icon: 'flash-outline', color: getCategoryColor(7) },
    { name: 'Subscriptions', icon: 'tv-outline', color: getCategoryColor(8) },
    { name: 'Education', icon: 'school-outline', color: getCategoryColor(9) },
    { name: 'Travel', icon: 'airplane-outline', color: getCategoryColor(10) },
    { name: 'Pets', icon: 'paw-outline', color: getCategoryColor(11) },
    { name: 'Gifts', icon: 'gift-outline', color: getCategoryColor(12) },
    { name: 'Insurance', icon: 'shield-checkmark-outline', color: getCategoryColor(13) },
    { name: 'Home', icon: 'home-outline', color: getCategoryColor(14) },
];

// Helper to get date string
function getDateOffset(daysAgo: number): string {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
}

// ============================================================================
// UUID GENERATION (Cryptographically Secure)
// ============================================================================

function generateUUID(): string {
    return Crypto.randomUUID();
}

// ============================================================================
// PROVIDER
// ============================================================================

// Pre-generate category IDs to share between categories and test transactions
const SEEDED_CATEGORY_IDS = DEFAULT_CATEGORIES.map(() => generateUUID());

function createSeededCategories(): Category[] {
    return DEFAULT_CATEGORIES.map((cat, index) => ({
        ...cat,
        id: SEEDED_CATEGORY_IDS[index],
        createdAt: Date.now() + index,
    }));
}

function createTestTransactions(): Transaction[] {
    const catIds = SEEDED_CATEGORY_IDS;

    const testTransactions: Omit<Transaction, 'id' | 'createdAt'>[] = [
        // Today (0)
        { title: 'Whole Foods', amount: -87.50, date: getDateOffset(0), categoryId: catIds[0], note: 'Weekly groceries' },
        { title: 'Starbucks', amount: -6.75, date: getDateOffset(0), categoryId: catIds[4] },
        { title: 'Uber Ride', amount: -24.00, date: getDateOffset(0), categoryId: catIds[2] },
        { title: 'Netflix', amount: -15.99, date: getDateOffset(0), categoryId: catIds[8] },

        // Yesterday (1)
        { title: 'Gym Membership', amount: -49.99, date: getDateOffset(1), categoryId: catIds[1] },
        { title: 'Amazon Purchase', amount: -156.00, date: getDateOffset(1), categoryId: catIds[3] },
        { title: 'Chipotle', amount: -12.50, date: getDateOffset(1), categoryId: catIds[6] },

        // 2 days ago
        { title: 'Electric Bill', amount: -120.00, date: getDateOffset(2), categoryId: catIds[7] },
        { title: 'Spotify', amount: -9.99, date: getDateOffset(2), categoryId: catIds[8] },
        { title: 'Gas Station', amount: -45.00, date: getDateOffset(2), categoryId: catIds[2] },

        // 3 days ago
        { title: 'Pet Food', amount: -38.00, date: getDateOffset(3), categoryId: catIds[11] },
        { title: 'Movie Tickets', amount: -28.00, date: getDateOffset(3), categoryId: catIds[5] },
        { title: 'Books', amount: -42.00, date: getDateOffset(3), categoryId: catIds[9] },

        // 4 days ago
        { title: 'Flight Booking', amount: -320.00, date: getDateOffset(4), categoryId: catIds[10] },
        { title: 'Birthday Gift', amount: -75.00, date: getDateOffset(4), categoryId: catIds[12] },

        // 5 days ago
        { title: 'Car Insurance', amount: -180.00, date: getDateOffset(5), categoryId: catIds[13] },
        { title: 'Home Depot', amount: -95.00, date: getDateOffset(5), categoryId: catIds[14] },
        { title: 'Trader Joes', amount: -65.00, date: getDateOffset(5), categoryId: catIds[0] },

        // 6 days ago
        { title: 'Coffee Beans', amount: -22.00, date: getDateOffset(6), categoryId: catIds[4] },
        { title: 'Pharmacy', amount: -35.00, date: getDateOffset(6), categoryId: catIds[1] },
        { title: 'Pizza Delivery', amount: -32.00, date: getDateOffset(6), categoryId: catIds[6] },

        // 7 days ago
        { title: 'Video Games', amount: -59.99, date: getDateOffset(7), categoryId: catIds[5] },
        { title: 'Costco', amount: -210.00, date: getDateOffset(7), categoryId: catIds[0] },
        { title: 'Vet Visit', amount: -120.00, date: getDateOffset(7), categoryId: catIds[11] },
        { title: 'Online Course', amount: -199.00, date: getDateOffset(7), categoryId: catIds[9] },
    ];

    return testTransactions.map((tx, index) => ({
        ...tx,
        id: generateUUID(),
        createdAt: Date.now() - index * 1000,
    }));
}

export function BudgetProvider({ children }: { children: ReactNode }) {
    const [budget, setBudget] = useState(5000);
    const [categories, setCategories] = useState<Category[]>(createSeededCategories);
    const [nextColorIndex, setNextColorIndex] = useState(DEFAULT_CATEGORIES.length);
    const [transactions, setTransactions] = useState<Transaction[]>(createTestTransactions);

    // ========================================================================
    // CATEGORY OPERATIONS
    // ========================================================================

    const addCategory = useCallback((category: Omit<Category, 'id' | 'createdAt' | 'color'> & { color?: string }) => {
        let finalColor = category.color;

        // Auto-assign color if not provided
        if (!finalColor) {
            finalColor = getCategoryColor(nextColorIndex);
            setNextColorIndex(prev => prev + 1);
        }

        const newCategory: Category = {
            ...category,
            color: finalColor,
            id: generateUUID(),
            createdAt: Date.now(),
        };
        setCategories(prev => [...prev, newCategory]);
    }, [nextColorIndex]);

    const updateCategory = useCallback((id: string, updates: Partial<Omit<Category, 'id' | 'createdAt'>>) => {
        setCategories(prev => prev.map(cat =>
            cat.id === id ? { ...cat, ...updates } : cat
        ));
    }, []);

    const deleteCategory = useCallback((id: string) => {
        setCategories(prev => prev.filter(c => c.id !== id));
        // Also delete all transactions with this category
        setTransactions(prev => prev.filter(t => t.categoryId !== id));
    }, []);

    const getCategoryById = useCallback((id: string): Category | undefined => {
        return categories.find(c => c.id === id);
    }, [categories]);

    // ========================================================================
    // TRANSACTION OPERATIONS
    // ========================================================================

    const addTransaction = useCallback((transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
        // Validate amount is a valid number
        if (!Number.isFinite(transaction.amount)) {
            console.error('Invalid transaction amount:', transaction.amount);
            return;
        }

        const newTransaction: Transaction = {
            ...transaction,
            id: generateUUID(),
            createdAt: Date.now(),
        };
        setTransactions(prev => [...prev, newTransaction]);
    }, []);

    const updateTransaction = useCallback((id: string, updates: Partial<Omit<Transaction, 'id' | 'createdAt'>>) => {
        // Validate amount if provided
        if (updates.amount !== undefined && !Number.isFinite(updates.amount)) {
            console.error('Invalid transaction amount:', updates.amount);
            return;
        }

        setTransactions(prev => prev.map(t =>
            t.id === id ? { ...t, ...updates } : t
        ));
    }, []);

    const deleteTransaction = useCallback((id: string) => {
        setTransactions(prev => prev.filter(t => t.id !== id));
    }, []);

    // ========================================================================
    // COMPUTED VALUES (Memoized)
    // ========================================================================

    const totalSpent = useMemo(() => {
        return transactions
            .filter(t => t.amount < 0)
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    }, [transactions]);

    const categoryBreakdown = useMemo((): CategorySpending[] => {
        const spending = new Map<string, number>();

        transactions
            .filter(t => t.amount < 0)
            .forEach(t => {
                const current = spending.get(t.categoryId) || 0;
                spending.set(t.categoryId, current + Math.abs(t.amount));
            });

        return categories
            .filter(cat => spending.has(cat.id))
            .map(cat => ({
                id: cat.id,
                name: cat.name,
                icon: cat.icon,
                color: cat.color,
                amount: spending.get(cat.id) || 0,
            }))
            .sort((a, b) => b.amount - a.amount);
    }, [transactions, categories]);

    const getTransactionsByDate = useCallback((date: string): Transaction[] => {
        return transactions
            .filter(t => t.date === date)
            .sort((a, b) => b.createdAt - a.createdAt);
    }, [transactions]);

    // ========================================================================
    // CONTEXT VALUE (Memoized to prevent unnecessary re-renders)
    // ========================================================================

    const value = useMemo<BudgetContextType>(() => ({
        budget,
        setBudget,
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        getCategoryById,
        nextColorIndex,
        transactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        totalSpent,
        categoryBreakdown,
        getTransactionsByDate,
    }), [
        budget,
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        getCategoryById,
        nextColorIndex,
        transactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        totalSpent,
        categoryBreakdown,
        getTransactionsByDate,
    ]);

    return (
        <BudgetContext.Provider value={value}>
            {children}
        </BudgetContext.Provider>
    );
}

// ============================================================================
// HOOK
// ============================================================================

export function useBudget(): BudgetContextType {
    const context = useContext(BudgetContext);
    if (!context) {
        throw new Error('useBudget must be used within a BudgetProvider');
    }
    return context;
}
