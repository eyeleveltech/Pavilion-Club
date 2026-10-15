'use client';

import dynamic from 'next/dynamic';

const EditorialLandingView = dynamic(
  () => import('./EditorialLandingView').then((mod) => mod.EditorialLandingView),
  { ssr: false }
);

export function EditorialLandingClient() {
  return <EditorialLandingView />;
}
