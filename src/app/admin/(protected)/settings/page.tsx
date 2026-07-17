import { siteSettingsCollection } from "@/lib/db/schema";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { SettingsForm, type SettingsDefaults } from "@/components/admin/SettingsForm";
import { FounderPortraitUploader } from "@/components/admin/FounderPortraitUploader";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await (await siteSettingsCollection()).findOne({ _id: "site" });

  const defaultValues: SettingsDefaults = {
    brandName: settings?.brandName ?? "",
    phone: settings?.phone ?? "",
    whatsappNumber: settings?.whatsappNumber ?? "",
    whatsappMessage: settings?.whatsappMessage ?? "",
    email: settings?.email ?? "",
    address: settings?.address ?? "",
    businessHours: settings?.businessHours ?? "",
    founderName: settings?.founderName ?? "",
    founderDesignation: settings?.founderDesignation ?? "",
    contactReceiverEmail: settings?.contactReceiverEmail ?? "",
    instagram: settings?.socialLinks?.instagram ?? "",
    facebook: settings?.socialLinks?.facebook ?? "",
    youtube: settings?.socialLinks?.youtube ?? "",
    linkedin: settings?.socialLinks?.linkedin ?? "",
    twitter: settings?.socialLinks?.twitter ?? "",
    maintenanceMessage: settings?.maintenanceMessage ?? "",
  };

  return (
    <div className="flex flex-col gap-6">
      <AdminHeader
        title="Settings"
        description="Business and contact details for the site. Ingredient copy, claims and the scroll experience are not editable here — see the report for why."
        breadcrumb={[{ label: "Admin", href: "/admin" }, { label: "Settings" }]}
      />

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900">Founder portrait</h2>
        <div className="mt-4">
          <FounderPortraitUploader currentImageUrl={settings?.founderPortrait?.url ?? null} />
        </div>
      </section>

      <SettingsForm defaultValues={defaultValues} />
    </div>
  );
}
