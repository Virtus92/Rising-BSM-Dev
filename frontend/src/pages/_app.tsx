import type { AppProps } from 'next/app';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '../providers/ThemeProvider';
import Layout from '../components/documentation/Layout';
import '../app/globals.css'; // Import the app-specific CSS

// Configure Inter font
const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter', 
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <main className={`${inter.variable} font-sans`}>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </main>
    </ThemeProvider>
  );
}
