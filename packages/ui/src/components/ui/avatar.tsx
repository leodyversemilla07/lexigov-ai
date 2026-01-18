import * as React from "react"
import { cn } from "../../lib/utils"

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name?: string
  size?: "sm" | "md" | "lg" | "xl"
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, name, size = "md", ...props }, ref) => {
    const sizeClasses = {
      sm: "h-8 w-8 text-xs",
      md: "h-10 w-10 text-sm",
      lg: "h-12 w-12 text-base",
      xl: "h-16 w-16 text-xl",
    }

    const initials = name
      ? name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
      : "??"

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold",
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {initials}
      </div>
    )
  }
)
Avatar.displayName = "Avatar"

export { Avatar }
