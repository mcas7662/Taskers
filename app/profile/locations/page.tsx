// taskers/app/profile/locations/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getDict, getLocale, getT, type TKey } from '@/lib/i18n'
import type { District, Division } from '@/lib/types'
import LocationForm from '@/components/LocationForm'
import DeleteLocationButton from '@/components/DeleteLocationButton'
import { addLocation, deleteLocation } from './actions'

export const metadata: Metadata = { title: 'Saved places' }

const LABELS = ['home', 'office', 'school', 'college', 'university', 'regular_visit', 'other'] as const
const MAX = 3

export default async function SavedLocationsPage() {
  const t = await getT()
  const locale = await getLocale()
  const dict = await getDict('loc_', 'adr_', 'sp_')
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/profile/locations')

  const { data: places } = await supabase
    .from('user_saved_locations')
    .select('id, label, custom_label, locality_name, source, latitude, longitude')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  const [{ data: divisions }, { data: districts }] = await Promise.all([
    supabase.from('bd_divisions').select('id, name_en, name_bn').order('name_en'),
    supabase.from('bd_districts').select('id, division_id, name_en, name_bn').order('name_en'),
  ])
  const list = places ?? []
  const labelText = (l: string) => t(`label_${l}` as TKey)

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Link href="/profile" className="text-sm font-semibold text-brand underline underline-offset-2">
        {t('backToProfile')}
      </Link>
      <header>
        <h1 className="text-3xl font-bold">{t('locationsTitle')}</h1>
        <p className="mt-2 text-muted">{t('locationsIntro')}</p>
        <p className="mt-2 font-semibold">
          {list.length.toLocaleString()} / {MAX} {t('locationsUsed')}
        </p>
      </header>

      {list.length === 0 ? (
        <p className="border border-dashed border-line bg-surface px-4 py-8 text-center text-muted">{t('noPlaces')}</p>
      ) : (
        <ul className="divide-y divide-line border border-line bg-surface">
          {list.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 p-4">
              <div className="flex min-w-0 gap-3">
                <MapPin aria-hidden className="mt-1 shrink-0 text-brand" size={20} />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{p.custom_label || labelText(p.label)}</p>
                  <p className="truncate text-sm text-muted">
                    {[p.custom_label ? labelText(p.label) : null, p.locality_name, p.source === 'gps' ? t('sourceGps') : t('sourceManual')]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                </div>
              </div>
              <form action={deleteLocation}>
                <input type="hidden" name="id" value={p.id} />
                <DeleteLocationButton label={t('deletePlace')} confirmText={t('deleteConfirm')} />
              </form>
            </li>
          ))}
        </ul>
      )}

      {list.length < MAX ? (
        <LocationForm
          action={addLocation}
          dict={dict}
          lang={locale}
          options={LABELS.map((l) => ({ value: l, label: labelText(l) }))}
          divisions={(divisions ?? []) as Division[]}
          districts={(districts ?? []) as District[]}
        />
      ) : (
        <p className="border-l-4 border-marigold bg-marigold-soft p-3 text-sm">{t('limitReached')}</p>
      )}
    </div>
  )
}
