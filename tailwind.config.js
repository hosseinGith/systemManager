/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./**/*.{html,css}"],

  theme: {
    extend: {
      colors: {
        darkMainColor: "#262e34",
        darkMainColor2: "#18191d",
        darkMainTextColor: "#fff",
        lightMainColor: "#fff",
        lightMainTextColor: "#000",
        mainColor: "#262e34",
        mainColor2: "#45b5ff",
        mainTextColor: "#000",
        lowIconColor: "#8c939e",
        lowSearchColor: "#3b444c",
        lowSearchColorLight: "#f1f1ee",
        clientColor1: "#8e3f69",
        clientColor2: " #a54772",
      },
    },

    container: {
      center: true,
    },
  },
  plugins: [],
};

// fixed run tailwind
//  npm uninstall tailwindcss
//  npm install -D tailwindcss@3.4.1
