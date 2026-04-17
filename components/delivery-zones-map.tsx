'use client'

import { useEffect, useRef, useState } from 'react'
import { formatPrice, getLocalizedName, type DeliveryZone } from '@/lib/types'
import type { Locale } from '@/lib/i18n/config'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface DeliveryZonesMapProps {
  zones: DeliveryZone[]
  locale: Locale
}

export function DeliveryZonesMap({ zones, locale }: DeliveryZonesMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  const t = {
    title: locale === 'hu' ? 'Szállítási zónák' : 'Delivery zones',
    minOrder: locale === 'hu' ? 'Min.' : 'Min.',
    time: locale === 'hu' ? 'Idő' : 'Time',
    fee: locale === 'hu' ? 'Díj' : 'Fee',
    free: locale === 'hu' ? 'Ingyenes' : 'Free',
    minutes: locale === 'hu' ? 'p' : 'min',
    currency: 'Ft',
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
      center: { lat: 47.4621, lng: 18.9550 },
      zoom: 12,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }],
        },
      ],
      mapTypeControl: true,
      mapTypeControlOptions: {
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
      icon: {
        url: 'data:image/svg+xml,' + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#2E7D32">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        `),
        scaledSize: new google.maps.Size(40, 40),
        anchor: new google.maps.Point(20, 40),
      },
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
              <div>${t.minOrder}: ${formatPrice(zone.min_order)} ${t.currency}</div>
              <div>${t.time}: ${zone.delivery_time_min}-${zone.delivery_time_max} ${t.minutes}</div>
              <div>${t.fee}: ${zone.delivery_fee === 0 ? t.free : `${formatPrice(zone.delivery_fee)} ${t.currency}`}</div>
            </div>
          </div>
        `,
      })

      zonePolygon.addListener('click', (event: google.maps.MapMouseEvent) => {
        infoWindow.setPosition(event.latLng)
        infoWindow.open(mapInstance)
      })
    })

    setMap(mapInstance)
  }, [isLoaded, zones, locale, t])

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">{t.title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Zone Legend */}
        <div className="px-6 pb-4 space-y-2">
          {zones.map((zone) => (
            <div key={zone.id} className="flex items-center gap-3 text-sm">
              <div
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: zone.color }}
              />
              <span className="flex-1 font-medium">{getLocalizedName(zone, locale)}</span>
              <span className="text-muted-foreground">
                {t.minOrder}: {formatPrice(zone.min_order)} {t.currency}
              </span>
              <span className="text-muted-foreground">
                {t.time}: {zone.delivery_time_min}-{zone.delivery_time_max} {t.minutes}
              </span>
              <span className="font-medium text-primary">
                {t.fee}: {zone.delivery_fee === 0 ? t.free : `${formatPrice(zone.delivery_fee)} ${t.currency}`}
              </span>
            </div>
          ))}
        </div>

        {/* Map */}
        <div
          ref={mapRef}
          className="w-full h-[400px] bg-muted"
          style={{ minHeight: '400px' }}
        >
          {!isLoaded && (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              {locale === 'hu' ? 'Térkép betöltése...' : 'Loading map...'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Fallback component without Google Maps (uses static image)
export function DeliveryZonesStatic({ zones, locale }: DeliveryZonesMapProps) {
  const t = {
    title: locale === 'hu' ? 'Szállítási zónák' : 'Delivery zones',
    minOrder: locale === 'hu' ? 'Min.' : 'Min.',
    time: locale === 'hu' ? 'Idő' : 'Time',
    fee: locale === 'hu' ? 'Díj' : 'Fee',
    free: locale === 'hu' ? 'Ingyenes' : 'Free',
    minutes: locale === 'hu' ? 'p' : 'min',
    currency: 'Ft',
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{t.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Zone Legend */}
        <div className="space-y-3">
          {zones.map((zone) => (
            <div
              key={zone.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-1 p-3 rounded-lg border"
              style={{ borderLeftColor: zone.color, borderLeftWidth: '4px' }}
            >
              <div className="flex items-center gap-2 min-w-[140px]">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: zone.color }}
                />
                <span className="font-medium">{getLocalizedName(zone, locale)}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {t.minOrder}: {formatPrice(zone.min_order)} {t.currency}
              </span>
              <span className="text-sm text-muted-foreground">
                {t.time}: {zone.delivery_time_min}-{zone.delivery_time_max} {t.minutes}
              </span>
              <span className="text-sm font-medium text-primary">
                {t.fee}: {zone.delivery_fee === 0 ? t.free : `${formatPrice(zone.delivery_fee)} ${t.currency}`}
              </span>
            </div>
          ))}
        </div>

        {/* Static Map Embed */}
        <div className="rounded-lg overflow-hidden border">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d43000!2d18.9550!3d47.4621!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4741e9b2c6c7e1f5%3A0x400c4290c1e1160!2sBuda%C3%B6rs!5e0!3m2!1sen!2shu!4v1234567890"
            width="100%"
            height="400"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Delivery zones map"
          />
        </div>
      </CardContent>
    </Card>
  )
}
