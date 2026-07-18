declare global {
    type KeybindOptions = {
        preventDefault?: boolean;
        stopPropagation?: boolean;
        ignoreInInputs?: boolean;
        desc?: string;
    };

    type KeybindEntry = {
        combo: string;
        options: Required<Omit<KeybindOptions, "desc">> & Pick<KeybindOptions, "desc">;
    };

    type KeybindContextValue = {
        bind: (
            combo: string,
            handler: () => void,
            opts?: KeybindOptions,
        ) => () => void;
        unbind: (combo: string) => void;
        getKeybinds: () => KeybindEntry[];
    };
}

export {};
