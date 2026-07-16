import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

/**
 * A reusable confirmation modal component.
 * Uses React Portal to render at document.body, escaping any parent
 * stacking contexts (e.g. backdrop-blur containers that break fixed positioning).
 * Supports overlay click and ESC key to dismiss.
 */
export default function ConfirmModal({
    isOpen,
    title = 'Confirm',
    message = 'Are you sure?',
    confirmLabel = 'Confirm',
    onConfirm,
    onCancel,
}) {
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Escape') {
            onCancel?.();
        }
    }, [onCancel]);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, handleKeyDown]);

    if (!isOpen) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            onClick={onCancel}
        >
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" />

            {/* Modal Card */}
            <div
                className="relative bg-surface-card rounded-2xl shadow-xl border border-hairline p-6 max-w-sm w-full mx-4 animate-in"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-lg font-semibold text-ink mb-2">{title}</h3>
                <p className="text-sm text-muted mb-6">{message}</p>

                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-muted rounded-lg border border-hairline hover:bg-surface-soft transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
