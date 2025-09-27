import { useState } from "react";

export interface ValidationRule {
    required?: boolean;
    maxLength?: number;
    minLength?: number;
    pattern?: RegExp;
    custom?: (value: any) => string | null; // تابع ولیدیشن دلخواه
}

export type ValidationSchema<T> = {
    [K in keyof T]?: ValidationRule;
};

export const useValidation = <T extends Record<string, any>>(schema: ValidationSchema<T>) => {
    const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

    const validate = (values: T) => {
        const newErrors: Partial<Record<keyof T, string>> = {};

        for (const field in schema) {
            const rules = schema[field];
            const value = values[field];

            if (!rules) continue;

            // required
            if (rules.required && (!value || String(value).trim().length === 0)) {
                newErrors[field] = `${field} is required`;
                continue;
            }

            // minLength
            if (rules.minLength && String(value).length < rules.minLength) {
                newErrors[field] = `${field} must be at least ${rules.minLength} characters`;
            }

            // maxLength
            if (rules.maxLength && String(value).length > rules.maxLength) {
                newErrors[field] = `${field} must be less than ${rules.maxLength} characters`;
            }

            // pattern
            if (rules.pattern && !rules.pattern.test(String(value))) {
                newErrors[field] = `${field} is invalid`;
            }

            // custom validator
            if (rules.custom) {
                const errorMessage = rules.custom(value);
                if (errorMessage) newErrors[field] = errorMessage;
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    return { errors, validate };
};
