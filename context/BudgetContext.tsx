import { Ionicons } from '@expo/vector-icons';
import { createContext, ReactNode, useContext, useState } from 'react';

export type Category = {
    id: string;
    name: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
};

export type Transaction = {
    id: string;
    title: string;
    subtitle: string;
    amount: number;
    date: string;
    iconName: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    categoryId: string;
};

type BudgetContextType = {
    budget: number;
    setBudget: (budget: number) => void;
    categories: Category[];
    addCategory: (category: Omit<Category, 'id'>) => void;
    deleteCategory: (id: string) => void;
    transactions: Transaction[];
    addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
    deleteTransaction: (id: string) => void;
};

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export function BudgetProvider({ children }: { children: ReactNode }) {
    const [budget, setBudget] = useState(3000);
    const [categories, setCategories] = useState<Category[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    const addCategory = (category: Omit<Category, 'id'>) => {
        const newCategory: Category = {
            ...category,
            id: Date.now().toString(),
        };
        setCategories(prev => [...prev, newCategory]);
    };

    const deleteCategory = (id: string) => {
        setCategories(prev => prev.filter(c => c.id !== id));
    };

    const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
        const newTransaction: Transaction = {
            ...transaction,
            id: Date.now().toString(),
        };
        setTransactions(prev => [...prev, newTransaction]);
    };

    const deleteTransaction = (id: string) => {
        setTransactions(prev => prev.filter(t => t.id !== id));
    };

    return (
        <BudgetContext.Provider value={{
            budget,
            setBudget,
            categories,
            addCategory,
            deleteCategory,
            transactions,
            addTransaction,
            deleteTransaction,
        }}>
            {children}
        </BudgetContext.Provider>
    );
}

export function useBudget() {
    const context = useContext(BudgetContext);
    if (!context) {
        throw new Error('useBudget must be used within a BudgetProvider');
    }
    return context;
}
