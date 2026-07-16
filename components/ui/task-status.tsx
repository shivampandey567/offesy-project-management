import { Ban, CheckCheck, Clock, PauseCircle, XCircle, Zap } from 'lucide-react'
import IconBg from './iconbg'
import TextBg from './textbg'

type StatusVariant = 'pending' | 'active' | 'done' | 'refused'
type ActionVariant = 'hold' | 'dropped'

const statusConfig: Record<StatusVariant, { variant: string; Icon: React.ElementType; label: string }> = {
    pending: { variant: 'orange',  Icon: Clock,       label: 'Pending'  },
    active:  { variant: 'blue',   Icon: Zap,         label: 'Active'   },
    done:    { variant: 'green',  Icon: CheckCheck,  label: 'Done'     },
    refused: { variant: 'rose',   Icon: Ban,         label: 'Refused'  },
}

const actionConfig: Record<ActionVariant, { variant: string; Icon: React.ElementType; label: string }> = {
    hold:    { variant: 'yellow', Icon: PauseCircle, label: 'Hold'     },
    dropped: { variant: 'red',  Icon: XCircle,     label: 'Dropped'  },
}

export const TaskStatusIcon = ({ status }: { status: string }) => {
    const config = statusConfig[status as StatusVariant]
    if (!config) return null
    const { variant, Icon } = config
    return <IconBg variant={variant as any} size="sm"><Icon /></IconBg>
}

export const TaskActionIcon = ({ action }: { action: string }) => {
    const config = actionConfig[action as ActionVariant]
    if (!config) return null
    const { variant, Icon } = config
    return <IconBg variant={variant as any} size="sm"><Icon /></IconBg>
}

export const TaskStatusBadge = ({ status }: { status: string }) => {
    const config = statusConfig[status as StatusVariant]
    if (!config) return null
    return <TextBg variant={config.variant as any}>{config.label}</TextBg>
}

export const TaskActionBadge = ({ action }: { action: string }) => {
    const config = actionConfig[action as ActionVariant]
    if (!config) return null
    return <TextBg variant={config.variant as any}>{config.label}</TextBg>
}