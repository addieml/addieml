import Image from "next/image";
import InsightRequestForm from '@/components/InsightRequestForm';
import InsightRequestList from '@/components/InsightRequestList';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#001a14] p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Image
            src="/shopify-logo.png"
            alt="Shopify Logo"
            width={48}
            height={48}
            className="rounded-lg"
          />
          <h1 className="text-xl font-bold text-[#CEC9F8]">
            Product Launch Retail Requests
          </h1>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <InsightRequestForm />
          <InsightRequestList />
        </div>
      </div>
    </main>
  );
}
