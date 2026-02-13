import { Colors } from "@/constants/theme";
import { useThemedStyles } from "@/hooks/use-theme-style";
import { useStore } from "@/store";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    FlatList,
    Modal,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { ThemedText } from "../themed-text";


export interface OptionsList {
    label: string;
    value: string;
}

interface SelectBoxProps {
    options: OptionsList[];
    value: string;
    onChange: (value: string) => void;
    title?: string;
    disabled?: boolean;
}

export default function SelectBox({ options, value, onChange, title = '', disabled = false }: SelectBoxProps) {
    const [visible, setVisible] = useState(false);
    const [pendingValue, setPendingValue] = useState(value);
    const theme = useStore(state => state.theme);
    const colorScheme = useStore(state => state.colorScheme);
    const { t } = useTranslation();

    const selectionBg = colorScheme === 'dark' ? Colors.dark.tabActivationBackground : Colors.light.tabActivationBackground;

    useEffect(() => {
        if (visible) setPendingValue(value);
    }, [visible, value]);

    const styles = useThemedStyles((tTheme) => ({
        selectBox: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 10,
            borderWidth: 1,
        },
        overlay: {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.5)",
        },
        modalCard: {
            width: "90%",
            maxWidth: 400,
            borderRadius: 16,
            padding: 20,
            paddingBottom: 24,
            backgroundColor: tTheme.bg,
        },
        modalTitle: {
            marginBottom: 16,
            fontWeight: "600",
        },
        optionRow: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingVertical: 14,
            paddingHorizontal: 12,
            borderRadius: 10,
            marginBottom: 2,
        },
        optionRowSelected: {
            backgroundColor: selectionBg,
        },
        applyButton: {
            backgroundColor: tTheme.tint,
            paddingVertical: 14,
            borderRadius: 10,
            alignItems: "center",
            justifyContent: "center",
            marginTop: 20,
        },
    }) as const);

    const selectedOption = options.find(opt => opt.value === value);
    const displayLabel = selectedOption ? selectedOption.label : value;

    const handleApply = () => {
        onChange(pendingValue);
        setVisible(false);
    };

    return (
        <View>
            <TouchableOpacity
                disabled={disabled}
                style={[styles.selectBox, { backgroundColor: theme.panel, borderColor: "transparent" }]}
                onPress={() => setVisible(true)}
            >
                <Text style={{ color: disabled ? theme.subText : theme.text }}>{displayLabel}</Text>
                <Feather name="chevron-down" size={16} color={theme.subText} />
            </TouchableOpacity>

            <Modal visible={visible} transparent animationType="fade">
                <TouchableOpacity
                    style={styles.overlay}
                    activeOpacity={1}
                    onPress={() => setVisible(false)}
                >
                    <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
                        <ThemedText type="defaultSemiBold" style={styles.modalTitle}>
                            {title}
                        </ThemedText>

                        <FlatList
                            data={options}
                            keyExtractor={(item) => item.value}
                            scrollEnabled={options.length > 6}
                            style={{ maxHeight: 280 }}
                            renderItem={({ item }) => {
                                const isSelected = item.value === pendingValue;
                                return (
                                    <TouchableOpacity
                                        style={[styles.optionRow, isSelected && styles.optionRowSelected]}
                                        onPress={() => setPendingValue(item.value)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={{ color: theme.text, fontSize: 16 }}>{item.label}</Text>
                                        {isSelected && (
                                            <Ionicons name="checkmark-circle" size={22} color={theme.tint} />
                                        )}
                                    </TouchableOpacity>
                                );
                            }}
                        />

                        <TouchableOpacity style={styles.applyButton} onPress={handleApply} activeOpacity={0.8}>
                            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>{t("common.apply")}</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}
