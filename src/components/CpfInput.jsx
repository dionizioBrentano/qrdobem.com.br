import React, { useState } from 'react';
import { maskCpf } from '../utils/masks';

export default function CpfInput({ value, onChange, ...props }) {
  const [isFocused, setIsFocused] = useState(false);

  // Quando focado exibe apenas dígitos, quando sem foco exibe mascarado.
  const displayValue = isFocused 
    ? (value || '').replace(/\D/g, '') 
    : maskCpf(value);

  const handleChange = (e) => {
    // Mantém apenas os números limitados a 11 dígitos
    const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
    
    // Repassa o valor mascarado para o state pai, padronizando os dados
    if (onChange) {
      onChange(maskCpf(digits));
    }
  };

  return (
    <input
      type="tel"
      value={displayValue}
      onChange={handleChange}
      onFocus={(e) => {
        setIsFocused(true);
        if (props.onFocus) props.onFocus(e);
      }}
      onBlur={(e) => {
        setIsFocused(false);
        if (props.onBlur) props.onBlur(e);
      }}
      {...props}
    />
  );
}
