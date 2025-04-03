import Image from "next/image";
import InsightRequestForm from '@/components/InsightRequestForm';
import InsightRequestDashboard from '@/components/InsightRequestDashboard';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Insight Request Platform
          </h1>
          
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Submit New Request
              </h2>
              <InsightRequestForm />
            </section>

            <section>
              <InsightRequestDashboard />
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
