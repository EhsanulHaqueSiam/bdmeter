import { Component } from 'react'
import { motion } from 'framer-motion'
import { haptic } from '../utils/haptic'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[var(--color-canvas)] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-outline)] shadow-sm p-10 max-w-md w-full text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
              className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-50 flex items-center justify-center"
            >
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </motion.div>
            <h2 className="text-xl font-semibold text-[var(--color-ink)] mb-2">Something went wrong</h2>
            <p className="text-sm text-[var(--color-ink)]/60 mb-6">
              An unexpected error occurred. Please try reloading the page.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { haptic('medium'); this.handleReload() }}
              className="px-6 py-3 bg-[var(--color-ink)] text-white rounded-xl font-medium text-sm hover:opacity-90 transition-opacity cursor-pointer"
            >
              Reload
            </motion.button>
          </motion.div>
        </div>
      )
    }

    return this.props.children
  }
}
