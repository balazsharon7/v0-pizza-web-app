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

// Static fallback component (uses iframe embed with overlay image style)
export function DeliveryZonesStatic({ zones, locale }: DeliveryZonesMapProps) {
  const t = {
    title: locale === 'hu' ? 'Kiszállítási információ' : 'Delivery information',
    minOrder: locale === 'hu' ? 'Min.' : 'Min.',
    time: locale === 'hu' ? 'Idő' : 'Time',
    fee: locale === 'hu' ? 'Díj' : 'Fee',
    free: locale === 'hu' ? 'Ingyenes' : 'Free',
    minutes: locale === 'hu' ? 'p' : 'min',
    currency: 'HUF',
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">{t.title}</h3>
      
      {/* Zone Legend - compact style like reference */}
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

      {/* Static Map with zones overlay image */}
      <div className="rounded-lg overflow-hidden border">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d86000!2d18.9550!3d47.4321!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4741e9b2c6c7e1f5%3A0x400c4290c1e1160!2sBuda%C3%B6rs!5e0!3m2!1shu!2shu!4v1234567890"
          width="100%"
          height="400"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={locale === 'hu' ? 'Kiszállítási területek térképe' : 'Delivery zones map'}
        />
      </div>
    </div>
  )
}
