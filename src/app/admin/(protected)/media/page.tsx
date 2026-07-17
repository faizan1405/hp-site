import { CLOUDINARY_FOLDERS, listImages } from "@/lib/cloudinary";
import { isCloudinaryConfigured } from "@/lib/env";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { EmptyState } from "@/components/admin/EmptyState";
import { MediaUploader } from "@/components/admin/MediaUploader";
import { MediaGrid } from "@/components/admin/MediaGrid";

export const dynamic = "force-dynamic";

export default async function AdminMediaPage() {
  const breadcrumb = [{ label: "Admin", href: "/admin" }, { label: "Media" }];

  if (!isCloudinaryConfigured()) {
    return (
      <div className="flex flex-col gap-6">
        <AdminHeader title="Media" breadcrumb={breadcrumb} />
        <EmptyState
          title="Cloudinary isn't configured"
          description="Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET to enable media uploads."
        />
      </div>
    );
  }

  const [founderImages, siteImages] = await Promise.all([
    listImages(CLOUDINARY_FOLDERS.founder),
    listImages(CLOUDINARY_FOLDERS.site),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <AdminHeader
        title="Media"
        description="Website imagery and the founder portrait, stored in Cloudinary."
        breadcrumb={breadcrumb}
      />

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-gray-900">Founder portrait</h2>
          <MediaUploader folder="founder" />
        </div>
        {founderImages.length === 0 ? (
          <EmptyState title="No founder portrait uploaded yet" />
        ) : (
          <MediaGrid images={founderImages} />
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-gray-900">Website images</h2>
          <MediaUploader folder="site" />
        </div>
        {siteImages.length === 0 ? (
          <EmptyState title="No website images uploaded yet" />
        ) : (
          <MediaGrid images={siteImages} />
        )}
      </section>
    </div>
  );
}
