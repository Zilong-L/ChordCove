import { useState } from "react";
import { QuestionMarkCircleIcon } from "@heroicons/react/24/solid";
import { Menu, Transition } from "@headlessui/react";
import { Fragment } from "react";
import ShortcutsModal from "./ShortcutsModal";

export default function HelpButton() {
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);

  return (
    <>
      <div className="fixed right-6 bottom-6 z-40">
        <Menu as="div" className="relative inline-block text-left">
          <Menu.Button className="items-center justify-center rounded-full bg-[var(--text-primary)] text-[var(--bg-page)] shadow-lg hover:bg-[var(--accent-blue-hover)] focus:outline-none">
            <QuestionMarkCircleIcon className="h-6 w-6" />
          </Menu.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 bottom-full mb-2 w-56 origin-bottom-right rounded-lg bg-[var(--bg-primary)] shadow-lg ring-1 ring-[var(--border-primary)] focus:outline-none">
              <div className="p-1">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => setIsShortcutsModalOpen(true)}
                      className={`${
                        active ? "bg-[var(--bg-secondary)]" : ""
                      } group flex w-full items-center rounded-md px-2 py-2 text-sm text-[var(--text-primary)]`}
                    >
                      Keyboard Shortcuts
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>

      <ShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />
    </>
  );
}
