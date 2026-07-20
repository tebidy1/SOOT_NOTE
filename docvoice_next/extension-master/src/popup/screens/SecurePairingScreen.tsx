import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../routes'

export default function SecurePairingScreen() {
  const navigate = useNavigate()
  const [qrCode, setQrCode] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [pairingCode, setPairingCode] = useState('')
  const [timer, setTimer] = useState(300) // 5 minutes in seconds

  useEffect(() => {
    generatePairingCode()
    const countdown = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(countdown)
          generatePairingCode()
          return 300
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(countdown)
  }, [])

  const generatePairingCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    setPairingCode(code)
    
    const ws = new WebSocket('wss://api.scribeflow.com/ws/pairing')
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'generate_qr', code }))
    }
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'qr_generated') {
        setQrCode(data.qrUrl)
      } else if (data.type === 'paired') {
        handleSuccessfulPairing(data.token)
      }
    }
    
    return () => ws.close()
  }

  const handleSuccessfulPairing = async (token: string) => {
    setIsConnecting(true)
    
    setTimeout(() => {
      navigate(ROUTES.HOME)
    }, 1000)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-teal-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-teal-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Secure QR Login</h1>
          <p className="text-gray-600">Scan with your mobile app to login securely</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center space-y-6">
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-48 h-48 bg-white rounded-lg border-2 border-blue-200 flex items-center justify-center">
                  {qrCode ? (
                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-2">QR Code</div>
                      <div className="font-mono text-lg font-bold text-blue-700">{pairingCode}</div>
                      <div className="text-xs text-gray-500 mt-2">Scan with SoutNote app</div>
                    </div>
                  ) : (
                    <div className="animate-pulse text-gray-400">
                      <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <div className="text-sm">Generating QR code...</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                    Waiting for scan
                  </div>
                </div>

                <div className="text-sm text-gray-700 bg-blue-50 p-3 rounded-lg">
                  <div className="font-semibold mb-1">Pairing Code:</div>
                  <div className="font-mono text-lg tracking-wider bg-white p-2 rounded border border-blue-200">
                    {pairingCode}
                  </div>
                </div>

                <div className="flex items-center justify-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  Expires in: <span className="font-semibold ml-1">{formatTime(timer)}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <p className="text-sm text-gray-600 mb-4">
                Open the SoutNote mobile app and tap "Scan QR Code" in the settings menu
              </p>

              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm mr-3">
                    1
                  </div>
                  <div className="text-sm text-gray-700">Open SoutNote mobile app</div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm mr-3">
                    2
                  </div>
                  <div className="text-sm text-gray-700">Go to Settings → QR Login</div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm mr-3">
                    3
                  </div>
                  <div className="text-sm text-gray-700">Scan the QR code above</div>
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => navigate(ROUTES.LOGIN)}
                className="flex-1 border-2 border-gray-300 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
              >
                Back to Login
              </button>
              <button
                onClick={generatePairingCode}
                className="flex-1 border-2 border-blue-200 text-blue-700 font-semibold py-3 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
              >
                Regenerate Code
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}