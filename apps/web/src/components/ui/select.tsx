import React, { useEffect, useState } from "react";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { ChevronDownIcon, X } from "lucide-react";

type TSelectData = {
  id: string;
  label: string;
  value: string;
  description?: string;
  icon?: string;
  disabled?: boolean;
  custom?: React.ReactNode;
  languages?: string[]; // Array of language flag emojis
};

type SelectProps = {
  data?: TSelectData[];
  onChange?: (value: string) => void;
  defaultValue?: string;
};

const Select = ({ data, defaultValue, onChange }: SelectProps) => {
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = useState<TSelectData | undefined>(undefined);

  useEffect(() => {
    if (defaultValue) {
      const item = data?.find((i) => i.value === defaultValue);
      if (item) {
        setSelected(item);
      }
    } else {
      setSelected(data?.[0]);
    }
  }, [defaultValue, data]);

  const onSelect = (value: string) => {
    const item = data?.find((i) => i.value === value);
    setSelected(item as TSelectData);
    setOpen(false);
    onChange?.(value);
  };

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
  };

  return (
    <div className="relative w-full">
      {/* Trigger - Always visible */}
      <div
        onClick={handleTriggerClick}
        className="overflow-hidden rounded-[30px] border border-input bg-background shadow-sm w-full cursor-pointer hover:border-gray-300 transition-colors"
      >
        <SelectItem item={selected} />
      </div>

      {/* Backdrop + Dropdown */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop to prevent clicks behind */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setOpen(false);
              }}
              className="fixed inset-0 z-40 bg-transparent cursor-default"
            />

            {/* Dropdown - Absolute positioned */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute top-0 left-0 right-0 z-50 overflow-visible rounded-[20px] border border-input bg-background shadow-xl"
            >
              <Head setOpen={setOpen} />
              <div className="w-full max-h-[400px] overflow-y-auto">
                {data?.map((item, index) => (
                  <SelectItem
                    order={index.toString()}
                    noDescription={false}
                    key={item.id}
                    item={item}
                    onChange={onSelect}
                  />
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Select;

const Head = ({ setOpen }: { setOpen: (open: boolean) => void }) => {
  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(false);
  };

  return (
    <motion.div
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      exit={{
        opacity: 0,
      }}
      transition={{
        delay: 0.1,
      }}
      layout
      className="flex items-center justify-between p-4"
    >
      <motion.strong layout className="text-foreground">
        Choose Voice
      </motion.strong>
      <button
        type="button"
        onClick={handleClose}
        className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
      >
        <X className="text-secondary-foreground" size={12} />
      </button>
    </motion.div>
  );
};

type SelectItemProps = {
  item?: TSelectData;
  noDescription?: boolean;
  order?: string;
  onChange?: (index: string) => void;
};

const animation = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: custom * 0.05,
      duration: 0.3,
    },
  }),
  exit: (custom: number) => ({
    opacity: 0,
    y: 10,
    transition: {
      delay: custom * 0.05,
    },
  }),
};

const SelectItem = ({
  item,
  noDescription = true,
  order,
  onChange,
}: SelectItemProps) => {
  const handleClick = (e: React.MouseEvent) => {
    // Only handle clicks in dropdown list, not when used as trigger
    if (!noDescription && onChange) {
      e.preventDefault();
      e.stopPropagation();
      onChange(item?.value as string);
    }
  };

  return (
    <motion.div
      className={`group flex ${!noDescription ? 'cursor-pointer' : ''} items-center justify-between gap-2 p-4 py-3 hover:bg-accent hover:text-accent-foreground transition-colors ${
        noDescription && "!p-2"
      }`}
      variants={animation}
      initial="hidden"
      animate="visible"
      exit="exit"
      key={"voice-" + item?.id + "-order-" + order}
      custom={order ? parseInt(order) : 0}
      onClick={!noDescription ? handleClick : undefined}
    >
      <div className="flex items-center gap-3 flex-1">
        <motion.div
          layout
          layoutId={`icon-${item?.id}`}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-input bg-background shrink-0"
        >
          {item?.icon}
        </motion.div>
        <motion.div layout className="flex flex-col flex-1 min-w-0">
          <motion.strong
            layoutId={`label-${item?.id}`}
            className="text-sm font-semibold text-foreground"
          >
            {item?.label}
          </motion.strong>
          {noDescription ? null : (
            <>
              <span className="text-xs text-muted-foreground line-clamp-2">
                {item?.description}
              </span>
              {item?.languages && item.languages.length > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  {item.languages.map((flag, idx) => (
                    <span key={idx} className="text-sm">
                      {flag}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>
      {noDescription ? (
        <motion.div
          layout
          className="flex items-center justify-center gap-2 pr-3"
        >
          <ChevronDownIcon className="text-foreground" size={20} />
        </motion.div>
      ) : (
        item?.custom
      )}
    </motion.div>
  );
};
