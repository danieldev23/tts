/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{vue,js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // Dark theme colors
                'app-bg': '#020617',
                'app-bg-alt': '#0b1220',
                'card-bg': '#0f172a',
                'card-border': '#1e293b',
                'text-primary': '#f8fafc',
                'text-secondary': '#94a3b8',
                'accent': {
                    cyan: '#22d3ee',
                    sky: '#0ea5e9',
                    blue: '#3b82f6'
                }
            },
            backgroundImage: {
                'gradient-btn': 'linear-gradient(to right, #22d3ee, #0ea5e9, #3b82f6)',
                'gradient-btn-hover': 'linear-gradient(to right, #06b6d4, #0284c7, #2563eb)'
            },
            boxShadow: {
                'glow': '0 0 20px rgba(34, 211, 238, 0.3)',
                'glow-hover': '0 0 30px rgba(34, 211, 238, 0.5)'
            }
        },
    },
    plugins: [],
}
