import React from 'react';

export default function CoffeeIcon({ className = "w-6 h-6", ...props }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className={className} {...props}>
            {/* Saucer */}
            <ellipse cx="50" cy="80" rx="40" ry="12" fill="#E6E0D4" stroke="#CBB9A1" strokeWidth="2" />
            {/* Cup Shadow */}
            <path d="M 25 75 Q 50 85 75 75 A 30 10 0 0 1 25 75 Z" fill="#D3C9B8" />
            {/* Cup Handle */}
            <path d="M 70 40 Q 95 40 95 55 Q 95 65 70 65" fill="none" stroke="#FDFBF7" strokeWidth="8" strokeLinecap="round" />
            {/* Cup Body */}
            <path d="M 20 30 L 25 70 Q 50 85 75 70 L 80 30 Z" fill="#FDFBF7" stroke="#E6E0D4" strokeWidth="2" />
            {/* Cup Rim */}
            <ellipse cx="50" cy="30" rx="30" ry="8" fill="#FDFBF7" stroke="#CBB9A1" strokeWidth="1" />
            {/* Coffee */}
            <ellipse cx="50" cy="30" rx="27" ry="6" fill="#4A2F1D" />
            {/* Coffee foam / art */}
            <ellipse cx="50" cy="30" rx="10" ry="2" fill="#C19A6B" opacity="0.8" transform="rotate(-15 50 30)" />
            {/* Steam */}
            <path d="M 40 20 Q 35 10 45 5" fill="none" stroke="#E6E0D4" strokeWidth="2" strokeLinecap="round" opacity="0.6" className="animate-[pulse_2s_ease-in-out_infinite]" />
            <path d="M 50 22 Q 45 12 55 7" fill="none" stroke="#E6E0D4" strokeWidth="2" strokeLinecap="round" opacity="0.8" className="animate-[pulse_1.5s_ease-in-out_infinite]" />
            <path d="M 60 20 Q 55 10 65 5" fill="none" stroke="#E6E0D4" strokeWidth="2" strokeLinecap="round" opacity="0.6" className="animate-[pulse_2.5s_ease-in-out_infinite]" />
        </svg>
    );
}
