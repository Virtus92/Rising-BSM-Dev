import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Authentifizierung - Rising BSM',
  description: 'Melden Sie sich bei Rising BSM an',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}