"use client";

import { useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../avatar";
import { Button } from "../button";
import { Camera, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ImageUploadProps {
    value?: string;
    onChange: (value: string) => void;
    onFileChange?: (file: File | null) => void;
    name?: string;
    fallback?: string;
    size?: "sm" | "md" | "lg" | "xl";
    shape?: "circle" | "square";
    showRemove?: boolean;
    disabled?: boolean;
    accept?: string;
    className?: string;
    avatarClassName?: string;
}

const sizeMap = {
    sm: { avatar: "h-12 w-12", button: "h-5 w-5" },
    md: { avatar: "h-16 w-16", button: "h-6 w-6" },
    lg: { avatar: "h-20 w-20", button: "h-7 w-7" },
    xl: { avatar: "h-24 w-24", button: "h-8 w-8" },
};

export function ImageUpload({
    value,
    onChange,
    onFileChange,
    name = "",
    fallback = "",
    size = "lg",
    shape = "circle",
    showRemove = true,
    disabled = false,
    accept = "image/*",
    className,
    avatarClassName,
}: ImageUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        const reader = new FileReader();
        
        reader.onloadend = () => {
            const result = reader.result as string;
            onChange(result);
            if (onFileChange) {
                onFileChange(file);
            }
            setIsLoading(false);
        };

        reader.onerror = () => {
            setIsLoading(false);
        };

        reader.readAsDataURL(file);
    };

    const handleRemove = () => {
        onChange("");
        if (onFileChange) {
            onFileChange(null);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleClick = () => {
        if (!disabled) {
            fileInputRef.current?.click();
        }
    };

    const currentSize = sizeMap[size];
    const hasImage = value && value.trim() !== "";

    return (
        <div className={cn("relative inline-block", className)}>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept={accept}
                disabled={disabled || isLoading}
            />
            
            <div className="relative">
                <Avatar
                    className={cn(
                        currentSize.avatar,
                        shape === "square" && "rounded-lg",
                        !disabled && "cursor-pointer",
                        isLoading && "opacity-50",
                        avatarClassName
                    )}
                    onClick={handleClick}
                >
                    <AvatarImage
                        src={value}
                        alt={name}
                        className={cn(shape === "square" && "rounded-lg")}
                    />
                    <AvatarFallback
                        className={cn(
                            shape === "square" && "rounded-lg",
                            "bg-muted text-muted-foreground"
                        )}
                    >
                        {fallback || name?.charAt(0).toUpperCase() || "?"}
                    </AvatarFallback>
                </Avatar>

                {hasImage && showRemove && !disabled && (
                    <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleRemove();
                        }}
                        className={cn(
                            "absolute -top-1 -right-1 h-5 w-5 rounded-full",
                            size === "xl" && "h-6 w-6"
                        )}
                    >
                        <X className="h-3 w-3" />
                    </Button>
                )}

                {!disabled && (
                    <Button
                        type="button"
                        size="icon"
                        onClick={handleClick}
                        disabled={isLoading}
                        className={cn(
                            "absolute -bottom-1 -right-1 rounded-full",
                            currentSize.button
                        )}
                    >
                        <Camera className="h-3 w-3" />
                    </Button>
                )}
            </div>
        </div>
    );
}
