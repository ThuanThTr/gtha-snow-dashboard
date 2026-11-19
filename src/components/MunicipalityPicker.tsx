"use client";

import { useRouter } from "next/navigation";

export interface PickerGroup {
  region: string;
  options: { name: string; slug: string }[];
}

/** Jumps to another municipality's level of service page without going back to the dashboard. */
export default function MunicipalityPicker({ groups, current }: { groups: PickerGroup[]; current: string }) {
  const router = useRouter();
  return (
    <div className="flex flex-col gap-2 rounded-md bg-surface p-4">
      <label htmlFor="switch-municipality" className="text-sm font-medium text-ink">
        See another municipality&rsquo;s level of service
      </label>
      <select
        id="switch-municipality"
        value={current}
        onChange={(e) => router.push(`/municipality/${e.target.value}`)}
        className="w-full rounded-md border border-line bg-panel px-3 py-2 text-base text-ink sm:w-80"
      >
        {groups.map(({ region, options }) => (
          <optgroup key={region} label={region}>
            {options.map((o) => (
              <option key={o.slug} value={o.slug}>
                {o.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}
