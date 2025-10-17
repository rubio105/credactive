import AdminInAppNotifications from "@/components/admin/AdminInAppNotifications";
import { AdminLayout } from "@/components/AdminLayout";

export default function AdminInAppNotificationsPage() {
  return (
    <AdminLayout>
      <div className="p-6">
        <AdminInAppNotifications />
      </div>
    </AdminLayout>
  );
}
