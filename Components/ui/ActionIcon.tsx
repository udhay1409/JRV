import { Check, X } from "lucide-react"

interface ActionIconProps {
  isAllowed: boolean
}

export function ActionIcon({ isAllowed }: ActionIconProps) {
  return isAllowed ? <Check className="text-green-500" /> : <X className="text-red-500" />
}

