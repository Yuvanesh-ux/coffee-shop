"use client";

interface FeaturePreviewProps {
  userEmail?: string;
  productCount: number;
}

export default function FeaturePreview({
  userEmail,
  productCount,
}: FeaturePreviewProps) {
  const firstName = userEmail?.split("@")[0] ?? "there";

  return (
    <section className="mb-8 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
            Feature Preview
          </p>
          <h2 className="mt-1 text-2xl font-bold text-gray-900">
            Mobile Order Ahead + Loyalty Wallet
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-gray-700">
            Hi {firstName}, we are testing a faster checkout flow that lets
            regulars save favorites, reorder in one tap, and track points
            toward free drinks.
          </p>
          <p className="mt-2 text-sm text-gray-600">
            {productCount} menu items are currently eligible in the beta menu.
          </p>
        </div>

        <div className="rounded-lg border border-amber-300 bg-white/80 p-4 text-sm text-gray-700">
          <p className="font-semibold text-gray-900">Pilot status</p>
          <p className="mt-1">Internal mockup only</p>
          <button
            type="button"
            disabled
            className="mt-3 w-full cursor-not-allowed rounded bg-amber-500 px-4 py-2 font-medium text-white opacity-70"
          >
            Join Waitlist (coming soon)
          </button>
        </div>
      </div>
    </section>
  );
}
