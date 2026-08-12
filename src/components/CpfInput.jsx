import React, { useState, useLayoutEffect, useRef } from 'react';
import { maskCpf } from '../utils/masks';

export default function CpfInput({ value, onChange, onFocus, onBlur, ...rest }) {
  const inputRef = useRef(null);
  const [cursor, setCursor] = useState(null);

  const displayValue = maskCpf(value || '');

  useLayoutEffect(() => {
    if (inputRef.current && cursor !== null) {
      inputRef.current.setSelectionRange(cursor, cursor);
    }
  }, [displayValue, cursor]);

  const handleChange = (e) => {
    const el = e.target;
    let start = el.selectionStart;
    
    const raw = el.value.replace(/\D/g, '').slice(0, 11);
    const masked = maskCpf(raw);

    // Ajusta o cursor para ir para o fim caso o usuário digite no final e uma formatação aconteça
    if (masked.length > displayValue.length && start === el.value.length) {
      start = masked.length;
    }
    
    setCursor(start);
    
    if (onChange) {
      onChange(masked);
    }
  };

  return (
    <input
      {...rest}
      ref={inputRef}
      type="tel"
      inputMode="numeric"
      autoComplete="off"
      value={displayValue}
      onChange={handleChange}
      onFocus={onFocus}
      onBlur={onBlur}
    />
  );
}
