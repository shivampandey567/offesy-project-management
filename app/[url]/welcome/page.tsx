"use client"

import React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"
import { User, Camera } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { InputGroup, InputGroupInput } from "@/components/ui/input-group"
import { useWelcome } from "@/hooks/useWelcome"

const formSchema = z.object({
    name: z
        .string()
        .min(3, "Name must be at least 3 characters.")
        .max(30, "Name must be at most 30 characters."),
    title: z
        .string()
        .min(3, "Title must be at least 3 characters.")
        .max(30, "Title must be at most 30 characters."),
    picture: z.string().optional().nullable(),
})

export default function ProfileSetupPage() {
    const { updateProfile, isSubmitting, previewImage, handleFileChange, resetPicture } = useWelcome()
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { name: "", title: "", picture: null },
    })

    const handlePictureClick = () => {
        fileInputRef.current?.click()
    }

    const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // 5MB limit
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image too large", {
                description: "Please upload an image under 5MB",
                position: "top-right",
            })
            e.target.value = ""
            return
        }

        // only images
        if (!file.type.startsWith("image/")) {
            toast.error("Invalid file type", {
                description: "Please upload an image file",
                position: "top-right",
            })
            e.target.value = ""
            return
        }

        const base64 = await handleFileChange(file)
        form.setValue("picture", base64, { shouldValidate: true })
        e.target.value = ""
    }

    async function onSubmit(data: z.infer<typeof formSchema>) {
        try {
            await updateProfile({
                name: data.name,
                title: data.title,
                picture: data.picture,
            })
            toast.success("Profile updated successfully!", {
                position: "top-right",
            })

            form.reset({ name: "", title: "", picture: null })
            resetPicture()
            if (fileInputRef.current) fileInputRef.current.value = ""

        } catch (error: any) {
            toast.error("Failed to update profile", {
                description: error.message,
                position: "top-right",
            })
        }
    }

    return (
        <div className="w-full min-h-screen flex items-center justify-center px-2">
            <Card className="w-full bg-background ring-0 md:max-w-md">
                <CardHeader>
                    <CardTitle className="font-medium text-[20px]">Set up your profile</CardTitle>
                    <CardDescription className="text-[18px] mb-4">Choose your appearance</CardDescription>
                </CardHeader>

                <CardContent>
                    <form id="profile-form" onSubmit={form.handleSubmit(onSubmit)}>
                        <FieldGroup>

                            {/* Name & Picture */}
                            <Controller
                                name="name"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel className="text-muted-foreground">Name & picture</FieldLabel>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={onFileChange}
                                                accept="image/*"
                                                className="hidden"
                                            />
                                            <Button
                                                type="button"
                                                className="h-12 w-12 rounded-full relative overflow-hidden p-0 shrink-0"
                                                variant="outline"
                                                onClick={handlePictureClick}
                                            >
                                                {previewImage ? (
                                                    <img
                                                        src={previewImage}
                                                        alt="Profile"
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <User className="h-5 w-5" />
                                                )}
                                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                    <Camera className="h-4 w-4 text-white" />
                                                </div>
                                            </Button>
                                            <InputGroup className="h-12 flex-1">
                                                <InputGroupInput
                                                    {...field}
                                                    placeholder="Enter your name..."
                                                    className="font-medium"
                                                    autoComplete="off"
                                                    aria-invalid={fieldState.invalid}
                                                />
                                            </InputGroup>
                                        </div>
                                        {fieldState.invalid && fieldState.error && (
                                            <FieldError errors={[fieldState.error]} />
                                        )}
                                    </Field>
                                )}
                            />

                            {/* Title */}
                            <Controller
                                name="title"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel htmlFor="title" className="text-muted-foreground">Title</FieldLabel>
                                        <InputGroup className="h-12">
                                            <InputGroupInput
                                                {...field}
                                                id="title"
                                                placeholder="Software engineer"
                                                className="font-medium"
                                                autoComplete="off"
                                                aria-invalid={fieldState.invalid}
                                            />
                                        </InputGroup>
                                        {fieldState.invalid && fieldState.error && (
                                            <FieldError errors={[fieldState.error]} />
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
                            form="profile-form"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Saving..." : "Continue"}
                        </Button>
                    </Field>
                </CardFooter>
            </Card>
        </div>
    )
}