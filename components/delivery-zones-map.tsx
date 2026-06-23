'use client'

import { useEffect, useRef, useState } from 'react'
import { formatPrice, getLocalizedName, type DeliveryZone } from '@/lib/types'
import type { Locale } from '@/lib/i18n/config'

interface DeliveryZonesMapProps {
  zones: DeliveryZone[]
  locale: Locale
}

export function DeliveryZonesMap({ zones, locale }: DeliveryZonesMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  const t = {
    title: locale === 'hu' ? 'Kiszállítási információ' : 'Delivery information',
    minOrder: locale === 'hu' ? 'Min.' : 'Min.',
    time: locale === 'hu' ? 'Idő' : 'Time',
    fee: locale === 'hu' ? 'Díj' : 'Fee',
    free: locale === 'hu' ? 'Ingyenes' : 'Free',
    minutes: locale === 'hu' ? 'p' : 'min',
    currency: 'HUF',
  }

  useEffect(() => {
    // Load Google Maps script
    if (typeof window !== 'undefined' && !window.google) {
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}&libraries=geometry`
      script.async = true
      script.defer = true
      script.onload = () => setIsLoaded(true)
      document.head.appendChild(script)
    } else if (window.google) {
      setIsLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (!isLoaded || !mapRef.current || !window.google) return

    // Initialize map centered on Budaörs
    const mapInstance = new google.maps.Map(mapRef.current, {
      center: { lat: 47.4321, lng: 18.9750 },
      zoom: 11,
      mapTypeControl: true,
      mapTypeControlOptions: {
        style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
        position: google.maps.ControlPosition.TOP_LEFT,
      },
      fullscreenControl: true,
      streetViewControl: true,
    })

    // Add marker for pizzeria location
    new google.maps.Marker({
      position: { lat: 47.4621, lng: 18.9550 },
      map: mapInstance,
      title: 'Terra Verde Pizzéria',
    })

    // Add polygons for each zone
    zones.forEach((zone) => {
      const polygon = zone.polygon as [number, number][]
      const paths = polygon.map(([lat, lng]) => ({ lat, lng }))
      
      const zonePolygon = new google.maps.Polygon({
        paths,
        strokeColor: zone.color,
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: zone.color,
        fillOpacity: 0.35,
        map: mapInstance,
      })

      // Info window on click
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; font-family: system-ui, sans-serif;">
            <strong style="font-size: 14px;">${getLocalizedName(zone, locale)}</strong>
            <div style="margin-top: 8px; font-size: 12px; color: #666;">
              <div>${t.minOrder}: ${t.currency} ${formatPrice(zone.min_order)}</div>
              <div>${t.time}: ${zone.delivery_time_max} ${t.minutes}</div>
              <div>${t.fee}: ${zone.delivery_fee === 0 ? t.free : `${t.currency} ${formatPrice(zone.delivery_fee)}`}</div>
            </div>
          </div>
        `,
      })

      zonePolygon.addListener('click', (event: google.maps.MapMouseEvent) => {
        infoWindow.setPosition(event.latLng)
        infoWindow.open(mapInstance)
      })
    })
  }, [isLoaded, zones, locale, t])

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">{t.title}</h3>
      
      {/* Zone Legend - styled like the reference image */}
      <div className="space-y-1">
        {zones.map((zone) => (
          <div key={zone.id} className="flex items-center gap-2 text-sm text-muted-foreground">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: zone.color }}
            />
            <span>
              {t.minOrder}: {t.currency} {formatPrice(zone.min_order)}, {t.time}: {zone.delivery_time_max} {t.minutes}, {t.fee}: {zone.delivery_fee === 0 ? t.free : `${t.currency} ${formatPrice(zone.delivery_fee)}`}
            </span>
          </div>
        ))}
      </div>

      {/* Map */}
      <div
        ref={mapRef}
        className="w-full h-[400px] rounded-lg overflow-hidden border bg-muted"
      >
        {!isLoaded && (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            {locale === 'hu' ? 'Térkép betöltése...' : 'Loading map...'}
          </div>
        )}
      </div>
    </div>
  )
}

// Pizzeria coordinates (Budaörs).
const PIZZERIA = { lat: 47.4621, lng: 18.955 }

const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

