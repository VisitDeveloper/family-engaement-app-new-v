import { ThemedText } from '@/components/themed-text';
import { useStore } from '@/store';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Modal, Platform, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';


interface DatePickerProps {
    mode?: 'date' | 'time' | 'datetime' | 'countdown';
    setDate: React.Dispatch<React.SetStateAction<Date>>;
    date: Date;
    disabled?: boolean
}

export default function DatePicker(props: DatePickerProps) {
    const { mode = 'date', setDate, date, disabled = false } = props
    const theme = useStore(state => state.theme)
    const [show, setShow] = useState(false);

    const onChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        // On Android, dismiss the picker when user cancels or selects
        if (Platform.OS === 'android') {
            setShow(false);
        }

        if (!selectedDate) {
            return;
        }

        const newDate = new Date(date); // Current state value

        if (mode === 'date') {
            // Only year, month, day
            newDate.setFullYear(selectedDate.getFullYear());
            newDate.setMonth(selectedDate.getMonth());
            newDate.setDate(selectedDate.getDate());
        } else if (mode === 'time') {
            // Only hour and minute
            newDate.setHours(selectedDate.getHours());
            newDate.setMinutes(selectedDate.getMinutes());
        }

        setDate(newDate);
        // On iOS, we keep the modal open so user can continue adjusting
        // The modal closes only when "Done" or "Cancel" is pressed
    };

    const formatDisplayValue = () => {
        if (mode === 'date') {
            return date.toLocaleDateString();
        } else if (mode === 'time') {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleString();
    };

    // On iOS, show a button that opens the picker in a modal for better UX
    if (Platform.OS === 'ios') {
        return (
            <View style={{ marginLeft: -10 }}>
                <TouchableOpacity
                    onPress={() => !disabled && setShow(true)}
                    disabled={disabled}
                    style={{ 
                        opacity: disabled ? 0.5 : 1,
                        paddingVertical: 4,
                        paddingHorizontal: 8,
                    }}
                >
                    <ThemedText style={{ color: theme.text, fontSize: 16 }}>
                        {formatDisplayValue()}
                    </ThemedText>
                </TouchableOpacity>
                <Modal
                    visible={show}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setShow(false)}
                >
                    <TouchableWithoutFeedback onPress={() => setShow(false)}>
                        <View style={{
                            flex: 1,
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            justifyContent: 'flex-end',
                        }}>
                            <TouchableWithoutFeedback>
                                <View style={{
                                    backgroundColor: theme.bg,
                                    borderTopLeftRadius: 20,
                                    borderTopRightRadius: 20,
                                    padding: 20,
                                    paddingBottom: 40,
                                }}>
                                    <View style={{
                                        flexDirection: 'row',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: 20,
                                    }}>
                                        <TouchableOpacity onPress={() => setShow(false)}>
                                            <ThemedText style={{ color: theme.tint, fontSize: 16 }}>
                                                Cancel
                                            </ThemedText>
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => {
                                            // Save the current selection and close
                                            setShow(false);
                                        }}>
                                            <ThemedText style={{ color: theme.tint, fontSize: 16, fontWeight: '600' }}>
                                                Done
                                            </ThemedText>
                                        </TouchableOpacity>
                                    </View>
                                    <DateTimePicker
                                        value={date}
                                        mode={mode}
                                        display="spinner"
                                        onChange={onChange}
                                        disabled={disabled}
                                        textColor={theme.text}
                                        style={{ backgroundColor: theme.bg }}
                                    />
                                </View>
                            </TouchableWithoutFeedback>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>
            </View>
        );
    }

    // On Android, show a button that opens the picker modal
    return (
        <View style={{ marginLeft: -10 }}>
            <TouchableOpacity
                onPress={() => !disabled && setShow(true)}
                disabled={disabled}
                style={{ opacity: disabled ? 0.5 : 1 }}
            >
                <ThemedText style={{ color: theme.text, fontSize: 16 }}>
                    {formatDisplayValue()}
                </ThemedText>
            </TouchableOpacity>
            {show && (
                <DateTimePicker
                    value={date}
                    mode={mode}
                    display="default"
                    onChange={onChange}
                    disabled={disabled}
                />
            )}
        </View>
    );
}


// // import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
// // import React, { useState } from "react";
// // import { Button, Platform, Text, View } from "react-native";

// // export default function App() {
// //     const [date, setDate] = useState(new Date());
// //     const [showDate, setShowDate] = useState(false);
// //     const [showTime, setShowTime] = useState(false);

// //     const onChangeIOS = (event: DateTimePickerEvent, selectedDate?: Date) => {
// //         if (selectedDate) {
// //             // On iOS, full datetime value (both date and time) comes
// //             setDate(selectedDate);
// //         }
// //         setShowDate(false);
// //     };

// //     const onChangeDateAndroid = (event: DateTimePickerEvent, selectedDate?: Date) => {
// //         if (selectedDate) {
// //             const newDate = new Date(selectedDate);
// //             setDate(newDate);
// //             setShowDate(false);
// //             setShowTime(true); // After selecting date → time picker
// //         } else {
// //             setShowDate(false);
// //         }
// //     };

// //     const onChangeTimeAndroid = (event: DateTimePickerEvent, selectedTime?: Date) => {
// //         if (selectedTime) {
// //             const newDate = new Date(date);
// //             newDate.setHours(selectedTime.getHours());
// //             newDate.setMinutes(selectedTime.getMinutes());
// //             setDate(newDate);
// //         }
// //         setShowTime(false);
// //     };

// //     const showPicker = () => {
// //         if (Platform.OS === "ios") {
// //             setShowDate(true);
// //         } else {
// //             setShowDate(true); // Android first date
// //         }
// //     };

// //     return (
// //         <View style={{ marginTop: 100, padding: 20 }}>
// //             <Button title="Pick Date & Time" onPress={showPicker} />

// //             <Text style={{ marginTop: 20, fontSize: 16 }}>
// //                 Selected: {date.toLocaleString()} {/* Display selected date and time */}
// //             </Text>

// //             {/* iOS datetime mode */}
// //             {Platform.OS === "ios" && showDate && (
// //                 <DateTimePicker
// //                     value={date}
// //                     mode="datetime"
// //                     display="spinner"
// //                     onChange={onChangeIOS}
// //                 />
// //             )}

// //             {/* Android separate mode */}
// //             {Platform.OS === "android" && showDate && (
// //                 <DateTimePicker
// //                     value={date}
// //                     mode="date"
// //                     display="default"
// //                     onChange={onChangeDateAndroid}
// //                 />
// //             )}

// //             {Platform.OS === "android" && showTime && (
// //                 <DateTimePicker
// //                     value={date}
// //                     mode="time"
// //                     display="default"
// //                     onChange={onChangeTimeAndroid}
// //                 />
// //             )}
// //         </View>
// //     );
// // }


