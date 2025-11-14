import dynamic from 'next/dynamic';

// Dynamically import the client component with SSR disabled to prevent useRef errors with ElevenLabs
const ClientOnlySupportAgent = dynamic(
  () => import('@/components/features/support-agent/ClientOnlySupportAgent'),
  { ssr: false }
);

export default function SupportAgentPage() {
  return <ClientOnlySupportAgent />;
}