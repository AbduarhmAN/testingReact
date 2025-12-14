import { Colors, Shadows } from '@/constants/theme';
import { StyleSheet, useColorScheme, View, ViewProps } from 'react-native';

export function Card({ style, ...otherProps }: ViewProps) {
    const colorScheme = useColorScheme();
    const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
    const shadows = colorScheme === 'dark' ? Shadows.dark : Shadows.light;

    return (
        <View
            style={[
                styles.card,
                { backgroundColor: theme.card },
                shadows,
                style,
            ]}
            {...otherProps}
        />
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 20,
        padding: 20,
        marginVertical: 10,
        marginHorizontal: 16,
    },
});
