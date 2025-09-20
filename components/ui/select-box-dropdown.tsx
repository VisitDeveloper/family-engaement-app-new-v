import { useStore } from "@/store";
import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const Dropdown = ({ options, value, onChange }: any) => {
    const [open, setOpen] = useState(false);
    const theme = useStore(state => state.theme)
    return (
        <View>
            {/* Select Box */}
            <TouchableOpacity
                style={[styles.selectBox, { backgroundColor: theme.panel, borderColor: "transparent" }]}
                onPress={() => setOpen(!open)}
            >
                <Text style={{ color: theme.text }}>{value}</Text>
                <Feather
                    name={open ? "chevron-up" : "chevron-down"}
                    size={16}
                    color={theme.subText}
                />
            </TouchableOpacity>

            {/* Dropdown Options */}
            {open && (
                <View style={[styles.dropdown, { backgroundColor: theme.panel }]}>
                    {options.map((item: string) => (
                        <TouchableOpacity
                            key={item}
                            style={styles.optionItem}
                            onPress={() => {
                                onChange(item);
                                setOpen(false);
                            }}
                        >
                            <Text style={{ color: theme.text }}>{item}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
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
    dropdown: {
        marginTop: 6,
        borderRadius: 8,
        paddingVertical: 4,
        elevation: 3,
    },
    optionItem: {
        padding: 12,
    },
});

export default Dropdown;
