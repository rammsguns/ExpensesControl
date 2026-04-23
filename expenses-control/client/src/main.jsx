import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { I18nProvider } from './i18n/index'
import App from './App'
import './index.css'

const queryClient = new QueryClient()

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    // Log to console only, never show details to user
    console.error('Application error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#f9fafb',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>😔</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>
            Something went wrong
          </h1>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
            We encountered an unexpected error. Please try refreshing the page.
          </p>
          <pre style={{ background: '#fee2e2', color: '#991b1b', padding: '1rem', borderRadius: '0.5rem', fontSize: '0.75rem', maxWidth: '100%', overflow: 'auto', marginBottom: '1rem' }}>
            {this.state.error?.toString() || 'Unknown error'}
          </pre>
          <button
            onClick={() => { this.setState({ hasError: false }); window.location.href = '/' }}
            style={{
              backgroundColor: '#4f46e5',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Go Home
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <AuthProvider>
            <BrowserRouter>
              <App />
              <Toaster
                position="top-center"
                toastOptions={{
                  duration: 3000,
                  ariaLive: 'polite',
                  className: '!rounded-xl !shadow-lg !text-sm !font-medium !px-4 !py-3',
                  success: {
                    className: '!bg-emerald-50 !text-emerald-700 !border !border-emerald-200',
                    iconTheme: { primary: '#059669', secondary: '#ecfdf5' },
                  },
                  error: {
                    className: '!bg-rose-50 !text-rose-700 !border !border-rose-200',
                    iconTheme: { primary: '#e11d48', secondary: '#fff1f2' },
                  },
                }}
              />
            </BrowserRouter>
          </AuthProvider>
        </I18nProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
)