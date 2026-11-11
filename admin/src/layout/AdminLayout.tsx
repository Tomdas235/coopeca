// Stub legacy — AdminLayout n'est plus utilisé (App.tsx utilise MainLayout).
// Ce fichier est conservé à des fins d'archive mais ne référence plus
// @mui / react-redux (non installés) afin de ne pas bloquer le build tsc.
import type { ReactNode } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }): JSX.Element {
  return <>{children}</>;
}
