'use client'

import { ArrowLeft, Home, Search, PlusSquare, Coins, User } from 'lucide-react'
import { Button } from "./ui/button"
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function TokensPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const handlePurchase = async (amount: number, piAmount: number) => {
    try {
      const payment = await window.Pi.createPayment({
        amount: piAmount,
        memo: `Purchase ${amount} tokens`,
        metadata: { type: 'token_purchase', amount }
      })
      console.log('Payment created:', payment)
      // Handle successful payment here
    } catch (error) {
      console.error('Payment error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(-1)}
            className="text-white hover:bg-zinc-800"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-lg font-semibold">Buy Tokens</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Current Balance */}
        <div className="text-center mb-8">
          <div className="text-sm text-zinc-400">Your Balance</div>
          <div className="text-3xl font-bold flex items-center justify-center gap-2">
            <Coins className="h-6 w-6 text-[#d6191e]" />
            {user?.tokenBalance || 0}
          </div>
        </div>

        {/* Buy Tokens Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Buy Tokens with Pi</h2>
          
          <div className="bg-zinc-800 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-[#d6191e]/10 p-2 rounded-lg">
                <Coins className="h-6 w-6 text-[#d6191e]" />
              </div>
              <div>
                <div className="font-semibold">100 tokens</div>
                <div className="text-sm text-zinc-400">Basic Package</div>
              </div>
            </div>
            <Button 
              className="bg-[#d6191e] hover:bg-[#d6191e]/90"
              onClick={() => handlePurchase(100, 1)}
            >
              Pay 1 π
            </Button>
          </div>

          <div className="bg-zinc-800 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-[#d6191e]/10 p-2 rounded-lg">
                <Coins className="h-6 w-6 text-[#d6191e]" />
              </div>
              <div>
                <div className="font-semibold">1000 tokens</div>
                <div className="text-sm text-zinc-400">Popular Package</div>
              </div>
            </div>
            <Button 
              className="bg-[#d6191e] hover:bg-[#d6191e]/90"
              onClick={() => handlePurchase(1000, 10)}
            >
              Pay 10 π
            </Button>
          </div>

          <div className="bg-zinc-800 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-[#d6191e]/10 p-2 rounded-lg">
                <Coins className="h-6 w-6 text-[#d6191e]" />
              </div>
              <div>
                <div className="font-semibold">10000 tokens</div>
                <div className="text-sm text-zinc-400">Premium Package</div>
              </div>
            </div>
            <Button 
              className="bg-[#d6191e] hover:bg-[#d6191e]/90"
              onClick={() => handlePurchase(10000, 100)}
            >
              Pay 100 π
            </Button>
          </div>
        </div>

        {/* Free Tokens Section */}
        <div className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold mb-4">Get Tokens for FREE</h2>
          
          <div className="bg-zinc-800 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-[#d6191e]/10 p-2 rounded-lg">
                <Coins className="h-6 w-6 text-[#d6191e]" />
              </div>
              <div>
                <div className="font-semibold">1 Token for 1 Ad</div>
                <div className="text-sm text-zinc-400">Watch ads to earn tokens</div>
              </div>
            </div>
            <Button variant="outline" disabled className="border-zinc-700">
              Coming soon
            </Button>
          </div>

          <div className="bg-zinc-800 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-[#d6191e]/10 p-2 rounded-lg">
                <Coins className="h-6 w-6 text-[#d6191e]" />
              </div>
              <div>
                <div className="font-semibold">Be a Content Creator</div>
                <div className="text-sm text-zinc-400">Earn tokens by creating content</div>
              </div>
            </div>
            <Button variant="outline" disabled className="border-zinc-700">
              Coming soon
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-zinc-900 border-t border-zinc-800 flex items-center justify-around px-4">
        <Button variant="ghost" size="icon" className="text-gray-400" onClick={() => navigate('/')}>
          <Home className="h-6 w-6" />
        </Button>
        <Button variant="ghost" size="icon" className="text-gray-400">
          <Search className="h-6 w-6" />
        </Button>
        <Button variant="ghost" size="icon" className="text-[#d6191e]" onClick={() => navigate('/upload')}>
          <PlusSquare className="h-8 w-8" />
        </Button>
        <Button variant="ghost" size="icon" className="text-[#d6191e]">
          <Coins className="h-6 w-6" />
        </Button>
        <Button variant="ghost" size="icon" className="text-gray-400" onClick={() => navigate('/profile')}>
          <User className="h-6 w-6" />
        </Button>
      </div>
    </div>
  )
}


