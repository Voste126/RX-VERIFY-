/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary": "#0055ff",
                "success": "#00C853",
                "warning": "#FFD600",
                "danger": "#D50000",
                "background-light": "#f5f6f8",
                "background-dark": "#0f1623",
                "surface-dark": "#1b1f28",
            },
            fontFamily: {
                "display": ["Inter", "sans-serif"],
                "mono": ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "Liberation Mono", "Courier New", "monospace"]
            },
            borderRadius: {
                DEFAULT: "0.25rem",
                lg: "0.5rem",
                xl: "0.75rem",
                "2xl": "1rem",
                full: "9999px"
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
            }
        },
    },
    plugins: [],
}
