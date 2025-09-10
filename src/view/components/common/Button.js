import React from 'react';


const Button = ({ children, className = '', ...props }) => (
	<button
		{...props}
		className={`btn shadow-md font-semibold tracking-wide ${className}`}
	>
		{children}
	</button>
);

export default Button;