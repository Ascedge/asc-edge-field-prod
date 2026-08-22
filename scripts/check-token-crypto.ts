import assert from 'node:assert/strict'
import { generateShareToken, hashShareToken } from '../lib/token-crypto'

const first = generateShareToken()
const second = generateShareToken()
assert.match(first.rawToken, /^[A-Za-z0-9_-]{43}$/)
assert.match(first.tokenHash, /^[0-9a-f]{64}$/)
assert.equal(first.tokenHash, hashShareToken(first.rawToken))
assert.notEqual(first.rawToken, second.rawToken)
assert.notEqual(first.tokenHash, second.tokenHash)
console.log('share-token cryptography checks passed')
