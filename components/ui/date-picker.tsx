import { useStore } from '@/store';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Platform, View } from 'react-native';


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
        if (!selectedDate) {
            setShow(Platform.OS === 'ios');
            return;
        }

        const newDate = new Date(date); // مقدار فعلی state

        if (mode === 'date') {
            // فقط سال، ماه، روز
            newDate.setFullYear(selectedDate.getFullYear());
            newDate.setMonth(selectedDate.getMonth());
            newDate.setDate(selectedDate.getDate());
        } else if (mode === 'time') {
            // فقط ساعت و دقیقه
            newDate.setHours(selectedDate.getHours());
            newDate.setMinutes(selectedDate.getMinutes());
        }

        setDate(newDate);
        setShow(Platform.OS === 'ios');
    };


    return (
        <View style={{ marginLeft: -10 }}>

            <DateTimePicker
                value={date}
                mode={mode}
                display="default"
                onChange={onChange}
                disabled={disabled}
            />



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
// //             // روی iOS مقدار کامل datetime (هم تاریخ هم ساعت) میاد
// //             setDate(selectedDate);
// //         }
// //         setShowDate(false);
// //     };

// //     const onChangeDateAndroid = (event: DateTimePickerEvent, selectedDate?: Date) => {
// //         if (selectedDate) {
// //             const newDate = new Date(selectedDate);
// //             setDate(newDate);
// //             setShowDate(false);
// //             setShowTime(true); // بعد از انتخاب تاریخ → تایم‌پیکر
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
// //             setShowDate(true); // Android اول تاریخ
// //         }
// //     };

// //     return (
// //         <View style={{ marginTop: 100, padding: 20 }}>
// //             <Button title="Pick Date & Time" onPress={showPicker} />

// //             <Text style={{ marginTop: 20, fontSize: 16 }}>
// //                 Selected: {date.toLocaleString()} {/* نمایش تاریخ و ساعت انتخابی */}
// //             </Text>

// //             {/* iOS حالت datetime */}
// //             {Platform.OS === "ios" && showDate && (
// //                 <DateTimePicker
// //                     value={date}
// //                     mode="datetime"
// //                     display="spinner"
// //                     onChange={onChangeIOS}
// //                 />
// //             )}

// //             {/* Android حالت جدا */}
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


