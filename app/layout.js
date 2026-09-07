import './globals.css';

export const metadata = {
  title: 'DAQUITOP',
  description: 'Cidades que conectam'
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
