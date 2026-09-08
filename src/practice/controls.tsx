'use client';
import type { ButtonHTMLAttributes } from 'react';
export function Button({variant, ...props}:ButtonHTMLAttributes<HTMLButtonElement>&{variant?:string}) {
 return <button {...props} type={props.type || 'button'} data-variant={variant} className={'practice-button '+(props.className || '')}/>;
}
export function Checkbox({checked,onCheckedChange,...props}:{checked:boolean;onCheckedChange:(checked:boolean)=>void;'aria-label'?:string}) {
 return <input {...props} className="practice-checkbox" type="checkbox" checked={checked} onChange={event=>onCheckedChange(event.target.checked)}/>;
}
