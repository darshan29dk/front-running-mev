module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          neon: "#39FF14", // Neon green
          slate: "#1a1f2e"
        }
      },
      boxShadow: {
        glow: "0 0 20px rgba(57, 255, 20, 0.2)" // Neon green glow
      }
    }
  },
  plugins: []
};