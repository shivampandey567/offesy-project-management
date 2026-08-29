import { Ban, CheckCheck, Clock, PauseCircle, XCircle, Zap } from 'lucide-react'
import IconBg from './iconbg'
import TextBg from './textbg'

type StatusVariant = 'Pending' | 'Active' | 'Done' | 'Refused'
type ActionVariant = 'Hold' | 'Cancelled'

const statusConfig: Record<StatusVariant, { variant: string; Icon: React.ElementType; label: string }> = {
    Pending: { variant: 'orange',  Icon: Clock,       label: 'Pending'  },
    Active:  { variant: 'blue',   Icon: Zap,         label: 'Active'   },
    Done:    { variant: 'green',  Icon: CheckCheck,  label: 'Done'     },
    Refused: { variant: 'rose',   Icon: Ban,         label: 'Refused'  },
}

const actionConfig: Record<ActionVariant, { variant: string; Icon: React.ElementType; label: string }> = {
    Hold:    { variant: 'yellow', Icon: PauseCircle, label: 'Hold'     },
    Cancelled: { variant: 'red',  Icon: XCircle,     label: 'Cancelled'  },
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
    const { variant, Icon, label } = config
    return (
        <TextBg variant={variant as any}>
            <Icon size={12} className='mr-1' />{label}
        </TextBg>
    )
}

export const TaskActionBadge = ({ action }: { action: string }) => {
    const config = actionConfig[action as ActionVariant]
    if (!config) return null
    const { variant, Icon, label } = config
    return (
        <TextBg variant={variant as any}>
            <Icon size={12} className='mr-1' />{label}
        </TextBg>
    )
}