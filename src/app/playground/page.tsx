import dynamic from 'next/dynamic';

// Dynamically import the client component with SSR disabled to prevent useRef errors with ElevenLabs
const ClientOnlyPlayground = dynamic(
  () => import('@/components/features/playground/ClientOnlyPlayground'),
  { ssr: false }
);

export default function PlaygroundPage() {
  return <ClientOnlyPlayground />;
}