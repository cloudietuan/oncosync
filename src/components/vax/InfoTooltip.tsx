import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface InfoTooltipProps {
  term: string;
  definition: string;
  className?: string;
}

const InfoTooltip = ({ term, definition, className = '' }: InfoTooltipProps) => (
  <TooltipProvider delayDuration={200}>
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors ${className}`}
          aria-label={`Info about ${term}`}
        >
          <Info size={13} strokeWidth={2.5} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[260px] text-xs leading-relaxed">
        <p className="font-semibold text-foreground mb-0.5">{term}</p>
        <p className="text-muted-foreground">{definition}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export default InfoTooltip;
