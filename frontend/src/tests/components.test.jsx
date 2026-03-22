import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ErrorBoundary from '../components/ErrorBoundary'

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <div>test content</div>
      </ErrorBoundary>
    )
    expect(screen.getByText('test content')).toBeInTheDocument()
  })

  it('renders error UI when child throws', () => {
    const ThrowingComponent = () => {
      throw new Error('test error')
    }

    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    )

    expect(screen.getByText('حدث خطأ غير متوقع')).toBeInTheDocument()
    expect(screen.getByText('إعادة المحاولة')).toBeInTheDocument()

    consoleSpy.mockRestore()
  })
})

describe('SkeletonReport', () => {
  it('renders loading skeleton', async () => {
    const { default: SkeletonReport } = await import('../components/SkeletonReport')
    render(<SkeletonReport />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})