/**
 * Loads the Google Maps JS API once, using the recommended async pattern
 * (loading=async + callback). Resolves when google.maps is ready.
 */
function loadGoogleMaps(key: string): Promise<void> {
  const w = window as unknown as { google?: { maps?: unknown }; __tvInitGmaps?: () => void }
  if (w.google?.maps) return Promise.resolve()
  return new Promise<void>((resolve, reject) => {
    const existing = document.getElementById('tv-gmaps-loader') as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Google Maps failed to load')))
      return
    }
    w.__tvInitGmaps = () => resolve()
    const s = document.createElement('script')
    s.id = 'tv-gmaps-loader'
    s.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}` +
      `&v=weekly&libraries=maps,marker&loading=async&callback=__tvInitGmaps`
    s.async = true
    s.onerror = () => reject(new Error('Google Maps failed to load'))
    document.head.appendChild(s)
  })
}

/**
 * Renders the delivery zones as filled polygons on a real Google map, with a
 * pizzeria marker and a click info window per zone. Only used when a Google
 * Maps API key is configured; otherwise the SVG fallback is shown.
 */
function ZoneGoogleMap({ zones, locale }: DeliveryZonesMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState(false)

  const drawable = zones.filter((z) => Array.isArray(z.polygon) && z.polygon.length >= 3)

  useEffect(() => {
    if (!GOOGLE_MAPS_KEY || !mapRef.current) return
    let cancelled = false

    loadGoogleMaps(GOOGLE_MAPS_KEY)
      .then(() => {
        if (cancelled || !mapRef.current) return
        const g = (window as unknown as { google: any }).google

        const map = new g.maps.Map(mapRef.current, {
          center: PIZZERIA,
          zoom: 12,
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
        })

        const bounds = new g.maps.LatLngBounds()

        new g.maps.Marker({
          position: PIZZERIA,
          map,
          title: 'Terra Verde Pizzéria',
        })
        bounds.extend(PIZZERIA)

        const cur = 'HUF'
        const lbl = {
          min: locale === 'hu' ? 'Min.' : 'Min.',
          time: locale === 'hu' ? 'Idő' : 'Time',
          fee: locale === 'hu' ? 'Díj' : 'Fee',
          free: locale === 'hu' ? 'Ingyenes' : 'Free',
          mins: locale === 'hu' ? 'perc' : 'min',
        }

        drawable.forEach((zone) => {
          const paths = zone.polygon.map(([lat, lng]) => ({ lat, lng }))
          paths.forEach((p) => bounds.extend(p))

          const poly = new g.maps.Polygon({
            paths,
            strokeColor: zone.color,
            strokeOpacity: 0.85,
            strokeWeight: 2,
            fillColor: zone.color,
            fillOpacity: 0.35,
            map,
          })

          const name = locale === 'hu' ? zone.name_hu : zone.name_en
          const feeText =
            zone.delivery_fee === 0 ? lbl.free : `${cur} ${formatPrice(zone.delivery_fee)}`
          const info = new g.maps.InfoWindow({
            content:
              `<div style="font-family:system-ui,sans-serif;padding:2px 4px;">` +
              `<strong style="font-size:14px;">${name}</strong>` +
              `<div style="margin-top:6px;font-size:12px;color:#555;line-height:1.5;">` +
              `${lbl.min}: ${cur} ${formatPrice(zone.min_order)}<br/>` +
              `${lbl.time}: ${zone.delivery_time_min}–${zone.delivery_time_max} ${lbl.mins}<br/>` +
              `${lbl.fee}: ${feeText}</div></div>`,
          })
          poly.addListener('click', (e: any) => {
            info.setPosition(e.latLng)
            info.open(map)
          })
        })

        if (!bounds.isEmpty()) map.fitBounds(bounds, 48)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })

    return () => {
      cancelled = true
    }
  }, [drawable, locale])

  if (error) {
    return <ZoneSvgMap zones={zones} locale={locale} />
  }

  return <div ref={mapRef} className="h-[460px] w-full" />
}

/** Pick black or white text for a hex fill based on perceived luminance. */
function readableTextColor(hex: string): string {
  const m = hex.replace('#', '')
  const r = parseInt(m.slice(0, 2), 16)
  const g = parseInt(m.slice(2, 4), 16)
  const b = parseInt(m.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? '#1f1f1f' : '#ffffff'
}

/**
 * Self-contained SVG map of the delivery zones, projected directly from the
 * zone polygon coordinates. Needs no external map provider or API key, so it
 * always renders. Zones with an empty polygon are skipped on the map (they
 * still appear in the cards/legend).
 */
function ZoneSvgMap({ zones, locale }: DeliveryZonesMapProps) {
  const drawable = zones.filter((z) => Array.isArray(z.polygon) && z.polygon.length >= 3)
  if (drawable.length === 0) return null

  // Collect all points (+ pizzeria) to compute geographic bounds.
  const pts: [number, number][] = []
  drawable.forEach((z) => z.polygon.forEach((p) => pts.push(p)))
  pts.push([PIZZERIA.lat, PIZZERIA.lng])

  const lats = pts.map((p) => p[0])
  const lngs = pts.map((p) => p[1])
  let minLat = Math.min(...lats)
  let maxLat = Math.max(...lats)
  let minLng = Math.min(...lngs)
  let maxLng = Math.max(...lngs)

  const padLat = (maxLat - minLat) * 0.12 || 0.01
  const padLng = (maxLng - minLng) * 0.12 || 0.01
  minLat -= padLat
  maxLat += padLat
  minLng -= padLng
  maxLng += padLng

  // Correct for longitude compression at this latitude so shapes aren't stretched.
  const lngK = Math.cos(((minLat + maxLat) / 2) * (Math.PI / 180))
  const geoW = (maxLng - minLng) * lngK
  const geoH = maxLat - minLat
  const W = 600
  const H = Math.max(360, Math.round((W * geoH) / geoW))

  const project = (lat: number, lng: number): [number, number] => [
    (((lng - minLng) * lngK) / geoW) * W,
    ((maxLat - lat) / geoH) * H,
  ]

  const [px, py] = project(PIZZERIA.lat, PIZZERIA.lng)

  const title = locale === 'hu' ? 'Kiszállítási területek térképe' : 'Delivery zones map'

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      className="block h-auto w-full"
      role="img"
      aria-label={title}
      style={{ background: 'var(--muted, #f3f3f1)' }}
    >
      <title>{title}</title>

      {/* Zone polygons */}
      {drawable.map((zone) => {
        const points = zone.polygon.map(([lat, lng]) => project(lat, lng).join(',')).join(' ')
        // Centroid for the label.
        const cx =
          zone.polygon.reduce((s, [, lng]) => s + project(0, lng)[0], 0) / zone.polygon.length
        const cy =
          zone.polygon.reduce((s, [lat]) => s + project(lat, 0)[1], 0) / zone.polygon.length
        const name = locale === 'hu' ? zone.name_hu : zone.name_en
        const pillW = Math.max(54, name.length * 7.2 + 18)
        return (
          <g key={zone.id}>
            <polygon
              points={points}
              fill={zone.color}
              fillOpacity={0.32}
              stroke={zone.color}
              strokeWidth={2}
              strokeLinejoin="round"
            />
            <g transform={`translate(${cx}, ${cy})`}>
              <rect
                x={-pillW / 2}
                y={-11}
                width={pillW}
                height={22}
                rx={11}
                fill={zone.color}
              />
              <text
                x={0}
                y={1}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={12}
                fontWeight={600}
                fill={readableTextColor(zone.color)}
                style={{ fontFamily: 'system-ui, sans-serif' }}
              >
                {name}
              </text>
            </g>
          </g>
        )
      })}

      {/* Pizzeria marker */}
      <g transform={`translate(${px}, ${py})`}>
        <circle r={9} fill="#ffffff" stroke="#1f1f1f" strokeWidth={2} />
        <circle r={3.5} fill="#1f1f1f" />
        <text
          x={0}
          y={-15}
          textAnchor="middle"
          fontSize={12}
          fontWeight={700}
          fill="#1f1f1f"
          style={{ fontFamily: 'system-ui, sans-serif', paintOrder: 'stroke' }}
          stroke="#ffffff"
          strokeWidth={3}
        >
          Terra Verde
        </text>
      </g>
    </svg>
  )
}

/**
 * Just the delivery-zone map (no detail cards), in a self-contained card.
 * Uses the real Google map when an API key is set, otherwise the SVG fallback.
 */
export function DeliveryZonesMapOnly({ zones, locale }: DeliveryZonesMapProps) {
  const mapTitle = locale === 'hu' ? 'Kiszállítási területek térképe' : 'Delivery zones map'
  return (
    <div className="rounded-2xl overflow-hidden border bg-card shadow-sm">
      {GOOGLE_MAPS_KEY ? (
        <ZoneGoogleMap zones={zones} locale={locale} />
      ) : (
        <ZoneSvgMap zones={zones} locale={locale} />
      )}
      <p className="px-4 py-3 text-xs text-muted-foreground border-t text-center">
        {mapTitle}
      </p>
    </div>
  )
}

// Static fallback component
export function DeliveryZonesStatic({ zones, locale }: DeliveryZonesMapProps) {
  const t = {
    title: locale === 'hu' ? 'Kiszállítási zónák' : 'Delivery Zones',
    subtitle: locale === 'hu'
      ? 'Budaörsön és a környező településeken vállalunk házhoz szállítást.'
      : 'We deliver to Budaörs and surrounding settlements.',
    minOrder: locale === 'hu' ? 'Min. rendelés' : 'Min. order',
    time: locale === 'hu' ? 'Szállítási idő' : 'Delivery time',
    fee: locale === 'hu' ? 'Szállítási díj' : 'Delivery fee',
    free: locale === 'hu' ? 'Ingyenes' : 'Free',
    minutes: locale === 'hu' ? 'perc' : 'min',
    currency: 'Ft',
    zipCodes: locale === 'hu' ? 'Irányítószámok' : 'ZIP codes',
    mapTitle: locale === 'hu' ? 'Kiszállítási területek térképe' : 'Delivery zones map',
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="text-center section-divider pt-8">
        <h2 className="font-serif text-3xl md:text-4xl font-bold">{t.title}</h2>
        <p className="mt-3 text-muted-foreground max-w-xl mx-auto">{t.subtitle}</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 items-start">
        {/* Zone Cards */}
        <div className="space-y-4">
          {zones.map((zone) => (
            <div
              key={zone.id}
              className="rounded-2xl border bg-card shadow-sm p-5 flex gap-4 hover:shadow-md transition-shadow"
            >
              {/* Color indicator */}
              <div
                className="w-1.5 rounded-full flex-shrink-0 self-stretch"
                style={{ backgroundColor: zone.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: zone.color }}
                  />
                  <h3 className="font-serif font-semibold text-lg">
                    {locale === 'hu' ? zone.name_hu : zone.name_en}
                  </h3>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="text-center p-2.5 rounded-xl bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-0.5">{t.minOrder}</p>
                    <p className="font-semibold text-sm">{formatPrice(zone.min_order)} {t.currency}</p>
                  </div>
                  <div className="text-center p-2.5 rounded-xl bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-0.5">{t.time}</p>
                    <p className="font-semibold text-sm">
                      {zone.delivery_time_min}–{zone.delivery_time_max} {t.minutes}
                    </p>
                  </div>
                  <div className="text-center p-2.5 rounded-xl bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-0.5">{t.fee}</p>
                    <p className="font-semibold text-sm">
                      {zone.delivery_fee === 0
                        ? t.free
                        : `${formatPrice(zone.delivery_fee)} ${t.currency}`}
                    </p>
                  </div>
                </div>

                {zone.zip_codes && zone.zip_codes.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">{t.zipCodes}:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {zone.zip_codes.map((zip) => (
                        <span
                          key={zip}
                          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border"
                          style={{ borderColor: zone.color + '60', color: zone.color, backgroundColor: zone.color + '15' }}
                        >
                          {zip}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Map */}
        <div className="rounded-2xl overflow-hidden border bg-card shadow-sm sticky top-24">
          {GOOGLE_MAPS_KEY ? (
            <ZoneGoogleMap zones={zones} locale={locale} />
          ) : (
            <ZoneSvgMap zones={zones} locale={locale} />
          )}
          <p className="px-4 py-3 text-xs text-muted-foreground border-t text-center">
            {t.mapTitle}
          </p>
        </div>
      </div>
    </div>
  )
}
