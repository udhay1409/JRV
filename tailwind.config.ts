// import type { Config } from "tailwindcss";

// import {heroui} from "@heroui/theme";

// /** @type {Config} */
// const config: Config = {
//   content: [
//     "./pages/**/*.{js,ts,jsx,tsx,mdx}",
//     "./Components/**/*.{js,ts,jsx,tsx,mdx}",
//     "./app/**/*.{js,ts,jsx,tsx,mdx}",
//     "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
//   ],
//   theme: {
//   	extend: {
//   		colors: {
//   			background: 'hsl(var(--background))',
//   			foreground: 'hsl(var(--foreground))',
//   			card: {
//   				DEFAULT: 'hsl(var(--card))',
//   				foreground: 'hsl(var(--card-foreground))'
//   			},
//   			popover: {
//   				DEFAULT: 'hsl(var(--popover))',
//   				foreground: 'hsl(var(--popover-foreground))'
//   			},
// 			  primary: {
// 				DEFAULT: "#0070F3",
// 				50: "#E6F0FF",
// 				100: "#CCE1FF",
// 				200: "#99C3FF",
// 				300: "#66A5FF",
// 				400: "#3387FF",
// 				500: "#0070F3",
// 				600: "#005ACC",
// 				700: "#0044A6",
// 				800: "#002E80",
// 				900: "#001959",
// 				foreground: 'hsl(var(--primary-foreground))'
// 			},
//   			secondary: {
//   				DEFAULT: 'hsl(var(--secondary))',
//   				foreground: 'hsl(var(--secondary-foreground))'
//   			},
//   			muted: {
//   				DEFAULT: 'hsl(var(--muted))',
//   				foreground: 'hsl(var(--muted-foreground))'
//   			},
//   			accent: {
//   				DEFAULT: 'hsl(var(--accent))',
//   				foreground: 'hsl(var(--accent-foreground))'
//   			},
//   			destructive: {
//   				DEFAULT: 'hsl(var(--destructive))',
//   				foreground: 'hsl(var(--destructive-foreground))'
//   			},
//   			border: 'hsl(var(--border))',
//   			input: 'hsl(var(--input))',
//   			ring: 'hsl(var(--ring))',
//   			chart: {
//   				'1': 'hsl(var(--chart-1))',
//   				'2': 'hsl(var(--chart-2))',
//   				'3': 'hsl(var(--chart-3))',
//   				'4': 'hsl(var(--chart-4))',
//   				'5': 'hsl(var(--chart-5))'
//   			},
// 			 // Hotel Primary Colors
// 			 'hotel-primary': `var(--hotel-primary)`,
// 			 'hotel-primary-text': '#0D0E0D',
// 			 'hotel-primary-darkgreen': '#18B754',
// 			 'hotel-primary-green': '#25D366',
// 			 'hotel-primary-red': '#FF0000',
// 			 'hotel-primary-darkred': '#9E3737',
// 			 'hotel-primary-yellow': '#FFDF00',
// 			 'hotel-primary-bg': '#F8F8F8',
	 
// 			 // Hotel Secondary Colors
// 			 'hotel-secondary': '#E3F2FD',
// 			 'hotel-secondary-accent': '#FFFFFF',
// 			 'hotel-secondary-light-grey': '#D9D9D9',
// 			 'hotel-secondary-grey': '#6E6E6E',
//   		},
//   		borderRadius: {
//   			lg: 'var(--radius)',
//   			md: 'calc(var(--radius) - 2px)',
//   			sm: 'calc(var(--radius) - 4px)'
//   		},
// 		  animation: {
// 			"spin-slow": "spin 3s linear infinite",
// 			ping: "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite",
// 			"accordion-down": "accordion-down 0.2s ease-out",
// 			"accordion-up": "accordion-up 0.2s ease-out",
// 			"progressBar": "progressBar 2s ease-in-out forwards",
// 			"pulse": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
// 			"spin-reverse": "spin 1s linear infinite reverse",
// 			"spin-slower": "spin 6s linear infinite",
// 		  },
// 		  keyframes: {
// 			spin: {
// 			  "0%": { transform: "rotate(0deg)" },
// 			  "100%": { transform: "rotate(360deg)" },
// 			},
// 			ping: {
// 			  "75%, 100%": { transform: "scale(1.5)", opacity: "0" },
// 			 },
// 			"accordion-down": {
// 			  from: { height: "0px" },
// 			  to: { height: "var(--radix-accordion-content-height)" },
// 			},
// 			"accordion-up": {
// 			  from: { height: "var(--radix-accordion-content-height)" },
// 			  to: { height: "0px" },
// 			},
// 			progressBar: {
// 			  '0%': { width: '0%' },
// 			  '20%': { width: '20%' },
// 			  '40%': { width: '40%' },
// 			  '60%': { width: '70%' },
// 			  '80%': { width: '90%' },
// 			  '100%': { width: '100%' }
// 			},
// 			pulse: {
// 			  '0%, 100%': { opacity: '1' },
// 			  '50%': { opacity: '0.5' }
// 			}
// 		  },
// 		  boxShadow: {
// 				input: `0px 2px 3px -1px rgba(0,0,0,0.1), 0px 1px 0px 0px rgba(25,28,33,0.02), 0px 0px 0px 1px rgba(25,28,33,0.08)`,

