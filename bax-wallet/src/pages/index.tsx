import { Layout } from '../components/Layout';
import { WalletBalance } from '../components/WalletBalance';
import { TabContent } from '../components/Tabs'

export default function Home() {
  return (
    <Layout>
      <div className="space-y-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <WalletBalance />
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <TabContent />
        </div>
      </div>
    </Layout>
  )
}