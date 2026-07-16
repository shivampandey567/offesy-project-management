"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"
import { Globe, CheckCircle2, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field"
import {
    InputGroup,
    InputGroupAddon,
    InputGroupText,
    InputGroupInput,
} from "@/components/ui/input-group"
import { useCreateWorkspace } from "@/hooks/useCreateWorkspace"

const slugify = (val: string) =>
    val.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")

const formSchema = z.object({
    name: z
        .string()
        .min(3, "Workspace name must be at least 3 characters.")
        .max(50, "Workspace name must be at most 50 characters."),
    url: z
        .string()
        .min(3, "URL must be at least 3 characters.")
        .max(40, "URL must be at most 40 characters.")
        .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens."),
})

export function CreateWorkspace() {
    const { urlStatus, checkUrl, createWorkspace } = useCreateWorkspace()
    const [isSubmitting, setIsSubmitting] = React.useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { name: "", url: "" },
    })

    const nameValue = form.watch("name")
    const urlValue = form.watch("url")

    // auto-fill url from name
    React.useEffect(() => {
        if (!form.getFieldState("url").isDirty) {
            const slug = slugify(nameValue)
            form.setValue("url", slug)
            if (slug.length >= 3) checkUrl(slug)
        }
    }, [nameValue])

    // check URL availability when user manually edits URL
    React.useEffect(() => {
        if (form.getFieldState("url").isDirty && urlValue.length >= 3) {
            checkUrl(urlValue)
        } else if (urlValue.length < 3) {
            // reset to idle if URL is too short
            checkUrl("")
        }
    }, [urlValue])

    const isUrlAvailable = urlStatus === 'available'
    const isUrlTaken = urlStatus === 'taken'
    const isCheckingUrl = urlStatus === 'checking'

    // disable submit if URL is not available or still checking
    const isSubmitDisabled = isSubmitting || isCheckingUrl || isUrlTaken || urlValue.length < 3

    async function onSubmit(data: z.infer<typeof formSchema>) {
        if (!isUrlAvailable) return

        setIsSubmitting(true)
        try {
            const result = await createWorkspace(data)
            toast.success("Workspace created", {
                description: `/${data.url} is ready.`,
                position: "top-right",
            })
            form.reset()
        } catch (error: any) {
            toast.error("Failed to create workspace", {
                description: error.message,
                position: "top-right",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Card className="w-full sm:max-w-md ring-0 bg-background">
            <CardHeader>
                <CardTitle className="text-center text-[20px]">Create workspace</CardTitle>
                <CardDescription className="text-center mb-4">Set up a new workspace for your team.</CardDescription>
            </CardHeader>

            <CardContent>
                <form id="create-workspace-form" onSubmit={form.handleSubmit(onSubmit)}>
                    <FieldGroup>

                        {/* Name */}
                        <Controller
                            name="name"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor="ws-name" className="text-muted-foreground">Name</FieldLabel>
                                    <InputGroup className="h-10">
                                        <InputGroupInput
                                            {...field}
                                            id="ws-name"
                                            autoComplete="off"
                                            aria-invalid={fieldState.invalid}
                                        />
                                    </InputGroup>
                                    {fieldState.invalid && (
                                        <FieldError errors={[fieldState.error]} />
                                    )}
                                </Field>
                            )}
                        />

                        {/* URL */}
                        <Controller
                            name="url"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid || isUrlTaken}>
                                    <FieldLabel htmlFor="ws-url" className="text-muted-foreground">URL</FieldLabel>
                                    <InputGroup className="h-10">
                                        <InputGroupAddon align="inline-start">
                                            <InputGroupText className="text-xs text-muted-foreground pr-0">
                                                officemate.app/
                                            </InputGroupText>
                                        </InputGroupAddon>
                                        <InputGroupInput
                                            {...field}
                                            id="ws-url"
                                            autoComplete="off"
                                            aria-invalid={fieldState.invalid || isUrlTaken}
                                            onChange={(e) => {
                                                const slug = slugify(e.target.value)
                                                field.onChange(slug)
                                            }}
                                        />
                                        <InputGroupAddon align="inline-end">
                                            <InputGroupText>
                                                {isCheckingUrl ? (
                                                    <span className="animate-spin h-3 w-3 border-2 border-muted-foreground border-t-transparent rounded-full" />
                                                ) : isUrlAvailable ? (
                                                    <CheckCircle2 size={14} className="text-green-500" />
                                                ) : isUrlTaken ? (
                                                    <XCircle size={14} className="text-red-500" />
                                                ) : (
                                                    <Globe size={14} />
                                                )}
                                            </InputGroupText>
                                        </InputGroupAddon>
                                    </InputGroup>

                                    {/* Zod validation errors - show first if invalid */}
                                    {fieldState.invalid && fieldState.error && (
                                        <FieldError errors={[fieldState.error]} />
                                    )}

                                    {/* URL availability - only show when NO validation errors and URL is valid length */}
                                    {!fieldState.invalid && urlValue.length >= 3 && (
                                        <>
                                            {isUrlAvailable && (
                                                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                                    <CheckCircle2 size={12} />
                                                    URL is available
                                                </p>
                                            )}
                                            {isUrlTaken && (
                                                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                                    <XCircle size={12} />
                                                    URL is not available
                                                </p>
                                            )}
                                        </>
                                    )}
                                </Field>
                            )}
                        />

                    </FieldGroup>
                </form>
            </CardContent>

            <CardFooter className="bg-transperent border-0">
                <Field orientation="horizontal">
                    <Button
                        className="w-full rounded-full h-10 mt-4"
                        variant="outline"
                        type="submit"
                        form="create-workspace-form"
                        disabled={isSubmitDisabled}
                    >
                        {isSubmitting ? "Creating..." : "Create Workspace"}
                    </Button>
                </Field>
            </CardFooter>
        </Card>
    )
}