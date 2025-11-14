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

const Home = () => {
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
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-teal-500 rounded-lg flex items-center justify-center mr-3">
                <Store className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-teal-600">MARKET SPOTON</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-700 hover:text-teal-600 font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-teal-50 via-white to-teal-50 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-teal-100 text-teal-700 rounded-full text-sm font-medium mb-8">
              <CheckCircle className="w-4 h-4 mr-2" />
              Digital Market Management Platform
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-blue-700 mb-6 leading-tight">
              Transform Your Market
              <br />
              <span className="text-teal-600">Operations Today</span>
            </h1>
            <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              Streamline zone and space allocation, seller registration, payment processing, and reporting 
              with our comprehensive digital market management system.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="bg-teal-500 hover:bg-teal-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center"
              >
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                to="/login"
                className="bg-white hover:bg-gray-50 text-teal-600 border-2 border-teal-500 px-8 py-4 rounded-lg font-semibold text-lg transition-all"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-teal-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold mb-2">{stat.number}</div>
                <div className="text-teal-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for Modern Markets
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to manage your market efficiently and grow your business
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={index}
                  className="bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-2 border border-gray-100"
                >
                  <div className={`${feature.color} w-14 h-14 rounded-lg flex items-center justify-center mb-6`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-teal-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose Market SpotOn?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experience the benefits of digital transformation
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon
              return (
                <div key={index} className="text-center">
                  <div className="bg-teal-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{benefit.title}</h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-teal-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Market?
          </h2>
          <p className="text-xl text-teal-100 mb-10">
            Join thousands of market managers and sellers who are already using Market SpotOn
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white hover:bg-gray-100 text-teal-600 px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 shadow-lg"
            >
              Start Free Trial
            </Link>
            <Link
              to="/login"
              className="bg-transparent hover:bg-teal-700 text-white border-2 border-white px-8 py-4 rounded-lg font-semibold text-lg transition-all"
            >
              Sign In to Account
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-teal-500 rounded-lg flex items-center justify-center mr-3">
                  <Store className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">MARKET SPOTON</span>
              </div>
              <p className="text-sm">
                Digital market management platform designed to streamline operations and boost efficiency.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-teal-400">Features</a></li>
                <li><a href="#" className="hover:text-teal-400">Pricing</a></li>
                <li><a href="#" className="hover:text-teal-400">Documentation</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-teal-400">About</a></li>
                <li><a href="#" className="hover:text-teal-400">Contact</a></li>
                <li><a href="#" className="hover:text-teal-400">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-teal-400">Privacy</a></li>
                <li><a href="#" className="hover:text-teal-400">Terms</a></li>
                <li><a href="#" className="hover:text-teal-400">Security</a></li>
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

