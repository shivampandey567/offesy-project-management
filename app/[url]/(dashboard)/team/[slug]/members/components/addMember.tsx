'use client'

import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, getAvatarVariant, getInitials } from '@/components/ui/avatar'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

type WorkspaceMember = { userId: string; clerkId: string | null; name: string; email?: string }
type TeamMember = { userId: string; role: string }

type AddMemberProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    team: { members?: TeamMember[] } | null
    updateTeam: (fields: Record<string, any>) => Promise<any>
    workspaceMembers: WorkspaceMember[]
    membersLoading?: boolean
    currentClerkId?: string | null
}

const AddMember = ({
    open,
    onOpenChange,
    team,
    updateTeam,
    workspaceMembers,
    membersLoading = false,
    currentClerkId,
}: AddMemberProps) => {
    const [userId, setUserId] = useState('')
    const [role, setRole] = useState('')
    const [submitting, setSubmitting] = useState(false)

    // reset selection every time the dialog opens fresh
    useEffect(() => {
        if (open) {
            setUserId('')
            setRole('')
        }
    }, [open])

    const teamUserIds = (team?.members ?? []).map((m) => String(m.userId))

    const availableMembers = workspaceMembers.filter(
        (m) => m.clerkId !== currentClerkId && !teamUserIds.includes(m.userId)
    )

    const selectedMember = availableMembers.find((m) => m.userId === userId)

    const resetForm = () => {
        setUserId('')
        setRole('')
    }

    const handleOpenChange = (next: boolean) => {
        if (!next) resetForm()
        onOpenChange(next)
    }

    const handleSubmit = async () => {
        if (!team) {
            toast.error('Team not loaded yet, try again', { position: 'top-right' })
            return
        }
        if (!userId || !role) return

        setSubmitting(true)
        try {
            const updated = [...(team.members ?? []), { userId, role }]
            await updateTeam({ members: updated })
            toast.success('Member added', { position: 'top-right' })
            resetForm()
            onOpenChange(false)
        } catch (err) {
            toast.error('Failed to add member', { position: 'top-right' })
        } finally {
            setSubmitting(false)
        }
    }

    const memberTriggerLabel = membersLoading
        ? 'Loading members…'
        : selectedMember
            ? selectedMember.name
            : availableMembers.length
                ? 'Select a member'
                : 'No members available invite more'

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add a member</DialogTitle>
                    <DialogDescription></DialogDescription>
                </DialogHeader>

                <FieldGroup>
                    <Field>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild disabled={membersLoading || availableMembers.length === 0}>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start !h-9 font-normal"
                                    disabled={membersLoading || availableMembers.length === 0}
                                >
                                    {selectedMember && (
                                        <Avatar size="sm" className="mr-1">
                                            <AvatarFallback variant={getAvatarVariant(selectedMember.name)}>
                                                {getInitials(selectedMember.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                    )}
                                    <span className={selectedMember ? '' : 'text-muted-foreground'}>
                                        {memberTriggerLabel}
                                    </span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="min-w-56">
                                <DropdownMenuGroup>
                                    <DropdownMenuRadioGroup value={userId} onValueChange={setUserId}>
                                        {availableMembers.map((m) => (
                                            <DropdownMenuRadioItem key={m.userId} value={m.userId}>
                                                <Avatar size="sm" className="mr-1">
                                                    <AvatarFallback variant={getAvatarVariant(m.name)}>
                                                        {getInitials(m.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                {m.name}
                                                {m.email && (
                                                    <span className="text-muted-foreground ml-1">{m.email}</span>
                                                )}
                                            </DropdownMenuRadioItem>
                                        ))}
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </Field>

                    <Field>
                        <Select value={role} onValueChange={setRole}>
                            <SelectTrigger className="w-full cursor-pointer">
                                <SelectValue placeholder="Role" />
                            </SelectTrigger>
                            <SelectContent className="z-[500]">
                                <SelectGroup>
                                    <SelectItem key='member' value='member'>member</SelectItem>
                                    <SelectItem key='admin' value='admin'>admin</SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </Field>
                </FieldGroup>

                <DialogFooter className='bg-card border-none'>
                    <Button
                        onClick={handleSubmit}
                        variant='blue'
                        disabled={!userId || !role || submitting || !team}
                        size="lg"
                        className="w-fit cursor-pointer rounded-full"
                    >
                        {submitting ? 'Adding…' : 'Add member'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default AddMember