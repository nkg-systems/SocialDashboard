export default function HomePage() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-4">SM3D Dashboard</h1>
      <p className="text-lg mb-8">Social Media Management Platform</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Analytics</h2>
          <p>View your social media performance</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Scheduling</h2>
          <p>Schedule your content</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">AI Insights</h2>
          <p>Get AI-powered recommendations</p>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-4">System Status</h2>
        <div className="space-y-2">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span>Frontend: Active</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
            <span>Backend: Pending</span>
          </div>
        </div>
      </div>
    </div>
  )
}
