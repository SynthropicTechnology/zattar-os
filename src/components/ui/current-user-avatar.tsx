'use client'

import { useUser } from '@/providers/user-provider'
import { resolveAvatarUrl } from '@/lib/avatar-url'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export const CurrentUserAvatar = () => {
  const userData = useUser()
  const name = userData.nomeExibicao || userData.nomeCompleto || '?'
  const profileImage = resolveAvatarUrl(userData.avatarUrl)

  const initials = name
    ?.split(' ')
    ?.filter(Boolean)
    ?.map((word) => word[0])
    ?.join('')
    ?.toUpperCase() || '?'

  return (
    <Avatar>
      {profileImage && <AvatarImage src={profileImage} alt={initials} />}
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  )
}
