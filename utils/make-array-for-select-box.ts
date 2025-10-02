type Option<T> = {
    label: T;
    value: T;
};

export function enumToOptions<T extends Record<string, string>>(enumObj: T): Option<T[keyof T]>[] {
    return Object.values(enumObj).map((value) => ({
        label: value as T[keyof T],  // 👈 cast کردن
        value: value as T[keyof T],  // 👈 cast کردن
    }));
}


// ////////////////////////////////////////////////////////////////////////////

type OptionType2<L, V> = {
    label: L;
    value: V;
};

export function specificArraytoOptions<T extends Record<string, any>, L extends keyof T, V extends keyof T>(
    items: T[],
    labelKey: L,
    valueKey: V
): OptionType2<T[L], T[V]>[] {
    return items.map((item) => ({
        label: item[labelKey],
        value: item[valueKey],
    }));
}

