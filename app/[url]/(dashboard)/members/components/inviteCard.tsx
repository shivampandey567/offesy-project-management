'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { InputGroup, InputGroupInput } from "@/components/ui/input-group"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useWorkspace } from "@/lib/workspace-context"
import { toast } from "sonner"
import { Mail } from "lucide-react"

const InviteCard = ({ open, onOpenChange }: {
    open: boolean
    onOpenChange: (v: boolean) => void
}) => {
    const [email, setEmail] = useState('')
    const [role, setRole] = useState('member')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const ws = useWorkspace()

    const handleSubmit = async () => {
        if (!email || !email.includes('@')) {
            toast.error('Enter a valid email', { position: 'top-right' })
            return
        }

        setIsSubmitting(true)
        try {
            const res = await fetch('/api/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, workspaceId: ws.id, role })
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Failed to send invite')
            }

            toast.success('Invite sent', {
                description: `Invitation sent to ${email}`,
                position: 'top-right'
            })
            setEmail('')
            setRole('member')
            onOpenChange(false)
        } catch (err: any) {
            toast.error('Failed to send invite', {
                description: err.message,
                position: 'top-right'
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full md:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Invite a member</DialogTitle>
                    <DialogDescription>
                        Send an email invitation to join <strong>{ws.name}</strong>
                    </DialogDescription>
                </DialogHeader>
                <div className="mt-4 flex flex-col gap-6">
                    <FieldGroup>
                        <Field>
                            <FieldLabel className="text-muted-foreground">Email address</FieldLabel>
                            <InputGroup className="h-10">
                                <InputGroupInput
                                    type="email"
                                    placeholder="name@gmail.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                                    autoComplete="off"
                                />
                            </InputGroup>
                        </Field>
                        <Field>
                            <FieldLabel className="text-muted-foreground">Role</FieldLabel>
                            <Select value={role} onValueChange={setRole}>
                                <SelectTrigger className="w-full h-10 cursor-pointer">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectItem value="member">Member</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </Field>
                    </FieldGroup>
                    <DialogFooter className="border-none bg-card">
                        <Button
                            onClick={handleSubmit}
                            size="lg"
                            className="rounded-full w-fit"
                            disabled={isSubmitting || !email}
                        >
                            <Mail />
                            {isSubmitting ? 'Sending...' : 'Send invite'}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default InviteCard