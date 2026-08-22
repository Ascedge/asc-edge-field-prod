import { NextRequest, NextResponse } from 'next/server'
import { AuthorizationError } from '@/lib/auth'

export type JsonRecord = Record<string, unknown>

export const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Internal server error'

export async function readJsonObject(request: NextRequest): Promise<JsonRecord> {
  let value: unknown
  try {
    value = await request.json()
  } catch {
    throw new Error('Request body must be valid JSON')
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Request body must be a JSON object')
  }
  return value as JsonRecord
}

export const badRequest = (message: string) =>
  NextResponse.json({ error: message }, { status: 400 })

export const serverError = (error: unknown) => {
  if (error instanceof AuthorizationError) {
    return NextResponse.json({ error: error.message }, { status: error.status })
  }
  console.error('Request failed:', errorMessage(error))
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}

export const stringValue = (
  value: unknown,
  name: string,
  options: { maxLength?: number; required?: boolean } = {},
): string | null => {
  if (value === undefined || value === null || value === '') {
    if (options.required) throw new Error(`${name} is required`)
    return null
  }
  if (typeof value !== 'string') throw new Error(`${name} must be a string`)
  const result = value.trim()
  if (options.required && !result) throw new Error(`${name} is required`)
  if (options.maxLength && result.length > options.maxLength) {
    throw new Error(`${name} must be ${options.maxLength} characters or fewer`)
  }
  return result
}

export const numberValue = (value: unknown, name: string, min: number, max: number): number => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    throw new Error(`${name} must be a number between ${min} and ${max}`)
  }
  return value
}

export const stringArrayValue = (value: unknown, name: string, maxItems = 50): string[] => {
  if (!Array.isArray(value) || value.length > maxItems || value.some((item) => typeof item !== 'string')) {
    throw new Error(`${name} must be an array of at most ${maxItems} strings`)
  }
  return value.map((item) => item.trim()).filter(Boolean)
}

export const uuidValue = (value: unknown, name: string): string => {
  const result = stringValue(value, name, { required: true })!
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(result)) {
    throw new Error(`${name} must be a valid UUID`)
  }
  return result
}
