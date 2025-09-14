import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import qaLogger from '@cctv/utils/qaLogger'

export default function Join() {
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchParams] = useSearchParams()

  // Check for prefilled code from QR code or URL params
  useEffect(() => {
    const prefilledCode = searchParams.get('code')
    if (prefilledCode) {
      setCode(prefilledCode.toUpperCase())
    }
  }, [searchParams])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!code.trim()) {
      setError('Please enter a code')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/experiences/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code.trim()
        }),
      })

      const data = await response.json()

      if (response.ok) {
        if (data.status === 'registered') {
          // User is already registered - store JWT and redirect to experience
          qaLogger(`User already registrated, redirecting to: ${data.url}`)

          localStorage.setItem('experience_jwt', data.jwt)
          window.location.href = data.url
        } else if (data.status === 'needs_registration') {
          // User needs to register - redirect to registration page
          qaLogger(`User needs registration, redirecting to: ${data.url}`)

          console.log("User needs registration")
          window.location.href = data.url
        }
      } else {
        setError(data.error || 'Failed to join experience')
      }
    } catch (err) {
      setError('Connection error. Please try again.')
      console.error('Join experience error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e) => {
    setCode(e.target.value)
    // Clear error when user starts typing
    if (error) {
      setError('')
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e)
    }
  }

  return (
    <section className="page flex-centered">
      <p className="hero-subtitle">Enter the secret code:</p>

      <form onSubmit={handleSubmit}>
        <input
          className="join-input"
          type="text"
          placeholder="Secret Code"
          value={code}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
          maxLength={50}
        />

        {error && (
          <p className="error-message" style={{ color: 'red', marginTop: '8px' }}>
            {error}
          </p>
        )}

        <button className="join-submit" type="submit" disabled={isLoading || !code.trim()}>
          {isLoading ? 'Joining...' : 'Submit'}
        </button>
      </form>
    </section>
  )
}
