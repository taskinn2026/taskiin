/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Tajawal', 'sans-serif'], // Set as default sans
                tajawal: ['Tajawal', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
