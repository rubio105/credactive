import { AdminLayout } from "@/components/AdminLayout";
import { AdminFeedback } from "@/components/admin/AdminFeedback";

export default function AdminFeedbackPage() {
  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Feedback Utenti</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Gestisci feedback e suggerimenti degli utenti</p>
        </div>
        
        <AdminFeedback />
      </div>
    </AdminLayout>
  );
}
