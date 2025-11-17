import { Link } from 'react-router-dom'
import { Store } from 'lucide-react'

const Register = () => {

  return (
    <div className="min-h-screen flex items-center justify-center bg-teal-50 p-4 py-12">
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden flex">
        {/* Left Promotional Panel */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-500 to-teal-600 relative overflow-hidden">
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-teal-700 rounded-full opacity-20 -mr-32 -mb-32"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-700 rounded-full opacity-10 -mr-48 -mb-48"></div>
          <div className="relative z-10 flex flex-col justify-center p-12 text-white">
            <div className="mb-8">
              <Store className="w-16 h-16 mb-4" />
            </div>
            <h1 className="text-4xl font-bold mb-6 leading-tight">
              Welcome to Market SpotOn
            </h1>
            <p className="text-lg text-teal-100 leading-relaxed">
              Accounts are created and verified by your market administration to keep the
              platform secure and aligned with your local markets.
            </p>
          </div>
        </div>

        {/* Right Register Form Panel */}
        <div className="w-full lg:w-1/2 p-8 lg:p-12 overflow-y-auto max-h-screen">
          <div>
            {/* Logo and Brand */}
            <div className="flex items-center mb-8">
              <div className="w-10 h-10 bg-teal-500 rounded-lg flex items-center justify-center mr-3">
                <Store className="w-6 h-6 text-white" />
              </div>
              <a href="/"><span className="text-2xl font-bold text-teal-600">MARKET SPOTON</span></a>
            </div>

            {/* Heading */}
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Account registration</h2>
            <p className="text-gray-700 mb-6 leading-relaxed">
              Self-registration is disabled on this platform.
              <br />
              <br />
              <span className="font-semibold">Manager accounts</span> are created and provided by the
              system administrator.
              <br />
              <span className="font-semibold">Seller accounts</span> are created and provided by the
              manager of the market where you operate.
              <br />
              If you need access, please contact your market manager or system administrator.
            </p>

            <div className="space-y-3">
              <Link
                to="/login"
                className="block w-full text-center bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
              >
                Go to Login
              </Link>
              <Link
                to="/forgot-password"
                className="block w-full text-center border border-teal-500 text-teal-600 hover:bg-teal-50 font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
              >
                Forgot Password
              </Link>
            </div>

            {/* Copyright */}
            <div className="mt-8 text-center text-sm text-gray-500">
              © {new Date().getFullYear()} Market SpotOn System. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
