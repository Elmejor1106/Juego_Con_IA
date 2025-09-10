import React from 'react';


const Input = ({ type = 'text', placeholder, value, onChange, name, required, className }) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      name={name}
      required={required}
      className={`w-full input shadow-sm focus:shadow-md transition ${className}`}
    />
  );
};

export default Input;
