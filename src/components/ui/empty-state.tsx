import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in duration-500", className)}>
            <div className="relative mb-6 group">
                <div className="absolute inset-0 bg-emerald-100/50 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative bg-white/80 p-5 rounded-full ring-1 ring-border shadow-sm group-hover:scale-110 transition-transform duration-300">
                    <Icon className="size-10 text-muted-foreground group-hover:text-emerald-600 transition-colors" />
                </div>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
            <p className="text-muted-foreground max-w-sm mb-6 text-sm leading-relaxed">{description}</p>
            {action && (
                <Button onClick={action.onClick} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5">
                    {action.label}
                </Button>
            )}
        </div>
    );
}
