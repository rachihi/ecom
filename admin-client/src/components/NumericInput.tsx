import { TextField, TextFieldProps } from '@mui/material';
import { forwardRef } from 'react';

interface NumericInputProps extends Omit<TextFieldProps, 'onChange'> {
    value: number;
    onChange: (value: number) => void;
}

const NumericInput = forwardRef<HTMLDivElement, NumericInputProps>(({ value, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, '');
        onChange(val ? Number(val) : 0);
    };

    const formattedValue = value ? new Intl.NumberFormat('vi-VN').format(value) : '';

    return (
        <TextField
            {...props}
            ref={ref}
            value={formattedValue}
            onChange={handleChange}
            type="text"
        />
    );
});

export default NumericInput;
