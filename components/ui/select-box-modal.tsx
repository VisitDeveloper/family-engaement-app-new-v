import { useThemedStyles } from "@/hooks/use-theme-style";
import { useStore } from "@/store";
import { Feather } from "@expo/vector-icons";
import { useState } from "react";
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
    const theme = useStore(state => state.theme);

    const styles = useThemedStyles((t) => ({
        titleOfModal: {
            flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'flex-start', padding: 20,
        },
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
        modalOverlay: {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: t.panel,
        },
        modalBox: {
            width: "90%",
            borderRadius: 10,
            padding: 20,
            borderWidth: 1,
            borderColor: t.border,
            maxHeight: 300,
            minHeight: 300,
            overFlow: 'auto'
        },
        optionItem: {
            padding: 12,
            borderBottomWidth: 1,
            borderColor: t.border,
        },

    }) as const);

    // Find the label for the current value
    const selectedOption = options.find(opt => opt.value === value);
    const displayLabel = selectedOption ? selectedOption.label : value;

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


            <Modal visible={visible} transparent animationType="slide">

                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setVisible(false)}
                >
                    <View style={[styles.titleOfModal, {}]}>
                        <ThemedText type="subtitle">
                            {title}
                        </ThemedText>
                    </View>

                    <View style={[styles.modalBox, { backgroundColor: theme.panel }]}>
                        <FlatList
                            data={options}
                            keyExtractor={(item) => item.value}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.optionItem}
                                    onPress={() => {
                                        onChange(item.value);
                                        setVisible(false);
                                    }}
                                >
                                    <Text style={{ color: theme.text }}>{item.label}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}


