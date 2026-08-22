'use client'

import { useEffect } from 'react'

export default function ReportOpenTracker({ propertyId }: { propertyId: string }) {
  useEffect(() => {
    const controller = new AbortController()
    void fetch('/api/report-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ property_id: propertyId, event_type: 'report_open', variant: 'A' }),
      signal: controller.signal,
    }).catch(() => undefined)
    return () => controller.abort()
  }, [propertyId])

  return null
}
