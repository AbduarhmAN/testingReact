import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';

type TransactionRowProps = {
    title: string;
    subtitle: string;
    amount: number;
    iconName: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    date?: string;
    isExpense?: boolean;
};

export function TransactionRow({
    title,
    subtitle,
    amount,
    iconName,
    iconColor,
    date,
    isExpense = true,
}: TransactionRowProps) {
    const colorScheme = useColorScheme();
    const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

    return (
        <View style={styles.container}>
            <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
                <Ionicons name={iconName} size={24} color={iconColor} />
            </View>

            <View style={styles.contentContainer}>
                <View style={styles.textContainer}>
                    <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                        {subtitle} {date && `• ${date}`}
                    </Text>
                </View>

                <Text
                    style={[
                        styles.amount,
                        { color: isExpense ? theme.text : theme.income },
                    ]}
                >
                    {isExpense ? '-' : '+'}${Math.abs(amount).toFixed(2)}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    contentContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    subtitle: {
        fontSize: 14,
    },
    amount: {
        fontSize: 16,
        fontWeight: '600',
    },
});
