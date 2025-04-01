import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-[var(--bg-primary)] p-6 shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="mb-4 text-lg font-medium leading-6 text-[var(--text-tertiary)]"
                >
                  Keyboard Shortcuts
                </Dialog.Title>
                <div className="space-y-3">
                  <div className="space-y-2 rounded bg-[var(--bg-secondary)] p-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[var(--text-tertiary)]">Q W E R T Y</span>
                      <span className="text-[var(--text-tertiary)]">Duration</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-tertiary)]">D</span>
                      <span className="text-[var(--text-tertiary)]">Toggle Dotted</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-tertiary)]">← →</span>
                      <span className="text-[var(--text-tertiary)]">Navigate Slots</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-tertiary)]">Delete</span>
                      <span className="text-[var(--text-tertiary)]">Delete Content</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-tertiary)]">L</span>
                      <span className="text-[var(--text-tertiary)]">Add Lyrics (for melody)</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    className="w-full rounded-lg bg-[var(--bg-secondary)] px-4 py-2 text-sm text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)]"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
