import Icon from './Icon';

export default function QtyStepper({ value, max = 20, onChange, disabled }) {
    return (
        <div className="inline-flex items-center rounded-full border border-bone-300">
            <button type="button" aria-label="Diminuer" disabled={disabled || value <= 1} onClick={() => onChange(value - 1)} className="grid h-9 w-9 place-items-center rounded-full disabled:opacity-30"><Icon name="minus" className="h-4 w-4" /></button>
            <span className="w-7 text-center font-mono text-sm font-semibold" aria-live="polite">{value}</span>
            <button type="button" aria-label="Augmenter" disabled={disabled || value >= max} onClick={() => onChange(value + 1)} className="grid h-9 w-9 place-items-center rounded-full disabled:opacity-30"><Icon name="plus" className="h-4 w-4" /></button>
        </div>
    );
}
