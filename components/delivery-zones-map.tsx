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
        <div className="rounded-2xl overflow-hidden border shadow-sm sticky top-24">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d10784.5!2d18.9510!3d47.4611!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4741ddc1e5afe6db%3A0x397c23ec48fec7a0!2sTerra%20Verde%20Pizz%C3%A9ria!5e0!3m2!1shu!2shu!4v1699900000000"
            width="100%"
            height="480"
            style={{ border: 0, display: 'block' }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={t.mapTitle}
          />
        </div>
      </div>
    </div>
  )
}
