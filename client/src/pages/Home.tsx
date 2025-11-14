import { Link } from 'react-router-dom'
import {
  Store,
  MapPin,
  CreditCard,
  BarChart3,
  Bell,
  Shield,
  Zap,
  Users,
  CheckCircle,
  ArrowRight,
  TrendingUp,
  Clock,
  Smartphone
} from 'lucide-react'

// Custom style for the subtle grid background pattern
const GridPatternStyle = {
  backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)',
  backgroundSize: '20px 20px',
}

const Home = () => {
  // Data structure is excellent - kept as is.
  const features = [
    {
      icon: MapPin,
      title: 'Zone & Space Management',
      description: 'Real-time tracking and management of market zones and spaces with instant availability updates.',
      color: 'bg-blue-500'
    },
    {
      icon: Users,
      title: 'Seller Registration',
      description: 'Streamlined digital onboarding process with automated space allocation for new sellers.',
      color: 'bg-green-500'
    },
    {
      icon: CreditCard,
      title: 'Integrated Payment System',
      description: 'Secure mobile money and digital payment options with instant receipts and automated reconciliation.',
      color: 'bg-purple-500'
    },
    {
      icon: BarChart3,
      title: 'Comprehensive Reporting',
      description: 'Automated daily, weekly, and monthly reports with analytics for better decision-making.',
      color: 'bg-orange-500'
    },
    {
      icon: Bell,
      title: 'Automated Notifications',
      description: 'Instant notifications for payments, allocations, and important announcements.',
      color: 'bg-pink-500'
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security with role-based access control and data protection.',
      color: 'bg-red-500'
    },
  ]

  const benefits = [
    {
      icon: Zap,
      title: 'Faster Operations',
      description: 'Reduce administrative overhead through automation of routine processes.'
    },
    {
      icon: TrendingUp,
      title: 'Better Revenue',
      description: 'Improve revenue collection via secure and trackable payment systems.'
    },
    {
      icon: Clock,
      title: 'Time Saving',
      description: 'Faster and more transparent seller onboarding process.'
    },
    {
      icon: Smartphone,
      title: 'Mobile Ready',
      description: 'Access your dashboard and manage operations from any device.'
    },
  ]

  const stats = [
    { number: '100%', label: 'Digital Transformation' },
    { number: '24/7', label: 'System Availability' },
    { number: '99.9%', label: 'Uptime Guarantee' },
    { number: '1000+', label: 'Active Users' },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation - Added sticky and subtle shadow */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20"> {/* Increased height for visual weight */}
            <Link to="/" className="flex items-center group">
              <div className="w-12 h-12 bg-teal-500 rounded-lg flex items-center justify-center mr-3 transition-transform group-hover:rotate-6">
                <Store className="w-7 h-7 text-white" />
              </div>
              <span className="text-3xl font-extrabold text-blue-900">MARKET SPOTON</span>
            </Link>
            <div className="flex items-center space-x-6">
              <Link
                to="/login"
                className="text-gray-700 hover:text-teal-600 font-semibold transition-colors hidden sm:inline"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-teal-600 hover:bg-teal-700 text-white px-7 py-3 rounded-xl font-bold transition-colors shadow-lg"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Enhanced background with GridPatternStyle */}
      <header className="relative bg-gradient-to-br from-teal-50 via-white to-gray-50 overflow-hidden" style={GridPatternStyle}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-40">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-teal-100 text-teal-800 rounded-full text-sm font-medium mb-8 border border-teal-200">
              <CheckCircle className="w-4 h-4 mr-2" />
              Digital Market Management Platform
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-blue-900 mb-6 leading-tight tracking-tighter">
              Transform Your Market
              <br className="hidden lg:block" />
              <span className="text-teal-600 block sm:inline-block mt-2">Operations Today</span>
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
              Streamline zone and space allocation, seller registration, payment processing, and reporting 
              with our comprehensive, secure, and user-friendly digital market management system.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="bg-teal-600 hover:bg-teal-700 text-white px-10 py-4 rounded-xl font-extrabold text-lg transition-all transform hover:scale-[1.02] shadow-xl shadow-teal-300/50 flex items-center justify-center group"
              >
                Get Started Free
                <ArrowRight className="ml-2 w-6 h-6 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/login"
                className="bg-white hover:bg-gray-100 text-teal-600 border-2 border-teal-500 px-10 py-4 rounded-xl font-bold text-lg transition-all shadow-md"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Section - Clean and impactful */}
      <section className="bg-blue-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center border-r last:border-r-0 border-blue-700/50">
                <div className="text-4xl md:text-5xl font-extrabold mb-1">{stat.number}</div>
                <div className="text-teal-300 uppercase tracking-wider text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section - Main value proposition */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-extrabold text-blue-900 mb-4">
              Powerful Features for Modern Markets
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to manage your market efficiently, ensure compliance, and maximize revenue growth.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={index}
                  className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 group"
                >
                  <div className={`${feature.color} w-16 h-16 rounded-xl flex items-center justify-center mb-6 shadow-lg`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-teal-600 transition-colors">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section - Focus on User Outcomes */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-teal-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-extrabold text-blue-900 mb-4">
              Measurable Benefits of Going Digital
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience increased efficiency and clear returns on your investment.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon
              return (
                <div key={index} className="text-center p-6 bg-white rounded-xl shadow-md border-t-4 border-teal-500">
                  <div className="bg-teal-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-extrabold text-gray-900 mb-3">{benefit.title}</h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section - Final Call */}
      <section className="py-20 bg-teal-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
            Ready to Transform Your Market?
          </h2>
          <p className="text-xl text-teal-100 mb-12">
            Join thousands of market managers and sellers who are already using Market SpotOn to digitize and grow.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white hover:bg-gray-100 text-teal-600 px-10 py-4 rounded-xl font-extrabold text-lg transition-all transform hover:scale-[1.02] shadow-xl"
            >
              Start Free Trial
            </Link>
            <Link
              to="/login"
              className="bg-transparent hover:bg-teal-700 text-white border-2 border-white px-10 py-4 rounded-xl font-bold text-lg transition-all"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* Footer - Professional and Informative */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-10">
            <div className="md:col-span-2">
              <Link to="/" className="flex items-center mb-4">
                <div className="w-10 h-10 bg-teal-500 rounded-lg flex items-center justify-center mr-3">
                  <Store className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-extrabold text-white">MARKET SPOTON</span>
              </Link>
              <p className="text-sm max-w-sm">
                The leading digital market management platform designed to streamline operations and boost efficiency for municipal and private markets.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 border-b border-teal-500/50 pb-2">Product</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#features" className="hover:text-teal-400 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-teal-400 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-teal-400 transition-colors">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 border-b border-teal-500/50 pb-2">Company</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-teal-400 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-teal-400 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-teal-400 transition-colors">Support Center</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 border-b border-teal-500/50 pb-2">Legal</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-teal-400 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-teal-400 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-teal-400 transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>© {new Date().getFullYear()} Market SpotOn System. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home