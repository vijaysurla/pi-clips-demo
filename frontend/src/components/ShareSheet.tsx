'use client'

import { useState } from 'react'
import { PhoneIcon as WhatsappIcon, MessageCircle, Send, Instagram, AlertTriangle, Heart, Download, Users, Repeat2, Bookmark, Copy, Check } from 'lucide-react'
import { Button } from "../components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "../components/ui/sheet"

interface ShareSheetProps {
  isOpen: boolean
  onClose: () => void
  videoId: string
  videoUrl: string
}

export default function ShareSheet({ isOpen, onClose, videoId, videoUrl }: ShareSheetProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(videoUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const shareOptions = [
    {
      name: 'WhatsApp',
      icon: WhatsappIcon,
      onClick: () => window.open(`whatsapp://send?text=${encodeURIComponent(videoUrl)}`)
    },
    {
      name: 'WhatsApp Status',
      icon: WhatsappIcon,
      onClick: () => window.open(`whatsapp://status?text=${encodeURIComponent(videoUrl)}`)
    },
    {
      name: 'Message',
      icon: MessageCircle,
      onClick: () => window.open(`sms:?body=${encodeURIComponent(videoUrl)}`)
    },
    {
      name: 'SMS',
      icon: Send,
      onClick: () => window.open(`sms:?body=${encodeURIComponent(videoUrl)}`)
    },
    {
      name: 'Messenger',
      icon: MessageCircle,
      onClick: () => window.open(`fb-messenger://share/?link=${encodeURIComponent(videoUrl)}`)
    },
    {
      name: 'Instagram',
      icon: Instagram,
      onClick: () => window.open(`instagram://share?text=${encodeURIComponent(videoUrl)}`)
    },
  ]

  const actionOptions = [
    {
      name: 'Report',
      icon: AlertTriangle,
      onClick: () => console.log('Report clicked')
    },
    {
      name: 'Not interested',
      icon: Heart,
      onClick: () => console.log('Not interested clicked')
    },
    {
      name: 'Save video',
      icon: Download,
      onClick: () => console.log('Save video clicked')
    },
    {
      name: 'Duet',
      icon: Users,
      onClick: () => console.log('Duet clicked')
    },
    {
      name: 'React',
      icon: Repeat2,
      onClick: () => console.log('React clicked')
    },
    {
      name: 'Add to Favorites',
      icon: Bookmark,
      onClick: () => console.log('Add to Favorites clicked')
    },
  ]

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="bottom" 
        className="h-[85vh] bg-zinc-900 text-white border-zinc-800 px-0"
      >
        <SheetHeader className="px-4 border-b border-zinc-800">
          <SheetTitle className="text-white text-base font-normal text-center">
            Share to
          </SheetTitle>
        </SheetHeader>

        {/* Share Options */}
        <div className="grid grid-cols-4 gap-4 p-4">
          {shareOptions.map((option) => (
            <button
              key={option.name}
              onClick={option.onClick}
              className="flex flex-col items-center gap-2"
            >
              <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center">
                <option.icon className="h-6 w-6" />
              </div>
              <span className="text-xs text-gray-300">{option.name}</span>
            </button>
          ))}
        </div>

        {/* Copy Link Button */}
        <div className="px-4 py-2">
          <Button
            variant="outline"
            onClick={handleCopyLink}
            className="w-full bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 flex items-center justify-center gap-2"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy link
              </>
            )}
          </Button>
        </div>

        {/* Action Options */}
        <div className="grid grid-cols-4 gap-4 p-4 border-t border-zinc-800">
          {actionOptions.map((option) => (
            <button
              key={option.name}
              onClick={option.onClick}
              className="flex flex-col items-center gap-2"
            >
              <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center">
                <option.icon className="h-6 w-6" />
              </div>
              <span className="text-xs text-gray-300 text-center">{option.name}</span>
            </button>
          ))}
        </div>

        {/* Cancel Button */}
        <div className="px-4 pt-2 pb-6">
          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full text-white hover:bg-zinc-800"
          >
            Cancel
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