// 		  },
//   	}
//   },
//   darkMode: ["class", "class"],
//   plugins: [heroui(), require("tailwindcss-animate")],

// };
// export default config;
import type { Config } from "tailwindcss";

import {heroui} from "@heroui/theme";

/** @type {Config} */ 
const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./Components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
			  primary: {
				DEFAULT: "#0070F3",
				50: "#E6F0FF",
				100: "#CCE1FF",
				200: "#99C3FF",
				300: "#66A5FF",
				400: "#3387FF",
				500: "#0070F3",
				600: "#005ACC",
				700: "#0044A6",
				800: "#002E80",
				900: "#001959",
				foreground: 'hsl(var(--primary-foreground))'
			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
			 // Hotel Primary Colors
			 'hotel-primary': `var(--hotel-primary)`,
			 'hotel-primary-text': '#0D0E0D',
			 'hotel-primary-darkgreen': '#18B754',
			 'hotel-primary-green': '#25D366',
			 'hotel-primary-red': '#FF0000',
			 'hotel-primary-darkred': '#9E3737',
			 'hotel-primary-yellow': '#FFDF00',
			 'hotel-primary-bg': '#F8F8F8',
	 
			 // Hotel Secondary Colors
			 'hotel-secondary': '#E3F2FD',
			 'hotel-secondary-accent': '#FFFFFF',
			 'hotel-secondary-light-grey': '#D9D9D9',
			 'hotel-secondary-grey': '#6E6E6E',
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
		  animation: {
			"spin-slow": "spin 3s linear infinite",
			ping: "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite",
			"accordion-down": "accordion-down 0.2s ease-out",
			"accordion-up": "accordion-up 0.2s ease-out",
			"progressBar": "progressBar 2s ease-in-out forwards",
			"pulse": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
			"spin-reverse": "spin 1s linear infinite reverse",
			"spin-slower": "spin 6s linear infinite",
		  },
		  keyframes: {
			spin: {
			  "0%": { transform: "rotate(0deg)" },
			  "100%": { transform: "rotate(360deg)" },
			},
			ping: {
			  "75%, 100%": { transform: "scale(1.5)", opacity: "0" },
			 },
			"accordion-down": {
			  from: { height: "0px" },
			  to: { height: "var(--radix-accordion-content-height)" },
			},
			"accordion-up": {
			  from: { height: "var(--radix-accordion-content-height)" },
			  to: { height: "0px" },
			},
			progressBar: {
			  '0%': { width: '0%' },
			  '20%': { width: '20%' },
			  '40%': { width: '40%' },
			  '60%': { width: '70%' },
			  '80%': { width: '90%' },
			  '100%': { width: '100%' }
			},
			pulse: {
			  '0%, 100%': { opacity: '1' },
			  '50%': { opacity: '0.5' }
			}
		  },
		  boxShadow: {
				input: `0px 2px 3px -1px rgba(0,0,0,0.1), 0px 1px 0px 0px rgba(25,28,33,0.02), 0px 0px 0px 1px rgba(25,28,33,0.08)`,

		  },
  	}
  },
  darkMode: ["class", "class"],
  plugins: [heroui(), require("tailwindcss-animate")],

};
export default config;