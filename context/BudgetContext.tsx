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
    addCategory: (category: Omit<Category, 'id' | 'createdAt'>) => void;
    updateCategory: (id: string, updates: Partial<Omit<Category, 'id' | 'createdAt'>>) => void;
    deleteCategory: (id: string) => void;
    getCategoryById: (id: string) => Category | undefined;

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
];

// ============================================================================
// UUID GENERATION (Cryptographically Secure)
// ============================================================================

function generateUUID(): string {
    return Crypto.randomUUID();
}

// ============================================================================
// PROVIDER
// ============================================================================

export function BudgetProvider({ children }: { children: ReactNode }) {
    const [budget, setBudget] = useState(3000);

    // Initialize categories with defaults (seeded with proper UUIDs)
    const [categories, setCategories] = useState<Category[]>(() => {
        return DEFAULT_CATEGORIES.map((cat, index) => ({
            ...cat,
            id: generateUUID(),
            createdAt: Date.now() + index, // Ensure unique timestamps
        }));
    });

    const [transactions, setTransactions] = useState<Transaction[]>([]);

    // ========================================================================
    // CATEGORY OPERATIONS
    // ========================================================================

    const addCategory = useCallback((category: Omit<Category, 'id' | 'createdAt'>) => {
        const newCategory: Category = {
            ...category,
            id: generateUUID(),
            createdAt: Date.now(),
        };
        setCategories(prev => [...prev, newCategory]);
    }, []);

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
